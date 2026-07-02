import {
    NextFunction,
    Request,
    RequestHandler,
    Response,
} from "express";

import { RedisClientType } from "redis";

import { createRedisClient } from "../redis/createRedisClient";

import { BucketRepository } from "../repositories/bucket.repository";
import { ClientRepository } from "../repositories/client.repository";

import { ClientConfig } from "../types/client";
import { ConsumeResult } from "../types/result";

export interface RateLimiterOptions {
    redisUrl: string;
}

export interface MiddlewareOptions {
    clientId: (
        req: Request
    ) => string | Promise<string>;
}

export class RateLimiter {

    private redis!: RedisClientType;

    private tokenBucketSha!: string;

    private bucketRepository!: BucketRepository;

    private clientRepository!: ClientRepository;

    constructor(
        private readonly options: RateLimiterOptions
    ) {}

    async connect(): Promise<void> {

        this.redis = await createRedisClient(
            this.options.redisUrl
        );

        const fs = await import("fs/promises");
        const path = await import("path");

        const script = await fs.readFile(
            path.join(__dirname, "../lua/tokenBucket.lua"),
            "utf8"
        );

        this.tokenBucketSha =
            await this.redis.scriptLoad(script);

        this.clientRepository =
            new ClientRepository(this.redis);

        this.bucketRepository =
            new BucketRepository(
                this.redis,
                this.tokenBucketSha
            );

    }

    async disconnect(): Promise<void> {

        await this.redis.quit();

    }

    async registerClient(
        client: ClientConfig
    ): Promise<void> {

        await this.clientRepository.saveClient(
            client
        );

    }

    async updateClient(
        client: ClientConfig
    ): Promise<void> {

        await this.clientRepository.saveClient(
            client
        );
        await this.bucketRepository.deleteBucket(client.clientId);

    }

    async deleteClient(
        clientId: string
    ): Promise<void> {

        await this.clientRepository.deleteClient(
            clientId
        );

        await this.bucketRepository.deleteBucket(
            clientId
        );

    }

    async getClient(
        clientId: string
    ): Promise<ClientConfig | null> {

        return this.clientRepository.getClient(
            clientId
        );

    }

    async check(
        clientId: string
    ): Promise<ConsumeResult> {

        const client =
            await this.clientRepository.getClient(
                clientId
            );

        if (!client) {
            throw new Error("Client not found");
        }

        return this.bucketRepository.consume(
            client
        );

    }

    middleware(
        options: MiddlewareOptions
    ): RequestHandler {

        return async (
            req: Request,
            res: Response,
            next: NextFunction
        ) => {

            try {

                const clientId =
                    await options.clientId(req);

                if (!clientId) {

                    res.status(400).json({
                        message: "Unable to determine client id.",
                    });

                    return;
                }

                const client =
                    await this.getClient(clientId);

                if (!client) {

                    res.status(404).json({
                        message: "Client not registered.",
                    });

                    return;
                }

                const result =
                    await this.check(clientId);

                res.setHeader(
                    "X-RateLimit-Limit",
                    client.capacity
                );

                res.setHeader(
                    "X-RateLimit-Remaining",
                    result.remainingTokens
                );

                res.setHeader(
                    "X-RateLimit-Reset",
                    result.resetTime
                );

                if (!result.allowed) {

                    res.status(429).json({
                        message: "Rate limit exceeded.",
                        ...result,
                    });

                    return;

                }

                next();

            } catch (err) {

                next(err);

            }

        };

    }

}