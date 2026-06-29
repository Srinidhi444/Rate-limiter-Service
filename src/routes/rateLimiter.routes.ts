import { Router } from "express";
import rateLimiterController from "../controllers/rateLimiter.controller";

const rateLimiterRouter = Router();

rateLimiterRouter.post("/check", rateLimiterController.check);

export default rateLimiterRouter;