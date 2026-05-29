import { Router } from 'express';
import { register, login, getMe, logout, updateProfile, changePassword, uploadAvatar, deleteAvatar } from '../controllers/authController';
import { verifyToken } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Cấu hình lưu trữ ảnh đại diện (Avatar)
const avatarsDir = path.join(__dirname, '..', '..', 'uploads', 'avatars');
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, avatarsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `avatar_${Date.now()}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh (jpg, png, gif, webp)'));
    }
  },
});

// POST /api/auth/register — Đăng ký
router.post('/register', register);

// POST /api/auth/login — Đăng nhập → trả JWT
router.post('/login', login);

// GET /api/auth/me — Thông tin user hiện tại (cần login)
router.get('/me', verifyToken, getMe);

// POST /api/auth/logout — Đăng xuất (blacklist token Redis)
router.post('/logout', verifyToken, logout);

// PUT /api/auth/profile — Cập nhật thông tin cá nhân
router.put('/profile', verifyToken, updateProfile);

// PUT /api/auth/profile/password — Đổi mật khẩu
router.put('/profile/password', verifyToken, changePassword);

// POST /api/auth/profile/avatar — Upload ảnh đại diện
router.post('/profile/avatar', verifyToken, upload.single('avatar'), uploadAvatar);

// DELETE /api/auth/profile/avatar — Xóa ảnh đại diện
router.delete('/profile/avatar', verifyToken, deleteAvatar);

export default router;
