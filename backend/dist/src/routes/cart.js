"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cartController_1 = require("../controllers/cartController");
const router = (0, express_1.Router)();
// Thêm sản phẩm vào giỏ hàng (hỗ trợ: regular, half_half, combo)
router.post('/items', cartController_1.CartController.addItem);
// Lấy giỏ hàng theo user_id (đồng bộ khi mở trang)
router.get('/user/:user_id', cartController_1.CartController.getCartByUser);
// Lấy chi tiết giỏ hàng (JOIN đầy đủ 5 bảng)
router.get('/:id', cartController_1.CartController.getCart);
// Xóa 1 mục khỏi giỏ hàng (cascade xóa topping, combo, half)
router.delete('/items/:cart_item_id', cartController_1.CartController.removeItem);
// Cập nhật số lượng 1 mục
router.put('/items/:cart_item_id', cartController_1.CartController.updateQuantity);
// Xóa toàn bộ giỏ hàng
router.delete('/:id', cartController_1.CartController.clearCart);
exports.default = router;
//# sourceMappingURL=cart.js.map