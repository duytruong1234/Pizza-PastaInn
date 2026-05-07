import prisma from '../lib/prisma';

// ── Kiểu dữ liệu cho request body từ frontend ──────────────────────────────

// Topping được chọn
interface ToppingInput {
  topping_id: number;
  quantity?: number;
}

// Nửa pizza (Half-Half)
interface HalfInput {
  dish_id: number;
  toppings?: ToppingInput[];
}

// Lựa chọn trong 1 nhóm combo
interface ComboSelectionInput {
  group_id: string;
  dish_price_id: string;
  is_half_half?: boolean;
  halves?: HalfInput[];
  toppings?: ToppingInput[];
}

// Dữ liệu thêm món thường vào giỏ hàng
interface AddRegularItemInput {
  type: 'regular';
  cart_id?: number | null;
  user_id?: number | null;
  dish_price_id: string;
  quantity: number;
  price_cart: number;
  cart_item_note?: string;
  toppings?: ToppingInput[];
}

// Dữ liệu thêm món half-half vào giỏ hàng
interface AddHalfHalfItemInput {
  type: 'half_half';
  cart_id?: number | null;
  user_id?: number | null;
  dish_price_id?: string;
  quantity: number;
  price_cart: number;
  cart_item_note?: string;
  halves: HalfInput[];
  toppings?: ToppingInput[];
}

// Dữ liệu thêm combo vào giỏ hàng
interface AddComboItemInput {
  type: 'combo';
  cart_id?: number | null;
  user_id?: number | null;
  combo_id: number;
  quantity: number;
  price_cart: number;
  cart_item_note?: string;
  combo_selections: ComboSelectionInput[];
}

// Union type cho tất cả loại input
type AddToCartInput = AddRegularItemInput | AddHalfHalfItemInput | AddComboItemInput;

export class CartService {

  // ── Lấy hoặc tạo giỏ hàng ─────────────────────────────────────────────────

  /**
   * Tìm giỏ hàng hiện tại hoặc tạo mới nếu chưa có.
   * Nếu user_id được truyền, gắn giỏ hàng với user.
   */
  static async getOrCreateCart(cart_id?: number | null, user_id?: number | null): Promise<number> {
    // Nếu đã có cart_id, kiểm tra tồn tại
    if (cart_id) {
      const existingCart = await prisma.cart.findUnique({ where: { cart_id } });
      if (existingCart) {
        // Nếu giỏ hàng chưa gắn user_id mà hiện tại đã đăng nhập → cập nhật user_id
        if (!existingCart.user_id && user_id) {
          await prisma.cart.update({
            where: { cart_id },
            data: { user_id }
          });
        }
        return existingCart.cart_id;
      }
    }

    // Nếu có user_id, tìm giỏ hàng chưa checkout của user
    if (user_id) {
      const userCart = await prisma.cart.findFirst({
        where: { user_id },
        orderBy: { created_at: 'desc' }
      });
      if (userCart) return userCart.cart_id;
    }

    // Tạo giỏ hàng mới
    const newCart = await prisma.cart.create({
      data: {
        user_id: user_id || null,
        created_at: new Date(),
        total_price_cart: 0
      }
    });
    return newCart.cart_id;
  }

  // ── Điều phối thêm vào giỏ hàng ───────────────────────────────────────────

  /**
   * Hàm chính: Điều phối thêm sản phẩm vào giỏ hàng theo loại (regular/half_half/combo).
   */
  static async addItemToCart(input: AddToCartInput) {
    const cartId = await this.getOrCreateCart(input.cart_id, input.user_id);

    let cartItemId: number;

    switch (input.type) {
      case 'regular':
        cartItemId = await this.addRegularItem(cartId, input);
        break;
      case 'half_half':
        cartItemId = await this.addHalfHalfItem(cartId, input);
        break;
      case 'combo':
        cartItemId = await this.addComboItem(cartId, input);
        break;
      default:
        throw new Error('Loại sản phẩm không hợp lệ');
    }

    // Cập nhật tổng tiền giỏ hàng
    await this.recalculateCartTotal(cartId);

    return { cart_id: cartId, cart_item_id: cartItemId };
  }

  // ── Luồng 1: Thêm món thường ──────────────────────────────────────────────

  /**
   * Thêm món thường (pizza đơn, spaghetti, salad, drink...) vào giỏ hàng.
   * Bảng liên quan: cart_items + cart_item_topping
   */
  private static async addRegularItem(cartId: number, input: AddRegularItemInput): Promise<number> {
    // Tạo cart_item
    const cartItem = await prisma.cartItem.create({
      data: {
        cart_id: cartId,
        dish_price_id: input.dish_price_id,
        quantity: input.quantity,
        price_cart: input.price_cart * input.quantity,
        cart_item_note: input.cart_item_note || null,
        is_half_half: false,
        combo_id: null
      }
    });

    // Tạo các topping cho cart_item (nếu có)
    if (input.toppings && input.toppings.length > 0) {
      await prisma.cartItemTopping.createMany({
        data: input.toppings.map(t => ({
          cart_item_id: cartItem.cart_item_id,
          topping_id: t.topping_id,
          quantity: (t.quantity || 1) * input.quantity,
          cart_item_combo_id: null,
          cart_item_half_id: null
        }))
      });
    }

    return cartItem.cart_item_id;
  }

  // ── Luồng 2: Thêm Half-Half Pizza ─────────────────────────────────────────

  /**
   * Thêm pizza Half-Half vào giỏ hàng.
   * Bảng liên quan: cart_items + cart_item_half (2 nửa) + cart_item_topping
   */
  private static async addHalfHalfItem(cartId: number, input: AddHalfHalfItemInput): Promise<number> {
    // Tạo cart_item với is_half_half = true
    const cartItem = await prisma.cartItem.create({
      data: {
        cart_id: cartId,
        dish_price_id: input.dish_price_id || null,
        quantity: input.quantity,
        price_cart: input.price_cart * input.quantity,
        cart_item_note: input.cart_item_note || null,
        is_half_half: true,
        combo_id: null
      }
    });

    // Tạo 2 bản ghi cart_item_half cho 2 nửa pizza
    for (const half of input.halves) {
      const cartHalf = await prisma.cartItemHalf.create({
        data: {
          cart_item_id: cartItem.cart_item_id,
          cart_item_combo_id: null,
          dish_id: half.dish_id,
          cart_half_note: null
        }
      });

      // Tạo topping riêng cho từng nửa (nếu có)
      if (half.toppings && half.toppings.length > 0) {
        await prisma.cartItemTopping.createMany({
          data: half.toppings.map(t => ({
            cart_item_id: null,
            cart_item_combo_id: null,
            cart_item_half_id: cartHalf.cart_item_half_id,
            topping_id: t.topping_id,
            quantity: (t.quantity || 1) * input.quantity
          }))
        });
      }
    }

    // Tạo topping chung cho cả pizza half-half (nếu có)
    if (input.toppings && input.toppings.length > 0) {
      await prisma.cartItemTopping.createMany({
        data: input.toppings.map(t => ({
          cart_item_id: cartItem.cart_item_id,
          cart_item_combo_id: null,
          cart_item_half_id: null,
          topping_id: t.topping_id,
          quantity: (t.quantity || 1) * input.quantity
        }))
      });
    }

    return cartItem.cart_item_id;
  }

  // ── Luồng 3: Thêm Combo ───────────────────────────────────────────────────

  /**
   * Thêm Combo vào giỏ hàng.
   * Bảng liên quan: cart_items + cart_item_combos (các lựa chọn)
   *   + cart_item_topping (topping cho từng lựa chọn)
   *   + cart_item_half (nếu pizza half-half bên trong combo)
   */
  private static async addComboItem(cartId: number, input: AddComboItemInput): Promise<number> {
    // Tạo cart_item với combo_id
    const cartItem = await prisma.cartItem.create({
      data: {
        cart_id: cartId,
        dish_price_id: null,
        combo_id: input.combo_id,
        quantity: input.quantity,
        price_cart: input.price_cart * input.quantity,
        cart_item_note: input.cart_item_note || null,
        is_half_half: false // Chỉ set true khi là món Half-Half độc lập
      }
    });

    // Tạo chi tiết lựa chọn cho từng nhóm combo
    for (const selection of input.combo_selections) {
      const comboItem = await prisma.cartItemCombo.create({
        data: {
          cart_item_id: cartItem.cart_item_id,
          group_id: selection.group_id,
          dish_price_id: selection.dish_price_id,
          is_half_half: selection.is_half_half || false,
          cart_combo_note: null
        }
      });

      // Nếu lựa chọn combo là pizza half-half
      if (selection.is_half_half && selection.halves && selection.halves.length > 0) {
        for (const half of selection.halves) {
          const comboHalf = await prisma.cartItemHalf.create({
            data: {
              cart_item_id: null,
              cart_item_combo_id: comboItem.cart_item_combo_id,
              dish_id: half.dish_id,
              cart_half_note: null
            }
          });

          // Topping riêng cho nửa pizza trong combo
          if (half.toppings && half.toppings.length > 0) {
            await prisma.cartItemTopping.createMany({
              data: half.toppings.map(t => ({
                cart_item_id: null,
                cart_item_combo_id: null,
                cart_item_half_id: comboHalf.cart_item_half_id,
                topping_id: t.topping_id,
                quantity: (t.quantity || 1) * input.quantity
              }))
            });
          }
        }
      }

      // Topping cho lựa chọn combo (không phải half-half)
      if (selection.toppings && selection.toppings.length > 0) {
        await prisma.cartItemTopping.createMany({
          data: selection.toppings.map(t => ({
            cart_item_id: null,
            cart_item_combo_id: comboItem.cart_item_combo_id,
            cart_item_half_id: null,
            topping_id: t.topping_id,
            quantity: (t.quantity || 1) * input.quantity
          }))
        });
      }
    }

    return cartItem.cart_item_id;
  }

  // ── Lấy giỏ hàng đầy đủ (JOIN 5 bảng) ────────────────────────────────────

  /**
   * Lấy chi tiết giỏ hàng kèm tất cả relations (5 bảng).
   * Dùng cho: load lại giỏ hàng từ DB, checkout, hiển thị trên frontend.
   */
  static async getCartById(cart_id: number) {
    return prisma.cart.findUnique({
      where: { cart_id },
      include: {
        items: {
          include: {
            // Topping trực tiếp trên cart_item (món thường hoặc topping chung half-half)
            toppings: true,
            // Chi tiết combo selections
            combos: {
              include: {
                // Topping cho từng lựa chọn combo
                toppings: true,
                // Half-half trong combo
                halves: {
                  include: {
                    cart_item_topping: true
                  }
                }
              }
            },
            // Half-half trực tiếp trên cart_item (không trong combo)
            halves: {
              include: {
                cart_item_topping: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Lấy giỏ hàng mới nhất của user theo user_id.
   * Dùng cho: đồng bộ giỏ hàng khi mở trang / đăng nhập.
   */
  static async getCartByUserId(user_id: number) {
    const cart = await prisma.cart.findFirst({
      where: { user_id },
      orderBy: { created_at: 'desc' },
      include: {
        items: {
          include: {
            toppings: true,
            combos: {
              include: {
                toppings: true,
                halves: {
                  include: {
                    cart_item_topping: true
                  }
                }
              }
            },
            halves: {
              include: {
                cart_item_topping: true
              }
            }
          }
        }
      }
    });
    return cart;
  }

  // ── Xóa 1 mục khỏi giỏ hàng ──────────────────────────────────────────────

  /**
   * Xóa 1 cart_item và tất cả dữ liệu liên quan (cascade thủ công).
   * Do onDelete: NoAction nên phải xóa thủ công theo thứ tự.
   */
  static async removeItemFromCart(cart_item_id: number) {
    // 1. Lấy tất cả cart_item_combo_id liên quan
    const comboItems = await prisma.cartItemCombo.findMany({
      where: { cart_item_id },
      select: { cart_item_combo_id: true }
    });
    const comboItemIds = comboItems.map(c => c.cart_item_combo_id);

    // 2. Lấy tất cả cart_item_half_id liên quan (cả trực tiếp và trong combo)
    const halfItems = await prisma.cartItemHalf.findMany({
      where: {
        OR: [
          { cart_item_id },
          ...(comboItemIds.length > 0 ? [{ cart_item_combo_id: { in: comboItemIds } }] : [])
        ]
      },
      select: { cart_item_half_id: true }
    });
    const halfItemIds = halfItems.map(h => h.cart_item_half_id);

    // 3. Xóa tất cả topping liên quan
    await prisma.cartItemTopping.deleteMany({
      where: {
        OR: [
          { cart_item_id },
          ...(comboItemIds.length > 0 ? [{ cart_item_combo_id: { in: comboItemIds } }] : []),
          ...(halfItemIds.length > 0 ? [{ cart_item_half_id: { in: halfItemIds } }] : [])
        ]
      }
    });

    // 4. Xóa tất cả half items
    if (halfItemIds.length > 0) {
      await prisma.cartItemHalf.deleteMany({
        where: { cart_item_half_id: { in: halfItemIds } }
      });
    }

    // 5. Xóa tất cả combo items
    if (comboItemIds.length > 0) {
      await prisma.cartItemCombo.deleteMany({
        where: { cart_item_combo_id: { in: comboItemIds } }
      });
    }

    // 6. Xóa cart_item chính
    await prisma.cartItem.delete({
      where: { cart_item_id }
    });

    return true;
  }

  // ── Cập nhật số lượng ──────────────────────────────────────────────────────

  /**
   * Cập nhật số lượng của 1 cart_item.
   */
  static async updateItemQuantity(cart_item_id: number, quantity: number) {
    if (quantity < 1) {
      return this.removeItemFromCart(cart_item_id);
    }

    const item = await prisma.cartItem.findUnique({ where: { cart_item_id } });
    if (!item) return false;

    // Tính đơn giá (unit_price) từ price_cart và quantity cũ
    const old_quantity = item.quantity || 1;
    const unit_price = (item.price_cart || 0) / old_quantity;
    const new_price_cart = unit_price * quantity;

    await prisma.cartItem.update({
      where: { cart_item_id },
      data: { 
        quantity,
        price_cart: new_price_cart
      }
    });

    // Cập nhật số lượng của tất cả toppings liên quan
    const comboItems = await prisma.cartItemCombo.findMany({
      where: { cart_item_id },
      select: { cart_item_combo_id: true }
    });
    const comboItemIds = comboItems.map(c => c.cart_item_combo_id);

    const halfItems = await prisma.cartItemHalf.findMany({
      where: {
        OR: [
          { cart_item_id },
          ...(comboItemIds.length > 0 ? [{ cart_item_combo_id: { in: comboItemIds } }] : [])
        ]
      },
      select: { cart_item_half_id: true }
    });
    const halfItemIds = halfItems.map(h => h.cart_item_half_id);

    const toppings = await prisma.cartItemTopping.findMany({
      where: {
        OR: [
          { cart_item_id },
          ...(comboItemIds.length > 0 ? [{ cart_item_combo_id: { in: comboItemIds } }] : []),
          ...(halfItemIds.length > 0 ? [{ cart_item_half_id: { in: halfItemIds } }] : [])
        ]
      }
    });

    for (const t of toppings) {
       const base_quantity = (t.quantity || 1) / old_quantity;
       const new_quantity = base_quantity * quantity;
       await prisma.cartItemTopping.update({
           where: { item_topping_id: t.item_topping_id },
           data: { quantity: new_quantity }
       });
    }

    return true;
  }

  // ── Cập nhật tổng tiền giỏ hàng ───────────────────────────────────────────

  /**
   * Tính lại tổng tiền giỏ hàng từ tất cả cart_items.
   */
  static async recalculateCartTotal(cart_id: number) {
    const items = await prisma.cartItem.findMany({
      where: { cart_id }
    });

    const total = items.reduce((sum, item) => {
      return sum + (item.price_cart || 0);
    }, 0);

    await prisma.cart.update({
      where: { cart_id },
      data: { total_price_cart: total }
    });

    return total;
  }

  // ── Xóa toàn bộ giỏ hàng ──────────────────────────────────────────────────

  /**
   * Xóa tất cả items trong giỏ hàng (dùng khi checkout xong hoặc clear cart).
   */
  static async clearCart(cart_id: number) {
    const items = await prisma.cartItem.findMany({
      where: { cart_id },
      select: { cart_item_id: true }
    });

    // Xóa từng item (cascade thủ công)
    for (const item of items) {
      await this.removeItemFromCart(item.cart_item_id);
    }

    // Cập nhật tổng tiền về 0
    await prisma.cart.update({
      where: { cart_id },
      data: { total_price_cart: 0 }
    });

    return true;
  }
}
