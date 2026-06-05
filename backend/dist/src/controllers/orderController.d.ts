import { Request, Response } from 'express';
export declare class OrderController {
    /**
     * Tạo đơn hàng mới từ giỏ hàng.
     * POST /api/orders
     */
    static createOrder(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Lấy chi tiết đơn hàng.
     * GET /api/orders/:id
     */
    static getOrder(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Lấy danh sách đơn hàng theo user.
     * GET /api/orders/user/:user_id
     */
    static getOrdersByUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Lấy danh sách đơn hàng theo số điện thoại.
     * GET /api/orders/phone/:phone
     */
    static getOrdersByPhone(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Hủy đơn hàng và hoàn trả lại số lượng tồn kho.
     * POST /api/orders/:id/cancel
     */
    static cancelOrder(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=orderController.d.ts.map