"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Admin API routes — thống kê, quản lý đơn hàng, thực đơn, khách hàng...
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const checkRole_1 = require("../middleware/checkRole");
const prisma_1 = __importDefault(require("../lib/prisma"));
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
const emailService_1 = require("../services/emailService");
const router = (0, express_1.Router)();
// Tất cả route admin đều cần đăng nhập + role admin/cashier
router.use(auth_1.verifyToken, (0, checkRole_1.checkRole)('admin', 'cashier'));
// ─── THỐNG KÊ TỔNG QUAN ─────────────────────────────────────────────────────
/**
 * GET /api/admin/stats
 * Lấy thống kê tổng quan: tổng đơn, doanh thu, số khách, số món
 */
router.get('/stats', async (_req, res) => {
    try {
        const [totalOrders, totalRevenue, totalCustomers, totalDishes] = await Promise.all([
            prisma_1.default.order.count(),
            prisma_1.default.order.aggregate({ _sum: { total_order: true } }),
            prisma_1.default.user.count({ where: { role: 'customer' } }),
            prisma_1.default.dish.count(),
        ]);
        (0, response_1.sendSuccess)(res, {
            data: {
                totalOrders,
                totalRevenue: totalRevenue._sum.total_order || 0,
                totalCustomers,
                totalDishes,
            },
        });
    }
    catch (err) {
        logger_1.logger.error('Admin stats error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi lấy thống kê', 500);
    }
});
/**
 * GET /api/admin/revenue
 * Doanh thu theo tháng trong năm hiện tại
 */
router.get('/revenue', async (_req, res) => {
    try {
        const year = new Date().getFullYear();
        const orders = await prisma_1.default.order.findMany({
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
        (0, response_1.sendSuccess)(res, { data: monthly });
    }
    catch (err) {
        logger_1.logger.error('Admin revenue error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi lấy doanh thu', 500);
    }
});
// ─── QUẢN LÝ ĐƠN HÀNG ──────────────────────────────────────────────────────
/**
 * GET /api/admin/orders
 * Danh sách đơn hàng (pagination + filter)
 */
router.get('/orders', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status;
        const userId = req.query.userId;
        const phone = req.query.phone;
        const where = {};
        if (status)
            where.order_status = status;
        if (userId && userId !== 'null') {
            where.user_id = parseInt(userId);
        }
        else if (phone) {
            where.OR = [
                { customer_phone: phone },
                { user: { phone } }
            ];
        }
        const [orders, total] = await Promise.all([
            prisma_1.default.order.findMany({
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
            prisma_1.default.order.count({ where }),
        ]);
        (0, response_1.sendSuccess)(res, {
            data: { orders, total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    }
    catch (err) {
        logger_1.logger.error('Admin orders error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi lấy danh sách đơn hàng', 500);
    }
});
/**
 * PATCH /api/admin/orders/:id/status
 * Cập nhật trạng thái đơn hàng
 */
router.patch('/orders/:id/status', async (req, res) => {
    try {
        const orderId = parseInt(String(req.params.id));
        const { order_status, discount_amount, shipping_fee, estimated_delivery_time } = req.body;
        const updateData = { order_status };
        // Tự động cập nhật timestamp tương ứng
        if (order_status === 'confirmed')
            updateData.confirmed_at = new Date();
        if (order_status === 'preparing')
            updateData.preparing_at = new Date();
        if (order_status === 'shipped') {
            updateData.shipped_at = new Date();
            updateData.estimated_delivery_time = new Date(Date.now() + 15 * 60 * 1000); // Tự động cộng 15 phút
        }
        if (order_status === 'arrived')
            updateData.arrived_at = new Date();
        if (order_status === 'completed') {
            updateData.completed_at = new Date();
            updateData.payment_status = 'paid'; // Tự động chuyển trạng thái thanh toán thành đã thanh toán
        }
        if (order_status === 'cancelled')
            updateData.cancelled_at = new Date();
        if (discount_amount !== undefined)
            updateData.discount_amount = parseInt(String(discount_amount)) || 0;
        if (shipping_fee !== undefined)
            updateData.shipping_fee = parseInt(String(shipping_fee)) || 0;
        if (estimated_delivery_time !== undefined) {
            updateData.estimated_delivery_time = estimated_delivery_time ? new Date(estimated_delivery_time) : null;
        }
        // Nếu thay đổi discount hay shipping fee, tính lại total_order
        if (discount_amount !== undefined || shipping_fee !== undefined) {
            const currentOrder = await prisma_1.default.order.findUnique({
                where: { order_id: orderId },
                select: { total_price_dish: true, discount_amount: true, shipping_fee: true }
            });
            if (currentOrder) {
                const total_price_dish = currentOrder.total_price_dish || 0;
                const finalDiscount = discount_amount !== undefined ? (parseInt(String(discount_amount)) || 0) : (currentOrder.discount_amount || 0);
                const finalShipping = shipping_fee !== undefined ? (parseInt(String(shipping_fee)) || 0) : (currentOrder.shipping_fee || 0);
                updateData.total_order = Math.max(0, total_price_dish + finalShipping - finalDiscount);
            }
        }
        const order = await prisma_1.default.order.update({
            where: { order_id: orderId },
            data: updateData,
        });
        // Gửi email bất đồng bộ theo trạng thái mới
        if (order_status === 'confirmed') {
            (0, emailService_1.sendOrderConfirmedEmail)(orderId).catch((err) => logger_1.logger.error(`Email xác nhận đơn ${orderId} thất bại:`, err));
        }
        else if (order_status === 'shipped') {
            (0, emailService_1.sendDeliveringEmail)(orderId).catch((err) => logger_1.logger.error(`Email đang giao đơn ${orderId} thất bại:`, err));
        }
        else if (order_status === 'completed') {
            (0, emailService_1.sendDeliveredEmail)(orderId).catch((err) => logger_1.logger.error(`Email giao thành công đơn ${orderId} thất bại:`, err));
        }
        (0, response_1.sendSuccess)(res, { data: order, message: 'Cập nhật trạng thái thành công' });
    }
    catch (err) {
        logger_1.logger.error('Admin update order error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi cập nhật đơn hàng', 500);
    }
});
function cleanAddressLine(addressLine) {
    if (!addressLine)
        return '';
    try {
        if (addressLine.startsWith('{') && addressLine.endsWith('}')) {
            const parsed = JSON.parse(addressLine);
            if (parsed && typeof parsed === 'object') {
                return parsed.address || '';
            }
        }
    }
    catch (e) {
        // Return original
    }
    return addressLine;
}
/**
 * GET /api/admin/orders/:id
 * Chi tiết đơn hàng (JOIN đầy đủ 5 bảng order)
 */
router.get('/orders/:id', async (req, res) => {
    try {
        const orderId = parseInt(String(req.params.id));
        const order = await prisma_1.default.order.findUnique({
            where: { order_id: orderId },
            include: {
                user: { select: { user_id: true, username: true, email: true, phone: true } },
                user_address: true,
                items: {
                    include: {
                        dish_price: {
                            include: {
                                dish: true,
                                size: true,
                                crust: true,
                            },
                        },
                        combo: true,
                        toppings: {
                            include: {
                                topping: true,
                            },
                        },
                        combos: {
                            include: {
                                dish_price: {
                                    include: {
                                        dish: true,
                                        size: true,
                                        crust: true,
                                    },
                                },
                                toppings: {
                                    include: {
                                        topping: true,
                                    },
                                },
                                halves: {
                                    include: {
                                        dish: true,
                                        order_item_toppings: {
                                            include: {
                                                topping: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        halves: {
                            include: {
                                dish: true,
                                order_item_toppings: {
                                    include: {
                                        topping: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!order) {
            (0, response_1.sendError)(res, 'Không tìm thấy đơn hàng', 404);
            return;
        }
        const orderData = JSON.parse(JSON.stringify(order));
        if (orderData.user_address) {
            orderData.user_address.address_line = cleanAddressLine(orderData.user_address.address_line);
        }
        // Enrich combo selections with quantity from ComboGroup
        if (orderData.items) {
            for (const item of orderData.items) {
                if (item.combo_id && item.combos) {
                    for (const sel of item.combos) {
                        if (sel.group_id) {
                            const group = await prisma_1.default.comboGroup.findUnique({
                                where: { group_id: sel.group_id }
                            });
                            sel.quantity = group?.max_select || 1;
                        }
                        else {
                            sel.quantity = 1;
                        }
                        // Happy Family Combo + Pepsi override
                        const dishName = sel.dish_price?.dish?.dish_name || '';
                        const comboName = item.combo?.combo_name || '';
                        if (comboName.toLowerCase().includes('happy family') && dishName.toLowerCase() === 'pepsi') {
                            sel.quantity = 4;
                        }
                    }
                }
            }
        }
        (0, response_1.sendSuccess)(res, { data: orderData });
    }
    catch (err) {
        logger_1.logger.error('Admin order detail error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi lấy chi tiết đơn hàng', 500);
    }
});
// ─── QUẢN LÝ DANH MỤC ──────────────────────────────────────────────────────
/**
 * GET /api/admin/categories
 */
router.get('/categories', async (_req, res) => {
    try {
        const categories = await prisma_1.default.category.findMany({
            include: { _count: { select: { dishes: true, combos: true } } },
            orderBy: { category_id: 'asc' },
        });
        (0, response_1.sendSuccess)(res, { data: categories });
    }
    catch (err) {
        logger_1.logger.error('Admin categories error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi lấy danh mục', 500);
    }
});
/**
 * POST /api/admin/categories
 */
router.post('/categories', async (req, res) => {
    try {
        const { category_name } = req.body;
        const category = await prisma_1.default.category.create({ data: { category_name } });
        (0, response_1.sendSuccess)(res, { data: category, message: 'Tạo danh mục thành công' }, 201);
    }
    catch (err) {
        logger_1.logger.error('Admin create category error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi tạo danh mục', 500);
    }
});
/**
 * PUT /api/admin/categories/:id
 */
router.put('/categories/:id', async (req, res) => {
    try {
        const id = parseInt(String(req.params.id));
        const { category_name } = req.body;
        const category = await prisma_1.default.category.update({
            where: { category_id: id },
            data: { category_name },
        });
        (0, response_1.sendSuccess)(res, { data: category, message: 'Cập nhật danh mục thành công' });
    }
    catch (err) {
        logger_1.logger.error('Admin update category error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi cập nhật danh mục', 500);
    }
});
/**
 * DELETE /api/admin/categories/:id
 */
router.delete('/categories/:id', async (req, res) => {
    try {
        const id = parseInt(String(req.params.id));
        await prisma_1.default.category.delete({ where: { category_id: id } });
        (0, response_1.sendSuccess)(res, { message: 'Xóa danh mục thành công' });
    }
    catch (err) {
        logger_1.logger.error('Admin delete category error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi xóa danh mục', 500);
    }
});
// ─── QUẢN LÝ MÓN ĂN ────────────────────────────────────────────────────────
/**
 * GET /api/admin/dishes
 */
router.get('/dishes', async (_req, res) => {
    try {
        const dishes = await prisma_1.default.dish.findMany({
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
        (0, response_1.sendSuccess)(res, { data: dishes });
    }
    catch (err) {
        logger_1.logger.error('Admin dishes error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi lấy món ăn', 500);
    }
});
/**
 * POST /api/admin/dishes
 */
router.post('/dishes', async (req, res) => {
    try {
        const { dish_name, category_id, image, ingredient, dish_status } = req.body;
        const dish = await prisma_1.default.dish.create({
            data: { dish_name, category_id, image, ingredient, dish_status: dish_status ?? true },
        });
        (0, response_1.sendSuccess)(res, { data: dish, message: 'Tạo món ăn thành công' }, 201);
    }
    catch (err) {
        logger_1.logger.error('Admin create dish error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi tạo món ăn', 500);
    }
});
/**
 * PUT /api/admin/dishes/:id
 */
router.put('/dishes/:id', async (req, res) => {
    try {
        const id = parseInt(String(req.params.id));
        const { dish_name, category_id, image, ingredient, dish_status } = req.body;
        const dish = await prisma_1.default.dish.update({
            where: { dish_id: id },
            data: { dish_name, category_id, image, ingredient, dish_status },
        });
        (0, response_1.sendSuccess)(res, { data: dish, message: 'Cập nhật món ăn thành công' });
    }
    catch (err) {
        logger_1.logger.error('Admin update dish error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi cập nhật món ăn', 500);
    }
});
/**
 * DELETE /api/admin/dishes/:id
 */
router.delete('/dishes/:id', async (req, res) => {
    try {
        const id = parseInt(String(req.params.id));
        await prisma_1.default.dish.delete({ where: { dish_id: id } });
        (0, response_1.sendSuccess)(res, { message: 'Xóa món ăn thành công' });
    }
    catch (err) {
        logger_1.logger.error('Admin delete dish error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi xóa món ăn', 500);
    }
});
/**
 * PUT /api/admin/dish-prices/:id
 * Cập nhật biến thể giá (size, crust, giá)
 */
router.put('/dish-prices/:id', async (req, res) => {
    try {
        const id = String(req.params.id);
        const { size_id, crust_id, dish_price } = req.body;
        const updated = await prisma_1.default.dishPrice.update({
            where: { dish_price_id: id },
            data: {
                ...(size_id !== undefined && { size_id }),
                ...(crust_id !== undefined && { crust_id }),
                ...(dish_price !== undefined && { dish_price }),
            },
        });
        (0, response_1.sendSuccess)(res, { data: updated, message: 'Cập nhật biến thể thành công' });
    }
    catch (err) {
        logger_1.logger.error('Admin update dish-price error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi cập nhật biến thể', 500);
    }
});
/**
 * POST /api/admin/dish-prices
 * Tạo biến thể giá mới cho món ăn
 */
router.post('/dish-prices', async (req, res) => {
    try {
        const { dish_price_id, dish_id, size_id, crust_id, dish_price } = req.body;
        const created = await prisma_1.default.dishPrice.create({
            data: {
                dish_price_id,
                dish_id,
                size_id: size_id || null,
                crust_id: crust_id || null,
                dish_price: dish_price || 0,
            },
        });
        (0, response_1.sendSuccess)(res, { data: created, message: 'Tạo biến thể thành công' }, 201);
    }
    catch (err) {
        logger_1.logger.error('Admin create dish-price error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi tạo biến thể', 500);
    }
});
// ─── QUẢN LÝ SIZE / CRUST / TOPPING ─────────────────────────────────────────
// GET sizes
router.get('/sizes', async (_req, res) => {
    try {
        const sizes = await prisma_1.default.size.findMany({ orderBy: { size_id: 'asc' } });
        (0, response_1.sendSuccess)(res, { data: sizes });
    }
    catch (err) {
        (0, response_1.sendError)(res, 'Lỗi', 500);
    }
});
// POST sizes
router.post('/sizes', async (req, res) => {
    try {
        const { size_name, is_visible } = req.body;
        const size = await prisma_1.default.size.create({
            data: { size_name, is_visible: is_visible ?? true }
        });
        (0, response_1.sendSuccess)(res, { data: size, message: 'Thêm kích cỡ thành công' }, 201);
    }
    catch (err) {
        logger_1.logger.error('Admin create size error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi thêm kích cỡ', 500);
    }
});
// PUT sizes/:id
router.put('/sizes/:id', async (req, res) => {
    try {
        const id = parseInt(String(req.params.id));
        const { size_name, is_visible } = req.body;
        const size = await prisma_1.default.size.update({
            where: { size_id: id },
            data: { size_name, is_visible },
        });
        (0, response_1.sendSuccess)(res, { data: size, message: 'Cập nhật kích cỡ thành công' });
    }
    catch (err) {
        logger_1.logger.error('Admin update size error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi cập nhật kích cỡ', 500);
    }
});
// DELETE sizes/:id
router.delete('/sizes/:id', async (req, res) => {
    try {
        const id = parseInt(String(req.params.id));
        await prisma_1.default.size.delete({ where: { size_id: id } });
        (0, response_1.sendSuccess)(res, { message: 'Xóa kích cỡ thành công' });
    }
    catch (err) {
        logger_1.logger.error('Admin delete size error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi xóa kích cỡ', 500);
    }
});
// GET crusts
router.get('/crusts', async (_req, res) => {
    try {
        const crusts = await prisma_1.default.crust.findMany({ orderBy: { crust_id: 'asc' } });
        (0, response_1.sendSuccess)(res, { data: crusts });
    }
    catch (err) {
        (0, response_1.sendError)(res, 'Lỗi', 500);
    }
});
// POST crusts
router.post('/crusts', async (req, res) => {
    try {
        const { crust_name, is_visible } = req.body;
        const crust = await prisma_1.default.crust.create({
            data: { crust_name, is_visible: is_visible ?? true }
        });
        (0, response_1.sendSuccess)(res, { data: crust, message: 'Thêm đế bánh thành công' }, 201);
    }
    catch (err) {
        logger_1.logger.error('Admin create crust error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi thêm đế bánh', 500);
    }
});
// PUT crusts/:id
router.put('/crusts/:id', async (req, res) => {
    try {
        const id = parseInt(String(req.params.id));
        const { crust_name, is_visible } = req.body;
        const crust = await prisma_1.default.crust.update({
            where: { crust_id: id },
            data: { crust_name, is_visible },
        });
        (0, response_1.sendSuccess)(res, { data: crust, message: 'Cập nhật đế bánh thành công' });
    }
    catch (err) {
        logger_1.logger.error('Admin update crust error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi cập nhật đế bánh', 500);
    }
});
// DELETE crusts/:id
router.delete('/crusts/:id', async (req, res) => {
    try {
        const id = parseInt(String(req.params.id));
        await prisma_1.default.crust.delete({ where: { crust_id: id } });
        (0, response_1.sendSuccess)(res, { message: 'Xóa đế bánh thành công' });
    }
    catch (err) {
        logger_1.logger.error('Admin delete crust error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi xóa đế bánh', 500);
    }
});
// GET toppings
router.get('/toppings', async (_req, res) => {
    try {
        const toppings = await prisma_1.default.topping.findMany({
            include: { sizes: { select: { size_name: true } } },
            orderBy: { topping_id: 'asc' },
        });
        (0, response_1.sendSuccess)(res, { data: toppings });
    }
    catch (err) {
        (0, response_1.sendError)(res, 'Lỗi', 500);
    }
});
// POST toppings
router.post('/toppings', async (req, res) => {
    try {
        const { topping_name, price_topping, is_for_pizza, is_for_spaghetti, size_id } = req.body;
        const topping = await prisma_1.default.topping.create({
            data: {
                topping_name,
                price_topping: price_topping || 0,
                is_for_pizza: is_for_pizza ?? true,
                is_for_spaghetti: is_for_spaghetti ?? false,
                size_id: size_id || null,
            },
        });
        (0, response_1.sendSuccess)(res, { data: topping, message: 'Thêm topping thành công' }, 201);
    }
    catch (err) {
        logger_1.logger.error('Admin create topping error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi thêm topping', 500);
    }
});
// PUT toppings/:id
router.put('/toppings/:id', async (req, res) => {
    try {
        const id = parseInt(String(req.params.id));
        const { topping_name, price_topping, is_for_pizza, is_for_spaghetti, size_id } = req.body;
        const topping = await prisma_1.default.topping.update({
            where: { topping_id: id },
            data: {
                topping_name,
                price_topping: price_topping || 0,
                is_for_pizza,
                is_for_spaghetti,
                size_id: size_id || null,
            },
        });
        (0, response_1.sendSuccess)(res, { data: topping, message: 'Cập nhật topping thành công' });
    }
    catch (err) {
        logger_1.logger.error('Admin update topping error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi cập nhật topping', 500);
    }
});
// DELETE toppings/:id
router.delete('/toppings/:id', async (req, res) => {
    try {
        const id = parseInt(String(req.params.id));
        await prisma_1.default.topping.delete({ where: { topping_id: id } });
        (0, response_1.sendSuccess)(res, { message: 'Xóa topping thành công' });
    }
    catch (err) {
        logger_1.logger.error('Admin delete topping error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi xóa topping', 500);
    }
});
// ─── QUẢN LÝ COMBO ──────────────────────────────────────────────────────────
router.get('/combos', async (_req, res) => {
    try {
        const combos = await prisma_1.default.combo.findMany({
            include: {
                categories: { select: { category_name: true } },
                groups: {
                    orderBy: { group_id: 'asc' },
                    include: {
                        combo_items: {
                            include: { dish_price: { include: { dish: true, size: true, crust: true } } },
                        },
                    },
                },
            },
            orderBy: { combo_id: 'asc' },
        });
        (0, response_1.sendSuccess)(res, { data: combos });
    }
    catch (err) {
        logger_1.logger.error('Admin combos error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi lấy combos', 500);
    }
});
/**
 * POST /api/admin/combos
 */
router.post('/combos', async (req, res) => {
    try {
        const { combo_name, combo_price, description, is_active, category_id, image_combo, groups } = req.body;
        const combo = await prisma_1.default.$transaction(async (tx) => {
            const newCombo = await tx.combo.create({
                data: {
                    combo_name,
                    combo_price,
                    description: description || null,
                    is_active: is_active ?? true,
                    category_id: category_id || null,
                    image_combo: image_combo || null,
                },
            });
            if (groups && Array.isArray(groups)) {
                for (const g of groups) {
                    const groupId = `cg_${newCombo.combo_id}_${Math.random().toString(36).substring(2, 9)}`;
                    const newGroup = await tx.comboGroup.create({
                        data: {
                            group_id: groupId,
                            combo_id: newCombo.combo_id,
                            group_name: g.group_name,
                            min_select: g.min_select ?? 1,
                            max_select: g.max_select ?? 1,
                        },
                    });
                    if (g.items && Array.isArray(g.items)) {
                        for (const item of g.items) {
                            await tx.comboItem.create({
                                data: {
                                    group_id: newGroup.group_id,
                                    dish_price_id: item.dish_price_id,
                                    price_extra: item.price_extra || 0,
                                },
                            });
                        }
                    }
                }
            }
            return newCombo;
        });
        (0, response_1.sendSuccess)(res, { data: combo, message: 'Tạo combo thành công' }, 201);
    }
    catch (err) {
        logger_1.logger.error('Admin create combo error:', err);
        (0, response_1.sendError)(res, err.message || 'Lỗi khi tạo combo', 500);
    }
});
/**
 * PUT /api/admin/combos/:id
 */
router.put('/combos/:id', async (req, res) => {
    try {
        const id = parseInt(String(req.params.id));
        const { combo_name, combo_price, description, is_active, category_id, image_combo, groups } = req.body;
        const combo = await prisma_1.default.$transaction(async (tx) => {
            const updated = await tx.combo.update({
                where: { combo_id: id },
                data: {
                    combo_name,
                    combo_price,
                    description: description || null,
                    is_active: is_active ?? true,
                    category_id: category_id || null,
                    image_combo: image_combo || null,
                },
            });
            // Xóa groups cũ (cascade xóa items)
            await tx.comboGroup.deleteMany({ where: { combo_id: id } });
            // Tạo lại groups mới
            if (groups && Array.isArray(groups)) {
                for (const g of groups) {
                    const groupId = `cg_${id}_${Math.random().toString(36).substring(2, 9)}`;
                    const newGroup = await tx.comboGroup.create({
                        data: {
                            group_id: groupId,
                            combo_id: id,
                            group_name: g.group_name,
                            min_select: g.min_select ?? 1,
                            max_select: g.max_select ?? 1,
                        },
                    });
                    if (g.items && Array.isArray(g.items)) {
                        for (const item of g.items) {
                            await tx.comboItem.create({
                                data: {
                                    group_id: newGroup.group_id,
                                    dish_price_id: item.dish_price_id,
                                    price_extra: item.price_extra || 0,
                                },
                            });
                        }
                    }
                }
            }
            return updated;
        });
        (0, response_1.sendSuccess)(res, { data: combo, message: 'Cập nhật combo thành công' });
    }
    catch (err) {
        logger_1.logger.error('Admin update combo error:', err);
        (0, response_1.sendError)(res, err.message || 'Lỗi khi cập nhật combo', 500);
    }
});
/**
 * DELETE /api/admin/combos/:id
 */
router.delete('/combos/:id', async (req, res) => {
    try {
        const id = parseInt(String(req.params.id));
        await prisma_1.default.combo.delete({ where: { combo_id: id } });
        (0, response_1.sendSuccess)(res, { message: 'Xóa combo thành công' });
    }
    catch (err) {
        logger_1.logger.error('Admin delete combo error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi xóa combo', 500);
    }
});
// ─── QUẢN LÝ CHI NHÁNH ──────────────────────────────────────────────────────
router.get('/stores', async (_req, res) => {
    try {
        const stores = await prisma_1.default.store.findMany({ orderBy: { store_id: 'asc' } });
        (0, response_1.sendSuccess)(res, { data: stores });
    }
    catch (err) {
        (0, response_1.sendError)(res, 'Lỗi', 500);
    }
});
// POST stores
router.post('/stores', async (req, res) => {
    try {
        const { store_name, address, hotline, latitude, longitude, is_active } = req.body;
        if (!store_name || !store_name.trim()) {
            (0, response_1.sendError)(res, 'Tên chi nhánh không được để trống', 400);
            return;
        }
        // Validate coordinates if provided (must be within Vietnam bounds)
        const lat = latitude != null ? parseFloat(latitude) : null;
        const lon = longitude != null ? parseFloat(longitude) : null;
        if (lat != null && (isNaN(lat) || lat < 8 || lat > 24)) {
            (0, response_1.sendError)(res, 'Vĩ độ (latitude) không hợp lệ. Phải nằm trong khoảng 8-24 cho Việt Nam.', 400);
            return;
        }
        if (lon != null && (isNaN(lon) || lon < 102 || lon > 110)) {
            (0, response_1.sendError)(res, 'Kinh độ (longitude) không hợp lệ. Phải nằm trong khoảng 102-110 cho Việt Nam.', 400);
            return;
        }
        const store = await prisma_1.default.store.create({
            data: {
                store_name: store_name.trim(),
                address: address?.trim() || null,
                hotline: hotline?.trim() || null,
                latitude: lat,
                longitude: lon,
                is_active: is_active ?? true,
            },
        });
        // Warn if coordinates missing (needed for delivery fee calculation)
        const warning = (lat == null || lon == null) ? ' ⚠️ Thiếu tọa độ GPS - chức năng tính phí giao hàng sẽ không hoạt động cho chi nhánh này.' : '';
        (0, response_1.sendSuccess)(res, { data: store, message: 'Thêm chi nhánh thành công' + warning }, 201);
    }
    catch (err) {
        logger_1.logger.error('Admin create store error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi thêm chi nhánh', 500);
    }
});
// PUT stores/:id
router.put('/stores/:id', async (req, res) => {
    try {
        const id = parseInt(String(req.params.id));
        const { store_name, address, hotline, latitude, longitude, is_active } = req.body;
        if (!store_name || !store_name.trim()) {
            (0, response_1.sendError)(res, 'Tên chi nhánh không được để trống', 400);
            return;
        }
        // Validate coordinates if provided (must be within Vietnam bounds)
        const lat = latitude != null ? parseFloat(latitude) : null;
        const lon = longitude != null ? parseFloat(longitude) : null;
        if (lat != null && (isNaN(lat) || lat < 8 || lat > 24)) {
            (0, response_1.sendError)(res, 'Vĩ độ (latitude) không hợp lệ. Phải nằm trong khoảng 8-24 cho Việt Nam.', 400);
            return;
        }
        if (lon != null && (isNaN(lon) || lon < 102 || lon > 110)) {
            (0, response_1.sendError)(res, 'Kinh độ (longitude) không hợp lệ. Phải nằm trong khoảng 102-110 cho Việt Nam.', 400);
            return;
        }
        const store = await prisma_1.default.store.update({
            where: { store_id: id },
            data: {
                store_name: store_name.trim(),
                address: address?.trim() || null,
                hotline: hotline?.trim() || null,
                latitude: lat,
                longitude: lon,
                is_active,
            },
        });
        const warning = (lat == null || lon == null) ? ' ⚠️ Thiếu tọa độ GPS - chức năng tính phí giao hàng sẽ không hoạt động cho chi nhánh này.' : '';
        (0, response_1.sendSuccess)(res, { data: store, message: 'Cập nhật chi nhánh thành công' + warning });
    }
    catch (err) {
        logger_1.logger.error('Admin update store error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi cập nhật chi nhánh', 500);
    }
});
// DELETE stores/:id
router.delete('/stores/:id', async (req, res) => {
    try {
        const id = parseInt(String(req.params.id));
        await prisma_1.default.store.delete({ where: { store_id: id } });
        (0, response_1.sendSuccess)(res, { message: 'Xóa chi nhánh thành công' });
    }
    catch (err) {
        logger_1.logger.error('Admin delete store error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi xóa chi nhánh', 500);
    }
});
// ─── QUẢN LÝ KHÁCH HÀNG ─────────────────────────────────────────────────────
router.get('/customers', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const [registeredCustomers, guestOrders] = await Promise.all([
            prisma_1.default.user.findMany({
                where: { role: 'customer' },
                select: {
                    user_id: true, username: true, email: true, phone: true,
                    user_status: true, created_at: true, role: true,
                    _count: { select: { orders: true } },
                },
                orderBy: { created_at: 'desc' },
            }),
            prisma_1.default.order.findMany({
                where: { user_id: null },
                select: {
                    customer_name: true,
                    customer_phone: true,
                    customer_email: true,
                    created_at: true,
                },
                orderBy: { created_at: 'desc' },
            }),
        ]);
        // Aggregate guests by phone or email
        const guestsMap = new Map();
        for (const order of guestOrders) {
            const phone = order.customer_phone?.trim();
            const email = order.customer_email?.trim();
            const key = phone || email || 'unknown';
            if (key === 'unknown')
                continue;
            const existing = guestsMap.get(key);
            if (existing) {
                existing._count.orders += 1;
                if (order.created_at && new Date(order.created_at) > new Date(existing.created_at)) {
                    existing.created_at = order.created_at;
                }
            }
            else {
                guestsMap.set(key, {
                    user_id: null, // Identifies as guest
                    username: order.customer_name?.trim() || 'Khách vãng lai',
                    email: email || '',
                    phone: phone || '',
                    user_status: true,
                    created_at: order.created_at || new Date(),
                    role: 'guest',
                    _count: { orders: 1 },
                });
            }
        }
        const guests = Array.from(guestsMap.values());
        // Merge and sort by created_at desc
        const allCustomers = [...registeredCustomers, ...guests].sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
        });
        const total = allCustomers.length;
        const paginated = allCustomers.slice((page - 1) * limit, page * limit);
        (0, response_1.sendSuccess)(res, {
            data: { customers: paginated, total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    }
    catch (err) {
        logger_1.logger.error('Admin customers error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi lấy khách hàng', 500);
    }
});
// ─── QUẢN LÝ ĐÁNH GIÁ ───────────────────────────────────────────────────────
router.get('/reviews', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const [reviews, total] = await Promise.all([
            prisma_1.default.shopReview.findMany({
                include: {
                    user: { select: { username: true, email: true } },
                    order: { select: { order_id: true, total_order: true } },
                },
                orderBy: { created_at: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma_1.default.shopReview.count(),
        ]);
        (0, response_1.sendSuccess)(res, {
            data: { reviews, total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    }
    catch (err) {
        logger_1.logger.error('Admin reviews error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi lấy đánh giá', 500);
    }
});
/**
 * PATCH /api/admin/reviews/:id
 * Cập nhật trạng thái hiển thị hoặc nội dung phản hồi đánh giá
 */
router.patch('/reviews/:id', async (req, res) => {
    try {
        const id = parseInt(String(req.params.id));
        const { is_visible, shop_reply } = req.body;
        const updateData = {};
        if (is_visible !== undefined)
            updateData.is_visible = Boolean(is_visible);
        if (shop_reply !== undefined) {
            updateData.shop_reply = shop_reply;
        }
        const updated = await prisma_1.default.shopReview.update({
            where: { review_id: id },
            data: updateData,
        });
        (0, response_1.sendSuccess)(res, { data: updated, message: 'Cập nhật đánh giá thành công' });
    }
    catch (err) {
        logger_1.logger.error('Admin update review error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi cập nhật đánh giá', 500);
    }
});
/**
 * DELETE /api/admin/reviews/:id
 * Xóa hoàn toàn đánh giá khỏi hệ thống
 */
router.delete('/reviews/:id', async (req, res) => {
    try {
        const id = parseInt(String(req.params.id));
        await prisma_1.default.shopReview.delete({
            where: { review_id: id },
        });
        (0, response_1.sendSuccess)(res, { message: 'Xóa đánh giá thành công' });
    }
    catch (err) {
        logger_1.logger.error('Admin delete review error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi xóa đánh giá', 500);
    }
});
/**
 * GET /api/admin/top-dishes
 * Top món ăn bán chạy
 */
router.get('/top-dishes', async (_req, res) => {
    try {
        const topDishes = await prisma_1.default.orderItem.groupBy({
            by: ['dish_price_id'],
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 10,
        });
        // Lấy thông tin chi tiết từng dish
        const dishDetails = await Promise.all(topDishes.map(async (item) => {
            if (!item.dish_price_id)
                return null;
            const dishPrice = await prisma_1.default.dishPrice.findUnique({
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
        }));
        (0, response_1.sendSuccess)(res, { data: dishDetails.filter(Boolean) });
    }
    catch (err) {
        logger_1.logger.error('Admin top dishes error:', err);
        (0, response_1.sendError)(res, 'Lỗi', 500);
    }
});
// ─── QUẢN LÝ CHAT TRỰC TUYẾN (ADMIN LIVE CHAT) ────────────────────────────────
/**
 * GET /api/admin/chat/rooms
 * Lấy danh sách các phòng chat kèm tin nhắn cuối và số lượng tin nhắn chưa đọc
 */
router.get('/chat/rooms', async (_req, res) => {
    try {
        const rooms = await prisma_1.default.chatRoom.findMany({
            include: {
                customer: {
                    select: {
                        user_id: true,
                        username: true,
                        email: true,
                        phone: true,
                        avatar: true,
                        addresses: {
                            select: {
                                address_line: true,
                                is_default: true
                            }
                        }
                    }
                },
                messages: {
                    orderBy: { created_at: 'desc' },
                    take: 1,
                    include: {
                        images: true,
                    },
                },
            },
            orderBy: { updated_at: 'desc' },
        });
        // Tính toán số lượng tin nhắn chưa đọc (từ khách hàng gửi) cho từng phòng
        const roomsWithUnreadCount = await Promise.all(rooms.map(async (room) => {
            const unreadCount = await prisma_1.default.message.count({
                where: {
                    room_id: room.room_id,
                    sender_type: 'customer',
                    is_read: false,
                },
            });
            return {
                ...room,
                unreadCount,
            };
        }));
        (0, response_1.sendSuccess)(res, { data: roomsWithUnreadCount });
    }
    catch (err) {
        logger_1.logger.error('Admin fetch chat rooms error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi lấy danh sách phòng chat', 500);
    }
});
/**
 * GET /api/admin/chat/rooms/:roomId/messages
 * Lấy lịch sử tin nhắn chi tiết trong một phòng
 */
router.get('/chat/rooms/:roomId/messages', async (req, res) => {
    try {
        const roomId = parseInt(String(req.params.roomId));
        if (isNaN(roomId)) {
            (0, response_1.sendError)(res, 'Mã phòng chat không hợp lệ', 400);
            return;
        }
        const messages = await prisma_1.default.message.findMany({
            where: { room_id: roomId },
            include: {
                images: true,
                sender: { select: { user_id: true, username: true, avatar: true } },
            },
            orderBy: { created_at: 'asc' },
        });
        (0, response_1.sendSuccess)(res, { data: messages });
    }
    catch (err) {
        logger_1.logger.error('Admin fetch chat messages error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi lấy lịch sử tin nhắn', 500);
    }
});
/**
 * POST /api/admin/chat/rooms/:roomId/messages
 * Admin gửi tin nhắn phản hồi cho khách
 */
router.post('/chat/rooms/:roomId/messages', async (req, res) => {
    try {
        const roomId = parseInt(String(req.params.roomId));
        const { message_text, image_urls } = req.body;
        const adminUser = req.user; // Lấy thông tin admin đăng nhập từ middleware
        if (isNaN(roomId)) {
            (0, response_1.sendError)(res, 'Mã phòng không hợp lệ', 400);
            return;
        }
        if (!message_text && (!image_urls || image_urls.length === 0)) {
            (0, response_1.sendError)(res, 'Tin nhắn hoặc hình ảnh là bắt buộc', 400);
            return;
        }
        const room = await prisma_1.default.chatRoom.findUnique({
            where: { room_id: roomId }
        });
        if (!room) {
            (0, response_1.sendError)(res, 'Phòng chat không tồn tại', 404);
            return;
        }
        // Nếu phòng ở trạng thái pending hoặc closed, đổi sang active khi admin phản hồi
        const nextStatus = room.room_status !== 'active' ? 'active' : undefined;
        const message = await prisma_1.default.$transaction(async (tx) => {
            const newMsg = await tx.message.create({
                data: {
                    room_id: roomId,
                    sender_type: 'admin',
                    sender_id: adminUser?.user_id || null,
                    message_text: message_text || '',
                    is_read: true, // Tin nhắn admin tự động xem như đã đọc
                },
            });
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
            await tx.chatRoom.update({
                where: { room_id: roomId },
                data: {
                    updated_at: new Date(),
                    ...(nextStatus && { room_status: nextStatus }),
                },
            });
            return newMsg;
        });
        const fullMessage = await prisma_1.default.message.findUnique({
            where: { message_id: message.message_id },
            include: {
                images: true,
                sender: { select: { user_id: true, username: true, avatar: true } },
            },
        });
        (0, response_1.sendSuccess)(res, { data: fullMessage, message: 'Gửi tin nhắn phản hồi thành công' }, 201);
    }
    catch (err) {
        logger_1.logger.error('Admin send message error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi gửi phản hồi', 500);
    }
});
/**
 * PATCH /api/admin/chat/rooms/:roomId/status
 * Cập nhật trạng thái phòng chat (pending, active, closed)
 */
router.patch('/chat/rooms/:roomId/status', async (req, res) => {
    try {
        const roomId = parseInt(String(req.params.roomId));
        const { room_status } = req.body;
        if (isNaN(roomId)) {
            (0, response_1.sendError)(res, 'Mã phòng không hợp lệ', 400);
            return;
        }
        if (!['pending', 'active', 'closed'].includes(room_status)) {
            (0, response_1.sendError)(res, 'Trạng thái phòng không hợp lệ', 400);
            return;
        }
        const updatedRoom = await prisma_1.default.chatRoom.update({
            where: { room_id: roomId },
            data: {
                room_status,
                updated_at: new Date(),
            },
        });
        (0, response_1.sendSuccess)(res, { data: updatedRoom, message: 'Cập nhật trạng thái phòng thành công' });
    }
    catch (err) {
        logger_1.logger.error('Admin update room status error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi cập nhật trạng thái phòng', 500);
    }
});
/**
 * PATCH /api/admin/chat/rooms/:roomId/read
 * Đánh dấu toàn bộ tin nhắn từ khách hàng trong phòng là đã đọc
 */
router.patch('/chat/rooms/:roomId/read', async (req, res) => {
    try {
        const roomId = parseInt(String(req.params.roomId));
        if (isNaN(roomId)) {
            (0, response_1.sendError)(res, 'Mã phòng không hợp lệ', 400);
            return;
        }
        await prisma_1.default.message.updateMany({
            where: {
                room_id: roomId,
                sender_type: 'customer',
                is_read: false,
            },
            data: {
                is_read: true,
            },
        });
        (0, response_1.sendSuccess)(res, { message: 'Đánh dấu đã đọc thành công' });
    }
    catch (err) {
        logger_1.logger.error('Admin mark read error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi đánh dấu đã đọc', 500);
    }
});
/**
 * DELETE /api/admin/chat/rooms/:roomId
 * Xóa cuộc hội thoại (tự động cascade xóa tin nhắn và ảnh tin nhắn nhờ DB onDelete Cascade)
 */
router.delete('/chat/rooms/:roomId', async (req, res) => {
    const roomId = parseInt(String(req.params.roomId));
    if (isNaN(roomId)) {
        (0, response_1.sendError)(res, 'Mã phòng không hợp lệ', 400);
        return;
    }
    try {
        await prisma_1.default.chatRoom.delete({
            where: { room_id: roomId }
        });
        (0, response_1.sendSuccess)(res, { message: 'Xóa cuộc hội thoại thành công' });
    }
    catch (err) {
        logger_1.logger.error('Admin delete chat room error:', err);
        (0, response_1.sendError)(res, 'Lỗi khi xóa cuộc hội thoại', 500);
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map