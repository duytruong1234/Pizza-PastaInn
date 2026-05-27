"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const response_1 = require("../utils/response");
const orderService_1 = require("../services/orderService");
const cartService_1 = require("../services/cartService");
class OrderController {
    /**
     * Tạo đơn hàng mới từ giỏ hàng.
     * POST /api/orders
     */
    static async createOrder(req, res) {
        try {
            const input = req.body;
            // Validate required fields
            if (!input.items || input.items.length === 0) {
                return (0, response_1.sendError)(res, 'Giỏ hàng trống, không thể đặt hàng', 400);
            }
            if (!input.payment_method) {
                return (0, response_1.sendError)(res, 'Vui lòng chọn phương thức thanh toán', 400);
            }
            if (!input.order_type) {
                return (0, response_1.sendError)(res, 'Vui lòng chọn hình thức nhận hàng', 400);
            }
            // Validate delivery info
            if (input.order_type === 'delivery') {
                if (!input.customer_address && !input.user_address_id) {
                    return (0, response_1.sendError)(res, 'Vui lòng nhập địa chỉ giao hàng', 400);
                }
            }
            // Validate customer info
            if (!input.user_id) {
                if (!input.customer_name) {
                    return (0, response_1.sendError)(res, 'Vui lòng nhập tên người nhận', 400);
                }
                if (!input.customer_phone) {
                    return (0, response_1.sendError)(res, 'Vui lòng nhập số điện thoại', 400);
                }
            }
            const order = await orderService_1.OrderService.createOrder(input);
            // Xóa giỏ hàng sau khi đặt hàng thành công (nếu có cart_id)
            const { cart_id } = req.body;
            if (cart_id) {
                try {
                    await cartService_1.CartService.clearCart(cart_id);
                }
                catch (e) {
                    console.error('Lỗi xóa giỏ hàng sau checkout:', e);
                }
            }
            return (0, response_1.sendSuccess)(res, {
                data: order,
                message: 'Đặt hàng thành công!'
            }, 201);
        }
        catch (error) {
            console.error('Order create error:', error);
            return (0, response_1.sendError)(res, 'Lỗi khi tạo đơn hàng', 500);
        }
    }
    /**
     * Lấy chi tiết đơn hàng.
     * GET /api/orders/:id
     */
    static async getOrder(req, res) {
        try {
            const order_id = parseInt(String(req.params.id));
            if (!order_id || isNaN(order_id)) {
                return (0, response_1.sendError)(res, 'order_id không hợp lệ', 400);
            }
            const order = await orderService_1.OrderService.getOrderById(order_id);
            if (!order) {
                return (0, response_1.sendError)(res, 'Không tìm thấy đơn hàng', 404);
            }
            return (0, response_1.sendSuccess)(res, { data: order });
        }
        catch (error) {
            console.error('Order get error:', error);
            return (0, response_1.sendError)(res, 'Lỗi lấy đơn hàng', 500);
        }
    }
    /**
     * Lấy danh sách đơn hàng theo user.
     * GET /api/orders/user/:user_id
     */
    static async getOrdersByUser(req, res) {
        try {
            const user_id = parseInt(String(req.params.user_id));
            if (!user_id || isNaN(user_id)) {
                return (0, response_1.sendError)(res, 'user_id không hợp lệ', 400);
            }
            const orders = await orderService_1.OrderService.getOrdersByUserId(user_id);
            return (0, response_1.sendSuccess)(res, { data: orders });
        }
        catch (error) {
            console.error('Orders by user error:', error);
            return (0, response_1.sendError)(res, 'Lỗi lấy đơn hàng', 500);
        }
    }
}
exports.OrderController = OrderController;
//# sourceMappingURL=orderController.js.map