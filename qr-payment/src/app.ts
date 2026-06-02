import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load các biến môi trường từ file .env
dotenv.config();

import orderRouter from './routes/order';
import webhookRouter from './routes/webhook';

const app = express();
const PORT = process.env.PORT || 4500;

// ─── Middleware Cấu hình ────────────────────────────────────────────────────────

// 1. Cho phép CORS để frontend có thể gọi các API từ nhiều cổng khác nhau dễ dàng
app.use(cors());

// 2. Custom JSON Parser để lưu trữ Raw Body phục vụ việc tính toán mã HMAC SHA256
// Chúng ta lưu raw buffer vào req.rawBody để đối chiếu chữ ký gốc của SePay
app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));

// 3. Parser cho URL-encoded
app.use(express.urlencoded({ extended: true }));

// 4. Phục vụ các file tĩnh trong thư mục public (Trang index.html thanh toán)
// Cho dù chạy bằng ts-node-dev (src/) hay biên dịch (dist/), public vẫn luôn nằm ở thư mục cha của __dirname
const publicDirectoryPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicDirectoryPath));

// ─── API Routes ───────────────────────────────────────────────────────────────

// Cấu hình định tuyến cho API quản lý đơn hàng
app.use('/api/order', orderRouter);

// Cấu hình định tuyến cho Webhook tiếp nhận thanh toán từ SePay
app.use('/webhook', webhookRouter);

// Health check API
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    message: 'Hệ thống thanh toán VietQR & SePay Webhook hoạt động bình thường!',
    time: new Date().toISOString()
  });
});

// Route mặc định phục vụ trang thanh toán khi người dùng truy cập trực tiếp
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(publicDirectoryPath, 'index.html'));
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
