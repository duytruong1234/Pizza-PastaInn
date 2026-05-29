// Client API routes — chat trực tiếp với Admin
import { Router } from 'express';
import prisma from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';
import { Response, Request } from 'express';

const router = Router();

/**
 * POST /api/chat/rooms/init
 * Khởi tạo hoặc tìm phòng chat hoạt động cho khách hàng/khách vãng lai
 */
router.post('/rooms/init', async (req: Request, res: Response): Promise<void> => {
  try {
    const { customer_id, guest_session_id, guest_name, guest_phone, guest_address } = req.body;

    // 1. Phía khách hàng đã đăng nhập
    if (customer_id) {
      const customerIdInt = parseInt(String(customer_id));
      
      // Tìm phòng chat đang chờ hoặc đang hoạt động
      let room = await prisma.chatRoom.findFirst({
        where: {
          customer_id: customerIdInt,
          room_status: { in: ['pending', 'active'] },
        },
        include: {
          customer: { select: { user_id: true, username: true, email: true, phone: true } },
        },
      });

      // Nếu chưa có, tạo phòng mới
      if (!room) {
        room = await prisma.chatRoom.create({
          data: {
            customer_id: customerIdInt,
            room_status: 'pending',
          },
          include: {
            customer: { select: { user_id: true, username: true, email: true, phone: true } },
          },
        });
      }

      sendSuccess(res, { data: room, message: 'Khởi tạo phòng chat thành công' });
      return;
    }

    // 2. Phía khách vãng lai (guest)
    if (guest_session_id) {
      // Tìm phòng chat của session đang chờ hoặc đang hoạt động
      let room = await prisma.chatRoom.findFirst({
        where: {
          guest_session_id: String(guest_session_id),
          room_status: { in: ['pending', 'active'] },
        },
      });

      // Nếu tìm thấy, trả về ngay
      if (room) {
        sendSuccess(res, { data: room, message: 'Lấy phòng chat hiện có thành công' });
        return;
      }

      // Nếu chưa có phòng và có thông tin đăng ký -> Tạo mới
      if (guest_name && guest_phone && guest_address) {
        room = await prisma.chatRoom.create({
          data: {
            guest_session_id: String(guest_session_id),
            guest_name: String(guest_name),
            guest_phone: String(guest_phone),
            guest_address: String(guest_address),
            room_status: 'pending',
          },
        });
        sendSuccess(res, { data: room, message: 'Khởi tạo phòng chat khách vãng lai thành công' });
        return;
      }

      // Chưa có phòng và thiếu thông tin -> Yêu cầu nhập form
      sendSuccess(res, { 
        data: null, 
        message: 'Yêu cầu điền thông tin để bắt đầu trò chuyện',
        meta: { require_info: true } 
      });
      return;
    }

    sendError(res, 'Thiếu thông tin khách hàng hoặc guest_session_id', 400);
  } catch (err) {
    logger.error('Chat rooms init error:', err);
    sendError(res, 'Lỗi khi khởi tạo phòng chat', 500);
  }
});

/**
 * GET /api/chat/rooms/:roomId/messages
 * Lấy danh sách tin nhắn của một phòng chat
 */
router.get('/rooms/:roomId/messages', async (req: Request, res: Response): Promise<void> => {
  try {
    const roomId = parseInt(String(req.params.roomId));
    if (isNaN(roomId)) {
      sendError(res, 'Mã phòng chat không hợp lệ', 400);
      return;
    }

    const messages = await prisma.message.findMany({
      where: { room_id: roomId },
      include: {
        images: true,
        sender: { select: { user_id: true, username: true, avatar: true } },
      },
      orderBy: { created_at: 'asc' },
    });

    sendSuccess(res, { data: messages });
  } catch (err) {
    logger.error('Fetch messages error:', err);
    sendError(res, 'Lỗi khi lấy tin nhắn', 500);
  }
});

/**
 * POST /api/chat/rooms/:roomId/messages
 * Gửi tin nhắn mới (Khách hàng hoặc Khách vãng lai gửi)
 */
router.post('/rooms/:roomId/messages', async (req: Request, res: Response): Promise<void> => {
  try {
    const roomId = parseInt(String(req.params.roomId));
    const { message_text, sender_id, image_urls } = req.body;

    if (isNaN(roomId)) {
      sendError(res, 'Mã phòng chat không hợp lệ', 400);
      return;
    }

    if (!message_text && (!image_urls || image_urls.length === 0)) {
      sendError(res, 'Nội dung tin nhắn hoặc hình ảnh là bắt buộc', 400);
      return;
    }

    // 1. Kiểm tra sự tồn tại của phòng
    const room = await prisma.chatRoom.findUnique({
      where: { room_id: roomId }
    });

    if (!room) {
      sendError(res, 'Phòng chat không tồn tại', 404);
      return;
    }

    // 2. Nếu phòng đã đóng -> Tự động mở lại ở trạng thái pending
    const statusUpdate = room.room_status === 'closed' ? 'pending' : undefined;

    // 3. Tạo tin nhắn mới bằng Transaction
    const message = await prisma.$transaction(async (tx) => {
      const newMsg = await tx.message.create({
        data: {
          room_id: roomId,
          sender_type: 'customer', // API này dành riêng cho Client gửi tin
          sender_id: sender_id ? parseInt(String(sender_id)) : null,
          message_text: message_text || '',
          is_read: false,
        },
      });

      // Tạo các MessageImage đính kèm nếu có
      if (image_urls && Array.isArray(image_urls) && image_urls.length > 0) {
        for (const url of image_urls) {
          await tx.messageImage.create({
            data: {
              message_id: newMsg.message_id,
              image_url: url,
            },
          });
        }
      }

      // Cập nhật trạng thái phòng chat và thời gian cập nhật
      await tx.chatRoom.update({
        where: { room_id: roomId },
        data: {
          updated_at: new Date(),
          ...(statusUpdate && { room_status: statusUpdate }),
        },
      });

      return newMsg;
    });

    // Lấy thông tin tin nhắn đầy đủ kèm hình ảnh để trả về
    const fullMessage = await prisma.message.findUnique({
      where: { message_id: message.message_id },
      include: {
        images: true,
        sender: { select: { user_id: true, username: true, avatar: true } },
      },
    });

    sendSuccess(res, { data: fullMessage, message: 'Gửi tin nhắn thành công' }, 201);
  } catch (err) {
    logger.error('Send message error:', err);
    sendError(res, 'Lỗi khi gửi tin nhắn', 500);
  }
});

export default router;
