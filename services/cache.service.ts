import { redis } from "@/lib/redis";

export class CacheService {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      return data as T;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  static async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    try {
      await redis.set(key, value, { ex: ttl });
    } catch (error) {
      console.error("Cache set error:", error);
    }
  }

  static async delete(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error("Cache delete error:", error);
    }
  }

  static async keys(pattern: string): Promise<string[]> {
    try {
      const keys = await redis.keys(pattern);
      return keys;
    } catch (error) {
      console.error("Cache keys error:", error);
      return [];
    }
  }
}
