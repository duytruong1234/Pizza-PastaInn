import prisma from '../lib/prisma';
import { ShippingService } from './shippingService';

// ── Kiểu dữ liệu cho request body tạo đơn hàng ─────────────────────────────

interface ToppingInput {
  topping_id: number;
  quantity?: number;
  topping_price?: number;
}

interface HalfInput {
  dish_id: number;
  order_half_note?: string;
  toppings?: ToppingInput[];
}

interface ComboSelectionInput {
  group_id: string;
  dish_price_id: string;
  is_half_half?: boolean;
  order_combo_note?: string;
  halves?: HalfInput[];
  toppings?: ToppingInput[];
}

interface OrderItemInput {
  type: 'regular' | 'half_half' | 'combo';
  dish_price_id?: string;
  combo_id?: number;
  quantity: number;
  order_price: number;
  order_item_note?: string;
  toppings?: ToppingInput[];
  halves?: HalfInput[];
  combo_selections?: ComboSelectionInput[];
}

export interface CreateOrderInput {
  user_id?: number | null;
  user_address_id?: number | null;
  payment_method: string;      // 'cod' | 'vietqr'
  total_price_dish: number;     // Tạm tính (giá món)
  shipping_fee?: number;
  discount_amount?: number;
  total_order: number;          // Tổng cộng
  order_note?: string;
  order_type: string;           // 'delivery' | 'pickup'
  pickup_time?: string;         // ISO string
  estimated_delivery_time?: string;
  // Thông tin khách hàng (cho khách chưa đăng nhập)
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  // Thông tin cửa hàng và vị trí giao hàng
  store_id?: number;
  customer_latitude?: number;
  customer_longitude?: number;
  shipping_distance_meters?: number;
  // Items
  items: OrderItemInput[];
}

export class OrderService {

  // ── Tạo đơn hàng mới ────────────────────────────────────────────────────────

  /**
   * Tạo đơn hàng đầy đủ trong 1 transaction:
   * orders → order_items → order_item_toppings / order_item_combos / order_item_half
   */
  static async createOrder(input: CreateOrderInput) {
    return prisma.$transaction(async (tx) => {
      // 1. Xử lý user_address nếu có address mới
      let userAddressId = input.user_address_id;

      if (!userAddressId && input.customer_address && input.user_id) {
        const addr = await tx.userAddress.create({
          data: {
            user_id: input.user_id,
            address_line: input.customer_address,
            is_default: false,
          },
        });
        userAddressId = addr.user_address_id;
      }

      // 2. Nếu chưa có user, tạo guest user
      let userId = input.user_id;
      if (!userId && input.customer_phone) {
        // Tìm user guest cũ theo phone
        const existingUser = await tx.user.findFirst({
          where: { phone: input.customer_phone, is_guest: true },
        });
        if (existingUser) {
          userId = existingUser.user_id;
        } else {
          const guestUser = await tx.user.create({
            data: {
              username: input.customer_name || 'Khách',
              phone: input.customer_phone,
              email: input.customer_email || null,
              role: 'customer',
              is_guest: true,
              user_status: true,
              created_at: new Date(),
            },
          });
          userId = guestUser.user_id;
        }

        // Tạo address cho guest nếu là delivery
        if (input.customer_address && !userAddressId) {
          const addr = await tx.userAddress.create({
            data: {
              user_id: userId,
              address_line: input.customer_address,
              is_default: true,
            },
          });
          userAddressId = addr.user_address_id;
        }
      }

      // 3. Kiểm tra & trừ tồn kho (trong cùng transaction)
      const dishReq: Record<number, number> = {};       // dish_id → tổng qty cần
      const toppingReq: Record<number, number> = {};    // topping_id → tổng qty cần

      // Helper: tra dish_id từ dish_price_id
      const resolveDish = async (dpId: string, qty: number) => {
        const dp = await tx.dishPrice.findUnique({ where: { dish_price_id: dpId } });
        if (dp?.dish_id) dishReq[dp.dish_id] = (dishReq[dp.dish_id] || 0) + qty;
      };
      const addTopping = (tid: number, qty: number) => {
        toppingReq[tid] = (toppingReq[tid] || 0) + qty;
      };

      for (const item of input.items) {
        // Regular
        if (item.type === 'regular' && item.dish_price_id) {
          await resolveDish(item.dish_price_id, item.quantity);
        }
        // Toppings trực tiếp
        if (item.toppings) {
          for (const t of item.toppings) addTopping(t.topping_id, (t.quantity || 1) * item.quantity);
        }
        // Half-half
        if (item.type === 'half_half' && item.halves) {
          for (const h of item.halves) {
            dishReq[h.dish_id] = (dishReq[h.dish_id] || 0) + item.quantity;
            if (h.toppings) for (const t of h.toppings) addTopping(t.topping_id, (t.quantity || 1) * item.quantity);
          }
        }
        // Combo
        if (item.type === 'combo' && item.combo_selections) {
          for (const sel of item.combo_selections) {
            if (!sel.is_half_half && sel.dish_price_id) await resolveDish(sel.dish_price_id, item.quantity);
            if (sel.is_half_half && sel.halves) {
              for (const h of sel.halves) {
                dishReq[h.dish_id] = (dishReq[h.dish_id] || 0) + item.quantity;
                if (h.toppings) for (const t of h.toppings) addTopping(t.topping_id, (t.quantity || 1) * item.quantity);
              }
            }
            if (sel.toppings) for (const t of sel.toppings) addTopping(t.topping_id, (t.quantity || 1) * item.quantity);
          }
        }
      }

      // Validate & trừ stock món ăn
      for (const [idStr, qty] of Object.entries(dishReq)) {
        const id = Number(idStr);
        const dish = await tx.dish.findUnique({ where: { dish_id: id } });
        if (dish?.stock !== null && dish?.stock !== undefined && dish.stock < qty) {
          throw new Error(`Món "${dish.dish_name}" đã hết hàng (còn ${dish.stock}, cần ${qty}).`);
        }
        if (dish?.stock !== null && dish?.stock !== undefined) {
          await tx.dish.update({ where: { dish_id: id }, data: { stock: dish.stock - qty } });
        }
      }

      // Validate & trừ stock topping
      for (const [idStr, qty] of Object.entries(toppingReq)) {
        const id = Number(idStr);
        const tp = await tx.topping.findUnique({ where: { topping_id: id } });
        if (tp?.stock !== null && tp?.stock !== undefined && tp.stock < qty) {
          throw new Error(`Topping "${tp.topping_name}" đã hết hàng (còn ${tp.stock}, cần ${qty}).`);
        }
        if (tp?.stock !== null && tp?.stock !== undefined) {
          await tx.topping.update({ where: { topping_id: id }, data: { stock: tp.stock - qty } });
        }
      }

      // Resolve customer details for orders table columns
      let customerName = input.customer_name;
      let customerPhone = input.customer_phone;
      let customerEmail = input.customer_email;

      if (userId && (!customerName || !customerPhone || !customerEmail)) {
        const u = await tx.user.findUnique({
          where: { user_id: userId },
          select: { username: true, phone: true, email: true }
        });
        if (u) {
          if (!customerName) customerName = u.username || 'Khách';
          if (!customerPhone) customerPhone = u.phone || '';
          if (!customerEmail) customerEmail = u.email || '';
        }
      }

      // Recalculate shipping parameters at backend for security and accuracy (delivery only)
      let storeId = input.store_id || null;
      let shippingFee = input.shipping_fee || 0;
      let distanceMeters = input.shipping_distance_meters || null;

      if (input.order_type === 'delivery' && input.customer_latitude != null && input.customer_longitude != null) {
        try {
          const calc = await ShippingService.calculateShipping(
            Number(input.customer_latitude),
            Number(input.customer_longitude)
          );
          
          console.log(`[OrderService] Verified shipping for delivery order. Calculated store_id: ${calc.store_id}, distance: ${calc.distance_meters}m, fee: ${calc.shipping_fee}. Client sent store_id: ${storeId}, distance: ${distanceMeters}m, fee: ${shippingFee}`);
          
          storeId = calc.store_id;
          distanceMeters = calc.distance_meters;
          shippingFee = calc.shipping_fee;
        } catch (calcErr: any) {
          console.error('[OrderService] Error recalculating shipping on order creation, using client values as fallback:', calcErr.message);
        }
      }

      // 4. Tạo đơn hàng
      const order = await tx.order.create({
        data: {
          user_id: userId || null,
          user_address_id: userAddressId || null,
          payment_method: input.payment_method,
          payment_status: (input.payment_method === 'cod' || input.payment_method === 'vietqr') ? 'pending' : 'paid',
          total_price_dish: input.total_price_dish,
          shipping_fee: shippingFee,
          discount_amount: input.discount_amount || 0,
          total_order: input.payment_method === 'vietqr' ? 2000 : (input.total_price_dish + shippingFee - (input.discount_amount || 0)),
          order_note: input.order_note || null,
          order_status: 'pending',
          order_type: input.order_type,
          created_at: new Date(),
          estimated_delivery_time: input.estimated_delivery_time
            ? new Date(input.estimated_delivery_time)
            : null,
          pickup_time: input.pickup_time ? new Date(input.pickup_time) : null,
          customer_name: customerName || null,
          customer_phone: customerPhone || null,
          customer_email: customerEmail || null,
          store_id: storeId,
          customer_latitude: input.customer_latitude || null,
          customer_longitude: input.customer_longitude || null,
          shipping_distance_meters: distanceMeters,
        },
      });

      // 4. Tạo order items
      for (const item of input.items) {
        const orderItem = await tx.orderItem.create({
          data: {
            order_id: order.order_id,
            dish_price_id: item.dish_price_id || null,
            combo_id: item.combo_id || null,
            quantity: item.quantity,
            is_half_half: item.type === 'half_half',
            order_price: item.order_price,
            order_item_note: item.order_item_note || null,
          },
        });

        // 4a. Toppings cho order_item (món thường hoặc topping chung half-half)
        if (item.toppings && item.toppings.length > 0) {
          await tx.orderItemTopping.createMany({
            data: item.toppings.map((t) => ({
              order_item_id: orderItem.order_item_id,
              topping_id: t.topping_id,
              quantity: (t.quantity || 1) * item.quantity,
              topping_price: t.topping_price || 0,
              order_item_combo_id: null,
              order_item_half_id: null,
            })),
          });
        }

        // 4b. Half-half (pizza nửa nửa)
        if (item.type === 'half_half' && item.halves && item.halves.length > 0) {
          for (const half of item.halves) {
            const orderHalf = await tx.orderItemHalf.create({
              data: {
                order_item_id: orderItem.order_item_id,
                order_item_combo_id: null,
                dish_id: half.dish_id,
                order_half_note: half.order_half_note || null,
              },
            });

            // Topping cho nửa pizza
            if (half.toppings && half.toppings.length > 0) {
              await tx.orderItemTopping.createMany({
                data: half.toppings.map((t) => ({
                  order_item_id: null,
                  order_item_combo_id: null,
                  order_item_half_id: orderHalf.order_item_half_id,
                  topping_id: t.topping_id,
                  quantity: (t.quantity || 1) * item.quantity,
                  topping_price: t.topping_price || 0,
                })),
              });
            }
          }
        }

        // 4c. Combo selections
        if (item.type === 'combo' && item.combo_selections && item.combo_selections.length > 0) {
          for (const sel of item.combo_selections) {
            const orderCombo = await tx.orderItemCombo.create({
              data: {
                order_item_id: orderItem.order_item_id,
                group_id: sel.group_id,
                dish_price_id: sel.dish_price_id,
                is_half_half: sel.is_half_half || false,
                order_combo_note: sel.order_combo_note || null,
              },
            });

            // Half-half trong combo
            if (sel.is_half_half && sel.halves && sel.halves.length > 0) {
              for (const half of sel.halves) {
                const comboHalf = await tx.orderItemHalf.create({
                  data: {
                    order_item_id: null,
                    order_item_combo_id: orderCombo.order_item_combo_id,
                    dish_id: half.dish_id,
                    order_half_note: half.order_half_note || null,
                  },
                });

                if (half.toppings && half.toppings.length > 0) {
                  await tx.orderItemTopping.createMany({
                    data: half.toppings.map((t) => ({
                      order_item_id: null,
                      order_item_combo_id: null,
                      order_item_half_id: comboHalf.order_item_half_id,
                      topping_id: t.topping_id,
                      quantity: (t.quantity || 1) * item.quantity,
                      topping_price: t.topping_price || 0,
                    })),
                  });
                }
              }
            }

            // Topping cho lựa chọn combo
            if (sel.toppings && sel.toppings.length > 0) {
              await tx.orderItemTopping.createMany({
                data: sel.toppings.map((t) => ({
                  order_item_id: null,
                  order_item_combo_id: orderCombo.order_item_combo_id,
                  order_item_half_id: null,
                  topping_id: t.topping_id,
                  quantity: (t.quantity || 1) * item.quantity,
                  topping_price: t.topping_price || 0,
                })),
              });
            }
          }
        }
      }

      return order;
    });
  }

  /**
   * Hủy đơn hàng và khôi phục lại tồn kho món ăn/topping.
   */
  static async cancelOrder(order_id: number) {
    return prisma.$transaction(async (tx) => {
      // 1. Lấy chi tiết đơn hàng
      const order = await tx.order.findUnique({
        where: { order_id },
        include: {
          items: {
            include: {
              toppings: true,
              combos: {
                include: {
                  toppings: true,
                  halves: {
                    include: {
                      order_item_toppings: true
                    }
                  }
                }
              },
              halves: {
                include: {
                  order_item_toppings: true
                }
              }
            }
          }
        }
      });

      if (!order) {
        throw new Error('Không tìm thấy đơn hàng');
      }

      // Nếu đơn hàng đã bị hủy rồi, không làm gì thêm
      if (order.order_status === 'cancelled') {
        return order;
      }

      // 2. Thu thập số lượng khôi phục tồn kho cho Món ăn và Topping
      const dishUpdates: Record<number, number> = {};
      const toppingUpdates: Record<number, number> = {};

      const addDishRestore = (dishId: number, qty: number) => {
        dishUpdates[dishId] = (dishUpdates[dishId] || 0) + qty;
      };

      const addToppingRestore = (toppingId: number, qty: number) => {
        toppingUpdates[toppingId] = (toppingUpdates[toppingId] || 0) + qty;
      };

      for (const item of order.items) {
        const itemQty = item.quantity || 1;

        // A. Món thường (Regular)
        if (!item.is_half_half && item.dish_price_id && !item.combo_id) {
          const dp = await tx.dishPrice.findUnique({ where: { dish_price_id: item.dish_price_id } });
          if (dp?.dish_id) addDishRestore(dp.dish_id, itemQty);
        }

        // B. Toppings trực tiếp
        if (item.toppings && item.toppings.length > 0) {
          for (const t of item.toppings) {
            if (t.topping_id !== null) {
              addToppingRestore(t.topping_id, t.quantity || itemQty);
            }
          }
        }

        // C. Nửa nửa (Half-half)
        if (item.is_half_half && item.halves && item.halves.length > 0) {
          for (const h of item.halves) {
            if (h.dish_id) addDishRestore(h.dish_id, itemQty);
            if (h.order_item_toppings && h.order_item_toppings.length > 0) {
              for (const t of h.order_item_toppings) {
                if (t.topping_id !== null) {
                  addToppingRestore(t.topping_id, t.quantity || itemQty);
                }
              }
            }
          }
        }

        // D. Combo selections
        if (item.combo_id && item.combos && item.combos.length > 0) {
          for (const sel of item.combos) {
            // Món thường trong combo
            if (!sel.is_half_half && sel.dish_price_id) {
              const dp = await tx.dishPrice.findUnique({ where: { dish_price_id: sel.dish_price_id } });
              if (dp?.dish_id) addDishRestore(dp.dish_id, itemQty);
            }
            // Half-half trong combo
            if (sel.is_half_half && sel.halves && sel.halves.length > 0) {
              for (const h of sel.halves) {
                if (h.dish_id) addDishRestore(h.dish_id, itemQty);
                if (h.order_item_toppings && h.order_item_toppings.length > 0) {
                  for (const t of h.order_item_toppings) {
                    if (t.topping_id !== null) {
                      addToppingRestore(t.topping_id, t.quantity || itemQty);
                    }
                  }
                }
              }
            }
            // Toppings của combo selection
            if (sel.toppings && sel.toppings.length > 0) {
              for (const t of sel.toppings) {
                if (t.topping_id !== null) {
                  addToppingRestore(t.topping_id, t.quantity || itemQty);
                }
              }
            }
          }
        }
      }

      // 3. Khôi phục kho cho Dish
      for (const [dishIdStr, qty] of Object.entries(dishUpdates)) {
        const dishId = Number(dishIdStr);
        const dish = await tx.dish.findUnique({ where: { dish_id: dishId } });
        if (dish && dish.stock !== null && dish.stock !== undefined) {
          await tx.dish.update({
            where: { dish_id: dishId },
            data: { stock: dish.stock + qty }
          });
        }
      }

      // 4. Khôi phục kho cho Topping
      for (const [toppingIdStr, qty] of Object.entries(toppingUpdates)) {
        const toppingId = Number(toppingIdStr);
        const topping = await tx.topping.findUnique({ where: { topping_id: toppingId } });
        if (topping && topping.stock !== null && topping.stock !== undefined) {
          await tx.topping.update({
            where: { topping_id: toppingId },
            data: { stock: topping.stock + qty }
          });
        }
      }

      // 5. Cập nhật trạng thái hủy đơn
      const updatedOrder = await tx.order.update({
        where: { order_id },
        data: {
          order_status: 'cancelled',
          cancelled_at: new Date()
        }
      });

      return updatedOrder;
    });
  }

  // ── Lấy chi tiết đơn hàng (JOIN đầy đủ 5 bảng) ──────────────────────────

  static cleanAddressLine(addressLine: string | null): string {
    if (!addressLine) return '';
    try {
      if (addressLine.startsWith('{') && addressLine.endsWith('}')) {
        const parsed = JSON.parse(addressLine);
        if (parsed && typeof parsed === 'object') {
          return parsed.address || '';
        }
      }
    } catch (e) {
      // Return original
    }
    return addressLine;
  }

  static async getOrderById(order_id: number) {
    const order = await prisma.order.findUnique({
      where: { order_id },
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            phone: true,
          },
        },
        user_address: true,
        store: true,
        items: {
          include: {
            toppings: true,
            combos: {
              include: {
                toppings: true,
                halves: {
                  include: {
                    order_item_toppings: true,
                  },
                },
              },
            },
            halves: {
              include: {
                order_item_toppings: true,
              },
            },
          },
        },
      },
    });

    if (order && order.user_address) {
      order.user_address.address_line = this.cleanAddressLine(order.user_address.address_line);
    }
    return order;
  }

  // ── Lấy danh sách đơn hàng theo user ──────────────────────────────────────

  static async getOrdersByUserId(user_id: number) {
    const orders = await prisma.order.findMany({
      where: { user_id },
      include: {
        user_address: true,
        store: true,
        items: {
          include: {
            dish_price: {
              include: {
                dish: true,
                size: true,
                crust: true,
              },
            },
            combo: true,
            toppings: {
              include: {
                topping: true,
              },
            },
            combos: {
              include: {
                dish_price: {
                  include: {
                    dish: true,
                    size: true,
                    crust: true,
                  },
                },
                toppings: {
                  include: {
                    topping: true,
                  },
                },
                halves: {
                  include: {
                    dish: true,
                    order_item_toppings: {
                      include: {
                        topping: true,
                      },
                    },
                  },
                },
              },
            },
            halves: {
              include: {
                dish: true,
                order_item_toppings: {
                  include: {
                    topping: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    for (const order of orders) {
      if (order.user_address) {
        order.user_address.address_line = this.cleanAddressLine(order.user_address.address_line);
      }
    }

    return orders;
  }

  // ── Lấy danh sách đơn hàng theo số điện thoại ────────────────────────────────

  static async getOrdersByPhone(phone: string) {
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { customer_phone: phone },
          {
            user: {
              phone: phone,
            },
          },
        ],
      },
      include: {
        user_address: true,
        store: true,
        items: {
          include: {
            dish_price: {
              include: {
                dish: true,
                size: true,
                crust: true,
              },
            },
            combo: true,
            toppings: {
              include: {
                topping: true,
              },
            },
            combos: {
              include: {
                dish_price: {
                  include: {
                    dish: true,
                    size: true,
                    crust: true,
                  },
                },
                toppings: {
                  include: {
                    topping: true,
                  },
                },
                halves: {
                  include: {
                    dish: true,
                    order_item_toppings: {
                      include: {
                        topping: true,
                      },
                    },
                  },
                },
              },
            },
            halves: {
              include: {
                dish: true,
                order_item_toppings: {
                  include: {
                    topping: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    for (const order of orders) {
      if (order.user_address) {
        order.user_address.address_line = this.cleanAddressLine(order.user_address.address_line);
      }
    }

    return orders;
  }

  // ── Cập nhật trạng thái ────────────────────────────────────────────────────

  static async updateOrderStatus(order_id: number, status: string) {
    const updateData: Record<string, unknown> = { order_status: status };

    if (status === 'shipped') updateData.shipped_at = new Date();
    if (status === 'arrived') updateData.arrived_at = new Date();
    if (status === 'completed') updateData.completed_at = new Date();

    return prisma.order.update({
      where: { order_id },
      data: updateData,
    });
  }
}
