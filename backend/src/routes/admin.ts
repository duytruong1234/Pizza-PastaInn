// Admin API routes — thống kê, quản lý đơn hàng, thực đơn, khách hàng...
import { Router } from 'express';
import { verifyToken, AuthRequest } from '../middleware/auth';
import { checkRole } from '../middleware/checkRole';
import prisma from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';
import { Response } from 'express';

const router = Router();

// Tất cả route admin đều cần đăng nhập + role admin/cashier
router.use(verifyToken, checkRole('admin', 'cashier'));

// ─── THỐNG KÊ TỔNG QUAN ─────────────────────────────────────────────────────

/**
 * GET /api/admin/stats
 * Lấy thống kê tổng quan: tổng đơn, doanh thu, số khách, số món
 */
router.get('/stats', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalOrders, totalRevenue, totalCustomers, totalDishes] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { total_order: true } }),
      prisma.user.count({ where: { role: 'customer' } }),
      prisma.dish.count(),
    ]);

    sendSuccess(res, {
      data: {
        totalOrders,
        totalRevenue: totalRevenue._sum.total_order || 0,
        totalCustomers,
        totalDishes,
      },
    });
  } catch (err) {
    logger.error('Admin stats error:', err);
    sendError(res, 'Lỗi khi lấy thống kê', 500);
  }
});

/**
 * GET /api/admin/revenue
 * Doanh thu theo tháng trong năm hiện tại
 */
router.get('/revenue', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const year = new Date().getFullYear();
    const orders = await prisma.order.findMany({
      where: {
        created_at: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
        order_status: { not: 'cancelled' },
      },
      select: {
        total_order: true,
        created_at: true,
      },
    });

    // Tổng hợp theo tháng
    const monthly = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      revenue: 0,
      orders: 0,
    }));

    orders.forEach((order) => {
      if (order.created_at) {
        const month = order.created_at.getMonth();
        monthly[month].revenue += order.total_order || 0;
        monthly[month].orders += 1;
      }
    });

    sendSuccess(res, { data: monthly });
  } catch (err) {
    logger.error('Admin revenue error:', err);
    sendError(res, 'Lỗi khi lấy doanh thu', 500);
  }
});

// ─── QUẢN LÝ ĐƠN HÀNG ──────────────────────────────────────────────────────

/**
 * GET /api/admin/orders
 * Danh sách đơn hàng (pagination + filter)
 */
router.get('/orders', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;

    const where = status ? { order_status: status } : {};

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { user_id: true, username: true, email: true, phone: true } },
          items: {
            include: {
              order: false,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    sendSuccess(res, {
      data: { orders, total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    logger.error('Admin orders error:', err);
    sendError(res, 'Lỗi khi lấy danh sách đơn hàng', 500);
  }
});

/**
 * PATCH /api/admin/orders/:id/status
 * Cập nhật trạng thái đơn hàng
 */
router.patch('/orders/:id/status', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orderId = parseInt(String(req.params.id));
    const { order_status } = req.body;

    const updateData: Record<string, unknown> = { order_status };

    // Tự động cập nhật timestamp tương ứng
    if (order_status === 'shipped') updateData.shipped_at = new Date();
    if (order_status === 'arrived') updateData.arrived_at = new Date();
    if (order_status === 'completed') updateData.completed_at = new Date();

    const order = await prisma.order.update({
      where: { order_id: orderId },
      data: updateData,
    });

    sendSuccess(res, { data: order, message: 'Cập nhật trạng thái thành công' });
  } catch (err) {
    logger.error('Admin update order error:', err);
    sendError(res, 'Lỗi khi cập nhật đơn hàng', 500);
  }
});

// ─── QUẢN LÝ DANH MỤC ──────────────────────────────────────────────────────

/**
 * GET /api/admin/categories
 */
router.get('/categories', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { dishes: true, combos: true } } },
      orderBy: { category_id: 'asc' },
    });
    sendSuccess(res, { data: categories });
  } catch (err) {
    logger.error('Admin categories error:', err);
    sendError(res, 'Lỗi khi lấy danh mục', 500);
  }
});

/**
 * POST /api/admin/categories
 */
router.post('/categories', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category_name } = req.body;
    const category = await prisma.category.create({ data: { category_name } });
    sendSuccess(res, { data: category, message: 'Tạo danh mục thành công' }, 201);
  } catch (err) {
    logger.error('Admin create category error:', err);
    sendError(res, 'Lỗi khi tạo danh mục', 500);
  }
});

/**
 * PUT /api/admin/categories/:id
 */
router.put('/categories/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(String(req.params.id));
    const { category_name } = req.body;
    const category = await prisma.category.update({
      where: { category_id: id },
      data: { category_name },
    });
    sendSuccess(res, { data: category, message: 'Cập nhật danh mục thành công' });
  } catch (err) {
    logger.error('Admin update category error:', err);
    sendError(res, 'Lỗi khi cập nhật danh mục', 500);
  }
});

/**
 * DELETE /api/admin/categories/:id
 */
router.delete('/categories/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(String(req.params.id));
    await prisma.category.delete({ where: { category_id: id } });
    sendSuccess(res, { message: 'Xóa danh mục thành công' });
  } catch (err) {
    logger.error('Admin delete category error:', err);
    sendError(res, 'Lỗi khi xóa danh mục', 500);
  }
});

// ─── QUẢN LÝ MÓN ĂN ────────────────────────────────────────────────────────

/**
 * GET /api/admin/dishes
 */
router.get('/dishes', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const dishes = await prisma.dish.findMany({
      include: {
        category: { select: { category_name: true } },
        prices: {
          include: {
            size: { select: { size_name: true } },
            crust: { select: { crust_name: true } },
          },
        },
      },
      orderBy: { dish_id: 'asc' },
    });
    sendSuccess(res, { data: dishes });
  } catch (err) {
    logger.error('Admin dishes error:', err);
    sendError(res, 'Lỗi khi lấy món ăn', 500);
  }
});

/**
 * POST /api/admin/dishes
 */
router.post('/dishes', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { dish_name, category_id, image, ingredient, dish_status } = req.body;
    const dish = await prisma.dish.create({
      data: { dish_name, category_id, image, ingredient, dish_status: dish_status ?? true },
    });
    sendSuccess(res, { data: dish, message: 'Tạo món ăn thành công' }, 201);
  } catch (err) {
    logger.error('Admin create dish error:', err);
    sendError(res, 'Lỗi khi tạo món ăn', 500);
  }
});

/**
 * PUT /api/admin/dishes/:id
 */
router.put('/dishes/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(String(req.params.id));
    const { dish_name, category_id, image, ingredient, dish_status } = req.body;
    const dish = await prisma.dish.update({
      where: { dish_id: id },
      data: { dish_name, category_id, image, ingredient, dish_status },
    });
    sendSuccess(res, { data: dish, message: 'Cập nhật món ăn thành công' });
  } catch (err) {
    logger.error('Admin update dish error:', err);
    sendError(res, 'Lỗi khi cập nhật món ăn', 500);
  }
});

/**
 * DELETE /api/admin/dishes/:id
 */
router.delete('/dishes/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(String(req.params.id));
    await prisma.dish.delete({ where: { dish_id: id } });
    sendSuccess(res, { message: 'Xóa món ăn thành công' });
  } catch (err) {
    logger.error('Admin delete dish error:', err);
    sendError(res, 'Lỗi khi xóa món ăn', 500);
  }
});

// ─── QUẢN LÝ SIZE / CRUST / TOPPING ─────────────────────────────────────────

// GET sizes
router.get('/sizes', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sizes = await prisma.size.findMany({ orderBy: { size_id: 'asc' } });
    sendSuccess(res, { data: sizes });
  } catch (err) {
    sendError(res, 'Lỗi', 500);
  }
});

// GET crusts
router.get('/crusts', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const crusts = await prisma.crust.findMany({ orderBy: { crust_id: 'asc' } });
    sendSuccess(res, { data: crusts });
  } catch (err) {
    sendError(res, 'Lỗi', 500);
  }
});

// GET toppings
router.get('/toppings', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const toppings = await prisma.topping.findMany({
      include: { sizes: { select: { size_name: true } } },
      orderBy: { topping_id: 'asc' },
    });
    sendSuccess(res, { data: toppings });
  } catch (err) {
    sendError(res, 'Lỗi', 500);
  }
});

// ─── QUẢN LÝ COMBO ──────────────────────────────────────────────────────────

router.get('/combos', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const combos = await prisma.combo.findMany({
      include: {
        categories: { select: { category_name: true } },
        groups: {
          include: {
            combo_items: {
              include: { dish_price: { include: { dish: true, size: true, crust: true } } },
            },
          },
        },
      },
      orderBy: { combo_id: 'asc' },
    });
    sendSuccess(res, { data: combos });
  } catch (err) {
    logger.error('Admin combos error:', err);
    sendError(res, 'Lỗi khi lấy combos', 500);
  }
});

// ─── QUẢN LÝ CHI NHÁNH ──────────────────────────────────────────────────────

router.get('/stores', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stores = await prisma.store.findMany({ orderBy: { store_id: 'asc' } });
    sendSuccess(res, { data: stores });
  } catch (err) {
    sendError(res, 'Lỗi', 500);
  }
});

// ─── QUẢN LÝ KHÁCH HÀNG ─────────────────────────────────────────────────────

router.get('/customers', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where: { role: 'customer' },
        select: {
          user_id: true, username: true, email: true, phone: true,
          user_status: true, created_at: true, role: true,
          _count: { select: { orders: true } },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where: { role: 'customer' } }),
    ]);

    sendSuccess(res, {
      data: { customers, total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    logger.error('Admin customers error:', err);
    sendError(res, 'Lỗi khi lấy khách hàng', 500);
  }
});

// ─── QUẢN LÝ ĐÁNH GIÁ ───────────────────────────────────────────────────────

router.get('/reviews', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const [reviews, total] = await Promise.all([
      prisma.shopReview.findMany({
        include: {
          user: { select: { username: true, email: true } },
          order: { select: { order_id: true, total_order: true } },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.shopReview.count(),
    ]);

    sendSuccess(res, {
      data: { reviews, total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    logger.error('Admin reviews error:', err);
    sendError(res, 'Lỗi khi lấy đánh giá', 500);
  }
});

/**
 * GET /api/admin/top-dishes
 * Top món ăn bán chạy
 */
router.get('/top-dishes', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const topDishes = await prisma.orderItem.groupBy({
      by: ['dish_price_id'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    });

    // Lấy thông tin chi tiết từng dish
    const dishDetails = await Promise.all(
      topDishes.map(async (item) => {
        if (!item.dish_price_id) return null;
        const dishPrice = await prisma.dishPrice.findUnique({
          where: { dish_price_id: item.dish_price_id },
          include: {
            dish: { select: { dish_name: true, image: true } },
            size: { select: { size_name: true } },
          },
        });
        return {
          dish_name: dishPrice?.dish?.dish_name || 'N/A',
          size: dishPrice?.size?.size_name || '',
          image: dishPrice?.dish?.image,
          total_sold: item._sum.quantity || 0,
        };
      })
    );

    sendSuccess(res, { data: dishDetails.filter(Boolean) });
  } catch (err) {
    logger.error('Admin top dishes error:', err);
    sendError(res, 'Lỗi', 500);
  }
});

export default router;
