local bucketKey = KEYS[1]
local statsKey = KEYS[2]
local activityKey = KEYS[3]
local rpsKey = KEYS[4]

local capacity = tonumber(ARGV[1])
local refillRate = tonumber(ARGV[2])
local currentTime = tonumber(ARGV[3])
local clientId = ARGV[4]

----------------------------------------------------
-- Fetch bucket
----------------------------------------------------

local bucket = redis.call(
    "HMGET",
    bucketKey,
    "tokens",
    "lastRefillTime"
)

local tokens = tonumber(bucket[1])
local lastRefillTime = tonumber(bucket[2])

if not tokens or not lastRefillTime then
    tokens = capacity
    lastRefillTime = currentTime
end

----------------------------------------------------
-- Refill
----------------------------------------------------

local elapsedTime = currentTime - lastRefillTime
local elapsedSeconds = elapsedTime / 1000

local tokensToAdd = math.floor(
    elapsedSeconds * refillRate
)

if tokensToAdd > 0 then

    tokens = math.min(
        tokens + tokensToAdd,
        capacity
    )

    local millisecondsPerToken =
        1000 / refillRate

    lastRefillTime =
        lastRefillTime +
        (tokensToAdd * millisecondsPerToken)
end

----------------------------------------------------
-- Consume
----------------------------------------------------

local allowed = 0

if tokens > 0 then
    tokens = tokens - 1
    allowed = 1
end

----------------------------------------------------
-- Save Bucket
----------------------------------------------------

redis.call(
    "HSET",
    bucketKey,
    "tokens",
    tokens,
    "lastRefillTime",
    lastRefillTime
)

redis.call(
    "EXPIRE",
    bucketKey,
    3600
)

----------------------------------------------------
-- Stats
----------------------------------------------------

redis.call(
    "HINCRBY",
    statsKey,
    "totalRequests",
    1
)

if allowed == 1 then

    redis.call(
        "HINCRBY",
        statsKey,
        "allowedRequests",
        1
    )

else

    redis.call(
        "HINCRBY",
        statsKey,
        "blockedRequests",
        1
    )

end

redis.call(
    "HSET",
    statsKey,
    "lastRequestTime",
    currentTime
)

redis.call(
    "EXPIRE",
    statsKey,
    3600
)

----------------------------------------------------
-- Activity Feed
----------------------------------------------------

local event = cjson.encode({
    time=currentTime,
    clientId=clientId,
    allowed=(allowed==1),
    remainingTokens=tokens
})

redis.call(
    "LPUSH",
    activityKey,
    event
)

redis.call(
    "LTRIM",
    activityKey,
    0,
    199
)

----------------------------------------------------
-- Requests Per Second
----------------------------------------------------

redis.call(
    "INCR",
    rpsKey
)

redis.call(
    "EXPIRE",
    rpsKey,
    2
)

----------------------------------------------------
-- Reset Time
----------------------------------------------------

local resetTime

if tokens > 0 then

    resetTime = currentTime

else

    local millisecondsPerToken =
        1000 / refillRate

    resetTime =
        lastRefillTime +
        millisecondsPerToken

end

----------------------------------------------------

return {
    allowed,
    tokens,
    resetTime
}