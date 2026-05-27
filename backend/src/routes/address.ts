import { Router } from 'express';
import { AddressController } from '../controllers/addressController';
import { verifyToken } from '../middleware/auth';

const router = Router();

// Tất cả các route address đều yêu cầu đăng nhập
router.use(verifyToken);

// GET /api/addresses — Lấy danh sách địa chỉ của user
router.get('/', AddressController.getAddresses);

// POST /api/addresses — Thêm địa chỉ mới
router.post('/', AddressController.createAddress);

// PUT /api/addresses/:id — Cập nhật địa chỉ đã lưu
router.put('/:id', AddressController.updateAddress);

// DELETE /api/addresses/:id — Xóa địa chỉ đã lưu
router.delete('/:id', AddressController.deleteAddress);

export default router;
