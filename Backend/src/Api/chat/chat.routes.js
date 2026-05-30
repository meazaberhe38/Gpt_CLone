import express from "express";

import {
  createConversationsController,
  getConversationsController,
} from "./controller/chat.controller.js";

const chatRouter = express.Router();

// Create conversation
chatRouter.post("/conversations", createConversationsController);

// Get conversations
chatRouter.get("/conversations", getConversationsController);

export default chatRouter;
