import bucketRepository from "../repositories/bucket.repository";
import clientRepository from "../repositories/client.repository";

import { ConsumeResult } from "../types/result";

class RateLimiterService {
    async check(clientId: string) {
        const client = await clientRepository.getClient(clientId);

        if (!client) {
            throw new Error("Client not found");
        }

        const result = await bucketRepository.consume(client);

        return {
            result,
            capacity: client.capacity,
        };
    }
}

export default new RateLimiterService();