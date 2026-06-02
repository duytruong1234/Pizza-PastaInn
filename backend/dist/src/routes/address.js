"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const addressController_1 = require("../controllers/addressController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Tất cả các route address đều yêu cầu đăng nhập
router.use(auth_1.verifyToken);
// GET /api/addresses — Lấy danh sách địa chỉ của user
router.get('/', addressController_1.AddressController.getAddresses);
// POST /api/addresses — Thêm địa chỉ mới
router.post('/', addressController_1.AddressController.createAddress);
// PUT /api/addresses/:id — Cập nhật địa chỉ đã lưu
router.put('/:id', addressController_1.AddressController.updateAddress);
// DELETE /api/addresses/:id — Xóa địa chỉ đã lưu
router.delete('/:id', addressController_1.AddressController.deleteAddress);
exports.default = router;
//# sourceMappingURL=address.js.map