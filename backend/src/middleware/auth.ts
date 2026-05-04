// Middleware xác thực JWT — verify token từ header Authorization
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendError } from '../utils/response';
import { isTokenBlacklisted } from '../utils/redis';

// Mở rộng Request để có user info
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
export async function verifyToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'Vui lòng đăng nhập để tiếp tục', 401);
      return;
    }

    const token = authHeader.split(' ')[1];

    // Kiểm tra token có bị blacklist không (user đã logout)
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      sendError(res, 'Token đã hết hạn, vui lòng đăng nhập lại', 401);
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      sendError(res, 'Lỗi cấu hình server', 500);
      return;
    }

    const decoded = jwt.verify(token, secret) as {
      user_id: number;
      email: string;
      role: string;
    };

    req.user = {
      user_id: decoded.user_id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      sendError(res, 'Token đã hết hạn, vui lòng đăng nhập lại', 401);
      return;
    }
    if (err instanceof jwt.JsonWebTokenError) {
      sendError(res, 'Token không hợp lệ', 401);
      return;
    }
    sendError(res, 'Lỗi xác thực', 500);
  }
}
