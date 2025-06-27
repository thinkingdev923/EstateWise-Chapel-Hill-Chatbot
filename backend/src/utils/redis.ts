import { createClient, RedisClientType } from "redis";

const { REDIS_URL = "redis://localhost:6379", REDIS_DEFAULT_TTL = "3600" } =
  process.env;

let client: RedisClientType | null = null;

/**
 * Initialize and connect the Redis client (singleton).
 */
export async function connectRedis(): Promise<void> {
  if (client && client.isOpen) return;

  client = createClient({ url: REDIS_URL });
  client.on("error", (err) => {
    console.error("Redis Client Error", err);
  });

  await client.connect();
  console.log("✅ Connected to Redis at", REDIS_URL);
}

/**
 * Gracefully disconnect the Redis client.
 */
export async function disconnectRedis(): Promise<void> {
  if (client && client.isOpen) {
    await client.disconnect();
    console.log("🛑 Disconnected from Redis");
  }
}

/**
 * Get a value from Redis and parse it as JSON.
 * @param key Redis key
 * @returns The parsed value, or null if missing.
 */
export async function getValue<T = unknown>(key: string): Promise<T | null> {
  if (!client) throw new Error("Redis client is not connected");
  const raw = await client.get(key);
  return raw !== null ? (JSON.parse(raw) as T) : null;
}

/**
 * Set a value in Redis, serialized as JSON, with optional TTL.
 * @param key Redis key
 * @param value Value to store
 * @param ttlSeconds Time-to-live in seconds (defaults to REDIS_DEFAULT_TTL)
 */
export async function setValue<T = unknown>(
  key: string,
  value: T,
  ttlSeconds?: number,
): Promise<void> {
  if (!client) throw new Error("Redis client is not connected");
  const payload = JSON.stringify(value);
  const ttl = ttlSeconds ?? parseInt(REDIS_DEFAULT_TTL, 10);

  await client.set(key, payload, {
    EX: ttl,
  });
}

/**
 * Delete one or more keys.
 * @param keys Redis key or array of keys
 * @returns Number of keys deleted
 */
export async function deleteKey(keys: string | string[]): Promise<number> {
  if (!client) throw new Error("Redis client is not connected");
  return await client.del(keys);
}

export default {
  connect: connectRedis,
  disconnect: disconnectRedis,
  get: getValue,
  set: setValue,
  del: deleteKey,
};
