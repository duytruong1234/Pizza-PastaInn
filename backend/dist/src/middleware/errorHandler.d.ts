import { Request, Response, NextFunction } from 'express';
/**
 * Custom error class cho application errors
 */
export declare class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    constructor(message: string, statusCode: number);
}
/**
 * Global error handler — bắt tất cả lỗi chưa handle
 */
export declare function globalErrorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void;
//# sourceMappingURL=errorHandler.d.ts.map