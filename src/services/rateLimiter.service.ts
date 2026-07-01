import bucketRepository from "../repositories/bucket.repository";
import clientRepository from "../repositories/client.repository";

import { ConsumeResult } from "../types/result";

class RateLimiterService {
    async check(clientId: string): Promise<ConsumeResult> {
        const client = await clientRepository.getClient(clientId);

        if (!client) {
            throw new Error("Client not found");
        }

        return await bucketRepository.consume(client);
    }
}

export default new RateLimiterService();