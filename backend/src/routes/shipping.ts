import { Router, Request, Response } from 'express';
import { ShippingService } from '../services/shippingService';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

// Geocoding API: GET /api/shipping/geocode?q=...
router.get('/geocode', async (req: Request, res: Response) => {
  const { q } = req.query;
  if (!q || typeof q !== 'string') {
    return sendError(res, 'Missing or invalid query string "q"', 400);
  }

  try {
    const features = await ShippingService.geocodeAddress(q);
    sendSuccess(res, { data: features });
  } catch (error: any) {
    console.error('[ShippingRouter] Geocoding error:', error);
    sendError(res, error.message || 'Lỗi geocoding địa chỉ', 500);
  }
});

// Calculate Shipping API: POST /api/shipping/calculate
router.post('/calculate', async (req: Request, res: Response) => {
  const { latitude, longitude } = req.body;
  
  if (latitude === undefined || longitude === undefined) {
    return sendError(res, 'Missing "latitude" or "longitude" in request body', 400);
  }

  const latNum = parseFloat(latitude);
  const lonNum = parseFloat(longitude);

  if (isNaN(latNum) || isNaN(lonNum)) {
    return sendError(res, 'Invalid "latitude" or "longitude" format', 400);
  }

  try {
    const result = await ShippingService.calculateShipping(latNum, lonNum);
    sendSuccess(res, { data: result });
  } catch (error: any) {
    console.error('[ShippingRouter] Calculate shipping error:', error);
    sendError(res, error.message || 'Lỗi tính toán phí giao hàng', 500);
  }
});

export default router;
