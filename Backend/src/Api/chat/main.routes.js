import express from "express";
import chatRouter from "./chat.routes.js";

const mainRouter = express.Router();

// mainRouter.use("/chat", (req, res) => {
//   res.send("Hello from chat route");
// });

mainRouter.use("/chat", chatRouter);
//

export default mainRouter;
