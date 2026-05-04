import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { CartService } from '../services/cartService';

export class CartController {
  static async addItem(req: Request, res: Response) {
    try {
      const { cart_id, dish_price_id, quantity, price_cart, cart_item_note } = req.body;
      
      const result = await CartService.addItemToCart({
        cart_id,
        dish_price_id,
        quantity,
        price_cart,
        cart_item_note
      });

      return sendSuccess(res, { data: result, message: 'Đã lưu vào cơ sở dữ liệu' });
    } catch (error) {
      console.error('Cart add error:', error);
      return sendError(res, 'Lỗi thêm vào giỏ hàng', 500);
    }
  }

  static async removeItem(req: Request, res: Response) {
    try {
      const { cart_id, dish_price_id } = req.body;
      
      if (!cart_id || !dish_price_id) {
        return sendError(res, 'Thiếu thông tin giỏ hàng', 400);
      }

      await CartService.removeItemFromCart(cart_id, dish_price_id);
      return sendSuccess(res, { message: 'Đã xóa khỏi giỏ hàng' });
    } catch (error) {
      console.error('Cart delete error:', error);
      return sendError(res, 'Lỗi xóa khỏi giỏ hàng', 500);
    }
  }

  static async updateQuantity(req: Request, res: Response) {
    try {
      const { cart_id, dish_price_id, quantity } = req.body;
      
      if (!cart_id || !dish_price_id) {
        return sendError(res, 'Thiếu thông tin giỏ hàng', 400);
      }

      await CartService.updateItemQuantity(cart_id, dish_price_id, quantity);
      return sendSuccess(res, { message: 'Đã cập nhật số lượng' });
    } catch (error) {
      console.error('Cart update error:', error);
      return sendError(res, 'Lỗi cập nhật giỏ hàng', 500);
    }
  }
}
