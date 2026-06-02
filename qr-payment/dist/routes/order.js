"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const store_1 = require("../store");
const router = (0, express_1.Router)();
/**
 * POST /api/order/create
 * Tạo đơn hàng mới và sinh link QR thanh toán động VietQR.
 */
router.post('/create', (req, res) => {
    try {
        const { amount, userId } = req.body;
        // Kiểm tra dữ liệu đầu vào hợp lệ
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Số tiền thanh toán không hợp lệ (phải là số lớn hơn 0)'
            });
        }
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'Mã người dùng (userId) không được để trống'
            });
        }
        // 1. Tạo orderId unique theo định dạng DH + timestamp
        const timestamp = Date.now();
        const orderId = `DH${timestamp}`;
        // 2. Lưu đơn hàng vào Map với status ban đầu: "pending"
        const newOrder = {
            orderId,
            amount: Number(amount),
            userId: String(userId),
            status: 'pending',
            createdAt: new Date()
        };
        store_1.orders.set(orderId, newOrder);
        // 3. Đọc thông tin ngân hàng cấu hình từ biến môi trường .env
        const bankCode = process.env.BANK_CODE || 'MB';
        const bankAccount = process.env.BANK_ACCOUNT || '0123456789';
        const accountName = process.env.ACCOUNT_NAME || 'NGUYEN VAN A';
        // 4. Tạo URL QR VietQR động theo format yêu cầu
        // Encode URI Component cho các ký tự đặc biệt (tên chủ tài khoản, mã đơn) để link hoạt động chuẩn xác
        const encodedAccountName = encodeURIComponent(accountName);
        const qrUrl = `https://img.vietqr.io/image/${bankCode}-${bankAccount}-compact2.png?amount=${newOrder.amount}&addInfo=${orderId}&accountName=${encodedAccountName}`;
        console.log(`[Order] Đã tạo đơn hàng mới: ${orderId} - Số tiền: ${newOrder.amount} VND - User: ${userId}`);
        // 5. Trả kết quả về cho frontend
        return res.status(201).json({
            success: true,
            orderId,
            qrUrl,
            amount: newOrder.amount,
            bankCode,
            bankAccount,
            accountName,
            message: 'Tạo đơn hàng thanh toán QR thành công'
        });
    }
    catch (error) {
        console.error('[Order] Lỗi khi tạo đơn hàng:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server khi tạo đơn hàng'
        });
    }
});
/**
 * GET /api/order/status/:orderId
 * Kiểm tra và trả về trạng thái hiện tại của đơn hàng.
 */
router.get('/status/:orderId', (req, res) => {
    try {
        const { orderId } = req.params;
        // Tìm đơn hàng trong in-memory Map
        const order = store_1.orders.get(orderId);
        if (!order) {
            // Trả về trạng thái "not_found" nếu đơn hàng không tồn tại
            return res.status(200).json({
                orderId,
                status: 'not_found'
            });
        }
        // Trả về trạng thái hiện tại: "pending" | "paid"
        return res.status(200).json({
            orderId,
            status: order.status
        });
    }
    catch (error) {
        console.error('[Order] Lỗi khi lấy trạng thái đơn hàng:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy trạng thái đơn hàng'
        });
    }
});
exports.default = router;
