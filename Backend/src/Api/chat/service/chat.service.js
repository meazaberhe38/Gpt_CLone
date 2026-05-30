import db from "../../../../db/db.config.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: GEMINI_MODEL,
});

// Get recent conversations
export const getRecentConversationRows = async (limit = 5) => {
  try {
    const safeLimit = Number.isNaN(Number(limit)) ? 5 : Number(limit);

    const [rows] = await db.execute(
      `SELECT id, role, content, created_at
       FROM conversations
       ORDER BY id DESC
       LIMIT ?`,
      [safeLimit],
    );

    return rows.reverse();
  } catch (error) {
    throw error;
  }
};

// Generate AI response
const generateAssistantAnswer = async ({ historyRows = [], question }) => {
  try {
    const chat = model.startChat({
      history: historyRows.map((row) => ({
        role: row.role === "assistant" ? "model" : "user",
        parts: [{ text: row.content }],
      })),
    });

    const result = await chat.sendMessage(question);
    const response = await result.response;

    return {
      text: response.text(),
      totalTokens: 0,
    };
  } catch (error) {
    throw error;
  }
};

// Get message by ID
const getMessageById = async (messageId) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, role, content, token_count, created_at
       FROM conversations
       WHERE id = ? LIMIT 1`,
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
  } catch (error) {
    throw error;
  }
};

// MAIN SERVICE
export async function createConversationService(question) {
  try {
    if (!question || !question.trim()) {
      const error = new Error("Question is required");
      error.status = 400;
      throw error;
    }

    // Get history
    const historyRows = await getRecentConversationRows(5);

    // Save user message
    const [userInsert] = await db.execute(
      `INSERT INTO conversations (content, role)
       VALUES (?, ?)`,
      [question, "user"],
    );

    // AI response
    const { text, totalTokens } = await generateAssistantAnswer({
      historyRows,
      question,
    });

    // Save assistant message
    const [assistantInsert] = await db.execute(
      `INSERT INTO conversations (role, content, token_count)
       VALUES (?, ?, ?)`,
      ["assistant", text, totalTokens],
    );

    // Fetch saved messages
    const userConversation = await getMessageById(userInsert.insertId);

    const assistantConversation = await getMessageById(
      assistantInsert.insertId,
    );

    return {
      userConversation,
      assistantConversation,
    };
  } catch (error) {
    console.error("SERVICE ERROR:", error);
    throw error;
  }
}
