import cors from "cors";
import express from "express";

import "dotenv/config";

import db from "./db/db.config.js";
import { errorHandler } from "./src/middleware/error-handler.js";
import mainRouter from "./src/Api/chat/main.routes.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", mainRouter);
app.use(errorHandler);

async function startserver() {
  try {
    const connection = await db.getConnection();
    console.log("Connected to the database!");
    connection.release();

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error connecting to the database:", error.message);
  }
}

startserver();
