"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRole = checkRole;
const response_1 = require("../utils/response");
/**
 * checkRole — chỉ cho phép các role được liệt kê truy cập
 * @param roles Danh sách role được phép (ví dụ: 'admin', 'cashier')
 */
function checkRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Vui lòng đăng nhập', 401);
            return;
        }
        if (!roles.includes(req.user.role)) {
            (0, response_1.sendError)(res, 'Bạn không có quyền truy cập tính năng này', 403);
            return;
        }
        next();
    };
}
//# sourceMappingURL=checkRole.js.map