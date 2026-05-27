import { Request, Response } from 'express';
export declare class CartController {
    /**
     * Thêm sản phẩm vào giỏ hàng (hỗ trợ 3 loại: regular, half_half, combo).
     * POST /api/cart/items
     */
    static addItem(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Lấy chi tiết giỏ hàng (JOIN đầy đủ 5 bảng).
     * GET /api/cart/:id
     */
    static getCart(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Lấy giỏ hàng theo user_id (đồng bộ khi mở trang).
     * GET /api/cart/user/:user_id
     */
    static getCartByUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Xóa 1 mục khỏi giỏ hàng (cascade xóa topping, combo, half).
     * DELETE /api/cart/items/:cart_item_id
     */
    static removeItem(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Cập nhật số lượng 1 mục trong giỏ hàng.
     * PUT /api/cart/items/:cart_item_id
     */
    static updateQuantity(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Xóa toàn bộ giỏ hàng.
     * DELETE /api/cart/:id
     */
    static clearCart(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=cartController.d.ts.map