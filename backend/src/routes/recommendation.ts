import { Router } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import * as recommendationService from '../services/recommendationService';

const router = Router();

// Lấy danh sách món phổ biến nhất
// GET /api/recommendations/popular
router.get('/popular', async (req, res) => {
  try {
    const data = await recommendationService.getPopularDishes();
    sendSuccess(res, { data });
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// Lấy danh sách món hay đặt lại của người dùng
// GET /api/recommendations/reorder?user_id=1
router.get('/reorder', async (req, res) => {
  try {
    const userId = Number(req.query.user_id);
    if (!userId) {
      return sendError(res, 'Vui lòng cung cấp user_id', 400);
    }
    const data = await recommendationService.getReorderFavorites(userId);
    sendSuccess(res, { data });
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// Lấy danh sách món thường được đặt cùng
// GET /api/recommendations/together?dish_ids=1,2,3
router.get('/together', async (req, res) => {
  try {
    const dishIdsStr = req.query.dish_ids as string;
    if (!dishIdsStr) {
      return sendError(res, 'Vui lòng cung cấp dish_ids', 400);
    }
    const dishIds = dishIdsStr.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
    const data = await recommendationService.getFrequentlyOrderedTogether(dishIds);
    sendSuccess(res, { data });
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// Lấy danh sách món được đánh giá cao nhất
// GET /api/recommendations/top-rated
router.get('/top-rated', async (req, res) => {
  try {
    const data = await recommendationService.getTopRatedDishes();
    sendSuccess(res, { data });
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// Gợi ý món ăn bằng Content-based Filtering (Cosine Similarity)
// POST /api/recommendations/content-based
router.post('/content-based', async (req, res) => {
  try {
    const { recommendByContentBased } = await import('../services/contentBasedService');
    const criteria = req.body?.criteria || {};
    const limit = Number(req.body?.limit) || 5;
    const data = await recommendByContentBased(criteria, limit);
    sendSuccess(res, { data });
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// Gợi ý món tương tự dựa trên vector đặc trưng (Item-Item Content-Based)
// GET /api/recommendations/similar/:dishId
router.get('/similar/:dishId', async (req, res) => {
  try {
    const { getSimilarDishes } = await import('../services/contentBasedService');
    const dishId = Number(req.params.dishId);
    if (!dishId) {
      return sendError(res, 'dishId không hợp lệ', 400);
    }
    const limit = Number(req.query.limit) || 4;
    const data = await getSimilarDishes(dishId, limit);
    sendSuccess(res, { data });
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

export default router;
