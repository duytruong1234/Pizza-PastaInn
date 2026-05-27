"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Express app entry — khởi tạo server
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("./utils/logger");
const redis_1 = require("./utils/redis");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_1 = __importDefault(require("./routes/auth"));
// Load biến môi trường
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
// ─── Middleware ───────────────────────────────────────────────────────────────
// CORS — cho phép frontend + admin truy cập
const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    process.env.ADMIN_URL || 'http://localhost:3001',
];
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // Cho phép requests không có origin (mobile apps, curl, etc.)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(null, true); // Cho phép tất cả trong dev
        }
    },
    credentials: true,
}));
// Parse JSON body
app.use(express_1.default.json({ limit: '10mb' }));
// Parse URL-encoded body (form data)
app.use(express_1.default.urlencoded({ extended: true }));
// Serve uploaded files
const path_1 = __importDefault(require("path"));
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '..', 'uploads')));
// ─── Upload route ────────────────────────────────────────────────────────────
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const uploadsDir = path_1.default.join(__dirname, '..', 'uploads', 'dishes');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        const name = `dish_${Date.now()}${ext}`;
        cb(null, name);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
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
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Không có file nào được tải lên' });
    }
    const imageUrl = `/uploads/dishes/${req.file.filename}`;
    res.json({ success: true, data: { url: imageUrl } });
});
// ─── Routes ──────────────────────────────────────────────────────────────────
// Health check
app.get('/api/health', (_req, res) => {
    res.json({
        success: true,
        message: 'Pizza&PastaInn API is running!',
        timestamp: new Date().toISOString(),
    });
});
// Auth routes
app.use('/api/auth', auth_1.default);
// Menu routes
const menu_1 = __importDefault(require("./routes/menu"));
app.use('/api/menu', menu_1.default);
// Store routes
const store_1 = __importDefault(require("./routes/store"));
app.use('/api/stores', store_1.default);
// Cart routes
const cart_1 = __importDefault(require("./routes/cart"));
app.use('/api/cart', cart_1.default);
// Order routes
const order_1 = __importDefault(require("./routes/order"));
app.use('/api/orders', order_1.default);
// Admin routes (dashboard quản trị)
const admin_1 = __importDefault(require("./routes/admin"));
app.use('/api/admin', admin_1.default);
// ─── Global Error Handler ────────────────────────────────────────────────────
app.use(errorHandler_1.globalErrorHandler);
// ─── Start Server ────────────────────────────────────────────────────────────
async function startServer() {
    // Kết nối Redis (không bắt buộc — app vẫn chạy nếu Redis down)
    await (0, redis_1.connectRedis)();
    app.listen(PORT, () => {
        logger_1.logger.info(`Pizza&PastaInn API running at http://localhost:${PORT}`);
        logger_1.logger.info(`Health check: http://localhost:${PORT}/api/health`);
    });
}
startServer().catch((err) => {
    logger_1.logger.error('Không thể khởi động server:', err);
    process.exit(1);
});
exports.default = app;
//# sourceMappingURL=app.js.map