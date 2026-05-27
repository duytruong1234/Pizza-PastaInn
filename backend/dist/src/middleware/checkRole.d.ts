import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
/**
 * checkRole — chỉ cho phép các role được liệt kê truy cập
 * @param roles Danh sách role được phép (ví dụ: 'admin', 'cashier')
 */
export declare function checkRole(...roles: string[]): (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=checkRole.d.ts.map