import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
/**
 * POST /api/auth/register
 * Đăng ký tài khoản mới — role mặc định là "customer"
 */
export declare function register(req: Request, res: Response): Promise<void>;
/**
 * POST /api/auth/login
 * Đăng nhập — trả về JWT token (7 ngày)
 */
export declare function login(req: Request, res: Response): Promise<void>;
/**
 * GET /api/auth/me
 * Lấy thông tin user hiện tại từ token
 */
export declare function getMe(req: AuthRequest, res: Response): Promise<void>;
/**
 * POST /api/auth/logout
 * Đăng xuất — lưu token vào Redis blacklist
 */
export declare function logout(req: AuthRequest, res: Response): Promise<void>;
//# sourceMappingURL=authController.d.ts.map