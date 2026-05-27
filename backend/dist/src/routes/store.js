"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const response_1 = require("../utils/response");
const router = (0, express_1.Router)();
// Lấy danh sách cửa hàng (chi nhánh)
router.get('/', async (req, res) => {
    try {
        const stores = await prisma_1.default.store.findMany({ where: { is_active: true } });
        (0, response_1.sendSuccess)(res, { data: stores });
    }
    catch (error) {
        (0, response_1.sendError)(res, 'Lỗi lấy thông tin cửa hàng', 500);
    }
});
exports.default = router;
//# sourceMappingURL=store.js.map