// import { createConversationService } from "../service/chat.service.js";

// export async function createConversationsController(req, res) {
//   try {
//     const { question } = req.body;

//     const result = await createConversationService(question);
//     res.status(201).json({
//       success: true,
//       message: "conversation posted successfully",
//       data: result,
//     });
//   } catch (error) {
//     throw error;
//   }
// }

// export async function getConversationsController(req, res) {
//   try {
//     const result = await getRecentConversationRows(5);
//     res.status(200).json({
//       success: true,
//       message: "Conversations retrieved successfully",
//       data: result,
//     });
//   } catch (error) {
//     throw error;
//   }
// }
import {
  createConversationService,
  getRecentConversationRows,
} from "../service/chat.service.js";

// Create conversation
export async function createConversationsController(req, res) {
  try {
    const { question } = req.body;

    const result = await createConversationService(question);

    res.status(201).json({
      success: true,
      message: "Conversation created successfully",
      data: result,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
}

// Get conversations
export async function getConversationsController(req, res) {
  try {
    const result = await getRecentConversationRows(100);

    res.status(200).json({
      success: true,
      message: "Conversations retrieved successfully",
      data: result,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
}
