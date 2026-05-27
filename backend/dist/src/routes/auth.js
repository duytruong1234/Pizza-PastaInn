"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Auth routes — đăng ký, đăng nhập, thông tin user, đăng xuất
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// POST /api/auth/register — Đăng ký
router.post('/register', authController_1.register);
// POST /api/auth/login — Đăng nhập → trả JWT
router.post('/login', authController_1.login);
// GET /api/auth/me — Thông tin user hiện tại (cần login)
router.get('/me', auth_1.verifyToken, authController_1.getMe);
// POST /api/auth/logout — Đăng xuất (blacklist token Redis)
router.post('/logout', auth_1.verifyToken, authController_1.logout);
exports.default = router;
//# sourceMappingURL=auth.js.map