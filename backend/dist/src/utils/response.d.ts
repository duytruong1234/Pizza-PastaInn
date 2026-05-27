import { Response } from 'express';
interface SuccessPayload {
    data?: unknown;
    message?: string;
    meta?: Record<string, unknown>;
}
/**
 * Trả về response thành công
 */
export declare function sendSuccess(res: Response, payload?: SuccessPayload, statusCode?: number): Response<any, Record<string, any>>;
/**
 * Trả về response lỗi
 */
export declare function sendError(res: Response, message: string, statusCode?: number, errors?: unknown): Response<any, Record<string, any>>;
export {};
//# sourceMappingURL=response.d.ts.map