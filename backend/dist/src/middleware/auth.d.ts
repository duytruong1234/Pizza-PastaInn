import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: {
        user_id: number;
        email: string;
        role: string;
    };
}
/**
 * Middleware verifyToken — kiểm tra JWT từ header Authorization: Bearer <token>
 * Nếu token hợp lệ → gắn user info vào req.user
 */
export declare function verifyToken(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=auth.d.ts.map