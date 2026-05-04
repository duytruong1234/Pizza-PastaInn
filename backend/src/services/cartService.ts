import prisma from '../lib/prisma';

export class CartService {
  /**
   * Adds or updates an item in the cart.
   * If cartId is null, creates a new cart.
   */
  static async addItemToCart({
    cart_id,
    dish_price_id,
    quantity,
    price_cart,
    cart_item_note
  }: {
    cart_id?: number | null;
    dish_price_id: string;
    quantity: number;
    price_cart: number;
    cart_item_note?: string;
  }) {
    let currentCartId = cart_id;

    // Create a new cart if none provided
    if (!currentCartId) {
      const newCart = await prisma.cart.create({
        data: {
          created_at: new Date(),
          total_price_cart: 0
        }
      });
      currentCartId = newCart.cart_id;
    }

    // Check if item already exists
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cart_id: currentCartId,
        dish_price_id
      }
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { cart_item_id: existingItem.cart_item_id },
        data: { quantity: existingItem.quantity! + quantity }
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cart_id: currentCartId,
          dish_price_id,
          quantity,
          price_cart,
          cart_item_note,
          is_half_half: false
        }
      });
    }

    return { cart_id: currentCartId };
  }

  /**
   * Removes an item from the cart
   */
  static async removeItemFromCart(cart_id: number, dish_price_id: string) {
    const existingItem = await prisma.cartItem.findFirst({
      where: { cart_id, dish_price_id }
    });

    if (existingItem) {
      await prisma.cartItem.delete({
        where: { cart_item_id: existingItem.cart_item_id }
      });
      return true;
    }
    return false;
  }

  /**
   * Updates quantity of an item in the cart
   */
  static async updateItemQuantity(cart_id: number, dish_price_id: string, quantity: number) {
    const existingItem = await prisma.cartItem.findFirst({
      where: { cart_id, dish_price_id }
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { cart_item_id: existingItem.cart_item_id },
        data: { quantity }
      });
      return true;
    }
    return false;
  }
}
