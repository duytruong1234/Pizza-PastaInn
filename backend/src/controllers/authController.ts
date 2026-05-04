// Auth controller — xử lý đăng ký, đăng nhập, thông tin user, đăng xuất
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { blacklistToken } from '../utils/redis';
import { registerSchema, loginSchema } from '../validators/authValidator';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

/**
 * POST /api/auth/register
 * Đăng ký tài khoản mới — role mặc định là "customer"
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    // Validate input
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      sendError(res, 'Dữ liệu không hợp lệ', 400, errors);
      return;
    }

    const { username, email, phone, password } = parsed.data;

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      sendError(res, 'Email đã được đăng ký, vui lòng sử dụng email khác', 409);
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tạo user mới
    const user = await prisma.user.create({
      data: {
        username,
        email,
        phone: phone || null,
        password: hashedPassword,
        role: 'customer',
        user_status: true,
        created_at: new Date(),
      },
      select: {
        user_id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    // Tạo JWT token
    const token = generateToken(user.user_id, user.email!, user.role!);

    logger.info(`Đăng ký thành công: ${email}`);

    sendSuccess(
      res,
      {
        data: { user, token },
        message: 'Đăng ký thành công',
      },
      201
    );
  } catch (err) {
    logger.error('Register error:', err);
    sendError(res, 'Lỗi hệ thống khi đăng ký', 500);
  }
}

/**
 * POST /api/auth/login
 * Đăng nhập — trả về JWT token (7 ngày)
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    // Validate input
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      sendError(res, 'Dữ liệu không hợp lệ', 400, errors);
      return;
    }

    const { email, password } = parsed.data;

    // Tìm user theo email
    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user || !user.password) {
      sendError(res, 'Email hoặc mật khẩu không đúng', 401);
      return;
    }

    // Kiểm tra tài khoản bị khoá
    if (user.user_status === false) {
      sendError(res, 'Tài khoản đã bị khoá, vui lòng liên hệ admin', 403);
      return;
    }

    // Kiểm tra password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      sendError(res, 'Email hoặc mật khẩu không đúng', 401);
      return;
    }

    // Tạo JWT token
    const token = generateToken(user.user_id, user.email!, user.role!);

    logger.info(`Đăng nhập thành công: ${email}`);

    sendSuccess(res, {
      data: {
        user: {
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        token,
      },
      message: 'Đăng nhập thành công',
    });
  } catch (err) {
    logger.error('Login error:', err);
    sendError(res, 'Lỗi hệ thống khi đăng nhập', 500);
  }
}

/**
 * GET /api/auth/me
 * Lấy thông tin user hiện tại từ token
 */
export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Chưa đăng nhập', 401);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { user_id: req.user.user_id },
      select: {
        user_id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        user_status: true,
        created_at: true,
      },
    });

    if (!user) {
      sendError(res, 'Không tìm thấy tài khoản', 404);
      return;
    }

    sendSuccess(res, { data: user });
  } catch (err) {
    logger.error('GetMe error:', err);
    sendError(res, 'Lỗi hệ thống', 500);
  }
}

/**
 * POST /api/auth/logout
 * Đăng xuất — lưu token vào Redis blacklist
 */
export async function logout(req: AuthRequest, res: Response): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      sendError(res, 'Không tìm thấy token', 400);
      return;
    }

    const token = authHeader.split(' ')[1];

    // Tính thời gian còn lại của token để set TTL cho blacklist
    try {
      const decoded = jwt.decode(token) as { exp?: number } | null;
      if (decoded?.exp) {
        const now = Math.floor(Date.now() / 1000);
        const ttl = decoded.exp - now;
        if (ttl > 0) {
          await blacklistToken(token, ttl);
        }
      }
    } catch {
      // Token decode fail — vẫn coi như logout thành công
    }

    logger.info(`Đăng xuất: user_id=${req.user?.user_id}`);

    sendSuccess(res, { message: 'Đăng xuất thành công' });
  } catch (err) {
    logger.error('Logout error:', err);
    sendError(res, 'Lỗi hệ thống khi đăng xuất', 500);
  }
}

// Helper

function generateToken(userId: number, email: string, role: string): string {
  const secret = process.env.JWT_SECRET!;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    { user_id: userId, email, role },
    secret,
    { expiresIn } as jwt.SignOptions
  );
}
