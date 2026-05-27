"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartController = void 0;
const response_1 = require("../utils/response");
const cartService_1 = require("../services/cartService");
class CartController {
    /**
     * Thêm sản phẩm vào giỏ hàng (hỗ trợ 3 loại: regular, half_half, combo).
     * POST /api/cart/items
     */
    static async addItem(req, res) {
        try {
            const { type } = req.body;
            if (!type || !['regular', 'half_half', 'combo'].includes(type)) {
                return (0, response_1.sendError)(res, 'Loại sản phẩm không hợp lệ. Hỗ trợ: regular, half_half, combo', 400);
            }
            const result = await cartService_1.CartService.addItemToCart(req.body);
            return (0, response_1.sendSuccess)(res, {
                data: result,
                message: 'Đã thêm vào giỏ hàng thành công'
            });
        }
        catch (error) {
            console.error('Cart add error:', error);
            return (0, response_1.sendError)(res, 'Lỗi thêm vào giỏ hàng', 500);
        }
    }
    /**
     * Lấy chi tiết giỏ hàng (JOIN đầy đủ 5 bảng).
     * GET /api/cart/:id
     */
    static async getCart(req, res) {
        try {
            const cart_id = parseInt(req.params.id);
            if (!cart_id || isNaN(cart_id)) {
                return (0, response_1.sendError)(res, 'cart_id không hợp lệ', 400);
            }
            const cart = await cartService_1.CartService.getCartById(cart_id);
            if (!cart) {
                return (0, response_1.sendError)(res, 'Không tìm thấy giỏ hàng', 404);
            }
            return (0, response_1.sendSuccess)(res, {
                data: cart,
                message: 'Lấy giỏ hàng thành công'
            });
        }
        catch (error) {
            console.error('Cart get error:', error);
            return (0, response_1.sendError)(res, 'Lỗi lấy giỏ hàng', 500);
        }
    }
    /**
     * Lấy giỏ hàng theo user_id (đồng bộ khi mở trang).
     * GET /api/cart/user/:user_id
     */
    static async getCartByUser(req, res) {
        try {
            const user_id = parseInt(req.params.user_id);
            if (!user_id || isNaN(user_id)) {
                return (0, response_1.sendError)(res, 'user_id không hợp lệ', 400);
            }
            const cart = await cartService_1.CartService.getCartByUserId(user_id);
            if (!cart) {
                return (0, response_1.sendSuccess)(res, { data: null, message: 'Chưa có giỏ hàng' });
            }
            // Cập nhật lại tổng tiền cho chính xác
            await cartService_1.CartService.recalculateCartTotal(cart.cart_id);
            return (0, response_1.sendSuccess)(res, {
                data: cart,
                message: 'Lấy giỏ hàng thành công'
            });
        }
        catch (error) {
            console.error('Cart get by user error:', error);
            return (0, response_1.sendError)(res, 'Lỗi lấy giỏ hàng', 500);
        }
    }
    /**
     * Xóa 1 mục khỏi giỏ hàng (cascade xóa topping, combo, half).
     * DELETE /api/cart/items/:cart_item_id
     */
    static async removeItem(req, res) {
        try {
            const cart_item_id = parseInt(req.params.cart_item_id);
            if (!cart_item_id || isNaN(cart_item_id)) {
                return (0, response_1.sendError)(res, 'cart_item_id không hợp lệ', 400);
            }
            // Lấy cart_id để recalculate total
            const cartItem = await (await Promise.resolve().then(() => __importStar(require('../lib/prisma')))).default.cartItem.findUnique({
                where: { cart_item_id },
                select: { cart_id: true }
            });
            if (!cartItem) {
                return (0, response_1.sendError)(res, 'Không tìm thấy mục trong giỏ hàng', 404);
            }
            await cartService_1.CartService.removeItemFromCart(cart_item_id);
            // Cập nhật lại tổng tiền
            if (cartItem.cart_id) {
                await cartService_1.CartService.recalculateCartTotal(cartItem.cart_id);
            }
            return (0, response_1.sendSuccess)(res, { message: 'Đã xóa khỏi giỏ hàng' });
        }
        catch (error) {
            console.error('Cart delete error:', error);
            return (0, response_1.sendError)(res, 'Lỗi xóa khỏi giỏ hàng', 500);
        }
    }
    /**
     * Cập nhật số lượng 1 mục trong giỏ hàng.
     * PUT /api/cart/items/:cart_item_id
     */
    static async updateQuantity(req, res) {
        try {
            const cart_item_id = parseInt(req.params.cart_item_id);
            const { quantity } = req.body;
            if (!cart_item_id || isNaN(cart_item_id)) {
                return (0, response_1.sendError)(res, 'cart_item_id không hợp lệ', 400);
            }
            if (typeof quantity !== 'number' || quantity < 0) {
                return (0, response_1.sendError)(res, 'Số lượng không hợp lệ', 400);
            }
            // Lấy cart_id để recalculate total
            const cartItem = await (await Promise.resolve().then(() => __importStar(require('../lib/prisma')))).default.cartItem.findUnique({
                where: { cart_item_id },
                select: { cart_id: true }
            });
            if (!cartItem) {
                return (0, response_1.sendError)(res, 'Không tìm thấy mục trong giỏ hàng', 404);
            }
            await cartService_1.CartService.updateItemQuantity(cart_item_id, quantity);
            // Cập nhật lại tổng tiền
            if (cartItem.cart_id) {
                await cartService_1.CartService.recalculateCartTotal(cartItem.cart_id);
            }
            return (0, response_1.sendSuccess)(res, { message: 'Đã cập nhật số lượng' });
        }
        catch (error) {
            console.error('Cart update error:', error);
            return (0, response_1.sendError)(res, 'Lỗi cập nhật giỏ hàng', 500);
        }
    }
    /**
     * Xóa toàn bộ giỏ hàng.
     * DELETE /api/cart/:id
     */
    static async clearCart(req, res) {
        try {
            const cart_id = parseInt(req.params.id);
            if (!cart_id || isNaN(cart_id)) {
                return (0, response_1.sendError)(res, 'cart_id không hợp lệ', 400);
            }
            await cartService_1.CartService.clearCart(cart_id);
            return (0, response_1.sendSuccess)(res, { message: 'Đã xóa toàn bộ giỏ hàng' });
        }
        catch (error) {
            console.error('Cart clear error:', error);
            return (0, response_1.sendError)(res, 'Lỗi xóa giỏ hàng', 500);
        }
    }
}
exports.CartController = CartController;
//# sourceMappingURL=cartController.js.map