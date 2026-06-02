"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
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
// POST /api/auth/register — Đăng ký
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