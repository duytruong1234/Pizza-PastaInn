import { Router } from 'express';
import prisma from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

// Lấy danh sách cửa hàng (chi nhánh)
router.get('/', async (req, res) => {
  try {
    const stores = await prisma.store.findMany({ where: { is_active: true } });
    sendSuccess(res, { data: stores });
  } catch (error) {
    sendError(res, 'Lỗi lấy thông tin cửa hàng', 500);
  }
});

export default router;
