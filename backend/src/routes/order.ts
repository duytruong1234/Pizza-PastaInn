import { Router } from 'express';
import { OrderController } from '../controllers/orderController';

const router = Router();

// Tạo đơn hàng mới (từ checkout page)
router.post('/', OrderController.createOrder);

// Lấy danh sách đơn hàng theo user_id
router.get('/user/:user_id', OrderController.getOrdersByUser);

// Lấy chi tiết 1 đơn hàng (JOIN đầy đủ 5 bảng order)
router.get('/:id', OrderController.getOrder);

export default router;
