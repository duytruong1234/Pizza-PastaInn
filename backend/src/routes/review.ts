import { Router } from 'express';
import { ReviewController } from '../controllers/reviewController';

const router = Router();

// Lấy danh sách đánh giá công khai
router.get('/', ReviewController.getPublicReviews);

// Gửi đánh giá mới
router.post('/', ReviewController.createReview);

export default router;
