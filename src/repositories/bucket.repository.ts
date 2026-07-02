import { RedisClientType } from "redis";

import { ClientConfig } from "../types/client";
import { ConsumeResult } from "../types/result";

export class BucketRepository {

    constructor(
        private readonly redis: RedisClientType,
        private readonly tokenBucketSha: string
    ) {}

    private getBucketKey(clientId: string): string {
        return `bucket:${clientId}`;
    }

    async consume(
        client: ClientConfig
    ): Promise<ConsumeResult> {

        const currentTime = Date.now();

        const result = await this.redis.evalSha(
            this.tokenBucketSha,
            {
                keys: [
                    this.getBucketKey(client.clientId),
                ],
                arguments: [
                    client.capacity.toString(),
                    client.refillRate.toString(),
                    currentTime.toString(),
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
        await this.redis.del(this.getBucketKey(clientId));
    }

}