import { Request, Response } from 'express';
export declare class ReviewController {
    /**
     * Tạo đánh giá mới (POST /api/reviews)
     */
    static createReview(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Lấy danh sách đánh giá công khai (GET /api/reviews)
     */
    static getPublicReviews(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Cập nhật đánh giá (PATCH /api/reviews/:id)
     */
    static updateReview(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Xóa đánh giá (DELETE /api/reviews/:id)
     */
    static deleteReview(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=reviewController.d.ts.map