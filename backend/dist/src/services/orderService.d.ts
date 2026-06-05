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
    payment_method: string;
    total_price_dish: number;
    shipping_fee?: number;
    discount_amount?: number;
    total_order: number;
    order_note?: string;
    order_type: string;
    pickup_time?: string;
    estimated_delivery_time?: string;
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
    customer_address?: string;
    store_id?: number;
    customer_latitude?: number;
    customer_longitude?: number;
    shipping_distance_meters?: number;
    items: OrderItemInput[];
}
export declare class OrderService {
    /**
     * Tạo đơn hàng đầy đủ trong 1 transaction:
     * orders → order_items → order_item_toppings / order_item_combos / order_item_half
     */
    static createOrder(input: CreateOrderInput): Promise<{
        order_id: number;
        store_id: number | null;
        user_id: number | null;
        user_address_id: number | null;
        payment_method: string | null;
        payment_status: string | null;
        total_price_dish: number | null;
        shipping_fee: number | null;
        discount_amount: number | null;
        total_order: number | null;
        order_note: string | null;
        created_at: Date | null;
        order_status: string | null;
        confirmed_at: Date | null;
        preparing_at: Date | null;
        shipped_at: Date | null;
        estimated_delivery_time: Date | null;
        arrived_at: Date | null;
        completed_at: Date | null;
        cancelled_at: Date | null;
        order_type: string | null;
        pickup_time: Date | null;
        customer_name: string | null;
        customer_phone: string | null;
        customer_email: string | null;
        customer_latitude: import("@prisma/client-runtime-utils").Decimal | null;
        customer_longitude: import("@prisma/client-runtime-utils").Decimal | null;
        shipping_distance_meters: import("@prisma/client-runtime-utils").Decimal | null;
    }>;
    /**
     * Hủy đơn hàng và khôi phục lại tồn kho món ăn/topping.
     */
    static cancelOrder(order_id: number): Promise<{
        order_id: number;
        store_id: number | null;
        user_id: number | null;
        user_address_id: number | null;
        payment_method: string | null;
        payment_status: string | null;
        total_price_dish: number | null;
        shipping_fee: number | null;
        discount_amount: number | null;
        total_order: number | null;
        order_note: string | null;
        created_at: Date | null;
        order_status: string | null;
        confirmed_at: Date | null;
        preparing_at: Date | null;
        shipped_at: Date | null;
        estimated_delivery_time: Date | null;
        arrived_at: Date | null;
        completed_at: Date | null;
        cancelled_at: Date | null;
        order_type: string | null;
        pickup_time: Date | null;
        customer_name: string | null;
        customer_phone: string | null;
        customer_email: string | null;
        customer_latitude: import("@prisma/client-runtime-utils").Decimal | null;
        customer_longitude: import("@prisma/client-runtime-utils").Decimal | null;
        shipping_distance_meters: import("@prisma/client-runtime-utils").Decimal | null;
    }>;
    static cleanAddressLine(addressLine: string | null): string;
    static getOrderById(order_id: number): Promise<({
        store: {
            is_active: boolean | null;
            store_id: number;
            store_name: string | null;
            address: string | null;
            latitude: import("@prisma/client-runtime-utils").Decimal | null;
            longitude: import("@prisma/client-runtime-utils").Decimal | null;
            hotline: string | null;
        } | null;
        user: {
            user_id: number;
            username: string | null;
            email: string | null;
            phone: string | null;
        } | null;
        items: ({
            toppings: {
                topping_id: number | null;
                order_item_topping_id: number;
                order_item_id: number | null;
                order_item_combo_id: number | null;
                order_item_half_id: number | null;
                quantity: number | null;
                topping_price: number | null;
            }[];
            combos: ({
                toppings: {
                    topping_id: number | null;
                    order_item_topping_id: number;
                    order_item_id: number | null;
                    order_item_combo_id: number | null;
                    order_item_half_id: number | null;
                    quantity: number | null;
                    topping_price: number | null;
                }[];
                halves: ({
                    order_item_toppings: {
                        topping_id: number | null;
                        order_item_topping_id: number;
                        order_item_id: number | null;
                        order_item_combo_id: number | null;
                        order_item_half_id: number | null;
                        quantity: number | null;
                        topping_price: number | null;
                    }[];
                } & {
                    dish_id: number | null;
                    order_item_id: number | null;
                    order_item_combo_id: number | null;
                    order_item_half_id: number;
                    order_half_note: string | null;
                })[];
            } & {
                dish_price_id: string | null;
                order_item_id: number | null;
                order_item_combo_id: number;
                group_id: string | null;
                is_half_half: boolean | null;
                order_combo_note: string | null;
            })[];
            halves: ({
                order_item_toppings: {
                    topping_id: number | null;
                    order_item_topping_id: number;
                    order_item_id: number | null;
                    order_item_combo_id: number | null;
                    order_item_half_id: number | null;
                    quantity: number | null;
                    topping_price: number | null;
                }[];
            } & {
                dish_id: number | null;
                order_item_id: number | null;
                order_item_combo_id: number | null;
                order_item_half_id: number;
                order_half_note: string | null;
            })[];
        } & {
            combo_id: number | null;
            dish_price_id: string | null;
            order_item_id: number;
            quantity: number | null;
            order_id: number | null;
            is_half_half: boolean | null;
            order_price: number | null;
            order_item_note: string | null;
        })[];
        user_address: {
            user_id: number | null;
            user_address_id: number;
            address_line: string | null;
            is_default: boolean | null;
        } | null;
    } & {
        order_id: number;
        store_id: number | null;
        user_id: number | null;
        user_address_id: number | null;
        payment_method: string | null;
        payment_status: string | null;
        total_price_dish: number | null;
        shipping_fee: number | null;
        discount_amount: number | null;
        total_order: number | null;
        order_note: string | null;
        created_at: Date | null;
        order_status: string | null;
        confirmed_at: Date | null;
        preparing_at: Date | null;
        shipped_at: Date | null;
        estimated_delivery_time: Date | null;
        arrived_at: Date | null;
        completed_at: Date | null;
        cancelled_at: Date | null;
        order_type: string | null;
        pickup_time: Date | null;
        customer_name: string | null;
        customer_phone: string | null;
        customer_email: string | null;
        customer_latitude: import("@prisma/client-runtime-utils").Decimal | null;
        customer_longitude: import("@prisma/client-runtime-utils").Decimal | null;
        shipping_distance_meters: import("@prisma/client-runtime-utils").Decimal | null;
    }) | null>;
    static getOrdersByUserId(user_id: number): Promise<({
        store: {
            is_active: boolean | null;
            store_id: number;
            store_name: string | null;
            address: string | null;
            latitude: import("@prisma/client-runtime-utils").Decimal | null;
            longitude: import("@prisma/client-runtime-utils").Decimal | null;
            hotline: string | null;
        } | null;
        items: ({
            combo: {
                category_id: number | null;
                combo_id: number;
                combo_name: string;
                combo_price: number;
                description: string | null;
                is_active: boolean | null;
                image_combo: string | null;
            } | null;
            dish_price: ({
                dish: {
                    category_id: number | null;
                    dish_id: number;
                    dish_name: string;
                    image: string | null;
                    ingredient: string | null;
                    dish_status: boolean | null;
                    stock: number | null;
                } | null;
                size: {
                    size_id: number;
                    size_name: string;
                    is_visible: boolean | null;
                } | null;
                crust: {
                    is_visible: boolean | null;
                    crust_id: number;
                    crust_name: string;
                } | null;
            } & {
                dish_id: number | null;
                size_id: number | null;
                dish_price_id: string;
                crust_id: number | null;
                dish_price: number | null;
            }) | null;
            toppings: ({
                topping: {
                    stock: number | null;
                    size_id: number | null;
                    topping_id: number;
                    topping_name: string;
                    price_topping: number | null;
                    is_for_pizza: boolean | null;
                    is_for_spaghetti: boolean | null;
                } | null;
            } & {
                topping_id: number | null;
                order_item_topping_id: number;
                order_item_id: number | null;
                order_item_combo_id: number | null;
                order_item_half_id: number | null;
                quantity: number | null;
                topping_price: number | null;
            })[];
            combos: ({
                dish_price: ({
                    dish: {
                        category_id: number | null;
                        dish_id: number;
                        dish_name: string;
                        image: string | null;
                        ingredient: string | null;
                        dish_status: boolean | null;
                        stock: number | null;
                    } | null;
                    size: {
                        size_id: number;
                        size_name: string;
                        is_visible: boolean | null;
                    } | null;
                    crust: {
                        is_visible: boolean | null;
                        crust_id: number;
                        crust_name: string;
                    } | null;
                } & {
                    dish_id: number | null;
                    size_id: number | null;
                    dish_price_id: string;
                    crust_id: number | null;
                    dish_price: number | null;
                }) | null;
                toppings: ({
                    topping: {
                        stock: number | null;
                        size_id: number | null;
                        topping_id: number;
                        topping_name: string;
                        price_topping: number | null;
                        is_for_pizza: boolean | null;
                        is_for_spaghetti: boolean | null;
                    } | null;
                } & {
                    topping_id: number | null;
                    order_item_topping_id: number;
                    order_item_id: number | null;
                    order_item_combo_id: number | null;
                    order_item_half_id: number | null;
                    quantity: number | null;
                    topping_price: number | null;
                })[];
                halves: ({
                    dish: {
                        category_id: number | null;
                        dish_id: number;
                        dish_name: string;
                        image: string | null;
                        ingredient: string | null;
                        dish_status: boolean | null;
                        stock: number | null;
                    } | null;
                    order_item_toppings: ({
                        topping: {
                            stock: number | null;
                            size_id: number | null;
                            topping_id: number;
                            topping_name: string;
                            price_topping: number | null;
                            is_for_pizza: boolean | null;
                            is_for_spaghetti: boolean | null;
                        } | null;
                    } & {
                        topping_id: number | null;
                        order_item_topping_id: number;
                        order_item_id: number | null;
                        order_item_combo_id: number | null;
                        order_item_half_id: number | null;
                        quantity: number | null;
                        topping_price: number | null;
                    })[];
                } & {
                    dish_id: number | null;
                    order_item_id: number | null;
                    order_item_combo_id: number | null;
                    order_item_half_id: number;
                    order_half_note: string | null;
                })[];
            } & {
                dish_price_id: string | null;
                order_item_id: number | null;
                order_item_combo_id: number;
                group_id: string | null;
                is_half_half: boolean | null;
                order_combo_note: string | null;
            })[];
            halves: ({
                dish: {
                    category_id: number | null;
                    dish_id: number;
                    dish_name: string;
                    image: string | null;
                    ingredient: string | null;
                    dish_status: boolean | null;
                    stock: number | null;
                } | null;
                order_item_toppings: ({
                    topping: {
                        stock: number | null;
                        size_id: number | null;
                        topping_id: number;
                        topping_name: string;
                        price_topping: number | null;
                        is_for_pizza: boolean | null;
                        is_for_spaghetti: boolean | null;
                    } | null;
                } & {
                    topping_id: number | null;
                    order_item_topping_id: number;
                    order_item_id: number | null;
                    order_item_combo_id: number | null;
                    order_item_half_id: number | null;
                    quantity: number | null;
                    topping_price: number | null;
                })[];
            } & {
                dish_id: number | null;
                order_item_id: number | null;
                order_item_combo_id: number | null;
                order_item_half_id: number;
                order_half_note: string | null;
            })[];
        } & {
            combo_id: number | null;
            dish_price_id: string | null;
            order_item_id: number;
            quantity: number | null;
            order_id: number | null;
            is_half_half: boolean | null;
            order_price: number | null;
            order_item_note: string | null;
        })[];
        user_address: {
            user_id: number | null;
            user_address_id: number;
            address_line: string | null;
            is_default: boolean | null;
        } | null;
    } & {
        order_id: number;
        store_id: number | null;
        user_id: number | null;
        user_address_id: number | null;
        payment_method: string | null;
        payment_status: string | null;
        total_price_dish: number | null;
        shipping_fee: number | null;
        discount_amount: number | null;
        total_order: number | null;
        order_note: string | null;
        created_at: Date | null;
        order_status: string | null;
        confirmed_at: Date | null;
        preparing_at: Date | null;
        shipped_at: Date | null;
        estimated_delivery_time: Date | null;
        arrived_at: Date | null;
        completed_at: Date | null;
        cancelled_at: Date | null;
        order_type: string | null;
        pickup_time: Date | null;
        customer_name: string | null;
        customer_phone: string | null;
        customer_email: string | null;
        customer_latitude: import("@prisma/client-runtime-utils").Decimal | null;
        customer_longitude: import("@prisma/client-runtime-utils").Decimal | null;
        shipping_distance_meters: import("@prisma/client-runtime-utils").Decimal | null;
    })[]>;
    static getOrdersByPhone(phone: string): Promise<({
        store: {
            is_active: boolean | null;
            store_id: number;
            store_name: string | null;
            address: string | null;
            latitude: import("@prisma/client-runtime-utils").Decimal | null;
            longitude: import("@prisma/client-runtime-utils").Decimal | null;
            hotline: string | null;
        } | null;
        items: ({
            combo: {
                category_id: number | null;
                combo_id: number;
                combo_name: string;
                combo_price: number;
                description: string | null;
                is_active: boolean | null;
                image_combo: string | null;
            } | null;
            dish_price: ({
                dish: {
                    category_id: number | null;
                    dish_id: number;
                    dish_name: string;
                    image: string | null;
                    ingredient: string | null;
                    dish_status: boolean | null;
                    stock: number | null;
                } | null;
                size: {
                    size_id: number;
                    size_name: string;
                    is_visible: boolean | null;
                } | null;
                crust: {
                    is_visible: boolean | null;
                    crust_id: number;
                    crust_name: string;
                } | null;
            } & {
                dish_id: number | null;
                size_id: number | null;
                dish_price_id: string;
                crust_id: number | null;
                dish_price: number | null;
            }) | null;
            toppings: ({
                topping: {
                    stock: number | null;
                    size_id: number | null;
                    topping_id: number;
                    topping_name: string;
                    price_topping: number | null;
                    is_for_pizza: boolean | null;
                    is_for_spaghetti: boolean | null;
                } | null;
            } & {
                topping_id: number | null;
                order_item_topping_id: number;
                order_item_id: number | null;
                order_item_combo_id: number | null;
                order_item_half_id: number | null;
                quantity: number | null;
                topping_price: number | null;
            })[];
            combos: ({
                dish_price: ({
                    dish: {
                        category_id: number | null;
                        dish_id: number;
                        dish_name: string;
                        image: string | null;
                        ingredient: string | null;
                        dish_status: boolean | null;
                        stock: number | null;
                    } | null;
                    size: {
                        size_id: number;
                        size_name: string;
                        is_visible: boolean | null;
                    } | null;
                    crust: {
                        is_visible: boolean | null;
                        crust_id: number;
                        crust_name: string;
                    } | null;
                } & {
                    dish_id: number | null;
                    size_id: number | null;
                    dish_price_id: string;
                    crust_id: number | null;
                    dish_price: number | null;
                }) | null;
                toppings: ({
                    topping: {
                        stock: number | null;
                        size_id: number | null;
                        topping_id: number;
                        topping_name: string;
                        price_topping: number | null;
                        is_for_pizza: boolean | null;
                        is_for_spaghetti: boolean | null;
                    } | null;
                } & {
                    topping_id: number | null;
                    order_item_topping_id: number;
                    order_item_id: number | null;
                    order_item_combo_id: number | null;
                    order_item_half_id: number | null;
                    quantity: number | null;
                    topping_price: number | null;
                })[];
                halves: ({
                    dish: {
                        category_id: number | null;
                        dish_id: number;
                        dish_name: string;
                        image: string | null;
                        ingredient: string | null;
                        dish_status: boolean | null;
                        stock: number | null;
                    } | null;
                    order_item_toppings: ({
                        topping: {
                            stock: number | null;
                            size_id: number | null;
                            topping_id: number;
                            topping_name: string;
                            price_topping: number | null;
                            is_for_pizza: boolean | null;
                            is_for_spaghetti: boolean | null;
                        } | null;
                    } & {
                        topping_id: number | null;
                        order_item_topping_id: number;
                        order_item_id: number | null;
                        order_item_combo_id: number | null;
                        order_item_half_id: number | null;
                        quantity: number | null;
                        topping_price: number | null;
                    })[];
                } & {
                    dish_id: number | null;
                    order_item_id: number | null;
                    order_item_combo_id: number | null;
                    order_item_half_id: number;
                    order_half_note: string | null;
                })[];
            } & {
                dish_price_id: string | null;
                order_item_id: number | null;
                order_item_combo_id: number;
                group_id: string | null;
                is_half_half: boolean | null;
                order_combo_note: string | null;
            })[];
            halves: ({
                dish: {
                    category_id: number | null;
                    dish_id: number;
                    dish_name: string;
                    image: string | null;
                    ingredient: string | null;
                    dish_status: boolean | null;
                    stock: number | null;
                } | null;
                order_item_toppings: ({
                    topping: {
                        stock: number | null;
                        size_id: number | null;
                        topping_id: number;
                        topping_name: string;
                        price_topping: number | null;
                        is_for_pizza: boolean | null;
                        is_for_spaghetti: boolean | null;
                    } | null;
                } & {
                    topping_id: number | null;
                    order_item_topping_id: number;
                    order_item_id: number | null;
                    order_item_combo_id: number | null;
                    order_item_half_id: number | null;
                    quantity: number | null;
                    topping_price: number | null;
                })[];
            } & {
                dish_id: number | null;
                order_item_id: number | null;
                order_item_combo_id: number | null;
                order_item_half_id: number;
                order_half_note: string | null;
            })[];
        } & {
            combo_id: number | null;
            dish_price_id: string | null;
            order_item_id: number;
            quantity: number | null;
            order_id: number | null;
            is_half_half: boolean | null;
            order_price: number | null;
            order_item_note: string | null;
        })[];
        user_address: {
            user_id: number | null;
            user_address_id: number;
            address_line: string | null;
            is_default: boolean | null;
        } | null;
    } & {
        order_id: number;
        store_id: number | null;
        user_id: number | null;
        user_address_id: number | null;
        payment_method: string | null;
        payment_status: string | null;
        total_price_dish: number | null;
        shipping_fee: number | null;
        discount_amount: number | null;
        total_order: number | null;
        order_note: string | null;
        created_at: Date | null;
        order_status: string | null;
        confirmed_at: Date | null;
        preparing_at: Date | null;
        shipped_at: Date | null;
        estimated_delivery_time: Date | null;
        arrived_at: Date | null;
        completed_at: Date | null;
        cancelled_at: Date | null;
        order_type: string | null;
        pickup_time: Date | null;
        customer_name: string | null;
        customer_phone: string | null;
        customer_email: string | null;
        customer_latitude: import("@prisma/client-runtime-utils").Decimal | null;
        customer_longitude: import("@prisma/client-runtime-utils").Decimal | null;
        shipping_distance_meters: import("@prisma/client-runtime-utils").Decimal | null;
    })[]>;
    static updateOrderStatus(order_id: number, status: string): Promise<{
        order_id: number;
        store_id: number | null;
        user_id: number | null;
        user_address_id: number | null;
        payment_method: string | null;
        payment_status: string | null;
        total_price_dish: number | null;
        shipping_fee: number | null;
        discount_amount: number | null;
        total_order: number | null;
        order_note: string | null;
        created_at: Date | null;
        order_status: string | null;
        confirmed_at: Date | null;
        preparing_at: Date | null;
        shipped_at: Date | null;
        estimated_delivery_time: Date | null;
        arrived_at: Date | null;
        completed_at: Date | null;
        cancelled_at: Date | null;
        order_type: string | null;
        pickup_time: Date | null;
        customer_name: string | null;
        customer_phone: string | null;
        customer_email: string | null;
        customer_latitude: import("@prisma/client-runtime-utils").Decimal | null;
        customer_longitude: import("@prisma/client-runtime-utils").Decimal | null;
        shipping_distance_meters: import("@prisma/client-runtime-utils").Decimal | null;
    }>;
}
export {};
//# sourceMappingURL=orderService.d.ts.map