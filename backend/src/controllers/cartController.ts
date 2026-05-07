import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { CartService } from '../services/cartService';

export class CartController {

  /**
   * Thêm sản phẩm vào giỏ hàng (hỗ trợ 3 loại: regular, half_half, combo).
   * POST /api/cart/items
   */
  static async addItem(req: Request, res: Response) {
    try {
      const { type } = req.body;

      if (!type || !['regular', 'half_half', 'combo'].includes(type)) {
        return sendError(res, 'Loại sản phẩm không hợp lệ. Hỗ trợ: regular, half_half, combo', 400);
      }

      const result = await CartService.addItemToCart(req.body);

      return sendSuccess(res, {
        data: result,
        message: 'Đã thêm vào giỏ hàng thành công'
      });
    } catch (error) {
      console.error('Cart add error:', error);
      return sendError(res, 'Lỗi thêm vào giỏ hàng', 500);
    }
  }

  /**
   * Lấy chi tiết giỏ hàng (JOIN đầy đủ 5 bảng).
   * GET /api/cart/:id
   */
  static async getCart(req: Request, res: Response) {
    try {
      const cart_id = parseInt(req.params.id as string);

      if (!cart_id || isNaN(cart_id)) {
        return sendError(res, 'cart_id không hợp lệ', 400);
      }

      const cart = await CartService.getCartById(cart_id);

      if (!cart) {
        return sendError(res, 'Không tìm thấy giỏ hàng', 404);
      }

      return sendSuccess(res, {
        data: cart,
        message: 'Lấy giỏ hàng thành công'
      });
    } catch (error) {
      console.error('Cart get error:', error);
      return sendError(res, 'Lỗi lấy giỏ hàng', 500);
    }
  }

  /**
   * Lấy giỏ hàng theo user_id (đồng bộ khi mở trang).
   * GET /api/cart/user/:user_id
   */
  static async getCartByUser(req: Request, res: Response) {
    try {
      const user_id = parseInt(req.params.user_id as string);

      if (!user_id || isNaN(user_id)) {
        return sendError(res, 'user_id không hợp lệ', 400);
      }

      const cart = await CartService.getCartByUserId(user_id);

      if (!cart) {
        return sendSuccess(res, { data: null, message: 'Chưa có giỏ hàng' });
      }

      // Cập nhật lại tổng tiền cho chính xác
      await CartService.recalculateCartTotal(cart.cart_id);

      return sendSuccess(res, {
        data: cart,
        message: 'Lấy giỏ hàng thành công'
      });
    } catch (error) {
      console.error('Cart get by user error:', error);
      return sendError(res, 'Lỗi lấy giỏ hàng', 500);
    }
  }

  /**
   * Xóa 1 mục khỏi giỏ hàng (cascade xóa topping, combo, half).
   * DELETE /api/cart/items/:cart_item_id
   */
  static async removeItem(req: Request, res: Response) {
    try {
      const cart_item_id = parseInt(req.params.cart_item_id as string);

      if (!cart_item_id || isNaN(cart_item_id)) {
        return sendError(res, 'cart_item_id không hợp lệ', 400);
      }

      // Lấy cart_id để recalculate total
      const cartItem = await (await import('../lib/prisma')).default.cartItem.findUnique({
        where: { cart_item_id },
        select: { cart_id: true }
      });

      if (!cartItem) {
        return sendError(res, 'Không tìm thấy mục trong giỏ hàng', 404);
      }

      await CartService.removeItemFromCart(cart_item_id);

      // Cập nhật lại tổng tiền
      if (cartItem.cart_id) {
        await CartService.recalculateCartTotal(cartItem.cart_id);
      }

      return sendSuccess(res, { message: 'Đã xóa khỏi giỏ hàng' });
    } catch (error) {
      console.error('Cart delete error:', error);
      return sendError(res, 'Lỗi xóa khỏi giỏ hàng', 500);
    }
  }

  /**
   * Cập nhật số lượng 1 mục trong giỏ hàng.
   * PUT /api/cart/items/:cart_item_id
   */
  static async updateQuantity(req: Request, res: Response) {
    try {
      const cart_item_id = parseInt(req.params.cart_item_id as string);
      const { quantity } = req.body;

      if (!cart_item_id || isNaN(cart_item_id)) {
        return sendError(res, 'cart_item_id không hợp lệ', 400);
      }

      if (typeof quantity !== 'number' || quantity < 0) {
        return sendError(res, 'Số lượng không hợp lệ', 400);
      }

      // Lấy cart_id để recalculate total
      const cartItem = await (await import('../lib/prisma')).default.cartItem.findUnique({
        where: { cart_item_id },
        select: { cart_id: true }
      });

      if (!cartItem) {
        return sendError(res, 'Không tìm thấy mục trong giỏ hàng', 404);
      }

      await CartService.updateItemQuantity(cart_item_id, quantity);

      // Cập nhật lại tổng tiền
      if (cartItem.cart_id) {
        await CartService.recalculateCartTotal(cartItem.cart_id);
      }

      return sendSuccess(res, { message: 'Đã cập nhật số lượng' });
    } catch (error) {
      console.error('Cart update error:', error);
      return sendError(res, 'Lỗi cập nhật giỏ hàng', 500);
    }
  }

  /**
   * Xóa toàn bộ giỏ hàng.
   * DELETE /api/cart/:id
   */
  static async clearCart(req: Request, res: Response) {
    try {
      const cart_id = parseInt(req.params.id as string);

      if (!cart_id || isNaN(cart_id)) {
        return sendError(res, 'cart_id không hợp lệ', 400);
      }

      await CartService.clearCart(cart_id);

      return sendSuccess(res, { message: 'Đã xóa toàn bộ giỏ hàng' });
    } catch (error) {
      console.error('Cart clear error:', error);
      return sendError(res, 'Lỗi xóa giỏ hàng', 500);
    }
  }
}
