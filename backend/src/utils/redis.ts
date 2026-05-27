// Redis client singleton — dùng cho token blacklist, cache
import Redis from 'ioredis';
import { logger } from './logger';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redis: Redis | null = null;

try {
  redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) {
        logger.warn('Redis: Đã thử kết nối 3 lần, dừng retry. Ứng dụng sẽ chạy không có Redis.');
        return null; // Dừng retry
      }
      const delay = Math.min(times * 200, 2000);
      return delay;
    },
    lazyConnect: true,
  });

  redis.on('connect', () => {
    logger.info('✅ Redis connected');
  });

  redis.on('error', (err) => {
    logger.error('❌ Redis error:', err.message);
  });
} catch (err) {
  logger.warn('⚠️ Redis không khả dụng, ứng dụng sẽ chạy không có Redis cache');
  redis = null;
}

/**
 * Kết nối Redis — gọi khi khởi tạo app
 * Nếu Redis không khả dụng, app vẫn chạy bình thường
 */
export async function connectRedis(): Promise<void> {
  if (!redis) return;
  try {
    await redis.connect();
  } catch (err) {
    logger.warn('⚠️ Không thể kết nối Redis, tiếp tục chạy không có cache');
    try {
      redis.disconnect();
    } catch (e) {}
    redis = null;
  }
}

/**
 * Thêm token vào blacklist (khi user logout)
 * @param token JWT token
 * @param expiresInSeconds Thời gian sống còn lại của token (seconds)
 */
export async function blacklistToken(token: string, expiresInSeconds: number): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(`bl:${token}`, '1', 'EX', expiresInSeconds);
  } catch {
    logger.error('Redis: Không thể blacklist token');
  }
}

/**
 * Kiểm tra token có bị blacklist không
 */
export async function isTokenBlacklisted(token: string): Promise<boolean> {
  if (!redis) return false;
  try {
    const result = await redis.get(`bl:${token}`);
    return result === '1';
  } catch {
    return false;
  }
}

export { redis };
