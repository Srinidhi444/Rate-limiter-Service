export interface ClientConfig {
    clientId: string;
    capacity: number;
    refillRate: number;
    algorithm: "TOKEN_BUCKET" | "SLIDING_WINDOW";
}