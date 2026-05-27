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
    items: OrderItemInput[];
}
export declare class OrderService {
    /**
     * Tạo đơn hàng đầy đủ trong 1 transaction:
     * orders → order_items → order_item_toppings / order_item_combos / order_item_half
     */
    static createOrder(input: CreateOrderInput): Promise<{
        user_id: number | null;
        created_at: Date | null;
        order_id: number;
        user_address_id: number | null;
        payment_method: string | null;
        payment_status: string | null;
        total_price_dish: number | null;
        shipping_fee: number | null;
        discount_amount: number | null;
        total_order: number | null;
        order_note: string | null;
        order_status: string | null;
        shipped_at: Date | null;
        estimated_delivery_time: Date | null;
        arrived_at: Date | null;
        completed_at: Date | null;
        order_type: string | null;
        pickup_time: Date | null;
    }>;
    static getOrderById(order_id: number): Promise<({
        user: {
            user_id: number;
            username: string | null;
            email: string | null;
            phone: string | null;
        } | null;
        items: ({
            toppings: {
                topping_id: number | null;
                quantity: number | null;
                order_item_id: number | null;
                order_item_combo_id: number | null;
                order_item_half_id: number | null;
                order_item_topping_id: number;
                topping_price: number | null;
            }[];
            combos: ({
                toppings: {
                    topping_id: number | null;
                    quantity: number | null;
                    order_item_id: number | null;
                    order_item_combo_id: number | null;
                    order_item_half_id: number | null;
                    order_item_topping_id: number;
                    topping_price: number | null;
                }[];
                halves: ({
                    order_item_toppings: {
                        topping_id: number | null;
                        quantity: number | null;
                        order_item_id: number | null;
                        order_item_combo_id: number | null;
                        order_item_half_id: number | null;
                        order_item_topping_id: number;
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
                group_id: string | null;
                is_half_half: boolean | null;
                order_item_id: number | null;
                order_item_combo_id: number;
                order_combo_note: string | null;
            })[];
            halves: ({
                order_item_toppings: {
                    topping_id: number | null;
                    quantity: number | null;
                    order_item_id: number | null;
                    order_item_combo_id: number | null;
                    order_item_half_id: number | null;
                    order_item_topping_id: number;
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
            order_id: number | null;
            quantity: number | null;
            is_half_half: boolean | null;
            order_item_id: number;
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
        user_id: number | null;
        created_at: Date | null;
        order_id: number;
        user_address_id: number | null;
        payment_method: string | null;
        payment_status: string | null;
        total_price_dish: number | null;
        shipping_fee: number | null;
        discount_amount: number | null;
        total_order: number | null;
        order_note: string | null;
        order_status: string | null;
        shipped_at: Date | null;
        estimated_delivery_time: Date | null;
        arrived_at: Date | null;
        completed_at: Date | null;
        order_type: string | null;
        pickup_time: Date | null;
    }) | null>;
    static getOrdersByUserId(user_id: number): Promise<({
        items: ({
            toppings: {
                topping_id: number | null;
                quantity: number | null;
                order_item_id: number | null;
                order_item_combo_id: number | null;
                order_item_half_id: number | null;
                order_item_topping_id: number;
                topping_price: number | null;
            }[];
            combos: ({
                toppings: {
                    topping_id: number | null;
                    quantity: number | null;
                    order_item_id: number | null;
                    order_item_combo_id: number | null;
                    order_item_half_id: number | null;
                    order_item_topping_id: number;
                    topping_price: number | null;
                }[];
                halves: ({
                    order_item_toppings: {
                        topping_id: number | null;
                        quantity: number | null;
                        order_item_id: number | null;
                        order_item_combo_id: number | null;
                        order_item_half_id: number | null;
                        order_item_topping_id: number;
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
                group_id: string | null;
                is_half_half: boolean | null;
                order_item_id: number | null;
                order_item_combo_id: number;
                order_combo_note: string | null;
            })[];
            halves: ({
                order_item_toppings: {
                    topping_id: number | null;
                    quantity: number | null;
                    order_item_id: number | null;
                    order_item_combo_id: number | null;
                    order_item_half_id: number | null;
                    order_item_topping_id: number;
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
            order_id: number | null;
            quantity: number | null;
            is_half_half: boolean | null;
            order_item_id: number;
            order_price: number | null;
            order_item_note: string | null;
        })[];
    } & {
        user_id: number | null;
        created_at: Date | null;
        order_id: number;
        user_address_id: number | null;
        payment_method: string | null;
        payment_status: string | null;
        total_price_dish: number | null;
        shipping_fee: number | null;
        discount_amount: number | null;
        total_order: number | null;
        order_note: string | null;
        order_status: string | null;
        shipped_at: Date | null;
        estimated_delivery_time: Date | null;
        arrived_at: Date | null;
        completed_at: Date | null;
        order_type: string | null;
        pickup_time: Date | null;
    })[]>;
    static updateOrderStatus(order_id: number, status: string): Promise<{
        user_id: number | null;
        created_at: Date | null;
        order_id: number;
        user_address_id: number | null;
        payment_method: string | null;
        payment_status: string | null;
        total_price_dish: number | null;
        shipping_fee: number | null;
        discount_amount: number | null;
        total_order: number | null;
        order_note: string | null;
        order_status: string | null;
        shipped_at: Date | null;
        estimated_delivery_time: Date | null;
        arrived_at: Date | null;
        completed_at: Date | null;
        order_type: string | null;
        pickup_time: Date | null;
    }>;
}
export {};
//# sourceMappingURL=orderService.d.ts.map