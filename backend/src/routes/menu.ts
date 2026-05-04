import { Router } from 'express';
import prisma from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

// Lấy danh sách danh mục
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    sendSuccess(res, { data: categories });
  } catch (error) {
    sendError(res, 'Lỗi lấy danh mục', 500);
  }
});

// Lấy danh sách kích cỡ
router.get('/sizes', async (req, res) => {
  try {
    const sizes = await prisma.size.findMany({ where: { is_visible: true } });
    sendSuccess(res, { data: sizes });
  } catch (error) {
    sendError(res, 'Lỗi lấy kích cỡ', 500);
  }
});

// Lấy danh sách đế bánh
router.get('/crusts', async (req, res) => {
  try {
    const crusts = await prisma.crust.findMany({ where: { is_visible: true } });
    sendSuccess(res, { data: crusts });
  } catch (error) {
    sendError(res, 'Lỗi lấy đế bánh', 500);
  }
});

// Lấy danh sách topping theo size_id và type (pizza/spaghetti)
router.get('/toppings', async (req, res) => {
  try {
    const { size_id, type } = req.query;
    let conditions: string[] = [];
    let params: any[] = [];
    let paramIndex = 1;

    if (size_id) {
      conditions.push(`(size_id = $${paramIndex} OR size_id IS NULL)`);
      params.push(Number(size_id));
      paramIndex++;
    }

    if (type === 'spaghetti') {
      conditions.push(`is_for_spaghetti = true`);
    } else if (type === 'pizza') {
      conditions.push(`is_for_pizza = true`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const toppings = await prisma.$queryRawUnsafe(`SELECT * FROM toppings ${whereClause}`, ...params);
    sendSuccess(res, { data: toppings });
  } catch (error: any) {
    console.error('Topping error:', error?.message || error);
    sendError(res, 'Lỗi lấy topping', 500);
  }
});

// Lấy danh sách món ăn
router.get('/dishes', async (req, res) => {
  try {
    const { category_id } = req.query;
    const where = { dish_status: true, ...(category_id && { category_id: Number(category_id) }) };
    const dishes = await prisma.dish.findMany({
      where,
      include: {
        prices: true,
      }
    });
    sendSuccess(res, { data: dishes });
  } catch (error) {
    sendError(res, 'Lỗi lấy món ăn', 500);
  }
});

// Lấy danh sách combo
router.get('/combos', async (req, res) => {
  try {
    const combos = await prisma.combo.findMany({ where: { is_active: true } });
    sendSuccess(res, { data: combos });
  } catch (error) {
    sendError(res, 'Lỗi lấy combo', 500);
  }
});

// Lấy chi tiết combo
router.get('/combos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const combo = await prisma.combo.findUnique({
      where: { combo_id: Number(id) },
      include: {
        groups: {
          include: {
            combo_items: {
              include: {
                dish_price: {
                  include: { dish: true, size: true, crust: true }
                }
              }
            }
          }
        }
      }
    });
    if (!combo) return sendError(res, 'Không tìm thấy combo', 404);
    sendSuccess(res, { data: combo });
  } catch (error) {
    sendError(res, 'Lỗi lấy chi tiết combo', 500);
  }
});

export default router;
