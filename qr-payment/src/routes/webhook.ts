import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { orders } from '../store';

// Mở rộng interface Request để hỗ trợ thuộc tính rawBody lưu trữ buffer của request
interface RequestWithRawBody extends Request {
  rawBody?: Buffer;
}

const router = Router();

/**
 * POST /webhook/sepay
 * Nhận thông báo giao dịch từ SePay Webhook và cập nhật trạng thái đơn hàng.
 */
router.post('/sepay', (req: RequestWithRawBody, res: Response) => {
  try {
    const signature = req.headers['x-sepay-signature'] as string;
    const rawBody = req.rawBody;
    const webhookSecret = process.env.SEPAY_WEBHOOK_SECRET;

    console.log('[SePay Webhook] Nhận được yêu cầu webhook mới.');

    // 1. Kiểm tra cấu hình và sự tồn tại của chữ ký
    if (!webhookSecret) {
      console.error('[SePay Webhook] LỖI: Chưa cấu hình SEPAY_WEBHOOK_SECRET trong file .env');
      return res.status(200).json({
        success: false,
        message: 'Server has not configured webhook secret'
      });
    }

    if (!signature || !rawBody) {
      console.warn('[SePay Webhook] Cảnh báo: Thiếu chữ ký x-sepay-signature hoặc raw body.');
      return res.status(200).json({
        success: false,
        message: 'Missing signature or payload body'
      });
    }

    // 2. Xác thực chữ ký bảo mật HMAC SHA256 từ header x-sepay-signature
    const hmac = crypto.createHmac('sha256', webhookSecret);
    const computedSignature = hmac.update(rawBody).digest('hex');

    // Chuyển đổi sang Buffer để so sánh an toàn bằng timingSafeEqual (tránh lỗ hổng timing attack)
    const sigBuffer = Buffer.from(signature, 'hex');
    const compBuffer = Buffer.from(computedSignature, 'hex');

    let isVerified = false;
    try {
      isVerified = sigBuffer.length === compBuffer.length && crypto.timingSafeEqual(sigBuffer, compBuffer);
    } catch (err) {
      isVerified = false;
    }

    if (!isVerified) {
      console.error('[SePay Webhook] Cảnh báo: Xác thực chữ ký thất bại. Giao dịch không hợp lệ!');
      // Trả về HTTP 200 nhưng thông báo thất bại để tránh SePay gửi lại (retry) vô hạn
      return res.status(200).json({
        success: false,
        message: 'Invalid signature verification'
      });
    }

    console.log('[SePay Webhook] Xác thực chữ ký thành công.');

    // 3. Phân tích nội dung (payload) gửi từ SePay
    // Dữ liệu body lúc này đã được express.json() parse thành đối tượng
    const { transferAmount, content, transactionDate } = req.body;

    if (!content) {
      console.warn('[SePay Webhook] Giao dịch không có nội dung chuyển khoản (content).');
      return res.status(200).json({
        success: false,
        message: 'Transaction content is empty'
      });
    }

    console.log(`[SePay Webhook] Chi tiết giao dịch: Số tiền: ${transferAmount} VND | Nội dung: "${content}" | Ngày giao dịch: ${transactionDate}`);

    // 4. Tìm mã đơn hàng orderId trong nội dung chuyển khoản bằng regex /DH\d+/
    const match = content.match(/DH\d+/);
    if (!match) {
      console.log(`[SePay Webhook] Không tìm thấy mã đơn hàng (DH...) trong nội dung chuyển khoản: "${content}"`);
      return res.status(200).json({
        success: false,
        message: 'No matching orderId (DH...) found in content'
      });
    }

    const orderId = match[0];
    console.log(`[SePay Webhook] Trích xuất thành công mã đơn hàng: ${orderId}`);

    // 5. Đối chiếu đơn hàng trong hệ thống (Map orders)
    const order = orders.get(orderId);

    // Case Edge 1: Đơn hàng không tồn tại trong hệ thống
    if (!order) {
      console.warn(`[SePay Webhook] Đơn hàng ${orderId} không tồn tại trong hệ thống.`);
      return res.status(200).json({
        success: false,
        message: `Order ${orderId} not found`
      });
    }

    // Case Edge 2: Đơn hàng đã được thanh toán từ trước
    if (order.status === 'paid') {
      console.log(`[SePay Webhook] Đơn hàng ${orderId} đã được thanh toán thành công trước đó.`);
      return res.status(200).json({
        success: true,
        message: `Order ${orderId} was already paid`
      });
    }

    // Case Edge 3: Kiểm tra số tiền nhận được có nhỏ hơn số tiền yêu cầu trong hóa đơn không
    const amountTransferred = Number(transferAmount);
    if (amountTransferred < order.amount) {
      console.warn(`[SePay Webhook] Đơn hàng ${orderId} bị thiếu tiền. Yêu cầu: ${order.amount} VND, chuyển khoản thực tế: ${amountTransferred} VND.`);
      return res.status(200).json({
        success: false,
        message: `Payment amount ${amountTransferred} is less than required ${order.amount}`
      });
    }

    // 6. Nếu hợp lệ: cập nhật đơn hàng thành "paid", lưu thời gian paidAt, số tiền thực tế và mã ngày giao dịch
    order.status = 'paid';
    order.paidAt = new Date();
    order.actualAmount = amountTransferred;
    order.transactionDate = transactionDate;

    orders.set(orderId, order);

    console.log(`[SePay Webhook] THANH TOÁN THÀNH CÔNG: Đơn hàng ${orderId} đã được cập nhật thành công trạng thái "paid" lúc ${order.paidAt.toISOString()}`);

    // Trả về kết quả xác nhận cho SePay
    return res.status(200).json({
      success: true,
      message: `Order ${orderId} marked as paid successfully`
    });

  } catch (error: any) {
    console.error('[SePay Webhook] Lỗi hệ thống khi xử lý webhook:', error);
    // Luôn luôn trả về 200 để tránh SePay spam retry khi server gặp lỗi
    return res.status(200).json({
      success: false,
      message: 'Server internal error occurred but webhook accepted'
    });
  }
});

export default router;
