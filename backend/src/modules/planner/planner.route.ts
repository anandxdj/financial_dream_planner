import { Router } from "express";
import { requireAuth } from "../../shared/middleware/require-auth";
import * as controller from "./planner.controller";

export const plannerRouter = Router();

plannerRouter.use(requireAuth);

plannerRouter.post("/chat", controller.postChat);
plannerRouter.post("/analyze", controller.postAnalyze);
plannerRouter.get("/conversations", controller.getConversations);
plannerRouter.get("/conversations/:id/messages", controller.getMessages);
