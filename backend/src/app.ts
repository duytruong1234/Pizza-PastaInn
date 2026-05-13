// Express app entry — khởi tạo server
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { connectRedis } from './utils/redis';
import { globalErrorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';

// Load biến môi trường
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Middleware ───────────────────────────────────────────────────────────────

// CORS — cho phép frontend + admin truy cập
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  process.env.ADMIN_URL || 'http://localhost:3001',
];
app.use(
  cors({
    origin: function (origin, callback) {
      // Cho phép requests không có origin (mobile apps, curl, etc.)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Cho phép tất cả trong dev
      }
    },
    credentials: true,
  })
);

// Parse JSON body
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded body (form data)
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
import path from 'path';
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── Upload route ────────────────────────────────────────────────────────────
import multer from 'multer';
import fs from 'fs';

const uploadsDir = path.join(__dirname, '..', 'uploads', 'dishes');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `dish_${Date.now()}${ext}`;
    cb(null, name);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
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
app.use('/api/auth', authRoutes);

// Menu routes
import menuRoutes from './routes/menu';
app.use('/api/menu', menuRoutes);

// Store routes
import storeRoutes from './routes/store';
app.use('/api/stores', storeRoutes);

// Cart routes
import cartRoutes from './routes/cart';
app.use('/api/cart', cartRoutes);

// Order routes
import orderRoutes from './routes/order';
app.use('/api/orders', orderRoutes);

// Admin routes (dashboard quản trị)
import adminRoutes from './routes/admin';
app.use('/api/admin', adminRoutes);

// ─── Global Error Handler ────────────────────────────────────────────────────

app.use(globalErrorHandler);

// ─── Start Server ────────────────────────────────────────────────────────────

async function startServer() {
  // Kết nối Redis (không bắt buộc — app vẫn chạy nếu Redis down)
  await connectRedis();

  app.listen(PORT, () => {
    logger.info(`Pizza&PastaInn API running at http://localhost:${PORT}`);
    logger.info(`Health check: http://localhost:${PORT}/api/health`);
  });
}

startServer().catch((err) => {
  logger.error('Không thể khởi động server:', err);
  process.exit(1);
});

export default app;
