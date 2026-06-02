"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
exports.connectRedis = connectRedis;
exports.blacklistToken = blacklistToken;
exports.isTokenBlacklisted = isTokenBlacklisted;
// Redis client singleton — dùng cho token blacklist, cache
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("./logger");
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
let redis = null;
exports.redis = redis;
try {
    exports.redis = redis = new ioredis_1.default(REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
            if (times > 3) {
                logger_1.logger.warn('Redis: Đã thử kết nối 3 lần, dừng retry. Ứng dụng sẽ chạy không có Redis.');
                return null; // Dừng retry
            }
            const delay = Math.min(times * 200, 2000);
            return delay;
        },
        lazyConnect: true,
    });
    redis.on('connect', () => {
        logger_1.logger.info('✅ Redis connected');
    });
    redis.on('error', (err) => {
        logger_1.logger.error('❌ Redis error:', err.message);
    });
}
catch (err) {
    logger_1.logger.warn('⚠️ Redis không khả dụng, ứng dụng sẽ chạy không có Redis cache');
    exports.redis = redis = null;
}
/**
 * Kết nối Redis — gọi khi khởi tạo app
 * Nếu Redis không khả dụng, app vẫn chạy bình thường
 */
async function connectRedis() {
    if (!redis)
        return;
    try {
        await redis.connect();
    }
    catch (err) {
        logger_1.logger.warn('⚠️ Không thể kết nối Redis, tiếp tục chạy không có cache');
        try {
            redis.disconnect();
        }
        catch (e) { }
        exports.redis = redis = null;
    }
}
/**
 * Thêm token vào blacklist (khi user logout)
 * @param token JWT token
 * @param expiresInSeconds Thời gian sống còn lại của token (seconds)
 */
async function blacklistToken(token, expiresInSeconds) {
    if (!redis)
        return;
    try {
        await redis.set(`bl:${token}`, '1', 'EX', expiresInSeconds);
    }
    catch {
        logger_1.logger.error('Redis: Không thể blacklist token');
    }
}
/**
 * Kiểm tra token có bị blacklist không
 */
async function isTokenBlacklisted(token) {
    if (!redis)
        return false;
    try {
        const result = await redis.get(`bl:${token}`);
        return result === '1';
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=redis.js.map