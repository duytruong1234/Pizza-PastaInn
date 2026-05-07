import { Router } from 'express';
import { CartController } from '../controllers/cartController';

const router = Router();

// Thêm sản phẩm vào giỏ hàng (hỗ trợ: regular, half_half, combo)
router.post('/items', CartController.addItem);

// Lấy giỏ hàng theo user_id (đồng bộ khi mở trang)
router.get('/user/:user_id', CartController.getCartByUser);

// Lấy chi tiết giỏ hàng (JOIN đầy đủ 5 bảng)
router.get('/:id', CartController.getCart);

// Xóa 1 mục khỏi giỏ hàng (cascade xóa topping, combo, half)
router.delete('/items/:cart_item_id', CartController.removeItem);

// Cập nhật số lượng 1 mục
router.put('/items/:cart_item_id', CartController.updateQuantity);

// Xóa toàn bộ giỏ hàng
router.delete('/:id', CartController.clearCart);

export default router;
