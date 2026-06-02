import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare class AddressController {
    /**
     * GET /api/addresses
     * Fetch all addresses for the logged-in user.
     */
    static getAddresses(req: AuthRequest, res: Response): Promise<void>;
    /**
     * POST /api/addresses
     * Create a new address for the logged-in user.
     */
    static createAddress(req: AuthRequest, res: Response): Promise<void>;
    /**
     * PUT /api/addresses/:id
     * Update an existing address.
     */
    static updateAddress(req: AuthRequest, res: Response): Promise<void>;
    /**
     * DELETE /api/addresses/:id
     * Delete an address.
     */
    static deleteAddress(req: AuthRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=addressController.d.ts.map