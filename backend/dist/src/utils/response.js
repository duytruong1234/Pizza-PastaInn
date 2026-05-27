"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = sendSuccess;
exports.sendError = sendError;
/**
 * Trả về response thành công
 */
function sendSuccess(res, payload = {}, statusCode = 200) {
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
function sendError(res, message, statusCode = 400, errors) {
    const payload = {
        success: false,
        message,
    };
    if (errors)
        payload.errors = errors;
    return res.status(statusCode).json(payload);
}
//# sourceMappingURL=response.js.map