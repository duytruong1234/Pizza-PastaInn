// Chatbot AI Service — gọi Groq API để gợi ý món ăn thông minh
import Groq from 'groq-sdk';
import prisma from '../lib/prisma';
import { logger } from '../utils/logger';

// ─── Khởi tạo Groq AI ───────────────────────────────────────────────────────

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

let groqClient: Groq | null = null;

function getGroq(): Groq {
  if (!groqClient) {
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY chưa được cấu hình trong biến môi trường');
    }
    groqClient = new Groq({ apiKey: GROQ_API_KEY });
  }
  return groqClient;
}

// ─── Cache menu data ─────────────────────────────────────────────────────────

interface MenuCache {
  data: string;
  dishMap: Map<number, any>;
  timestamp: number;
}

let menuCache: MenuCache | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // Cache 5 phút

async function getMenuContext(): Promise<MenuCache> {
  // Trả về cache nếu còn hạn
  if (menuCache && Date.now() - menuCache.timestamp < CACHE_TTL_MS) {
    return menuCache;
  }

  // Lấy dữ liệu menu từ database
  const [categories, dishes, combos, stores] = await Promise.all([
    prisma.category.findMany({ orderBy: { category_id: 'asc' } }),
    prisma.dish.findMany({
      where: { dish_status: true },
      include: {
        prices: {
          include: { size: true, crust: true }
        },
        category: true
      }
    }),
    prisma.combo.findMany({
      where: { is_active: true },
      include: {
        groups: {
          include: {
            combo_items: {
              include: {
                dish_price: {
                  include: { dish: true, size: true }
                }
              }
            }
          }
        }
      }
    }),
    prisma.store.findMany({ where: { is_active: true } })
  ]);

  // Tạo map để tra cứu nhanh
  const dishMap = new Map<number, any>();
  dishes.forEach(d => dishMap.set(d.dish_id, d));

  // Format menu data cực ngắn gọn cho AI (giảm token)
  const menuItems = dishes.map(d => {
    const priceValues = d.prices.map(p => Number(p.dish_price)).filter(p => p > 0);
    const minPrice = priceValues.length > 0 ? Math.min(...priceValues) : 0;
    const maxPrice = priceValues.length > 0 ? Math.max(...priceValues) : 0;
    return {
      id: d.dish_id,
      name: d.dish_name,
      cat: d.category?.category_name || '',
      ing: d.ingredient || '',
      price: minPrice === maxPrice ? `${minPrice}` : `${minPrice}-${maxPrice}`
    };
  });

  const comboItems = combos.map(c => ({
    id: c.combo_id,
    name: c.combo_name,
    price: c.combo_price,
    desc: c.description || ''
  }));

  const categoryList = categories.map(c => c.category_name).join(', ');

  // Format thông tin cửa hàng
  const storeInfo = stores.map(s => `${s.store_name}: ${s.address} (${s.hotline})`).join('; ');

  // Lấy dữ liệu bán chạy và đánh giá cao thực tế từ database
  let bestsellersList: string[] = [];
  let topRatedList: string[] = [];
  try {
    const { getPopularDishes, getTopRatedDishes } = await import('./recommendationService');
    const [popular, topRated] = await Promise.all([
      getPopularDishes(6),
      getTopRatedDishes(6)
    ]);
    bestsellersList = popular.map((p: any) => `${p.dish_name} (${p.category || 'Món'}: bán ${p.total_ordered || 1} phần)`);
    topRatedList = topRated.map((t: any) => `${t.dish_name} (${t.avg_rating || 5} sao)`);
  } catch (err) {
    logger.warn('Lỗi lấy bestsellers cho menu context:', err);
  }

  const menuContext = JSON.stringify({
    categories: categoryList,
    dishes: menuItems,
    combos: comboItems,
    stores: storeInfo,
    bestsellers: bestsellersList,
    top_rated: topRatedList
  });

  menuCache = {
    data: menuContext,
    dishMap,
    timestamp: Date.now()
  };

  return menuCache;
}

// ─── System Prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `/no_think
Bạn là trợ lý ảo AI thông minh và chu đáo của nhà hàng PizzaGenie.

THÔNG TIN NHÀ HÀNG:
- Chuyên: Pizza kiểu Ý, Spaghetti, Gratin, Risotto, Salad, Đồ uống, Combo tiết kiệm
- Thanh toán: VietQR (chuyển khoản) và COD (tiền mặt khi nhận hàng)
- Giao hàng tận nhà, cần tên + SĐT + địa chỉ
- Size pizza: Regular (nhỏ), Large (lớn)
- Đế: Thin crust, Thick crust, Cheese viền phô mai, Ham viền đâm bông
- Half-Half Pizza (kết hợp 2 vị trên 1 bánh)
- Trang web: Menu, Giới thiệu, Chi nhánh, Đánh giá, Tra cứu đơn

NHIỆM VỤ:
1. Phân loại query_type:
- "popular": Khách hỏi món bán chạy, phổ biến, best-seller, được đặt nhiều, hot
- "top_rated": Khách hỏi món ngon nhất, đánh giá cao, nhiều sao, review tốt
- "recommend": Khách muốn gợi ý theo sở thích, khẩu vị, mức giá, hoặc hỏi chung về món ăn
- "general": Câu hỏi về thông tin nhà hàng (thanh toán, giao hàng, kích cỡ, đế bánh, giờ mở cửa...)

2. Trích xuất criteria (nếu có):
- "category": "pizza" | "spaghetti" | "gratin" | "salad" | "drink" | "combo" | null (nếu khách chỉ đích danh nhóm món)
- "limit": số lượng món khách muốn xem (Ví dụ: "1 món", "1 pizza", "1 cái" -> 1; "2 món" -> 2; mặc định 3 nếu không nói rõ)
- "tastes": mảng khẩu vị ("spicy", "cheesy", "seafood", "meat", "veggie", "sweet", "creamy")
- "max_budget": ngân sách tối đa dạng số nếu khách đề cập
- "avoid_ingredients": mảng nguyên liệu muốn tránh

3. Soạn "reply":
- 1-2 câu tiếng Việt tự nhiên, thân thiện và nhiệt tình.
- Dựa vào danh sách "bestsellers", "top_rated" và "dishes" trong dữ liệu nhà hàng để trả lời chính xác.
- TUYỆT ĐỐI KHÔNG nói "không có dữ liệu" hay "chưa có thông tin" khi khách hỏi món bán chạy hay món ngon. Hãy tự tin giới thiệu món phù hợp nhất từ dữ liệu được cung cấp!

CHỈ trả về JSON thuần, KHÔNG kèm văn bản bên ngoài:
{
  "reply": "Câu trả lời thân thiện 1-2 câu",
  "query_type": "popular",
  "criteria": {
    "category": "pizza",
    "limit": 1,
    "tastes": [],
    "avoid_tastes": [],
    "max_budget": null,
    "avoid_ingredients": []
  },
  "follow_up": null
}`;

// ─── Kiểu dữ liệu ───────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
}

interface ChatbotResponse {
  reply: string;
  dishes: any[];
  combos: any[];
  follow_up: string | null;
  query_type?: string;
}

// ─── Chatbot Session Management ─────────────────────────────────────────────

export async function createOrGetSession(userId: number | null, guestId: string | null): Promise<number> {
  const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
  
  const where: any = {
    is_active: true,
    started_at: { gte: thirtyMinsAgo }
  };

  if (userId) {
    where.user_id = userId;
  } else if (guestId) {
    where.guest_id = guestId;
  } else {
    // Không có userId và guestId → tạo session mới
    const newSession = await prisma.chatbotSession.create({
      data: { user_id: null, guest_id: null }
    });
    return newSession.session_id;
  }

  const activeSession = await prisma.chatbotSession.findFirst({
    where,
    orderBy: { started_at: 'desc' }
  });

  if (activeSession) {
    return activeSession.session_id;
  }

  const newSession = await prisma.chatbotSession.create({
    data: {
      user_id: userId,
      guest_id: guestId,
      started_at: new Date(),
      total_messages: 0
    }
  });

  return newSession.session_id;
}

export async function saveMessage(sessionId: number, role: 'user' | 'bot', content: string, intent?: string, dishesCount?: number): Promise<void> {
  await prisma.chatbotMessage.create({
    data: {
      session_id: sessionId,
      role,
      content,
      intent,
      dishes_count: dishesCount,
      created_at: new Date()
    }
  });

  const updateData: any = {
    total_messages: { increment: 1 }
  };
  if (intent) {
    updateData.last_intent = intent;
  }

  await prisma.chatbotSession.update({
    where: { session_id: sessionId },
    data: updateData
  });
}

export async function getSessionHistory(sessionId: number): Promise<any[]> {
  return prisma.chatbotMessage.findMany({
    where: { session_id: sessionId },
    orderBy: { created_at: 'asc' }
  });
}

export async function getUserSessions(userId: number | null, guestId: string | null, page: number, limit: number): Promise<{sessions: any[], total: number}> {
  const skip = (page - 1) * limit;
  const whereClause: any = {};
  
  if (userId) {
    whereClause.user_id = userId;
  } else if (guestId) {
    whereClause.guest_id = guestId;
  }

  const [total, sessions] = await Promise.all([
    prisma.chatbotSession.count({ where: whereClause }),
    prisma.chatbotSession.findMany({
      where: whereClause,
      include: {
        user: {
          select: { name: true, email: true }
        },
        messages: {
          take: 1,
          orderBy: { created_at: 'asc' }
        }
      },
      orderBy: { started_at: 'desc' },
      skip,
      take: limit
    })
  ]);

  return { sessions, total };
}

// ─── Hàm chính: xử lý câu hỏi ──────────────────────────────────────────────

export async function askChatbot(
  message: string,
  conversationHistory: ChatMessage[] = [],
  userId?: number | null,
  customerName?: string | null,
  sessionId?: number
): Promise<ChatbotResponse> {
  if (sessionId) {
    await saveMessage(sessionId, 'user', message);
  }

  // Lấy menu context (cho AI tham khảo tên món)
  const { data: menuContext } = await getMenuContext();

  // Khởi tạo Groq client
  const groq = getGroq();

  // Lấy thông tin lịch sử đơn hàng của khách hàng nếu đã đăng nhập
  let userContext = '';
  if (userId) {
    try {
      const recentOrders = await prisma.order.findMany({
        where: { user_id: userId, order_status: 'completed' },
        orderBy: { created_at: 'desc' },
        take: 3,
        include: {
          items: {
            include: {
              dish_price: {
                include: { dish: true }
              },
              combo: true
            }
          }
        }
      });
      const dishNames: string[] = [];
      recentOrders.forEach(o => {
        o.items.forEach(it => {
          if (it.dish_price?.dish?.dish_name) dishNames.push(it.dish_price.dish.dish_name);
          if (it.combo?.combo_name) dishNames.push(it.combo.combo_name);
        });
      });
      const uniqueItems = Array.from(new Set(dishNames));
      userContext = `\nTHÔNG TIN KHÁCH HÀNG:\n- Tên khách: ${customerName || 'Khách quen'}\n- Món từng đặt gần đây: ${uniqueItems.length > 0 ? uniqueItems.join(', ') : 'Chưa có'}\n(Ghi chú: Hãy xưng hô thân thiện với khách hàng theo tên và ưu tiên gợi ý khẩu vị quen thuộc nếu phù hợp)`;
    } catch (e) {
      logger.warn('Lỗi lấy lịch sử đơn hàng cho chatbot:', e);
    }
  }

  // Xây dựng lịch sử hội thoại (giữ tối đa 4 tin nhắn)
  const historyMessages = conversationHistory
    .slice(-4)
    .map(m => ({
      role: m.role === 'user' ? 'user' as const : 'assistant' as const,
      content: m.content
    }));

  // Tạo user prompt
  const userPrompt = `DỮ LIỆU NHÀ HÀNG:\n${menuContext}${userContext}\n\nKHÁCH HỎI: ${message}`;

  // ══════════════════════════════════════════════════════════════════════════
  // BƯỚC 1: AI trích xuất tiêu chí và soạn phản hồi
  // ══════════════════════════════════════════════════════════════════════════
  const callGroq = async (model: string) => {
    return groq.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...historyMessages,
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 400,
      response_format: { type: 'json_object' },
    });
  };

  let result: any;
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI timeout')), 9000)
    );
    result = await Promise.race([callGroq('qwen/qwen3.8-27b'), timeoutPromise]);
  } catch (err: any) {
    logger.warn('Qwen3.8 failed or rate-limited, trying fallback model...', err?.message || err);
    try {
      const timeoutPromise2 = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Fallback AI timeout')), 9000)
      );
      result = await Promise.race([callGroq('qwen/qwen3.6-27b'), timeoutPromise2]);
    } catch (err2: any) {
      logger.warn('Backup model also failed:', err2?.message || err2);
      throw err2;
    }
  }

  const responseText = result.choices[0]?.message?.content || '';

  // Parse JSON từ AI
  let parsed: any;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    logger.warn('Chatbot AI trả về non-JSON, thử salvage...');
    const replyMatch = responseText.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    const extractedReply = replyMatch ? replyMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n') : null;
    if (extractedReply) {
      parsed = { reply: extractedReply, query_type: 'general', criteria: null, follow_up: null };
    } else {
      return {
        reply: 'Xin lỗi, tôi chưa hiểu rõ yêu cầu. Bạn có thể nói rõ hơn bạn muốn tìm món gì không?',
        dishes: [], combos: [], follow_up: 'Bạn muốn ăn pizza, spaghetti, hay gratin?'
      };
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // BƯỚC 2: Xử lý theo query_type
  // ══════════════════════════════════════════════════════════════════════════
  const queryType = parsed.query_type || 'general';
  const categoryFilter = parsed.criteria?.category || null;
  const requestedLimit = parsed.criteria?.limit && Number(parsed.criteria.limit) > 0
    ? Number(parsed.criteria.limit)
    : 3;

  // ── "recommend": Gợi ý theo sở thích → Content-based Filtering ──
  if (queryType === 'recommend' && parsed.criteria) {
    const { recommendByContentBased } = await import('./contentBasedService');

    const criteria = {
      tastes: parsed.criteria.tastes || [],
      avoid_tastes: parsed.criteria.avoid_tastes || [],
      category: categoryFilter,
      max_budget: parsed.criteria.max_budget || null,
      avoid_ingredients: parsed.criteria.avoid_ingredients || [],
    };

    const recommendations = await recommendByContentBased(criteria, requestedLimit);
    logger.info(`Content-based Filtering: ${recommendations.length} món, criteria=${JSON.stringify(criteria)}`);

    let reply = parsed.reply;
    if (!reply || reply.toLowerCase().includes('không có dữ liệu') || reply.toLowerCase().includes('chưa có thông tin')) {
      reply = requestedLimit === 1 && recommendations[0]
        ? `Gợi ý phù hợp nhất với khẩu vị của bạn là ${recommendations[0].dish_name}. Mời bạn thưởng thức!`
        : `Tôi tìm được ${recommendations.length} món phù hợp với yêu cầu của bạn!`;
    }

    if (sessionId) {
      await saveMessage(sessionId, 'bot', reply, queryType, recommendations.length);
    }

    return {
      reply,
      query_type: queryType,
      dishes: recommendations.map(r => ({
        dish_id: r.dish_id, dish_name: r.dish_name, category: r.category,
        ingredient: r.ingredient, image: r.image, prices: r.prices,
        similarity_score: r.similarity_score, match_reasons: r.match_reasons
      })),
      combos: [],
      follow_up: parsed.follow_up || null
    };
  }

  // ── "popular": Món bán chạy nhất → Lấy dữ liệu đơn hàng thật từ DB ──
  if (queryType === 'popular') {
    const { getPopularDishes } = await import('./recommendationService');
    const popular = await getPopularDishes(requestedLimit, categoryFilter || undefined);

    let reply = parsed.reply;
    const isBadReply = !reply || reply.toLowerCase().includes('không có dữ liệu') || reply.toLowerCase().includes('chưa có thông tin');

    if (isBadReply) {
      if (requestedLimit === 1 && popular[0]) {
        reply = `Món ${categoryFilter ? categoryFilter : 'bán chạy nhất'} tại nhà hàng là ${popular[0].dish_name}. Mời bạn tham khảo:`;
      } else {
        reply = `Dưới đây là ${popular.length} món ${categoryFilter || ''} bán chạy nhất tại nhà hàng:`;
      }
    }

    if (sessionId) {
      await saveMessage(sessionId, 'bot', reply, queryType, popular.length);
    }

    return {
      reply,
      query_type: queryType,
      dishes: popular.map((d: any) => ({
        dish_id: d.dish_id || d.id,
        dish_name: d.dish_name || d.name,
        category: d.category || '',
        ingredient: d.ingredient || '',
        image: d.image || null,
        prices: d.prices || [],
        similarity_score: null,
        match_reasons: [`Đã bán ${d.total_ordered || 1} phần`]
      })),
      combos: [],
      follow_up: parsed.follow_up || 'Bạn muốn thêm thông tin về món nào?'
    };
  }

  // ── "top_rated": Món đánh giá cao nhất → Lấy review thật từ DB ──
  if (queryType === 'top_rated') {
    const { getTopRatedDishes } = await import('./recommendationService');
    const topRated = await getTopRatedDishes(requestedLimit, categoryFilter || undefined);

    let reply = parsed.reply;
    const isBadReply = !reply || reply.toLowerCase().includes('không có dữ liệu') || reply.toLowerCase().includes('chưa có thông tin');

    if (isBadReply) {
      if (requestedLimit === 1 && topRated[0]) {
        reply = `Món ${categoryFilter ? categoryFilter : 'được đánh giá cao nhất'} là ${topRated[0].dish_name} với ${topRated[0].avg_rating} sao:`;
      } else {
        reply = `Dưới đây là ${topRated.length} món ${categoryFilter || ''} được thực khách đánh giá cao nhất:`;
      }
    }

    if (sessionId) {
      await saveMessage(sessionId, 'bot', reply, queryType, topRated.length);
    }

    return {
      reply,
      query_type: queryType,
      dishes: topRated.map((d: any) => ({
        dish_id: d.dish_id || d.id,
        dish_name: d.dish_name || d.name,
        category: d.category || '',
        ingredient: d.ingredient || '',
        image: d.image || null,
        prices: d.prices || [],
        similarity_score: null,
        match_reasons: [`Đánh giá ${d.avg_rating?.toFixed(1) || '5'}/5 sao (${d.review_count || 0} đánh giá)`]
      })),
      combos: [],
      follow_up: parsed.follow_up || null
    };
  }

  // ── "general": Câu hỏi chung (thanh toán, giao hàng, v.v.) ──
  const generalReply = parsed.reply || 'Tôi có thể giúp gì thêm cho bạn?';
  
  if (sessionId) {
    await saveMessage(sessionId, 'bot', generalReply, queryType, 0);
  }

  return {
    reply: generalReply,
    query_type: queryType,
    dishes: [],
    combos: [],
    follow_up: parsed.follow_up || null
  };
}

// ─── Fallback khi AI không khả dụng ─────────────────────────────────────────

export async function getFallbackResponse(message: string, customerName?: string | null): Promise<ChatbotResponse> {
  const lowerMsg = message.toLowerCase();
  const removeAccents = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
  const normalizedMsg = removeAccents(lowerMsg);
  const greetingPrefix = customerName ? `Chào bạn ${customerName}! ` : '';

  // Nhận diện số lượng yêu cầu
  let limit = 3;
  const quantityMatch = lowerMsg.match(/(?:cho|gợi ý|xem)?\s*(\d+|một|hai|ba|bốn|năm)\s*(?:món|loại|cái|phần)/i);
  if (quantityMatch) {
    const word = quantityMatch[1].toLowerCase();
    if (word === '1' || word === 'một') limit = 1;
    else if (word === '2' || word === 'hai') limit = 2;
    else if (word === '3' || word === 'ba') limit = 3;
    else if (word === '4' || word === 'bốn') limit = 4;
    else if (word === '5' || word === 'năm') limit = 5;
    else {
      const num = parseInt(word, 10);
      if (!isNaN(num) && num > 0) limit = Math.min(num, 5);
    }
  }

  // Nhận diện danh mục
  let categoryName: string | null = null;
  let categoryId: number | null = null;

  if (lowerMsg.includes('pizza') || normalizedMsg.includes('pizza')) { categoryName = 'Pizza'; categoryId = 1; }
  else if (lowerMsg.includes('spaghetti') || lowerMsg.includes('mì') || lowerMsg.includes('mi y') || normalizedMsg.includes('mi')) { categoryName = 'Spaghetti'; categoryId = 3; }
  else if (lowerMsg.includes('gratin') || lowerMsg.includes('risotto') || lowerMsg.includes('cơm') || normalizedMsg.includes('com')) { categoryName = 'Gratin'; categoryId = 2; }
  else if (lowerMsg.includes('salad') || lowerMsg.includes('gà') || normalizedMsg.includes('ga') || lowerMsg.includes('khoai')) { categoryName = 'Salad'; categoryId = 4; }
  else if (lowerMsg.includes('nước') || normalizedMsg.includes('nuoc') || lowerMsg.includes('drink') || lowerMsg.includes('bia')) { categoryName = 'Drink'; categoryId = 5; }
  else if (lowerMsg.includes('combo') || normalizedMsg.includes('combo')) { categoryName = 'Combo'; categoryId = 7; }

  // Nhận diện ý định bán chạy (hỗ trợ cả có dấu và không dấu)
  const isPopular = lowerMsg.includes('bán chạy') || normalizedMsg.includes('ban chay') ||
    lowerMsg.includes('phổ biến') || normalizedMsg.includes('pho bien') ||
    lowerMsg.includes('best seller') || lowerMsg.includes('bestseller') ||
    lowerMsg.includes('nhiều người đặt') || normalizedMsg.includes('nhieu nguoi dat') ||
    lowerMsg.includes('chạy nhất') || normalizedMsg.includes('chay nhat') ||
    normalizedMsg.includes('dat nhieu') || normalizedMsg.includes('mua nhieu') ||
    normalizedMsg.includes('hot nhat');

  // Nhận diện ý định đánh giá cao (hỗ trợ cả có dấu và không dấu)
  const isTopRated = lowerMsg.includes('ngon nhất') || normalizedMsg.includes('ngon nhat') ||
    lowerMsg.includes('đánh giá') || normalizedMsg.includes('danh gia') ||
    lowerMsg.includes('sao') || lowerMsg.includes('rating') ||
    lowerMsg.includes('review cao') || normalizedMsg.includes('review');

  if (isPopular) {
    const { getPopularDishes } = await import('./recommendationService');
    const dishes = await getPopularDishes(limit, categoryName || undefined);
    const reply = limit === 1 && dishes[0]
      ? `${greetingPrefix}Món ${categoryName || ''} bán chạy nhất tại nhà hàng là ${dishes[0].dish_name}:`
      : `${greetingPrefix}Đây là ${dishes.length} món ${categoryName || ''} bán chạy nhất tại nhà hàng:`;

    return {
      reply,
      dishes: dishes.map((d: any) => ({
        dish_id: d.dish_id || d.id,
        dish_name: d.dish_name || d.name,
        category: d.category || '',
        ingredient: d.ingredient || '',
        image: d.image || null,
        prices: d.prices || [],
        similarity_score: null,
        match_reasons: [`Đã bán ${d.total_ordered || 1} phần`]
      })),
      combos: [],
      follow_up: 'Bạn muốn đặt món này không?'
    };
  }

  if (isTopRated) {
    const { getTopRatedDishes } = await import('./recommendationService');
    const dishes = await getTopRatedDishes(limit, categoryName || undefined);
    const reply = limit === 1 && dishes[0]
      ? `${greetingPrefix}Món ${categoryName || ''} được đánh giá cao nhất là ${dishes[0].dish_name} (${dishes[0].avg_rating} sao):`
      : `${greetingPrefix}Đây là ${dishes.length} món ${categoryName || ''} được đánh giá cao nhất tại nhà hàng:`;

    return {
      reply,
      dishes: dishes.map((d: any) => ({
        dish_id: d.dish_id || d.id,
        dish_name: d.dish_name || d.name,
        category: d.category || '',
        ingredient: d.ingredient || '',
        image: d.image || null,
        prices: d.prices || [],
        similarity_score: null,
        match_reasons: [`Đánh giá ${d.avg_rating?.toFixed(1) || '5'}/5 sao`]
      })),
      combos: [],
      follow_up: 'Bạn muốn xem thêm thông tin về món nào?'
    };
  }

  // Nếu không match keyword món ăn → trả thông báo text, KHÔNG hiện món
  if (!categoryId) {
    if (lowerMsg.includes('thanh to') || lowerMsg.includes('payment') || lowerMsg.includes('toan')) {
      return {
        reply: `${greetingPrefix}Nhà hàng có 2 phương thức thanh toán: Chuyển khoản qua VietQR và Thanh toán khi nhận hàng (COD).`,
        dishes: [], combos: [], follow_up: 'Bạn muốn xem menu không?'
      };
    }
    if (lowerMsg.includes('giao') || lowerMsg.includes('ship') || lowerMsg.includes('delivery')) {
      return {
        reply: `${greetingPrefix}Nhà hàng giao tận nhà. Bạn cần cung cấp tên, số điện thoại và địa chỉ khi đặt hàng.`,
        dishes: [], combos: [], follow_up: 'Bạn muốn đặt món gì?'
      };
    }
    if (lowerMsg.includes('size') || lowerMsg.includes('cỡ') || lowerMsg.includes('co ')) {
      return {
        reply: `${greetingPrefix}Pizza có 2 size: Regular (nhỏ) và Large (lớn). Đế có 4 loại: Thin, Thick, Cheese viền phô mai, Ham viền đâm bông.`,
        dishes: [], combos: [], follow_up: 'Bạn muốn xem pizza nào?'
      };
    }
    return {
      reply: `${greetingPrefix}Xin lỗi, tôi chưa hiểu rõ câu hỏi. Bạn có thể hỏi về menu, thanh toán, giao hàng hoặc gõ tên món ăn nhé!`,
      dishes: [], combos: [], follow_up: 'Bạn muốn xem pizza, spaghetti, hay gratin?'
    };
  }

  // Có keyword category → tìm món theo category
  const dishes = await prisma.dish.findMany({
    where: { dish_status: true, category_id: categoryId },
    include: {
      prices: { include: { size: true, crust: true } },
      category: true
    },
    take: limit
  });

  const reply = limit === 1 && dishes[0]
    ? `${greetingPrefix}Đây là món ${categoryName || ''} dành cho bạn:`
    : `${greetingPrefix}Đây là ${dishes.length} món ${categoryName || ''} phù hợp với yêu cầu của bạn:`;

  return {
    reply: dishes.length > 0 ? reply : 'Xin lỗi, tôi chưa tìm được món phù hợp. Bạn thử hỏi lại nhé!',
    dishes: dishes.map(d => ({
      dish_id: d.dish_id,
      dish_name: d.dish_name,
      category: d.category?.category_name || '',
      ingredient: d.ingredient || '',
      image: d.image || null,
      prices: d.prices.map((p: any) => ({
        dish_price_id: p.dish_price_id,
        size_name: p.size?.size_name || '',
        crust_name: p.crust?.crust_name || '',
        dish_price: p.dish_price
      }))
    })),
    combos: [],
    follow_up: null
  };
}
