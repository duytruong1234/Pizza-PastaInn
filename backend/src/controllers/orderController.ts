import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { OrderService, CreateOrderInput } from '../services/orderService';
import { CartService } from '../services/cartService';

export class OrderController {

  /**
   * Tạo đơn hàng mới từ giỏ hàng.
   * POST /api/orders
   */
  static async createOrder(req: Request, res: Response) {
    try {
      const input: CreateOrderInput = req.body;

      // Validate required fields
      if (!input.items || input.items.length === 0) {
        return sendError(res, 'Giỏ hàng trống, không thể đặt hàng', 400);
      }

      if (!input.payment_method) {
        return sendError(res, 'Vui lòng chọn phương thức thanh toán', 400);
      }

      if (!input.order_type) {
        return sendError(res, 'Vui lòng chọn hình thức nhận hàng', 400);
      }

      // Validate delivery info
      if (input.order_type === 'delivery') {
        if (!input.customer_address && !input.user_address_id) {
          return sendError(res, 'Vui lòng nhập địa chỉ giao hàng', 400);
        }
      }

      // Validate customer info
      if (!input.user_id) {
        if (!input.customer_name) {
          return sendError(res, 'Vui lòng nhập tên người nhận', 400);
        }
        if (!input.customer_phone) {
          return sendError(res, 'Vui lòng nhập số điện thoại', 400);
        }
      }

      const order = await OrderService.createOrder(input);

      // Xóa giỏ hàng sau khi đặt hàng thành công (nếu có cart_id)
      const { cart_id } = req.body;
      if (cart_id) {
        try {
          await CartService.clearCart(cart_id);
        } catch (e) {
          console.error('Lỗi xóa giỏ hàng sau checkout:', e);
        }
      }

      return sendSuccess(res, {
        data: order,
        message: 'Đặt hàng thành công!'
      }, 201);
    } catch (error) {
      console.error('Order create error:', error);
      return sendError(res, 'Lỗi khi tạo đơn hàng', 500);
    }
  }

  /**
   * Lấy chi tiết đơn hàng.
   * GET /api/orders/:id
   */
  static async getOrder(req: Request, res: Response) {
    try {
      const order_id = parseInt(String(req.params.id));
      if (!order_id || isNaN(order_id)) {
        return sendError(res, 'order_id không hợp lệ', 400);
      }

      const order = await OrderService.getOrderById(order_id);
      if (!order) {
        return sendError(res, 'Không tìm thấy đơn hàng', 404);
      }

      return sendSuccess(res, { data: order });
    } catch (error) {
      console.error('Order get error:', error);
      return sendError(res, 'Lỗi lấy đơn hàng', 500);
    }
  }

  /**
   * Lấy danh sách đơn hàng theo user.
   * GET /api/orders/user/:user_id
   */
  static async getOrdersByUser(req: Request, res: Response) {
    try {
      const user_id = parseInt(String(req.params.user_id));
      if (!user_id || isNaN(user_id)) {
        return sendError(res, 'user_id không hợp lệ', 400);
      }

      const orders = await OrderService.getOrdersByUserId(user_id);
      return sendSuccess(res, { data: orders });
    } catch (error) {
      console.error('Orders by user error:', error);
      return sendError(res, 'Lỗi lấy đơn hàng', 500);
    }
  }

  /**
   * Lấy danh sách đơn hàng theo số điện thoại.
   * GET /api/orders/phone/:phone
   */
  static async getOrdersByPhone(req: Request, res: Response) {
    try {
      const phone = String(req.params.phone).trim();
      if (!phone) {
        return sendError(res, 'Số điện thoại không hợp lệ', 400);
      }

      const orders = await OrderService.getOrdersByPhone(phone);
      return sendSuccess(res, { data: orders });
    } catch (error) {
      console.error('Orders by phone error:', error);
      return sendError(res, 'Lỗi lấy đơn hàng theo số điện thoại', 500);
    }
  }

  /**
   * Hủy đơn hàng và hoàn trả lại số lượng tồn kho.
   * POST /api/orders/:id/cancel
   */
  static async cancelOrder(req: Request, res: Response) {
    try {
      const order_id = parseInt(String(req.params.id));
      if (!order_id || isNaN(order_id)) {
        return sendError(res, 'order_id không hợp lệ', 400);
      }

      const order = await OrderService.cancelOrder(order_id);
      return sendSuccess(res, { data: order, message: 'Hủy đơn hàng thành công và đã khôi phục lại tồn kho.' });
    } catch (error: any) {
      console.error('Order cancel error:', error);
      return sendError(res, error.message || 'Lỗi khi hủy đơn hàng', 500);
    }
  }
}

