import { Router } from 'express';
import prisma from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

// Lấy danh sách danh mục
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { category_id: 'asc' }
    });
    // Sort Pizza to top
    categories.sort((a: any, b: any) => {
      const aIsPizza = a.category_name.toLowerCase().includes('pizza') ? 0 : 1;
      const bIsPizza = b.category_name.toLowerCase().includes('pizza') ? 0 : 1;
      if (aIsPizza !== bIsPizza) return aIsPizza - bIsPizza;
      return a.category_id - b.category_id;
    });
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

    let where: any = {};

    if (size_id) {
      where.OR = [
        { size_id: Number(size_id) },
        { size_id: null }
      ];
    }

    if (type === 'spaghetti') {
      where.is_for_spaghetti = true;
    } else if (type === 'pizza') {
      where.is_for_pizza = true;
    }

    const toppings = await prisma.topping.findMany({
      where,
      include: {
        sizes: true
      }
    });

    sendSuccess(res, { data: toppings });
  } catch (error: any) {
    console.error('Topping error:', error?.message || error);
    sendError(res, 'Lỗi lấy topping', 500);
  }
});

// Lấy danh sách món ăn
router.get('/dishes', async (req, res) => {
  try {
    const { category_id, all } = req.query;
    const where: any = { ...(category_id && { category_id: Number(category_id) }) };
    if (all !== 'true') {
      where.dish_status = true;
    }
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

// Lấy danh sách giá theo dish_id (dùng cho Half-Half mapping)
router.get('/dishes/:id/prices', async (req, res) => {
  try {
    const { id } = req.params;
    const prices = await prisma.dishPrice.findMany({
      where: { dish_id: Number(id) }
    });
    sendSuccess(res, { data: prices });
  } catch (error) {
    sendError(res, 'Lỗi lấy giá món', 500);
  }
});

// Lấy danh sách combo
router.get('/combos', async (req, res) => {
  try {
    const combos = await prisma.combo.findMany({
      where: { is_active: true },
      include: { groups: { select: { group_name: true }, orderBy: { group_id: 'asc' } } }
    });
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
          orderBy: { group_id: 'asc' },
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
