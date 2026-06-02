"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reviewController_1 = require("../controllers/reviewController");
const router = (0, express_1.Router)();
// Lấy danh sách đánh giá công khai
router.get('/', reviewController_1.ReviewController.getPublicReviews);
// Gửi đánh giá mới
router.post('/', reviewController_1.ReviewController.createReview);
// Cập nhật đánh giá
router.patch('/:id', reviewController_1.ReviewController.updateReview);
// Xóa đánh giá
router.delete('/:id', reviewController_1.ReviewController.deleteReview);
exports.default = router;
//# sourceMappingURL=review.js.map