// Chức năng "Lựa chọn phù hợp cho bạn" — Bộ lọc 5 bước + Chấm điểm nguyên liệu thang 100 (Câu 1 -> Câu 6)
//   POST /api/recommendations/smart/quiz
//   POST /api/recommendations/smart/quiz/ingredients

import { Router, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';
import {
  sixStepQuizRequestSchema,
  runSixStepQuiz,
  INGREDIENT_DEFS,
  DIET_OPTIONS,
  SPICY_OPTIONS,
  SIX_STEP_PEOPLE_OPTIONS,
  CATEGORY_OPTIONS,
} from '../services/sixStepQuizService';

const router = Router();

/**
 * POST /api/recommendations/smart/quiz
 * Chạy 6 câu hỏi: Lọc (Câu 1 -> Câu 5) + Chấm điểm nguyên liệu thang 100 (Câu 6)
 */
router.post('/quiz', async (req: AuthRequest, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const parsed = sixStepQuizRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
      sendError(res, `Câu trả lời chưa hợp lệ: ${msg}`, 400);
      return;
    }
    const data = await runSixStepQuiz(parsed.data);
    sendSuccess(res, { data });
  } catch (err) {
    logger.error('SmartRec quiz error:', err);
    sendError(res, 'Lỗi khi tìm món phù hợp', 500);
  }
});

/**
 * POST /api/recommendations/smart/quiz/ingredients
 * Trả về danh sách nguyên liệu khả dụng cho Câu 6 (sau khi lọc Câu 1–5 và ẩn nguyên liệu dị ứng Câu 2)
 */
router.post('/quiz/ingredients', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = sixStepQuizRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
      sendError(res, `Dữ liệu chưa hợp lệ: ${msg}`, 400);
      return;
    }
    const result = await runSixStepQuiz(parsed.data);
    sendSuccess(res, {
      data: {
        available_ingredients: result.available_ingredients,
        filter_trace: result.filter_trace,
        allergy_options: INGREDIENT_DEFS.filter(d => d.in_allergy_list).map(d => ({
          key: d.key,
          label: d.label,
          db_keywords_label: d.db_keywords_label,
        })),
        meta: {
          diet_options: DIET_OPTIONS,
          spicy_options: SPICY_OPTIONS,
          people_options: SIX_STEP_PEOPLE_OPTIONS,
          category_options: CATEGORY_OPTIONS,
        },
      },
    });
  } catch (err) {
    logger.error('SmartRec quiz ingredients error:', err);
    sendError(res, 'Lỗi khi tải danh sách nguyên liệu Câu 6', 500);
  }
});

export default router;
