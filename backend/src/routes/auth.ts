import { Router } from 'express';
import { register, login, googleLogin, getMe, logout, updateProfile, changePassword, uploadAvatar, deleteAvatar } from '../controllers/authController';
import { verifyToken } from '../middleware/auth';
import { createOtp, verifyOtp } from '../services/otpService';
import { sendOtpEmail } from '../services/emailService';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
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

// POST /api/auth/send-otp — Gui ma OTP xac thuc email
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Email khong hop le' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Dinh dang email khong hop le' });
    }

    const otp = createOtp(email);
    if (!otp) {
      return res.status(429).json({ success: false, message: 'Ban da gui qua nhieu yeu cau. Vui long thu lai sau 10 phut.' });
    }

    // Gui email OTP
    const sent = await sendOtpEmail(email, otp);
    if (!sent) {
      return res.status(500).json({ success: false, message: 'Khong the gui email OTP. Vui long thu lai.' });
    }

    return res.json({ success: true, message: 'Ma OTP da duoc gui den email cua ban' });
  } catch (err) {
    console.error('Send OTP error:', err);
    return res.status(500).json({ success: false, message: 'Loi he thong' });
  }
});

// POST /api/auth/verify-otp — Xac thuc ma OTP
router.post('/verify-otp', (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Thieu email hoac ma OTP' });
    }

    const isValid = verifyOtp(email, otp);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Ma OTP khong dung hoac da het han' });
    }

    return res.json({ success: true, verified: true, message: 'Xac thuc email thanh cong' });
  } catch (err) {
    console.error('Verify OTP error:', err);
    return res.status(500).json({ success: false, message: 'Loi he thong' });
  }
});

// POST /api/auth/forgot-password/send-otp — Gửi mã OTP đặt lại mật khẩu
router.post('/forgot-password/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập địa chỉ email hợp lệ' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: trimmedEmail, mode: 'insensitive' } },
      select: { user_id: true, email: true, user_status: true },
    });

    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản nào đăng ký với email này' });
    }

    if (existingUser.user_status === false) {
      return res.status(403).json({ success: false, message: 'Tài khoản này đang bị khóa, vui lòng liên hệ hỗ trợ' });
    }

    const otp = createOtp(trimmedEmail);
    if (!otp) {
      return res.status(429).json({ success: false, message: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 10 phút.' });
    }

    const sent = await sendOtpEmail(trimmedEmail, otp);
    if (!sent) {
      return res.status(500).json({ success: false, message: 'Không thể gửi email OTP lúc này. Vui lòng thử lại.' });
    }

    return res.json({ success: true, message: 'Mã xác thực 6 số đã được gửi đến email của bạn' });
  } catch (err) {
    console.error('Forgot password send OTP error:', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
  }
});

// POST /api/auth/forgot-password/reset — Xác thực OTP và đặt mật khẩu mới
router.post('/forgot-password/reset', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ email, mã OTP và mật khẩu mới' });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const isValid = verifyOtp(trimmedEmail, String(otp).trim());
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Mã OTP không chính xác hoặc đã hết hạn' });
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: trimmedEmail, mode: 'insensitive' } },
      select: { user_id: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { user_id: user.user_id },
      data: { password: hashedPassword },
    });

    return res.json({ success: true, message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.' });
  } catch (err) {
    console.error('Forgot password reset error:', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống khi đặt lại mật khẩu' });
  }
});

// POST /api/auth/register — Dang ky
router.post('/register', register);

// POST /api/auth/login — Đăng nhập → trả JWT
router.post('/login', login);

// POST /api/auth/google-login — Đăng nhập bằng Google
router.post('/google-login', googleLogin);

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
