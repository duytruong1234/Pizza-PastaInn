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
