"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const response_1 = require("../utils/response");
const redis_1 = require("../utils/redis");
/**
 * Middleware verifyToken — kiểm tra JWT từ header Authorization: Bearer <token>
 * Nếu token hợp lệ → gắn user info vào req.user
 */
async function verifyToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            (0, response_1.sendError)(res, 'Vui lòng đăng nhập để tiếp tục', 401);
            return;
        }
        const token = authHeader.split(' ')[1];
        // Kiểm tra token có bị blacklist không (user đã logout)
        const blacklisted = await (0, redis_1.isTokenBlacklisted)(token);
        if (blacklisted) {
            (0, response_1.sendError)(res, 'Token đã hết hạn, vui lòng đăng nhập lại', 401);
            return;
        }
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            (0, response_1.sendError)(res, 'Lỗi cấu hình server', 500);
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        req.user = {
            user_id: decoded.user_id,
            email: decoded.email,
            role: decoded.role,
        };
        next();
    }
    catch (err) {
        if (err instanceof jsonwebtoken_1.default.TokenExpiredError) {
            (0, response_1.sendError)(res, 'Token đã hết hạn, vui lòng đăng nhập lại', 401);
            return;
        }
        if (err instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            (0, response_1.sendError)(res, 'Token không hợp lệ', 401);
            return;
        }
        (0, response_1.sendError)(res, 'Lỗi xác thực', 500);
    }
}
//# sourceMappingURL=auth.js.map