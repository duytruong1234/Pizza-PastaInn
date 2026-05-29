import { Router } from 'express';
import { ReviewController } from '../controllers/reviewController';

const router = Router();

// Lấy danh sách đánh giá công khai
router.get('/', ReviewController.getPublicReviews);

// Gửi đánh giá mới
router.post('/', ReviewController.createReview);

// Cập nhật đánh giá
router.patch('/:id', ReviewController.updateReview);

// Xóa đánh giá
router.delete('/:id', ReviewController.deleteReview);

export default router;
