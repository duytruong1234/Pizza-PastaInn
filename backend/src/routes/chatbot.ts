// Chatbot route — API xử lý hội thoại AI gợi ý món ăn
import { Router, Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { askChatbot, getFallbackResponse, createOrGetSession, getSessionHistory, getUserSessions } from '../services/chatbotService';
import { logger } from '../utils/logger';

const router = Router();

// Rate limiting đơn giản — tối đa 10 request/phút/IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * POST /api/chatbot/ask
 * Gửi câu hỏi cho chatbot AI, nhận gợi ý món ăn
 *
 * Body: {
 *   message: string,              // Câu hỏi của khách (bắt buộc)
 *   conversation_history?: Array<{ role: 'user'|'bot', content: string }>  // Lịch sử hội thoại (tùy chọn)
 * }
 */
router.post('/ask', async (req: Request, res: Response): Promise<void> => {
  try {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

    // Kiểm tra rate limit
    if (!checkRateLimit(clientIp)) {
      sendError(res, 'Bạn đang gửi quá nhiều tin nhắn. Vui lòng chờ 1 phút rồi thử lại.', 429);
      return;
    }

    const { message, conversation_history, user_id, customer_name, session_id, guest_id } = req.body;

    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      sendError(res, 'Vui lòng nhập câu hỏi', 400);
      return;
    }

    if (message.trim().length > 500) {
      sendError(res, 'Câu hỏi quá dài, vui lòng rút gọn (tối đa 500 ký tự)', 400);
      return;
    }

    // Xử lý session
    let sessionId = session_id ? Number(session_id) : null;
    if (!sessionId) {
      sessionId = await createOrGetSession(
        user_id ? Number(user_id) : null,
        guest_id ? String(guest_id) : null
      );
    }

    // Validate conversation history nếu có
    const history = Array.isArray(conversation_history)
      ? conversation_history.filter(
          (m: any) => m && typeof m.role === 'string' && typeof m.content === 'string'
        )
      : [];

    // Gọi AI chatbot
    let response;
    try {
      response = await askChatbot(
        message.trim(),
        history,
        user_id ? Number(user_id) : null,
        customer_name || null,
        sessionId
      );
    } catch (aiError: any) {
      // Nếu AI lỗi, dùng fallback
      console.error('=== AI ERROR DETAILS ===', aiError);
      logger.warn('AI API error, using fallback. Error:', aiError?.message || String(aiError));
      response = await getFallbackResponse(message.trim(), customer_name || null);
    }

    sendSuccess(res, { data: { ...response, session_id: sessionId } });
  } catch (err: any) {
    logger.error('Chatbot error:', err?.message || err);
    sendError(res, 'Lỗi xử lý chatbot. Vui lòng thử lại.', 500);
  }
});

/**
 * GET /api/chatbot/sessions
 * Lấy danh sách session của người dùng
 */
router.get('/sessions', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.query.user_id ? Number(req.query.user_id) : null;
    const guestId = req.query.guest_id ? String(req.query.guest_id) : null;
    const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;
    const limit = req.query.limit ? Math.max(1, Number(req.query.limit)) : 10;

    const result = await getUserSessions(userId, guestId, page, limit);
    sendSuccess(res, { data: result });
  } catch (err: any) {
    logger.error('Lỗi lấy danh sách session:', err);
    sendError(res, 'Lỗi khi lấy lịch sử chat', 500);
  }
});

/**
 * GET /api/chatbot/sessions/:id/messages
 * Lấy lịch sử tin nhắn của một session
 */
router.get('/sessions/:id/messages', async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionId = Number(req.params.id);
    if (isNaN(sessionId)) {
      sendError(res, 'Mã phiên không hợp lệ', 400);
      return;
    }

    const messages = await getSessionHistory(sessionId);
    sendSuccess(res, { data: messages });
  } catch (err: any) {
    logger.error('Lỗi lấy tin nhắn session:', err);
    sendError(res, 'Lỗi khi lấy tin nhắn', 500);
  }
});

export default router;
