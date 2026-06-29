import prisma from '../lib/prisma';
import { logger } from '../utils/logger';

export async function autoCompleteOldOrders() {
  try {
    const now = new Date();
    // Chuyển sang giờ Việt Nam (UTC+7) để xác định ranh giới ngày
    const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    vnTime.setUTCHours(0, 0, 0, 0);
    // Trừ đi 7 giờ để chuyển lại về giờ UTC tương ứng với đầu ngày hôm nay VN (00:00:00 UTC+7)
    const startOfTodayInUTC = new Date(vnTime.getTime() - 7 * 60 * 60 * 1000);

    // Tìm và cập nhật tất cả đơn hàng chưa hoàn thành/hủy được tạo trước đầu ngày hôm nay (giờ VN)
    const result = await prisma.order.updateMany({
      where: {
        created_at: {
          lt: startOfTodayInUTC,
        },
        order_status: {
          notIn: ['completed', 'cancelled'],
        },
      },
      data: {
        order_status: 'completed',
        completed_at: new Date(), // Gán thời gian hoàn thành là lúc hệ thống xác nhận
      },
    });

    if (result.count > 0) {
      logger.info(`Tự động hoàn thành ${result.count} đơn hàng cũ từ những ngày trước.`);
    }
  } catch (error) {
    logger.error('Lỗi khi tự động hoàn thành đơn hàng cũ:', error);
  }
}
