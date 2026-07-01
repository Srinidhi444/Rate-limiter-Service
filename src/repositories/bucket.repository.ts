import fs from "fs/promises";
import path from "path";

import redis from "../redis/redis";
import { ClientConfig } from "../types/client";
import { ConsumeResult } from "../types/result";

class BucketRepository {
    private script: string | null = null;

    private getKey(clientId: string): string {
        return `bucket:${clientId}`;
    }

    private async getScript(): Promise<string> {
        if (!this.script) {
            this.script = await fs.readFile(
                path.join(__dirname, "../lua/tokenBucket.lua"),
                "utf-8"
            );
        }

        return this.script;
    }

    async consume(client: ClientConfig): Promise<ConsumeResult> {
        const script = await this.getScript();

        const result = await redis.eval(script, {
            keys: [this.getKey(client.clientId)],
            arguments: [
                client.capacity.toString(),
                client.refillRate.toString(),
                Date.now().toString(),
            ],
        }) as [number, number, number];

        return {
            allowed: result[0] === 1,
            remainingTokens: Number(result[1]),
            resetTime: Number(result[2]),
        };
    }

    async deleteBucket(clientId: string): Promise<void> {
        await redis.del(this.getKey(clientId));
    }
}

export default new BucketRepository();