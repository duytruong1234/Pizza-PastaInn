// Response helpers — chuẩn hoá format trả về cho tất cả API
import { Response } from 'express';

interface SuccessPayload {
  data?: unknown;
  message?: string;
  meta?: Record<string, unknown>;
}

/**
 * Trả về response thành công
 */
export function sendSuccess(res: Response, payload: SuccessPayload = {}, statusCode = 200) {
  const { data = null, message = 'Success', meta } = payload;
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta && { meta }),
  });
}

/**
 * Trả về response lỗi
 */
export function sendError(res: Response, message: string, statusCode = 400, errors?: unknown) {
  const payload: any = {
    success: false,
    message,
  };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
}
