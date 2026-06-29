import { Request, Response } from "express";
import rateLimiterService from "../services/rateLimiter.service";

class RateLimiterController {
    async check(req: Request, res: Response): Promise<void> {
        try {
            const { clientId } = req.body;

            if (!clientId) {
                res.status(400).json({
                    message: "clientId is required",
                });
                return;
            }

            const result = await rateLimiterService.check(clientId);

            res.setHeader("X-RateLimit-Remaining", result.remainingTokens);
            res.setHeader("X-RateLimit-Reset", result.resetTime);

            res.status(result.allowed ? 200 : 429).json(result);
        } catch (err) {
            res.status(500).json({
                message: err instanceof Error ? err.message : "Internal Server Error",
            });
        }
    }
}

export default new RateLimiterController();