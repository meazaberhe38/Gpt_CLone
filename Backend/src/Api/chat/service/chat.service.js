import { Connection } from "mysql2";
import db from "../../../../db/db.config.js";
import { GoogleGenAI } from "@google/genai";
// import { text } from "express";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

const geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const getRecentConversationRows = async (limit = 5) => {
  const normalizedLimit = Number.parseInt(limit, 10);
  const safeLimit =
    Number.isNaN(normalizedLimit) || normalizedLimit <= 0 ? 1 : normalizedLimit;
  const [rows] = await db.execute(
    `SELECT id, role, content, created_at FROM conversations ORDER BY id DESC LIMIT
      ${safeLimit}`,
  );
  return rows.reverse();
};

const generateAssistantAnswer = async ({ historyRows = [], question }) => {
  // format history for gemini start chat
  console.log(historyRows);
  const formattedHistory = (historyRows || []).map((row) => ({
    role: row.role === "assistant" ? "model" : "user",
    parts: [{ text: row.content }],
  }));

  const chat = geminiClient.chats.create({
    model: GEMINI_MODEL,
    config: {
      maxOutputTokens: 1024,
    },
    history: formattedHistory,
  });

  const result = await chat.sendMessage({
    message: question,
  });
  return {
    text: result?.text || "No response generated",
    totalTokens: result?.usageMetadata?.totalTokenCount || 0,
  };
};

const getMessageById = async (messageId) => {
  const [rows] = await db.execute(
    "SELECT id, role, content, token_count FROM conversations WHERE id = ? LIMIT 1",
    [messageId],
  );
  if (!rows[0]) return null;
  return {
    id: rows[0].id,
    role: rows[0].role,
    content: rows[0].content,
    tokenCount: Number(rows[0].token_count) || 0,
    createdAt: rows[0].created_at,
  };
};

export async function createConversationService(question) {
  try {
    //validation
    if (!question.trim()) {
      const error = new Error("Question is required");
      error.status = 400;
      throw error;
    }

    // get recent conversations for context

    // await db.query("INSERT INTO conversations (content) VALUES (?)", [
    //   question,
    // ]);
    // get recent conversations
    const historyRows = await getRecentConversationRows(1);

    // insert new conversation
    const [result] = await db.execute(
      "INSERT INTO conversations (content, role) VALUES (?, 'user')",
      [question],
    );

    const { text, totalTokens } = await generateAssistantAnswer({
      historyRows,
      question,
    });

    const [createAssistantMessageResult] = await db.execute(
      "INSERT INTO conversations ( role, content, token_count) VALUES (?, ?, ?)",
      ["assistant", text, totalTokens],
    );

    const userConversation = await getMessageById(result.insertId);
    const assistantConversation = await getMessageById(
      createAssistantMessageResult.insertId,
    );

    return {
      userConversation,
      assistantConversation,
    };
  } catch (error) {
    throw error;
  }
}
