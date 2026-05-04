import { Router } from 'express';
import { CartController } from '../controllers/cartController';

const router = Router();

// Add or update item in cart
router.post('/items', CartController.addItem);

// Remove item from cart
router.delete('/items', CartController.removeItem);

// Update item quantity
router.put('/items', CartController.updateQuantity);

export default router;
