# Distributed Token Bucket Rate Limiter

A high-performance distributed **Token Bucket Rate Limiter** built with **TypeScript**, **Redis**, and **Lua**.

This project demonstrates how production-grade rate limiting can be implemented using Redis as a centralized state store while leveraging Redis Lua scripting to guarantee atomic operations and eliminate race conditions.

The library is published on npm as:

```bash
npm install @srinidhi-kulkarni/rate-limiter
```

---

# Overview

Modern backend systems often run multiple server instances behind a load balancer.

In-memory rate limiting works only when a single server is handling all requests. Once multiple instances are introduced, each server maintains its own counters, leading to inconsistent rate limiting.

This project solves that problem by storing bucket state inside Redis and executing the complete Token Bucket algorithm as an atomic Lua script.

As a result:

- Every server shares the same rate limit state
- No race conditions occur
- No distributed locks are required
- Multiple application instances behave as a single logical rate limiter

---

# Features

- Distributed rate limiting
- Token Bucket algorithm
- Atomic Redis Lua execution
- Race-condition free
- Express middleware
- Configurable per client
- Automatic token refill
- Burst request support
- Redis persistence
- TypeScript implementation
- Published as an npm package

---

# Motivation

Many tutorials implement rate limiting using JavaScript objects or Maps.

Example:

```
Server A

client1 -> 5 requests
```

```
Server B

client1 -> 5 requests
```

If both servers allow 5 requests independently, the client effectively receives 10 requests instead of 5.

A distributed application therefore requires a centralized state store.

Redis solves this problem.

However, simply storing counters inside Redis is not enough.

Concurrent requests can still introduce race conditions if multiple GET and SET operations are performed separately.

This project eliminates that issue by executing the entire algorithm inside a Redis Lua script, where Redis guarantees atomic execution.

---

# Architecture

```
                Client Request
                      │
                      ▼
            Express Middleware
                      │
                      ▼
               RateLimiter Library
                      │
                      ▼
             Redis Lua Script (Atomic)
                      │
        ┌─────────────┴─────────────┐
        │                           │
  Token Available             Bucket Empty
        │                           │
        ▼                           ▼
 Allow Request               Reject (429)
```

---

# Project Structure

```
src/

core/
    RateLimiter.ts

repositories/
    bucket.repository.ts
    client.repository.ts

redis/
    createRedisClient.ts

lua/
    tokenBucket.lua

types/

index.ts
```

---

# Tech Stack

- TypeScript
- Node.js
- Express
- Redis
- Lua

---

# How the Token Bucket Algorithm Works

Each client owns a bucket.

The bucket contains:

- Capacity
- Current Tokens
- Last Refill Time

Example:

```
Capacity = 10

Current Tokens = 10

Refill Rate = 5 tokens/sec
```

Whenever a request arrives:

1. Calculate elapsed time.
2. Refill tokens.
3. Clamp to maximum capacity.
4. Consume one token.
5. Save updated bucket.
6. Return whether request is allowed.

If no tokens remain:

```
HTTP 429 Too Many Requests
```

is returned.

---

# Why Lua?

A naive Redis implementation looks like this:

```
GET bucket

↓

Modify bucket

↓

SET bucket
```

Two requests arriving simultaneously can both read the same bucket before either writes the update, causing lost updates and incorrect rate limiting.

Instead, this project executes the complete algorithm inside a Redis Lua script:

```
Redis

↓

Execute Lua

↓

Update bucket

↓

Return result
```

Redis guarantees that a Lua script executes atomically.

No other Redis command can interleave during its execution.

This completely removes race conditions.

---

# Redis Data Model

Client configuration

```
client:{clientId}
```

Example

```
client:demo-client
```

Bucket

```
bucket:{clientId}
```

Stores

```
tokens

lastRefillTime
```

---

# Express Middleware

The library integrates directly with Express.

Example

```ts
app.use(
    limiter.middleware({
        clientId: (req) =>
            req.headers["x-api-key"] as string,
    })
);
```

The middleware:

- Extracts the client identifier
- Executes the Redis Lua script
- Adds rate limit headers
- Rejects requests with HTTP 429 when limits are exceeded

---

# Example

Register a client

```ts
await limiter.registerClient({
    clientId: "demo-client",
    capacity: 10,
    refillRate: 5,
});
```

Create middleware

```ts
app.use(
    limiter.middleware({
        clientId: (req) =>
            req.headers["x-api-key"] as string,
    })
);
```

---

# Response Headers

The middleware automatically returns:

```
X-RateLimit-Limit

X-RateLimit-Remaining

X-RateLimit-Reset
```

---

# Performance Testing

The project was stress-tested using **Autocannon**.

### Burst Test

```
20 concurrent requests

10 allowed

10 rejected
```

---

### Sustained Load

```
200 concurrent connections

30 seconds

≈92,000 requests

≈3,000 requests/sec

Correct refill behaviour

No race conditions
```

---

### High Concurrency

```
1000 concurrent requests

Atomic Redis execution

No inconsistent bucket state
```

---


# Current Capabilities

- Distributed Token Bucket
- Atomic Redis Lua execution
- Express middleware
- Configurable client limits
- TypeScript support

---

# Future Improvements

- Maybe adding more algorithms and RAM based limiting also

---

# Installation

```bash
npm install @srinidhi-kulkarni/rate-limiter
```

---

# Quick Example

```ts
const limiter = new RateLimiter({
    redisUrl: "redis://localhost:6379",
});

await limiter.connect();

await limiter.registerClient({
    clientId: "demo-client",
    capacity: 10,
    refillRate: 5,
});

app.use(
    limiter.middleware({
        clientId: (req) =>
            req.headers["x-api-key"] as string,
    })
);
```

---

# License

MIT

---

# Author

**Srinidhi Kulkarni**

