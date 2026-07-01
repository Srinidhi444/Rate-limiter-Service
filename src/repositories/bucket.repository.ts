import fs from "fs/promises";
import path from "path";
import luaLoader from "../lua/luaLoader";
import redis from "../redis/redis";
import { ClientConfig } from "../types/client";
import { ConsumeResult } from "../types/result";

class BucketRepository {
   

    private getKey(clientId: string): string {
        return `bucket:${clientId}`;
    }

   

    async consume(client: ClientConfig): Promise<ConsumeResult> {
        const result = await redis.evalSha(
            luaLoader.getTokenBucketSha(),
            {
                keys: [this.getKey(client.clientId)],
                arguments: [
                    client.capacity.toString(),
                    client.refillRate.toString(),
                    Date.now().toString(),
                ],
            }
        ) as [number, number, number];

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