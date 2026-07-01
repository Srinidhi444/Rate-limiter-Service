import { RedisClientType } from "redis";

import { ClientConfig } from "../types/client";

export class ClientRepository {

    constructor(
        private readonly redis: RedisClientType
    ) {}

    private getKey(clientId: string): string {
        return `client:${clientId}`;
    }

    async getClient(
        clientId: string
    ): Promise<ClientConfig | null> {

        const data = await this.redis.get(
            this.getKey(clientId)
        );

        if (!data) {
            return null;
        }

        return JSON.parse(data) as ClientConfig;
    }

    async saveClient(
        client: ClientConfig
    ): Promise<void> {

        await this.redis.set(
            this.getKey(client.clientId),
            JSON.stringify(client)
        );

    }

    async deleteClient(
        clientId: string
    ): Promise<void> {

        await this.redis.del(
            this.getKey(clientId)
        );

    }

}