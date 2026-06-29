import redis from "../redis/redis";
import { ClientConfig } from "../types/client";

class ClientRepository {
    private getKey(clientId: string): string {
        return `client:${clientId}`;
    }

    async getClient(clientId: string): Promise<ClientConfig | null> {
        const data = await redis.get(this.getKey(clientId));

        if (!data) {
            return null;
        }

        return JSON.parse(data) as ClientConfig;
    }

    async saveClient(client: ClientConfig): Promise<void> {
        await redis.set(
            this.getKey(client.clientId),
            JSON.stringify(client)
        );
    }

    async deleteClient(clientId: string): Promise<void> {
        await redis.del(this.getKey(clientId));
    }
}

export default new ClientRepository();