"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load các biến môi trường từ file .env
dotenv_1.default.config();
const order_1 = __importDefault(require("./routes/order"));
const webhook_1 = __importDefault(require("./routes/webhook"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4500;
// ─── Middleware Cấu hình ────────────────────────────────────────────────────────
// 1. Cho phép CORS để frontend có thể gọi các API từ nhiều cổng khác nhau dễ dàng
app.use((0, cors_1.default)());
// 2. Custom JSON Parser để lưu trữ Raw Body phục vụ việc tính toán mã HMAC SHA256
// Chúng ta lưu raw buffer vào req.rawBody để đối chiếu chữ ký gốc của SePay
app.use(express_1.default.json({
    verify: (req, _res, buf) => {
        req.rawBody = buf;
    }
}));
// 3. Parser cho URL-encoded
app.use(express_1.default.urlencoded({ extended: true }));
// 4. Phục vụ các file tĩnh trong thư mục public (Trang index.html thanh toán)
// Cho dù chạy bằng ts-node-dev (src/) hay biên dịch (dist/), public vẫn luôn nằm ở thư mục cha của __dirname
const publicDirectoryPath = path_1.default.join(__dirname, '..', 'public');
app.use(express_1.default.static(publicDirectoryPath));
// ─── API Routes ───────────────────────────────────────────────────────────────
// Cấu hình định tuyến cho API quản lý đơn hàng
app.use('/api/order', order_1.default);
// Cấu hình định tuyến cho Webhook tiếp nhận thanh toán từ SePay
app.use('/webhook', webhook_1.default);
// Health check API
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'healthy',
        message: 'Hệ thống thanh toán VietQR & SePay Webhook hoạt động bình thường!',
        time: new Date().toISOString()
    });
});
// Route mặc định phục vụ trang thanh toán khi người dùng truy cập trực tiếp
app.get('*', (_req, res) => {
    res.sendFile(path_1.default.join(publicDirectoryPath, 'index.html'));
});
// Khởi chạy Express Server
app.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(`🚀 Cổng thanh toán VietQR & SePay Webhook đã được khởi chạy thành công!`);
    console.log(`💻 Local URL: http://localhost:${PORT}`);
    console.log(`🌐 API Health Check: http://localhost:${PORT}/health`);
    console.log(`📬 Webhook Endpoint: http://localhost:${PORT}/webhook/sepay`);
    console.log(`================================================================`);
});
