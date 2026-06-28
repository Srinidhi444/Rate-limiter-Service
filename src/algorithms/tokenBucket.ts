import { Bucket } from "../types/bucket";
import { ClientConfig } from "../types/client";
import { ConsumeResult } from "../types/result";

export function consume(
    bucket: Bucket,
    clientConfig: ClientConfig
): ConsumeResult {

    const currentTime = Date.now();

    const refilledBucket = refill(bucket, clientConfig, currentTime);

    const allowed = canConsume(refilledBucket);

    const updatedBucket = allowed
        ? consumeToken(refilledBucket)
        : refilledBucket;

    return {
        allowed,
        bucket: updatedBucket,
        remainingTokens: updatedBucket.tokens,
        resetTime: calculateResetTime(
            updatedBucket,
            clientConfig,
            currentTime
        )
    };
}

function refill(
    bucket: Bucket,
    clientConfig: ClientConfig,
    currentTime: number
): Bucket {

    const elapsedTime = currentTime - bucket.lastRefillTime;
    const elapsedSeconds = elapsedTime / 1000;

    const tokensToAdd = Math.floor(
        elapsedSeconds * clientConfig.refillRate
    );

    if (tokensToAdd <= 0) {
        return bucket;
    }

    return {
        ...bucket,
        tokens: Math.min(
            bucket.tokens + tokensToAdd,
            clientConfig.capacity
        ),
        lastRefillTime: currentTime
    };
}

function canConsume(bucket: Bucket): boolean {
    return bucket.tokens > 0;
}

function consumeToken(bucket: Bucket): Bucket {
    return {
        ...bucket,
        tokens: bucket.tokens - 1
    };
}

function calculateResetTime(
    bucket: Bucket,
    clientConfig: ClientConfig,
    currentTime: number
): number {

    if (bucket.tokens > 0) {
        return currentTime;
    }

    const millisecondsPerToken = 1000 / clientConfig.refillRate;

    return bucket.lastRefillTime + millisecondsPerToken;
}