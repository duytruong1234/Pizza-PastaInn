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
/**
 * PUT /api/auth/profile
 * Cập nhật thông tin cá nhân (username, phone, email, avatar)
 */
export declare function updateProfile(req: AuthRequest, res: Response): Promise<void>;
/**
 * PUT /api/auth/profile/password
 * Thay đổi mật khẩu người dùng
 */
export declare function changePassword(req: AuthRequest, res: Response): Promise<void>;
/**
 * POST /api/auth/profile/avatar
 * Upload ảnh đại diện
 */
export declare function uploadAvatar(req: AuthRequest, res: Response): Promise<void>;
/**
 * DELETE /api/auth/profile/avatar
 * Xóa ảnh đại diện
 */
export declare function deleteAvatar(req: AuthRequest, res: Response): Promise<void>;
//# sourceMappingURL=authController.d.ts.map