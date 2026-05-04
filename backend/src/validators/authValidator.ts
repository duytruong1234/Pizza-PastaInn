// Zod schemas cho auth validation
import { z } from 'zod';

export const registerSchema = z.object({
  username: z
    .string({ message: 'Tên không được để trống' })
    .min(2, 'Tên phải có ít nhất 2 ký tự')
    .max(100, 'Tên không quá 100 ký tự'),
  email: z
    .string({ message: 'Email không được để trống' })
    .email('Email không hợp lệ')
    .max(100, 'Email không quá 100 ký tự'),
  phone: z
    .string()
    .regex(/^[0-9]{10,11}$/, 'Số điện thoại phải có 10-11 chữ số')
    .optional(),
  password: z
    .string({ message: 'Mật khẩu không được để trống' })
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .max(100, 'Mật khẩu không quá 100 ký tự'),
});

export const loginSchema = z.object({
  email: z
    .string({ message: 'Email không được để trống' })
    .email('Email không hợp lệ'),
  password: z
    .string({ message: 'Mật khẩu không được để trống' })
    .min(1, 'Mật khẩu không được để trống'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
