// Middleware kiểm tra role — admin / cashier / customer
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { sendError } from '../utils/response';

/**
 * checkRole — chỉ cho phép các role được liệt kê truy cập
 * @param roles Danh sách role được phép (ví dụ: 'admin', 'cashier')
 */
export function checkRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Vui lòng đăng nhập', 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(res, 'Bạn không có quyền truy cập tính năng này', 403);
      return;
    }

    next();
  };
}
