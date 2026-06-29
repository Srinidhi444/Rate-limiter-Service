import redis from "../redis/redis";
import { Bucket } from "../types/bucket";

class BucketRepository {
    private getKey(clientId: string): string {
        return `bucket:${clientId}`;
    }

    async getBucket(clientId: string): Promise<Bucket | null> {
        const data = await redis.get(this.getKey(clientId));

        if (!data) {
            return null;
        }

        return JSON.parse(data) as Bucket;
    }

    async saveBucket(clientId: string, bucket: Bucket): Promise<void> {
        await redis.set(
            this.getKey(clientId),
            JSON.stringify(bucket),
            {
                EX: 3600, // expire after 1 hour of inactivity
            }
        );
    }

    async deleteBucket(clientId: string): Promise<void> {
        await redis.del(this.getKey(clientId));
    }
}

export default new BucketRepository();