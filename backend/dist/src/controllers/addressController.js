"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressController = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
/**
 * Utility function to parse serialized address_line.
 * If address_line is a JSON string, extract name, phone, and address.
 * Otherwise, return address_line as address and use fallbacks.
 */
function parseAddressLine(addressLine, userPhone, username) {
    if (!addressLine) {
        return {
            recipient_name: username || '',
            recipient_phone: userPhone || '',
            address_detail: '',
            latitude: null,
            longitude: null,
        };
    }
    try {
        if (addressLine.startsWith('{') && addressLine.endsWith('}')) {
            const parsed = JSON.parse(addressLine);
            if (parsed && typeof parsed === 'object') {
                return {
                    recipient_name: parsed.name || username || '',
                    recipient_phone: parsed.phone || userPhone || '',
                    address_detail: parsed.address || '',
                    latitude: parsed.lat != null ? Number(parsed.lat) : null,
                    longitude: parsed.lon != null ? Number(parsed.lon) : null,
                };
            }
        }
    }
    catch (e) {
        // Treat as plain text string if not valid JSON
    }
    return {
        recipient_name: username || '',
        recipient_phone: userPhone || '',
        address_detail: addressLine,
        latitude: null,
        longitude: null,
    };
}
class AddressController {
    /**
     * GET /api/addresses
     * Fetch all addresses for the logged-in user.
     */
    static async getAddresses(req, res) {
        try {
            const userId = req.user?.user_id;
            if (!userId) {
                (0, response_1.sendError)(res, 'Không tìm thấy thông tin người dùng', 401);
                return;
            }
            // Fetch user details for fallbacks
            const user = await prisma_1.default.user.findUnique({
                where: { user_id: userId },
                select: { phone: true, username: true },
            });
            const addresses = await prisma_1.default.userAddress.findMany({
                where: { user_id: userId },
                orderBy: [
                    { is_default: 'desc' },
                    { user_address_id: 'asc' },
                ],
            });
            const formatted = addresses.map((addr) => {
                const parsed = parseAddressLine(addr.address_line, user?.phone, user?.username);
                return {
                    user_address_id: addr.user_address_id,
                    user_id: addr.user_id,
                    is_default: addr.is_default || false,
                    ...parsed,
                };
            });
            (0, response_1.sendSuccess)(res, {
                data: formatted,
                message: 'Lấy danh sách địa chỉ thành công',
            });
        }
        catch (err) {
            logger_1.logger.error('Get addresses error:', err);
            (0, response_1.sendError)(res, 'Lỗi hệ thống khi lấy danh sách địa chỉ', 500);
        }
    }
    /**
     * POST /api/addresses
     * Create a new address for the logged-in user.
     */
    static async createAddress(req, res) {
        try {
            const userId = req.user?.user_id;
            if (!userId) {
                (0, response_1.sendError)(res, 'Không tìm thấy thông tin người dùng', 401);
                return;
            }
            const { recipient_name, recipient_phone, address_detail, is_default, latitude, longitude } = req.body;
            if (!recipient_name || !recipient_phone || !address_detail) {
                (0, response_1.sendError)(res, 'Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ giao hàng', 400);
                return;
            }
            // Serialize recipient fields + coordinates into address_line JSON
            const addressLine = JSON.stringify({
                name: recipient_name.trim(),
                phone: recipient_phone.trim(),
                address: address_detail.trim(),
                lat: latitude != null ? Number(latitude) : null,
                lon: longitude != null ? Number(longitude) : null,
            });
            await prisma_1.default.$transaction(async (tx) => {
                // If this address is set as default, update all other addresses of this user to is_default = false
                if (is_default) {
                    await tx.userAddress.updateMany({
                        where: { user_id: userId },
                        data: { is_default: false },
                    });
                }
                // Check if user has any addresses. If this is the first address, make it default automatically
                const addressCount = await tx.userAddress.count({
                    where: { user_id: userId },
                });
                const shouldBeDefault = addressCount === 0 ? true : !!is_default;
                const newAddress = await tx.userAddress.create({
                    data: {
                        user_id: userId,
                        address_line: addressLine,
                        is_default: shouldBeDefault,
                    },
                });
                const parsed = parseAddressLine(newAddress.address_line);
                (0, response_1.sendSuccess)(res, {
                    data: {
                        user_address_id: newAddress.user_address_id,
                        user_id: newAddress.user_id,
                        is_default: newAddress.is_default || false,
                        ...parsed,
                    },
                    message: 'Thêm địa chỉ mới thành công',
                }, 201);
            });
        }
        catch (err) {
            logger_1.logger.error('Create address error:', err);
            (0, response_1.sendError)(res, 'Lỗi hệ thống khi thêm địa chỉ mới', 500);
        }
    }
    /**
     * PUT /api/addresses/:id
     * Update an existing address.
     */
    static async updateAddress(req, res) {
        try {
            const userId = req.user?.user_id;
            if (!userId) {
                (0, response_1.sendError)(res, 'Không tìm thấy thông tin người dùng', 401);
                return;
            }
            const addressId = parseInt(String(req.params.id));
            if (isNaN(addressId)) {
                (0, response_1.sendError)(res, 'Mã địa chỉ không hợp lệ', 400);
                return;
            }
            // Check if address exists and belongs to the user
            const existing = await prisma_1.default.userAddress.findFirst({
                where: { user_address_id: addressId, user_id: userId },
            });
            if (!existing) {
                (0, response_1.sendError)(res, 'Không tìm thấy địa chỉ của bạn hoặc địa chỉ không thuộc quyền sở hữu của bạn', 404);
                return;
            }
            const { recipient_name, recipient_phone, address_detail, is_default, latitude, longitude } = req.body;
            if (!recipient_name || !recipient_phone || !address_detail) {
                (0, response_1.sendError)(res, 'Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ giao hàng', 400);
                return;
            }
            const addressLine = JSON.stringify({
                name: recipient_name.trim(),
                phone: recipient_phone.trim(),
                address: address_detail.trim(),
                lat: latitude != null ? Number(latitude) : null,
                lon: longitude != null ? Number(longitude) : null,
            });
            await prisma_1.default.$transaction(async (tx) => {
                // If this address is set as default, update all other addresses of this user to is_default = false
                if (is_default) {
                    await tx.userAddress.updateMany({
                        where: { user_id: userId, NOT: { user_address_id: addressId } },
                        data: { is_default: false },
                    });
                }
                const updated = await tx.userAddress.update({
                    where: { user_address_id: addressId },
                    data: {
                        address_line: addressLine,
                        is_default: !!is_default,
                    },
                });
                const parsed = parseAddressLine(updated.address_line);
                (0, response_1.sendSuccess)(res, {
                    data: {
                        user_address_id: updated.user_address_id,
                        user_id: updated.user_id,
                        is_default: updated.is_default || false,
                        ...parsed,
                    },
                    message: 'Cập nhật địa chỉ thành công',
                });
            });
        }
        catch (err) {
            logger_1.logger.error('Update address error:', err);
            (0, response_1.sendError)(res, 'Lỗi hệ thống khi cập nhật địa chỉ', 500);
        }
    }
    /**
     * DELETE /api/addresses/:id
     * Delete an address.
     */
    static async deleteAddress(req, res) {
        try {
            const userId = req.user?.user_id;
            if (!userId) {
                (0, response_1.sendError)(res, 'Không tìm thấy thông tin người dùng', 401);
                return;
            }
            const addressId = parseInt(String(req.params.id));
            if (isNaN(addressId)) {
                (0, response_1.sendError)(res, 'Mã địa chỉ không hợp lệ', 400);
                return;
            }
            // Check if address exists and belongs to the user
            const existing = await prisma_1.default.userAddress.findFirst({
                where: { user_address_id: addressId, user_id: userId },
            });
            if (!existing) {
                (0, response_1.sendError)(res, 'Không tìm thấy địa chỉ của bạn hoặc địa chỉ không thuộc quyền sở hữu của bạn', 404);
                return;
            }
            await prisma_1.default.$transaction(async (tx) => {
                // Delete the address
                await tx.userAddress.delete({
                    where: { user_address_id: addressId },
                });
                // If the deleted address was default, set another address as default
                if (existing.is_default) {
                    const nextAddress = await tx.userAddress.findFirst({
                        where: { user_id: userId },
                        orderBy: { user_address_id: 'asc' },
                    });
                    if (nextAddress) {
                        await tx.userAddress.update({
                            where: { user_address_id: nextAddress.user_address_id },
                            data: { is_default: true },
                        });
                    }
                }
            });
            (0, response_1.sendSuccess)(res, {
                message: 'Xóa địa chỉ thành công',
            });
        }
        catch (err) {
            logger_1.logger.error('Delete address error:', err);
            (0, response_1.sendError)(res, 'Lỗi hệ thống khi xóa địa chỉ', 500);
        }
    }
}
exports.AddressController = AddressController;
//# sourceMappingURL=addressController.js.map