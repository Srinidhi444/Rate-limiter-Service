import { Bucket } from "./bucket";

export interface ConsumeResult {
    allowed: boolean;
    remainingTokens: number;
    resetTime: number;
   
}