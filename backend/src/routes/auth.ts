// Auth routes — đăng ký, đăng nhập, thông tin user, đăng xuất
import { Router } from 'express';
import { register, login, getMe, logout } from '../controllers/authController';
import { verifyToken } from '../middleware/auth';

const router = Router();

// POST /api/auth/register — Đăng ký
router.post('/register', register);

// POST /api/auth/login — Đăng nhập → trả JWT
router.post('/login', login);

// GET /api/auth/me — Thông tin user hiện tại (cần login)
router.get('/me', verifyToken, getMe);

// POST /api/auth/logout — Đăng xuất (blacklist token Redis)
router.post('/logout', verifyToken, logout);

export default router;
