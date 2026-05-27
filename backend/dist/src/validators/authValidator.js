"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerSchema = void 0;
// Zod schemas cho auth validation
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    username: zod_1.z
        .string({ message: 'Tên không được để trống' })
        .min(2, 'Tên phải có ít nhất 2 ký tự')
        .max(100, 'Tên không quá 100 ký tự'),
    email: zod_1.z
        .string({ message: 'Email không được để trống' })
        .email('Email không hợp lệ')
        .max(100, 'Email không quá 100 ký tự'),
    phone: zod_1.z
        .string()
        .regex(/^[0-9]{10,11}$/, 'Số điện thoại phải có 10-11 chữ số')
        .optional(),
    password: zod_1.z
        .string({ message: 'Mật khẩu không được để trống' })
        .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
        .max(100, 'Mật khẩu không quá 100 ký tự'),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z
        .string({ message: 'Email không được để trống' })
        .email('Email không hợp lệ'),
    password: zod_1.z
        .string({ message: 'Mật khẩu không được để trống' })
        .min(1, 'Mật khẩu không được để trống'),
});
//# sourceMappingURL=authValidator.js.map