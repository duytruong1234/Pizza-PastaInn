"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.getMe = getMe;
exports.logout = logout;
exports.updateProfile = updateProfile;
exports.changePassword = changePassword;
exports.uploadAvatar = uploadAvatar;
exports.deleteAvatar = deleteAvatar;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const response_1 = require("../utils/response");
const redis_1 = require("../utils/redis");
const authValidator_1 = require("../validators/authValidator");
const logger_1 = require("../utils/logger");
/**
 * POST /api/auth/register
 * Đăng ký tài khoản mới — role mặc định là "customer"
 */
async function register(req, res) {
    try {
        // Validate input
        const parsed = authValidator_1.registerSchema.safeParse(req.body);
        if (!parsed.success) {
            const errors = parsed.error.issues.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            }));
            (0, response_1.sendError)(res, 'Dữ liệu không hợp lệ', 400, errors);
            return;
        }
        const { username, email, phone, password } = parsed.data;
        // Kiểm tra email đã tồn tại chưa
        const existingUser = await prisma_1.default.user.findFirst({
            where: { email },
        });
        if (existingUser) {
            (0, response_1.sendError)(res, 'Email đã được đăng ký, vui lòng sử dụng email khác', 409);
            return;
        }
        // Hash password
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        // Tạo user mới
        const user = await prisma_1.default.user.create({
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
        const token = generateToken(user.user_id, user.email, user.role);
        logger_1.logger.info(`Đăng ký thành công: ${email}`);
        (0, response_1.sendSuccess)(res, {
            data: { user, token },
            message: 'Đăng ký thành công',
        }, 201);
    }
    catch (err) {
        logger_1.logger.error('Register error:', err);
        (0, response_1.sendError)(res, 'Lỗi hệ thống khi đăng ký', 500);
    }
}
/**
 * POST /api/auth/login
 * Đăng nhập — trả về JWT token (7 ngày)
 */
async function login(req, res) {
    try {
        // Validate input
        const parsed = authValidator_1.loginSchema.safeParse(req.body);
        if (!parsed.success) {
            const errors = parsed.error.issues.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            }));
            (0, response_1.sendError)(res, 'Dữ liệu không hợp lệ', 400, errors);
            return;
        }
        const { email, password } = parsed.data;
        // Tìm user theo email
        const user = await prisma_1.default.user.findFirst({
            where: { email },
        });
        if (!user || !user.password) {
            (0, response_1.sendError)(res, 'Email hoặc mật khẩu không đúng', 401);
            return;
        }
        // Kiểm tra tài khoản bị khoá
        if (user.user_status === false) {
            (0, response_1.sendError)(res, 'Tài khoản đã bị khoá, vui lòng liên hệ admin', 403);
            return;
        }
        // Kiểm tra password
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            (0, response_1.sendError)(res, 'Email hoặc mật khẩu không đúng', 401);
            return;
        }
        // Tạo JWT token
        const token = generateToken(user.user_id, user.email, user.role);
        logger_1.logger.info(`Đăng nhập thành công: ${email}`);
        (0, response_1.sendSuccess)(res, {
            data: {
                user: {
                    user_id: user.user_id,
                    username: user.username,
                    email: user.email,
                    phone: user.phone,
                    avatar: user.avatar,
                    role: user.role,
                },
                token,
            },
            message: 'Đăng nhập thành công',
        });
    }
    catch (err) {
        logger_1.logger.error('Login error:', err);
        (0, response_1.sendError)(res, 'Lỗi hệ thống khi đăng nhập', 500);
    }
}
/**
 * GET /api/auth/me
 * Lấy thông tin user hiện tại từ token
 */
async function getMe(req, res) {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Chưa đăng nhập', 401);
            return;
        }
        const user = await prisma_1.default.user.findUnique({
            where: { user_id: req.user.user_id },
            select: {
                user_id: true,
                username: true,
                email: true,
                phone: true,
                avatar: true,
                role: true,
                user_status: true,
                created_at: true,
            },
        });
        if (!user) {
            (0, response_1.sendError)(res, 'Không tìm thấy tài khoản', 404);
            return;
        }
        (0, response_1.sendSuccess)(res, { data: user });
    }
    catch (err) {
        logger_1.logger.error('GetMe error:', err);
        (0, response_1.sendError)(res, 'Lỗi hệ thống', 500);
    }
}
/**
 * POST /api/auth/logout
 * Đăng xuất — lưu token vào Redis blacklist
 */
async function logout(req, res) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            (0, response_1.sendError)(res, 'Không tìm thấy token', 400);
            return;
        }
        const token = authHeader.split(' ')[1];
        // Tính thời gian còn lại của token để set TTL cho blacklist
        try {
            const decoded = jsonwebtoken_1.default.decode(token);
            if (decoded?.exp) {
                const now = Math.floor(Date.now() / 1000);
                const ttl = decoded.exp - now;
                if (ttl > 0) {
                    await (0, redis_1.blacklistToken)(token, ttl);
                }
            }
        }
        catch {
            // Token decode fail — vẫn coi như logout thành công
        }
        logger_1.logger.info(`Đăng xuất: user_id=${req.user?.user_id}`);
        (0, response_1.sendSuccess)(res, { message: 'Đăng xuất thành công' });
    }
    catch (err) {
        logger_1.logger.error('Logout error:', err);
        (0, response_1.sendError)(res, 'Lỗi hệ thống khi đăng xuất', 500);
    }
}
/**
 * PUT /api/auth/profile
 * Cập nhật thông tin cá nhân (username, phone, email, avatar)
 */
async function updateProfile(req, res) {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Chưa đăng nhập', 401);
            return;
        }
        const { username, email, phone, avatar } = req.body;
        // Validate email if updated
        if (email && email !== req.user.email) {
            const existingUser = await prisma_1.default.user.findFirst({
                where: {
                    email,
                    NOT: { user_id: req.user.user_id }
                },
            });
            if (existingUser) {
                (0, response_1.sendError)(res, 'Email đã được đăng ký bởi tài khoản khác', 409);
                return;
            }
        }
        const updatedUser = await prisma_1.default.user.update({
            where: { user_id: req.user.user_id },
            data: {
                username: username !== undefined ? username : undefined,
                email: email !== undefined ? email : undefined,
                phone: phone !== undefined ? phone : null,
                avatar: avatar !== undefined ? avatar : undefined,
            },
            select: {
                user_id: true,
                username: true,
                email: true,
                phone: true,
                avatar: true,
                role: true,
            }
        });
        (0, response_1.sendSuccess)(res, {
            data: updatedUser,
            message: 'Cập nhật thông tin cá nhân thành công'
        });
    }
    catch (err) {
        logger_1.logger.error('UpdateProfile error:', err);
        (0, response_1.sendError)(res, 'Lỗi hệ thống khi cập nhật profile', 500);
    }
}
/**
 * PUT /api/auth/profile/password
 * Thay đổi mật khẩu người dùng
 */
async function changePassword(req, res) {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Chưa đăng nhập', 401);
            return;
        }
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            (0, response_1.sendError)(res, 'Vui lòng điền đầy đủ mật khẩu cũ và mới', 400);
            return;
        }
        // Tìm mật khẩu hiện tại
        const user = await prisma_1.default.user.findUnique({
            where: { user_id: req.user.user_id },
            select: { password: true }
        });
        if (!user || !user.password) {
            (0, response_1.sendError)(res, 'Không tìm thấy tài khoản', 404);
            return;
        }
        // Kiểm tra mật khẩu cũ
        const isMatch = await bcryptjs_1.default.compare(oldPassword, user.password);
        if (!isMatch) {
            (0, response_1.sendError)(res, 'Mật khẩu cũ không chính xác', 400);
            return;
        }
        // Mã hóa mật khẩu mới
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, salt);
        // Cập nhật mật khẩu mới
        await prisma_1.default.user.update({
            where: { user_id: req.user.user_id },
            data: { password: hashedPassword }
        });
        (0, response_1.sendSuccess)(res, { message: 'Đổi mật khẩu thành công' });
    }
    catch (err) {
        logger_1.logger.error('ChangePassword error:', err);
        (0, response_1.sendError)(res, 'Lỗi hệ thống khi đổi mật khẩu', 500);
    }
}
/**
 * POST /api/auth/profile/avatar
 * Upload ảnh đại diện
 */
async function uploadAvatar(req, res) {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Chưa đăng nhập', 401);
            return;
        }
        if (!req.file) {
            (0, response_1.sendError)(res, 'Không có file nào được tải lên', 400);
            return;
        }
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        // Cập nhật avatar trong DB
        const updatedUser = await prisma_1.default.user.update({
            where: { user_id: req.user.user_id },
            data: { avatar: avatarUrl },
            select: {
                user_id: true,
                username: true,
                email: true,
                phone: true,
                avatar: true,
                role: true,
            }
        });
        (0, response_1.sendSuccess)(res, {
            data: updatedUser,
            message: 'Tải lên ảnh đại diện thành công'
        });
    }
    catch (err) {
        logger_1.logger.error('UploadAvatar error:', err);
        (0, response_1.sendError)(res, 'Lỗi hệ thống khi tải ảnh đại diện', 500);
    }
}
/**
 * DELETE /api/auth/profile/avatar
 * Xóa ảnh đại diện
 */
async function deleteAvatar(req, res) {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Chưa đăng nhập', 401);
            return;
        }
        // Cập nhật database xóa avatar
        const updatedUser = await prisma_1.default.user.update({
            where: { user_id: req.user.user_id },
            data: { avatar: null },
            select: {
                user_id: true,
                username: true,
                email: true,
                phone: true,
                avatar: true,
                role: true,
            }
        });
        (0, response_1.sendSuccess)(res, {
            data: updatedUser,
            message: 'Đã xóa ảnh đại diện thành công'
        });
    }
    catch (err) {
        logger_1.logger.error('DeleteAvatar error:', err);
        (0, response_1.sendError)(res, 'Lỗi hệ thống khi xóa ảnh đại diện', 500);
    }
}
// Helper
function generateToken(userId, email, role) {
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    return jsonwebtoken_1.default.sign({ user_id: userId, email, role }, secret, { expiresIn });
}
//# sourceMappingURL=authController.js.map