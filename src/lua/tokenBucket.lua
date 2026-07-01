local key = KEYS[1]

local capacity = tonumber(ARGV[1])
local refillRate = tonumber(ARGV[2])
local currentTime = tonumber(ARGV[3])

-- Fetch existing bucket
local bucket = redis.call("HMGET", key, "tokens", "lastRefillTime")

local tokens = tonumber(bucket[1])
local lastRefillTime = tonumber(bucket[2])

-- First request for this client
if not tokens or not lastRefillTime then
    tokens = capacity
    lastRefillTime = currentTime
end

-- Calculate refill
local elapsedTime = currentTime - lastRefillTime
local elapsedSeconds = elapsedTime / 1000

local tokensToAdd = math.floor(elapsedSeconds * refillRate)

if tokensToAdd > 0 then
    tokens = math.min(tokens + tokensToAdd, capacity)

    -- Preserve leftover elapsed time instead of discarding it
    local millisecondsPerToken = 1000 / refillRate
    lastRefillTime = lastRefillTime + (tokensToAdd * millisecondsPerToken)
end

-- Consume token
local allowed = 0

if tokens > 0 then
    tokens = tokens - 1
    allowed = 1
end

-- Save updated bucket
redis.call(
    "HSET",
    key,
    "tokens",
    tokens,
    "lastRefillTime",
    lastRefillTime
)

-- Expire inactive buckets after 1 hour
redis.call("EXPIRE", key, 3600)

-- Calculate reset time
local resetTime

if tokens > 0 then
    resetTime = currentTime
else
    local millisecondsPerToken = 1000 / refillRate
    resetTime = lastRefillTime + millisecondsPerToken
end

return {
    allowed,
    tokens,
    resetTime
}