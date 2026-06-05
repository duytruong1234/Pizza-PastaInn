import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { sendPaymentSuccessEmail } from '../services/emailService';

// Mở rộng interface Request của Express để hỗ trợ rawBody
interface RequestWithRawBody extends Request {
  rawBody?: Buffer;
}

const router = Router();

/**
 * POST /api/webhooks/sepay
 * Nhận thông báo giao dịch chuyển khoản từ SePay Webhook và cập nhật trạng thái đơn hàng trong PostgreSQL.
 */
router.post(['/sepay', '/'], async (req: RequestWithRawBody, res: Response) => {
  try {
    const signature = req.headers['x-sepay-signature'] as string;
    const timestamp = req.headers['x-sepay-timestamp'] as string;
    const rawBody = req.rawBody;
    const webhookSecret = process.env.SEPAY_WEBHOOK_SECRET;

    console.log('[SePay Webhook] Nhận được thông báo giao dịch mới.');
    console.log('[SePay Webhook] Headers:', JSON.stringify({
      'x-sepay-signature': req.headers['x-sepay-signature'] || 'KHÔNG CÓ',
      'x-sepay-timestamp': req.headers['x-sepay-timestamp'] || 'KHÔNG CÓ',
      'content-type': req.headers['content-type'],
    }));
    console.log('[SePay Webhook] Body:', JSON.stringify(req.body));

    // 1. Kiểm tra cấu hình và sự tồn tại của chữ ký
    if (!webhookSecret) {
      console.error('[SePay Webhook] LỖI: Chưa cấu hình SEPAY_WEBHOOK_SECRET trong file .env');
      return res.status(200).json({
        success: false,
        message: 'Server has not configured webhook secret'
      });
    }

    if (!signature || !rawBody || !timestamp) {
      console.warn('[SePay Webhook] Cảnh báo: Thiếu chữ ký, timestamp hoặc body rỗng.');
      return res.status(200).json({
        success: false,
        message: 'Missing signature, timestamp or payload body'
      });
    }

    // 2. Chống replay attack: kiểm tra timestamp không quá 5 phút
    const currentTime = Math.floor(Date.now() / 1000);
    const webhookTime = parseInt(timestamp, 10);
    if (Math.abs(currentTime - webhookTime) > 300) {
      console.warn('[SePay Webhook] Cảnh báo: Webhook quá hạn (replay attack?).');
      return res.status(200).json({
        success: false,
        message: 'Webhook timestamp expired'
      });
    }

    // 3. Xác thực chữ ký HMAC SHA256 theo tài liệu SePay
    // Chuỗi ký = "{timestamp}.{rawBody}"
    const dataToSign = `${timestamp}.${rawBody.toString()}`;
    const computedSignature = crypto.createHmac('sha256', webhookSecret).update(dataToSign).digest('hex');

    // SePay gửi chữ ký dạng "sha256=<hex>", cần bỏ prefix "sha256=" trước khi so sánh
    const receivedSig = signature.startsWith('sha256=') ? signature.slice(7) : signature;

    // Chuyển đổi sang Buffer để so sánh an toàn chống timing attack
    const sigBuffer = Buffer.from(receivedSig, 'hex');
    const compBuffer = Buffer.from(computedSignature, 'hex');

    let isVerified = false;
    try {
      isVerified = sigBuffer.length === compBuffer.length && crypto.timingSafeEqual(sigBuffer, compBuffer);
    } catch (err) {
      isVerified = false;
    }

    if (!isVerified) {
      console.error('[SePay Webhook] Xác thực chữ ký thất bại. Giao dịch giả mạo!');
      console.error('[SePay Webhook] Chữ ký nhận được:', receivedSig);
      console.error('[SePay Webhook] Chữ ký tính toán:', computedSignature);
      console.error('[SePay Webhook] dataToSign preview:', dataToSign.substring(0, 120));
      return res.status(200).json({
        success: false,
        message: 'Invalid signature verification'
      });
    }

    console.log('[SePay Webhook] Xác thực chữ ký thành công.');

    // 3. Phân tích nội dung thanh toán từ SePay
    const { transferAmount, content, transactionDate } = req.body;

    if (!content) {
      console.warn('[SePay Webhook] Giao dịch không chứa nội dung chuyển khoản.');
      return res.status(200).json({
        success: false,
        message: 'Transaction content is empty'
      });
    }

    console.log(`[SePay Webhook] Nội dung chuyển khoản nhận được: "${content}" | Số tiền: ${transferAmount} VND`);

    // 4. Trích xuất order_id từ nội dung chuyển khoản bằng Regex
    // Định dạng mong đợi: PIZZA_INN_<order_id> (chấp nhận cả các biến thể như PIZZAINN<id>, PIZZA INN <id> do một số ngân hàng tự động loại bỏ ký tự gạch dưới)
    const match = content.match(/PIZZA[-_\s]*INN[-_\s]*(\d+)/i);
    if (!match) {
      console.log(`[SePay Webhook] Không tìm thấy mã đơn hàng dạng PIZZA_INN_<id> trong nội dung: "${content}"`);
      return res.status(200).json({
        success: false,
        message: 'No matching order ID found in content'
      });
    }

    const orderId = parseInt(match[1], 10);
    console.log(`[SePay Webhook] Trích xuất thành công mã đơn hàng ID: ${orderId}`);

    // 5. Đối chiếu đơn hàng trong cơ sở dữ liệu PostgreSQL qua Prisma
    const order = await prisma.order.findUnique({
      where: { order_id: orderId }
    });

    if (!order) {
      console.warn(`[SePay Webhook] Không tìm thấy đơn hàng ID ${orderId} trong cơ sở dữ liệu.`);
      return res.status(200).json({
        success: false,
        message: `Order ID ${orderId} not found`
      });
    }

    // Nếu đơn hàng đã được cập nhật thanh toán từ trước
    if (order.payment_status === 'paid') {
      console.log(`[SePay Webhook] Đơn hàng ID ${orderId} đã được đánh dấu thanh toán từ trước.`);
      return res.status(200).json({
        success: true,
        message: `Order ID ${orderId} was already paid`
      });
    }

    // Kiểm tra số tiền chuyển khoản thực tế có đủ không
    const amountTransferred = Number(transferAmount);
    const amountRequired = Number(order.total_order);

    // HỖ TRỢ TEST CHUYỂN KHOẢN THỰC TẾ TRONG MÔI TRƯỜNG DEV (Đổi isDevMode thành false khi chạy thật)
    const isDevMode = true;
    if (amountTransferred < amountRequired && !isDevMode) {
      console.warn(`[SePay Webhook] Đơn hàng ID ${orderId} chuyển khoản thiếu tiền. Yêu cầu: ${amountRequired} VND, Thực nhận: ${amountTransferred} VND.`);
      return res.status(200).json({
        success: false,
        message: `Amount ${amountTransferred} is less than required ${amountRequired}`
      });
    }

    // 6. Cập nhật trạng thái đơn hàng sang "paid" và "confirmed" trong cơ sở dữ liệu và lưu vết giao dịch
    await prisma.$transaction(async (tx) => {
      // Cập nhật đơn hàng
      await tx.order.update({
        where: { order_id: orderId },
        data: {
          payment_status: 'paid',
          order_status: 'confirmed',
          confirmed_at: new Date()
        }
      });

      // Tạo giao dịch trong bảng tb_transactions
      await tx.transaction.create({
        data: {
          gateway: req.body.gateway || 'Unknown',
          transaction_date: req.body.transactionDate ? new Date(req.body.transactionDate) : new Date(),
          account_number: req.body.accountNumber || null,
          sub_account: req.body.subAccount || null,
          amount_in: req.body.transferType === 'in' ? Number(req.body.transferAmount || 0) : 0,
          amount_out: req.body.transferType === 'out' ? Number(req.body.transferAmount || 0) : 0,
          accumulated: Number(req.body.accumulated || 0),
          code: req.body.code || null,
          transaction_content: req.body.content || null,
          reference_number: req.body.referenceCode || null,
          body: JSON.stringify(req.body),
          order_id: orderId
        }
      });
    });

    console.log(`[SePay Webhook] THANH TOÁN THÀNH CÔNG: Đơn hàng ID ${orderId} đã được xác nhận thanh toán và ghi nhận lịch sử giao dịch thành công lúc ${new Date().toISOString()}`);

    // Gửi email thông báo thanh toán thành công (bất đồng bộ)
    sendPaymentSuccessEmail(orderId).catch((err) =>
      console.error(`[SePay Webhook] Lỗi gửi email thanh toán cho đơn ${orderId}:`, err)
    );

    return res.status(200).json({
      success: true,
      message: `Order ID ${orderId} marked as paid and transaction logged successfully`
    });

  } catch (error: any) {
    console.error('[SePay Webhook] Lỗi khi xử lý thông tin webhook:', error);
    return res.status(200).json({
      success: false,
      message: 'Server error occurred but webhook accepted'
    });
  }
});

export default router;
