import fs from "fs/promises";
import path from "path";

import redis from "../redis/redis";

class LuaLoader {
    private tokenBucketSha: string | null = null;

    async loadScripts(): Promise<void> {
        const script = await fs.readFile(
            path.join(__dirname, "tokenBucket.lua"),
            "utf-8"
        );

        this.tokenBucketSha = await redis.scriptLoad(script);

        console.log("Loaded tokenBucket.lua");
        console.log("SHA:", this.tokenBucketSha);
    }

    getTokenBucketSha(): string {
        if (!this.tokenBucketSha) {
            throw new Error("Lua scripts not loaded.");
        }

        return this.tokenBucketSha;
    }
}

export default new LuaLoader();