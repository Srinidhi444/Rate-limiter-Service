import bucketRepository from "../repositories/bucket.repository";
import clientRepository from "../repositories/client.repository";

import { consume } from "../algorithms/tokenBucket";
import { ConsumeResult } from "../types/result";

class RateLimiterService {
    async check(clientId: string): Promise<ConsumeResult> {
        const client = await clientRepository.getClient(clientId);

        if (!client) {
            throw new Error("Client not found");
        }

        let bucket = await bucketRepository.getBucket(clientId);

        if (!bucket) {
            bucket = {
                tokens: client.capacity,
                lastRefillTime: Date.now(),
            };

            await bucketRepository.saveBucket(clientId, bucket);
        }

        const result = consume(
            bucket,
            client,
            Date.now()
        );

        await bucketRepository.saveBucket(
            clientId,
            result.bucket
        );

        return result;
    }
}

export default new RateLimiterService();