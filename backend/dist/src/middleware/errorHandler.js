"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.globalErrorHandler = globalErrorHandler;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
/**
 * Custom error class cho application errors
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
/**
 * Global error handler — bắt tất cả lỗi chưa handle
 */
function globalErrorHandler(err, _req, res, _next) {
    // Zod validation error
    if (err instanceof zod_1.ZodError) {
        const errors = err.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        res.status(400).json({
            success: false,
            message: 'Dữ liệu không hợp lệ',
            errors,
        });
        return;
    }
    // App error (do mình throw)
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
        return;
    }
    // Lỗi không xác định — log full stack
    logger_1.logger.error(err);
    res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống, vui lòng thử lại sau',
    });
}
//# sourceMappingURL=errorHandler.js.map