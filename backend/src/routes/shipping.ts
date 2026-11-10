import { Router, Request, Response } from 'express';
import { ShippingService } from '../services/shippingService';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

/**
 * GET /api/shipping/geocode?q=...
 * Tìm kiếm tọa độ từ địa chỉ văn bản
 */
router.get('/geocode', async (req: Request, res: Response) => {
  const { q } = req.query;
  if (!q || typeof q !== 'string') {
    return sendError(res, 'Vui lòng cung cấp chuỗi địa chỉ cần tìm', 400);
  }

  try {
    const features = await ShippingService.geocodeAddress(q);
    sendSuccess(res, { data: features });
  } catch (error: any) {
    console.error('[ShippingRouter] Geocoding error:', error);
    sendError(res, error.message || 'Lỗi xác định tọa độ địa chỉ', 500);
  }
});

/**
 * POST /api/shipping/calculate (và alias /api/shipping/quote)
 * Tính chi nhánh gần nhất, khoảng cách (mét/km) và phí giao hàng (<= 4km: 0đ, > 4km: 20.000đ)
 */
router.post(['/calculate', '/quote'], async (req: Request, res: Response) => {
  const { latitude, longitude, address } = req.body;

  const hasCoords =
    latitude !== undefined &&
    longitude !== undefined &&
    latitude !== null &&
    longitude !== null &&
    !isNaN(Number(latitude)) &&
    !isNaN(Number(longitude));

  const hasAddress = typeof address === 'string' && address.trim().length > 0;

  if (!hasCoords && !hasAddress) {
    return sendError(res, 'Vui lòng cung cấp tọa độ hoặc địa chỉ giao hàng', 400);
  }

  try {
    const result = await ShippingService.calculateShipping(
      hasCoords ? Number(latitude) : null,
      hasCoords ? Number(longitude) : null,
      hasAddress ? address.trim() : null
    );
    sendSuccess(res, { data: result });
  } catch (error: any) {
    console.error('[ShippingRouter] Calculate shipping error:', error);
    sendError(res, error.message || 'Lỗi tính toán phí giao hàng', 500);
  }
});

export default router;
