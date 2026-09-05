import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import prisma from '../lib/prisma';

export class ReviewController {
  /**
   * Tạo đánh giá mới (POST /api/reviews)
   * Accepts: { comment, image_url, order_id, user_id, item_ratings: { dish_name, dish_image, rating_star }[] }
   */
  static async createReview(req: Request, res: Response) {
    try {
      const { comment, image_url, order_id, user_id, item_ratings } = req.body;

      if (!order_id) {
        return sendError(res, 'Order ID is required to submit a review', 400);
      }

      if (!user_id) {
        return sendError(res, 'User ID is required to submit a review', 400);
      }

      if (!item_ratings || !Array.isArray(item_ratings) || item_ratings.length === 0) {
        return sendError(res, 'Please rate at least one dish', 400);
      }

      // Validate each item rating
      for (const item of item_ratings) {
        if (!item.dish_name || !item.rating_star || item.rating_star < 1 || item.rating_star > 5) {
          return sendError(res, 'Each dish rating must have a name and rating between 1-5', 400);
        }
      }

      const parsedOrderId = parseInt(String(order_id));
      const parsedUserId = parseInt(String(user_id));

      // Verify order exists, is completed, and belongs to the user
      const order = await prisma.order.findUnique({
        where: { order_id: parsedOrderId },
      });

      if (!order) {
        return sendError(res, 'Order not found', 404);
      }

      if (order.order_status !== 'completed') {
        return sendError(res, 'You can only review completed orders', 400);
      }

      if (order.user_id !== parsedUserId) {
        return sendError(res, 'This order does not belong to you', 403);
      }

      // Check if order already has a review
      const existingReview = await prisma.shopReview.findFirst({
        where: { order_id: parsedOrderId },
      });

      if (existingReview) {
        return sendError(res, 'This order has already been reviewed', 400);
      }

      // Calculate overall rating as average of item ratings
      const avgRating = Math.round(
        item_ratings.reduce((sum: number, item: any) => sum + item.rating_star, 0) / item_ratings.length
      );

      // Convert image_url array or string to a single string
      let dbImageUrl = '';
      if (image_url) {
        if (Array.isArray(image_url)) {
          dbImageUrl = JSON.stringify(image_url);
        } else {
          dbImageUrl = String(image_url);
        }
      }

      // Create review with item ratings in a transaction
      const review = await prisma.$transaction(async (tx) => {
        const newReview = await tx.shopReview.create({
          data: {
            rating_star: avgRating,
            comment: comment || '',
            image_url: dbImageUrl || null,
            is_visible: true,
            created_at: new Date(),
            order_id: parsedOrderId,
            user_id: parsedUserId,
          },
        });

        // Create item ratings
        await tx.reviewItemRating.createMany({
          data: item_ratings.map((item: any) => ({
            review_id: newReview.review_id,
            dish_name: item.dish_name,
            dish_image: item.dish_image || null,
            rating_star: parseInt(String(item.rating_star)),
          })),
        });

        return newReview;
      });

      return sendSuccess(res, {
        data: review,
        message: 'Review submitted successfully!'
      }, 201);
    } catch (error) {
      console.error('Create review error:', error);
      return sendError(res, 'Error submitting review', 500);
    }
  }

  /**
   * Lấy danh sách đánh giá công khai (GET /api/reviews)
   */
  static async getPublicReviews(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 15;

      const [reviews, total] = await Promise.all([
        prisma.shopReview.findMany({
          where: { is_visible: true },
          include: {
            user: { select: { username: true, email: true } },
            item_ratings: {
              select: {
                id: true,
                dish_name: true,
                dish_image: true,
                rating_star: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.shopReview.count({
          where: { is_visible: true },
        }),
      ]);

      return sendSuccess(res, {
        data: {
          reviews,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        }
      });
    } catch (error) {
      console.error('Get public reviews error:', error);
      return sendError(res, 'Error fetching reviews', 500);
    }
  }

  /**
   * Kiểm tra xem order có thể review được không (GET /api/reviews/order-check/:orderId)
   */
  static async checkOrderReviewEligibility(req: Request, res: Response) {
    try {
      const orderId = parseInt(String(req.params.orderId));
      const userId = parseInt(req.query.user_id as string);

      if (isNaN(orderId)) {
        return sendError(res, 'Invalid order ID', 400);
      }

      if (isNaN(userId)) {
        return sendError(res, 'User ID is required', 400);
      }

      // Fetch order with items
      const order = await prisma.order.findUnique({
        where: { order_id: orderId },
        include: {
          items: {
            include: {
              dish_price: {
                include: {
                  dish: { select: { dish_name: true, image: true } },
                },
              },
              combo: { select: { combo_name: true, image_combo: true } },
            },
          },
        },
      });

      if (!order) {
        return sendSuccess(res, { data: { canReview: false, reason: 'Order not found' } });
      }

      if (order.user_id !== userId) {
        return sendSuccess(res, { data: { canReview: false, reason: 'Order does not belong to you' } });
      }

      if (order.order_status !== 'completed') {
        return sendSuccess(res, { data: { canReview: false, reason: 'Order is not yet completed' } });
      }

      // Check for existing review
      const existingReview = await prisma.shopReview.findFirst({
        where: { order_id: orderId },
        include: { item_ratings: true },
      });

      if (existingReview) {
        return sendSuccess(res, { data: { canReview: false, reason: 'Order already reviewed', existingReview } });
      }

      // Build items list for the form
      const orderItems = order.items.map((item) => {
        if (item.combo) {
          return {
            name: item.combo.combo_name || 'Combo',
            image: item.combo.image_combo || null,
            quantity: item.quantity || 1,
          };
        }
        return {
          name: item.dish_price?.dish?.dish_name || 'Unknown dish',
          image: item.dish_price?.dish?.image || null,
          quantity: item.quantity || 1,
        };
      });

      // Deduplicate by dish name (combine quantities)
      const uniqueItems: { name: string; image: string | null; quantity: number }[] = [];
      for (const item of orderItems) {
        const existing = uniqueItems.find(u => u.name === item.name);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          uniqueItems.push({ ...item });
        }
      }

      return sendSuccess(res, {
        data: {
          canReview: true,
          order: {
            order_id: order.order_id,
            order_status: order.order_status,
            created_at: order.created_at,
            total_order: order.total_order,
          },
          items: uniqueItems,
        }
      });
    } catch (error) {
      console.error('Check order review eligibility error:', error);
      return sendError(res, 'Error checking order review eligibility', 500);
    }
  }

  /**
   * Cập nhật đánh giá (PATCH /api/reviews/:id)
   */
  static async updateReview(req: Request, res: Response) {
    try {
      const reviewId = parseInt(String(req.params.id));
      const { comment, image_url, user_id, item_ratings } = req.body;

      if (isNaN(reviewId)) {
        return sendError(res, 'Invalid review ID', 400);
      }

      // Check review exists
      const existingReview = await prisma.shopReview.findUnique({
        where: { review_id: reviewId }
      });

      if (!existingReview) {
        return sendError(res, 'Review not found', 404);
      }

      // Check ownership
      if (user_id && existingReview.user_id && existingReview.user_id !== parseInt(String(user_id))) {
        return sendError(res, 'You do not have permission to edit this review', 403);
      }

      let dbImageUrl = undefined;
      if (image_url) {
        if (Array.isArray(image_url)) {
          dbImageUrl = JSON.stringify(image_url);
        } else {
          dbImageUrl = String(image_url);
        }
      }

      // Calculate new average rating if item_ratings provided
      let avgRating = undefined;
      if (item_ratings && Array.isArray(item_ratings) && item_ratings.length > 0) {
        avgRating = Math.round(
          item_ratings.reduce((sum: number, item: any) => sum + item.rating_star, 0) / item_ratings.length
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        const updatedReview = await tx.shopReview.update({
          where: { review_id: reviewId },
          data: {
            ...(avgRating !== undefined && { rating_star: avgRating }),
            ...(comment !== undefined && { comment: comment || '' }),
            ...(dbImageUrl !== undefined && { image_url: dbImageUrl }),
          }
        });

        // If item_ratings provided, replace them
        if (item_ratings && Array.isArray(item_ratings) && item_ratings.length > 0) {
          // Delete old ratings
          await tx.reviewItemRating.deleteMany({
            where: { review_id: reviewId },
          });

          // Create new ratings
          await tx.reviewItemRating.createMany({
            data: item_ratings.map((item: any) => ({
              review_id: reviewId,
              dish_name: item.dish_name,
              dish_image: item.dish_image || null,
              rating_star: parseInt(String(item.rating_star)),
            })),
          });
        }

        return updatedReview;
      });

      return sendSuccess(res, { data: updated, message: 'Review updated successfully!' });
    } catch (error) {
      console.error('Update review error:', error);
      return sendError(res, 'Error updating review', 500);
    }
  }

  /**
   * Xóa đánh giá (DELETE /api/reviews/:id)
   * Item ratings are auto-deleted via onDelete: Cascade
   */
  static async deleteReview(req: Request, res: Response) {
    try {
      const reviewId = parseInt(String(req.params.id));
      const { user_id } = req.query;

      if (isNaN(reviewId)) {
        return sendError(res, 'Invalid review ID', 400);
      }

      const existingReview = await prisma.shopReview.findUnique({
        where: { review_id: reviewId }
      });

      if (!existingReview) {
        return sendError(res, 'Review not found', 404);
      }

      // Check ownership
      if (user_id && existingReview.user_id && existingReview.user_id !== parseInt(String(user_id as string))) {
        return sendError(res, 'You do not have permission to delete this review', 403);
      }

      await prisma.shopReview.delete({
        where: { review_id: reviewId }
      });

      return sendSuccess(res, { message: 'Review deleted successfully!' });
    } catch (error) {
      console.error('Delete review error:', error);
      return sendError(res, 'Error deleting review', 500);
    }
  }
}
