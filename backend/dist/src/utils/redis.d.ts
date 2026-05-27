import Redis from 'ioredis';
declare let redis: Redis | null;
/**
 * Kết nối Redis — gọi khi khởi tạo app
 * Nếu Redis không khả dụng, app vẫn chạy bình thường
 */
export declare function connectRedis(): Promise<void>;
/**
 * Thêm token vào blacklist (khi user logout)
 * @param token JWT token
 * @param expiresInSeconds Thời gian sống còn lại của token (seconds)
 */
export declare function blacklistToken(token: string, expiresInSeconds: number): Promise<void>;
/**
 * Kiểm tra token có bị blacklist không
 */
export declare function isTokenBlacklisted(token: string): Promise<boolean>;
export { redis };
//# sourceMappingURL=redis.d.ts.map