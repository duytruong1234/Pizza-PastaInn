import { Router } from 'express';
import { OrderController } from '../controllers/orderController';

const router = Router();

// Tạo đơn hàng mới (từ checkout page)
router.post('/', OrderController.createOrder);

// Lấy danh sách đơn hàng theo user_id
router.get('/user/:user_id', OrderController.getOrdersByUser);

// Lấy danh sách đơn hàng theo số điện thoại
router.get('/phone/:phone', OrderController.getOrdersByPhone);

// Lấy chi tiết 1 đơn hàng (JOIN đầy đủ 5 bảng order)
router.get('/:id', OrderController.getOrder);

// Hủy đơn hàng và khôi phục tồn kho
router.post('/:id/cancel', OrderController.cancelOrder);

// Đổi phương thức thanh toán cho đơn hàng đang chờ xử lý (VietQR -> COD)
router.patch('/:id/payment-method', OrderController.switchPaymentMethod);

export default router;
