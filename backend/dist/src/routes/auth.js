"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const otpService_1 = require("../services/otpService");
const emailService_1 = require("../services/emailService");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = (0, express_1.Router)();
// Cấu hình lưu trữ ảnh đại diện (Avatar)
const avatarsDir = path_1.default.join(__dirname, '..', '..', 'uploads', 'avatars');
if (!fs_1.default.existsSync(avatarsDir)) {
    fs_1.default.mkdirSync(avatarsDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, avatarsDir),
    filename: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        const name = `avatar_${Date.now()}${ext}`;
        cb(null, name);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
    fileFilter: (_req, file, cb) => {
        const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
        if (allowed.test(path_1.default.extname(file.originalname))) {
            cb(null, true);
        }
        else {
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
        const otp = (0, otpService_1.createOtp)(email);
        if (!otp) {
            return res.status(429).json({ success: false, message: 'Ban da gui qua nhieu yeu cau. Vui long thu lai sau 10 phut.' });
        }
        // Gui email OTP
        const sent = await (0, emailService_1.sendOtpEmail)(email, otp);
        if (!sent) {
            return res.status(500).json({ success: false, message: 'Khong the gui email OTP. Vui long thu lai.' });
        }
        return res.json({ success: true, message: 'Ma OTP da duoc gui den email cua ban' });
    }
    catch (err) {
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
        const isValid = (0, otpService_1.verifyOtp)(email, otp);
        if (!isValid) {
            return res.status(400).json({ success: false, message: 'Ma OTP khong dung hoac da het han' });
        }
        return res.json({ success: true, verified: true, message: 'Xac thuc email thanh cong' });
    }
    catch (err) {
        console.error('Verify OTP error:', err);
        return res.status(500).json({ success: false, message: 'Loi he thong' });
    }
});
// POST /api/auth/register — Dang ky
router.post('/register', authController_1.register);
// POST /api/auth/login — Đăng nhập → trả JWT
router.post('/login', authController_1.login);
// GET /api/auth/me — Thông tin user hiện tại (cần login)
router.get('/me', auth_1.verifyToken, authController_1.getMe);
// POST /api/auth/logout — Đăng xuất (blacklist token Redis)
router.post('/logout', auth_1.verifyToken, authController_1.logout);
// PUT /api/auth/profile — Cập nhật thông tin cá nhân
router.put('/profile', auth_1.verifyToken, authController_1.updateProfile);
// PUT /api/auth/profile/password — Đổi mật khẩu
router.put('/profile/password', auth_1.verifyToken, authController_1.changePassword);
// POST /api/auth/profile/avatar — Upload ảnh đại diện
router.post('/profile/avatar', auth_1.verifyToken, upload.single('avatar'), authController_1.uploadAvatar);
// DELETE /api/auth/profile/avatar — Xóa ảnh đại diện
router.delete('/profile/avatar', auth_1.verifyToken, authController_1.deleteAvatar);
exports.default = router;
//# sourceMappingURL=auth.js.map