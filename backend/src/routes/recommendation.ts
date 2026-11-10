import { Router } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import * as recommendationService from '../services/recommendationService';
import { BasketAnalysisService } from '../services/basketAnalysisService';
import smartRecommendationRoutes from './smartRecommendation';

const router = Router();

// Lựa chọn phù hợp cho bạn (6 câu hỏi): /api/recommendations/smart/...
router.use('/smart', smartRecommendationRoutes);

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

// Lấy danh sách món thường được đặt cùng (Luật kết hợp Apriori, chỉ tính món lẻ)
// GET /api/recommendations/together?dish_ids=1,2,3
router.get('/together', async (req, res) => {
  try {
    const dishIdsStr = req.query.dish_ids as string;
    if (!dishIdsStr) {
      return sendError(res, 'Vui lòng cung cấp dish_ids', 400);
    }
    const dishIds = dishIdsStr.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
    // Ưu tiên luật kết hợp (Confidence × ln(Lift)); thiếu dữ liệu thì dùng cách đếm cũ làm dự phòng
    const ruleBased = await BasketAnalysisService.getCustomerRecommendations(dishIds, 4);
    const data = ruleBased && ruleBased.length > 0
      ? ruleBased
      : await recommendationService.getFrequentlyOrderedTogether(dishIds);
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

// Gợi ý món chay tương tự bằng Cosine Similarity
// GET /api/recommendations/vegetarian-similar/:dishId
router.get('/vegetarian-similar/:dishId', async (req, res) => {
  try {
    const { getVegetarianSimilarDishes } = await import('../services/contentBasedService');
    const dishId = Number(req.params.dishId);
    if (!dishId) {
      return sendError(res, 'dishId không hợp lệ', 400);
    }
    const limit = Number(req.query.limit) || 3;
    const data = await getVegetarianSimilarDishes(dishId, limit);
    sendSuccess(res, { data });
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// Goi y mon moi tuong tu dua tren lich su mua hang
// GET /api/recommendations/history-suggestions?user_id=1
router.get('/history-suggestions', async (req, res) => {
  try {
    const userId = Number(req.query.user_id);
    if (!userId) {
      return sendError(res, 'Vui long cung cap user_id', 400);
    }
    const limit = req.query.limit ? Number(req.query.limit) : 6;
    const data = await recommendationService.getHistoryBasedSuggestions(userId, limit);
    sendSuccess(res, { data });
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// Goi y combo theo gio hang
// POST /api/recommendations/combo-upsell
router.post('/combo-upsell', async (req, res) => {
  try {
    const { dish_ids } = req.body;
    if (!dish_ids || !Array.isArray(dish_ids) || dish_ids.length === 0) {
      return sendError(res, 'Vui long cung cap dish_ids', 400);
    }
    const data = await recommendationService.suggestCombosForCart(dish_ids);
    sendSuccess(res, { data });
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// Gợi ý kết hợp tròn vị (Món ăn kèm do Admin cấu hình)
// GET /api/recommendations/pairings/:dishId
router.get('/pairings/:dishId', async (req, res) => {
  try {
    const dishId = Number(req.params.dishId);
    if (!dishId) {
      return sendError(res, 'dishId không hợp lệ', 400);
    }

    const prisma = (await import('../lib/prisma')).default;

    // Tìm tất cả pairing group chứa dish này
    const pairingItems = await prisma.dishPairingItem.findMany({
      where: { dish_id: dishId },
      select: { pairing_id: true }
    });

    if (pairingItems.length === 0) {
      return sendSuccess(res, { data: [] });
    }

    const pairingIds = pairingItems.map(p => p.pairing_id);

    // Lấy tất cả các pairing group đó kèm các món trong nhóm
    const pairings = await prisma.dishPairing.findMany({
      where: { pairing_id: { in: pairingIds } },
      include: {
        items: {
          include: {
            dish: {
              include: {
                prices: { include: { size: true, crust: true } },
                category: true
              }
            }
          }
        }
      }
    });

    // Trả về danh sách món kết hợp (loại bỏ chính món đang xem)
    const pairedDishes: any[] = [];
    const addedDishIds = new Set<number>();

    for (const pairing of pairings) {
      for (const item of pairing.items) {
        if (item.dish_id !== dishId && !addedDishIds.has(item.dish_id)) {
          addedDishIds.add(item.dish_id);
          pairedDishes.push({
            dish_id: item.dish.dish_id,
            dish_name: item.dish.dish_name,
            image: item.dish.image,
            ingredient: item.dish.ingredient,
            dish_type: (item.dish as any).dish_type || 'man',
            category: item.dish.category?.category_name || '',
            reason: pairing.reason || '',
            prices: item.dish.prices.map(p => ({
              dish_price_id: p.dish_price_id,
              size_name: p.size?.size_name || '',
              crust_name: p.crust?.crust_name || '',
              dish_price: p.dish_price
            }))
          });
        }
      }
    }

    sendSuccess(res, { data: pairedDishes });
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

export default router;
