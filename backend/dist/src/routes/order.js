"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderController_1 = require("../controllers/orderController");
const router = (0, express_1.Router)();
// Tạo đơn hàng mới (từ checkout page)
router.post('/', orderController_1.OrderController.createOrder);
// Lấy danh sách đơn hàng theo user_id
router.get('/user/:user_id', orderController_1.OrderController.getOrdersByUser);
// Lấy danh sách đơn hàng theo số điện thoại
router.get('/phone/:phone', orderController_1.OrderController.getOrdersByPhone);
// Lấy chi tiết 1 đơn hàng (JOIN đầy đủ 5 bảng order)
router.get('/:id', orderController_1.OrderController.getOrder);
exports.default = router;
//# sourceMappingURL=order.js.map