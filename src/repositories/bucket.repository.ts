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

    private getStatsKey(clientId: string): string {
        return `stats:${clientId}`;
    }

    async consume(
        client: ClientConfig
    ): Promise<ConsumeResult> {

        const currentTime = Date.now();
        const currentSecond = Math.floor(currentTime / 1000);

        const result = await this.redis.evalSha(
            this.tokenBucketSha,
            {
                keys: [
                    this.getBucketKey(client.clientId),
                    this.getStatsKey(client.clientId),
                    "activity",
                    `requests:${currentSecond}`,
                ],
                arguments: [
                    client.capacity.toString(),
                    client.refillRate.toString(),
                    currentTime.toString(),
                    client.clientId,
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