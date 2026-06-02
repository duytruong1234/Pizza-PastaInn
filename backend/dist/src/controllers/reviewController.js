"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewController = void 0;
const response_1 = require("../utils/response");
const prisma_1 = __importDefault(require("../lib/prisma"));
class ReviewController {
    /**
     * Tạo đánh giá mới (POST /api/reviews)
     */
    static async createReview(req, res) {
        try {
            const { rating_star, comment, image_url, order_id, user_id } = req.body;
            if (!rating_star || rating_star < 1 || rating_star > 5) {
                return (0, response_1.sendError)(res, 'Số sao đánh giá phải từ 1 đến 5', 400);
            }
            // Convert image_url array or string to a single string
            let dbImageUrl = '';
            if (image_url) {
                if (Array.isArray(image_url)) {
                    dbImageUrl = JSON.stringify(image_url);
                }
                else {
                    dbImageUrl = String(image_url);
                }
            }
            const review = await prisma_1.default.shopReview.create({
                data: {
                    rating_star: parseInt(String(rating_star)),
                    comment: comment || '',
                    image_url: dbImageUrl || null,
                    is_visible: true, // Default to visible so it displays immediately on client site
                    created_at: new Date(),
                    ...(order_id && { order_id: parseInt(String(order_id)) }),
                    ...(user_id && { user_id: parseInt(String(user_id)) }),
                },
            });
            return (0, response_1.sendSuccess)(res, {
                data: review,
                message: 'Gửi đánh giá thành công!'
            }, 201);
        }
        catch (error) {
            console.error('Create review error:', error);
            return (0, response_1.sendError)(res, 'Lỗi khi gửi đánh giá', 500);
        }
    }
    /**
     * Lấy danh sách đánh giá công khai (GET /api/reviews)
     */
    static async getPublicReviews(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 15;
            const [reviews, total] = await Promise.all([
                prisma_1.default.shopReview.findMany({
                    where: { is_visible: true },
                    include: {
                        user: { select: { username: true, email: true } },
                    },
                    orderBy: { created_at: 'desc' },
                    skip: (page - 1) * limit,
                    take: limit,
                }),
                prisma_1.default.shopReview.count({
                    where: { is_visible: true },
                }),
            ]);
            return (0, response_1.sendSuccess)(res, {
                data: {
                    reviews,
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                }
            });
        }
        catch (error) {
            console.error('Get public reviews error:', error);
            return (0, response_1.sendError)(res, 'Lỗi khi lấy danh sách đánh giá', 500);
        }
    }
    /**
     * Cập nhật đánh giá (PATCH /api/reviews/:id)
     */
    static async updateReview(req, res) {
        try {
            const reviewId = parseInt(String(req.params.id));
            const { rating_star, comment, image_url, user_id } = req.body;
            if (isNaN(reviewId)) {
                return (0, response_1.sendError)(res, 'Mã đánh giá không hợp lệ', 400);
            }
            // Kiểm tra sự tồn tại của đánh giá
            const existingReview = await prisma_1.default.shopReview.findUnique({
                where: { review_id: reviewId }
            });
            if (!existingReview) {
                return (0, response_1.sendError)(res, 'Đánh giá không tồn tại', 404);
            }
            // Nếu truyền user_id, kiểm tra xem có đúng là tác giả không
            if (user_id && existingReview.user_id && existingReview.user_id !== parseInt(String(user_id))) {
                return (0, response_1.sendError)(res, 'Bạn không có quyền sửa đánh giá này', 403);
            }
            let dbImageUrl = undefined;
            if (image_url) {
                if (Array.isArray(image_url)) {
                    dbImageUrl = JSON.stringify(image_url);
                }
                else {
                    dbImageUrl = String(image_url);
                }
            }
            const updated = await prisma_1.default.shopReview.update({
                where: { review_id: reviewId },
                data: {
                    ...(rating_star && { rating_star: parseInt(String(rating_star)) }),
                    ...(comment !== undefined && { comment: comment || '' }),
                    ...(dbImageUrl !== undefined && { image_url: dbImageUrl }),
                }
            });
            return (0, response_1.sendSuccess)(res, { data: updated, message: 'Cập nhật đánh giá thành công!' });
        }
        catch (error) {
            console.error('Update review error:', error);
            return (0, response_1.sendError)(res, 'Lỗi khi cập nhật đánh giá', 500);
        }
    }
    /**
     * Xóa đánh giá (DELETE /api/reviews/:id)
     */
    static async deleteReview(req, res) {
        try {
            const reviewId = parseInt(String(req.params.id));
            const { user_id } = req.query; // Nhận user_id từ query để xác thực tác giả
            if (isNaN(reviewId)) {
                return (0, response_1.sendError)(res, 'Mã đánh giá không hợp lệ', 400);
            }
            const existingReview = await prisma_1.default.shopReview.findUnique({
                where: { review_id: reviewId }
            });
            if (!existingReview) {
                return (0, response_1.sendError)(res, 'Đánh giá không tồn tại', 404);
            }
            // Nếu truyền user_id, kiểm tra xem có đúng là tác giả không
            if (user_id && existingReview.user_id && existingReview.user_id !== parseInt(String(user_id))) {
                return (0, response_1.sendError)(res, 'Bạn không có quyền xóa đánh giá này', 403);
            }
            await prisma_1.default.shopReview.delete({
                where: { review_id: reviewId }
            });
            return (0, response_1.sendSuccess)(res, { message: 'Xóa đánh giá thành công!' });
        }
        catch (error) {
            console.error('Delete review error:', error);
            return (0, response_1.sendError)(res, 'Lỗi khi xóa đánh giá', 500);
        }
    }
}
exports.ReviewController = ReviewController;
//# sourceMappingURL=reviewController.js.map