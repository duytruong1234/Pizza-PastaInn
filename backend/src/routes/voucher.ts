import { Router, Request, Response } from 'express';
import { verifyToken, AuthRequest } from '../middleware/auth';
import { VoucherService } from '../services/voucherService';

const router = Router();

/**
 * GET /api/vouchers
 * Lấy danh sách mã giảm giá đang hoạt động cho trang Checkout
 */
router.get('/', (_req: Request, res: Response) => {
  try {
    const data = VoucherService.listActiveVouchers();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Lỗi tải danh sách mã giảm giá' });
  }
});

/**
 * POST /api/vouchers/apply
 * Kiểm tra và tính số tiền giảm giá cho đơn hàng
 */
router.post('/apply', (req: Request, res: Response) => {
  try {
    const { code, subtotal, shipping_fee } = req.body || {};
    const result = VoucherService.validateVoucher(
      String(code || ''),
      Number(subtotal) || 0,
      Number(shipping_fee) || 0
    );
    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message,
        data: { discount_amount: 0 },
      });
    }
    return res.json({
      success: true,
      message: result.message,
      data: {
        voucher: result.voucher,
        discount_amount: result.discount_amount,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Lỗi áp dụng mã giảm giá' });
  }
});

/**
 * GET /api/vouchers/loyalty
 * Lấy thông tin điểm tích lũy & hạng thành viên của khách hàng đăng nhập
 */
router.get('/loyalty', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để xem điểm tích lũy' });
    }
    const data = await VoucherService.getUserLoyaltySummary(userId);
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Lỗi tải thông tin điểm thành viên' });
  }
});

/**
 * GET /api/vouchers/admin
 * Lấy toàn bộ danh sách mã giảm giá cho trang Admin
 */
router.get('/admin', (_req: Request, res: Response) => {
  try {
    const data = VoucherService.loadVouchers();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Lỗi tải danh sách mã giảm giá' });
  }
});

/**
 * POST /api/vouchers/admin
 * Tạo mã giảm giá mới
 */
router.post('/admin', (req: Request, res: Response) => {
  try {
    const created = VoucherService.createVoucher(req.body || {});
    res.status(201).json({ success: true, message: 'Tạo mã giảm giá thành công', data: created });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err?.message || 'Không thể tạo mã giảm giá' });
  }
});

/**
 * PUT /api/vouchers/admin/:id
 * Cập nhật mã giảm giá
 */
router.put('/admin/:id', (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const updated = VoucherService.updateVoucher(id, req.body || {});
    res.json({ success: true, message: 'Cập nhật mã giảm giá thành công', data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err?.message || 'Không thể cập nhật mã giảm giá' });
  }
});

/**
 * DELETE /api/vouchers/admin/:id
 * Xóa mã giảm giá
 */
router.delete('/admin/:id', (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    VoucherService.deleteVoucher(id);
    res.json({ success: true, message: 'Đã xóa mã giảm giá' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err?.message || 'Không thể xóa mã giảm giá' });
  }
});

/**
 * GET /api/vouchers/admin/loyalty
 * Tổng quan thành viên, điểm tích lũy, lịch sử đổi điểm & cấu hình quy tắc tích điểm cho Admin
 */
router.get('/admin/loyalty', async (_req: Request, res: Response) => {
  try {
    const data = await VoucherService.getAdminLoyaltyOverview();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Lỗi tải dữ liệu tích điểm thành viên' });
  }
});

/**
 * PUT /api/vouchers/admin/loyalty/config
 * Cập nhật cấu hình quy tắc tích điểm & mốc hạng thành viên
 */
router.put('/admin/loyalty/config', (req: Request, res: Response) => {
  try {
    const config = VoucherService.updateLoyaltyConfig(req.body || {});
    res.json({ success: true, message: 'Đã cập nhật cấu hình tích điểm', data: config });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err?.message || 'Không thể cập nhật cấu hình tích điểm' });
  }
});

/**
 * POST /api/vouchers/admin/loyalty/adjust
 * Cộng hoặc trừ điểm thưởng thủ công cho khách hàng
 */
router.post('/admin/loyalty/adjust', (req: Request, res: Response) => {
  try {
    const { user_id, points_delta, reason } = req.body || {};
    const record = VoucherService.adjustUserPoints(Number(user_id), Number(points_delta), String(reason || ''));
    res.status(201).json({
      success: true,
      message: Number(points_delta) > 0 ? 'Đã cộng điểm thưởng thành công' : 'Đã điều chỉnh trừ điểm thành công',
      data: record,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err?.message || 'Không thể điều chỉnh điểm thành viên' });
  }
});

/**
 * DELETE /api/vouchers/admin/loyalty/adjust/:id
 * Hoàn tác / xóa bản ghi điều chỉnh điểm thủ công
 */
router.delete('/admin/loyalty/adjust/:id', (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    VoucherService.deleteLoyaltyAdjustment(id);
    res.json({ success: true, message: 'Đã hoàn tác điều chỉnh điểm' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err?.message || 'Không thể xóa điều chỉnh điểm' });
  }
});

export default router;
