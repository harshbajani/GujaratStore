import { redis } from '../redis';

export const checkRedisConnection = async (): Promise<boolean> => {
  try {
    // Simple set/get operation to test connection
    await redis.set('health-check', 'ok', { ex: 10 });
    const result = await redis.get('health-check');
    return result === 'ok';
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
};