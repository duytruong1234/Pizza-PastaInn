interface ToppingInput {
    topping_id: number;
    quantity?: number;
}
interface HalfInput {
    dish_id: number;
    toppings?: ToppingInput[];
}
interface ComboSelectionInput {
    group_id: string;
    dish_price_id: string;
    is_half_half?: boolean;
    halves?: HalfInput[];
    toppings?: ToppingInput[];
}
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
type AddToCartInput = AddRegularItemInput | AddHalfHalfItemInput | AddComboItemInput;
export declare class CartService {
    /**
     * Tìm giỏ hàng hiện tại hoặc tạo mới nếu chưa có.
     * Nếu user_id được truyền, gắn giỏ hàng với user.
     */
    static getOrCreateCart(cart_id?: number | null, user_id?: number | null): Promise<number>;
    /**
     * Hàm chính: Điều phối thêm sản phẩm vào giỏ hàng theo loại (regular/half_half/combo).
     */
    static addItemToCart(input: AddToCartInput): Promise<{
        cart_id: number;
        cart_item_id: number;
    }>;
    /**
     * Thêm món thường (pizza đơn, spaghetti, salad, drink...) vào giỏ hàng.
     * Bảng liên quan: cart_items + cart_item_topping
     */
    private static addRegularItem;
    /**
     * Thêm pizza Half-Half vào giỏ hàng.
     * Bảng liên quan: cart_items + cart_item_half (2 nửa) + cart_item_topping
     */
    private static addHalfHalfItem;
    /**
     * Thêm Combo vào giỏ hàng.
     * Bảng liên quan: cart_items + cart_item_combos (các lựa chọn)
     *   + cart_item_topping (topping cho từng lựa chọn)
     *   + cart_item_half (nếu pizza half-half bên trong combo)
     */
    private static addComboItem;
    /**
     * Lấy chi tiết giỏ hàng kèm tất cả relations (5 bảng).
     * Dùng cho: load lại giỏ hàng từ DB, checkout, hiển thị trên frontend.
     */
    static getCartById(cart_id: number): Promise<({
        items: ({
            toppings: {
                topping_id: number | null;
                cart_item_id: number | null;
                quantity: number | null;
                cart_item_combo_id: number | null;
                cart_item_half_id: number | null;
                item_topping_id: number;
            }[];
            combos: ({
                toppings: {
                    topping_id: number | null;
                    cart_item_id: number | null;
                    quantity: number | null;
                    cart_item_combo_id: number | null;
                    cart_item_half_id: number | null;
                    item_topping_id: number;
                }[];
                halves: ({
                    cart_item_topping: {
                        topping_id: number | null;
                        cart_item_id: number | null;
                        quantity: number | null;
                        cart_item_combo_id: number | null;
                        cart_item_half_id: number | null;
                        item_topping_id: number;
                    }[];
                } & {
                    dish_id: number | null;
                    cart_item_id: number | null;
                    cart_item_combo_id: number | null;
                    cart_item_half_id: number;
                    cart_half_note: string | null;
                })[];
            } & {
                dish_price_id: string | null;
                group_id: string | null;
                cart_item_id: number | null;
                is_half_half: boolean | null;
                cart_item_combo_id: number;
                cart_combo_note: string | null;
            })[];
            halves: ({
                cart_item_topping: {
                    topping_id: number | null;
                    cart_item_id: number | null;
                    quantity: number | null;
                    cart_item_combo_id: number | null;
                    cart_item_half_id: number | null;
                    item_topping_id: number;
                }[];
            } & {
                dish_id: number | null;
                cart_item_id: number | null;
                cart_item_combo_id: number | null;
                cart_item_half_id: number;
                cart_half_note: string | null;
            })[];
        } & {
            combo_id: number | null;
            dish_price_id: string | null;
            cart_id: number | null;
            cart_item_id: number;
            quantity: number | null;
            is_half_half: boolean | null;
            price_cart: number | null;
            cart_item_note: string | null;
        })[];
    } & {
        user_id: number | null;
        created_at: Date | null;
        cart_id: number;
        total_price_cart: number | null;
    }) | null>;
    /**
     * Lấy giỏ hàng mới nhất của user theo user_id.
     * Dùng cho: đồng bộ giỏ hàng khi mở trang / đăng nhập.
     */
    static getCartByUserId(user_id: number): Promise<({
        items: ({
            toppings: {
                topping_id: number | null;
                cart_item_id: number | null;
                quantity: number | null;
                cart_item_combo_id: number | null;
                cart_item_half_id: number | null;
                item_topping_id: number;
            }[];
            combos: ({
                toppings: {
                    topping_id: number | null;
                    cart_item_id: number | null;
                    quantity: number | null;
                    cart_item_combo_id: number | null;
                    cart_item_half_id: number | null;
                    item_topping_id: number;
                }[];
                halves: ({
                    cart_item_topping: {
                        topping_id: number | null;
                        cart_item_id: number | null;
                        quantity: number | null;
                        cart_item_combo_id: number | null;
                        cart_item_half_id: number | null;
                        item_topping_id: number;
                    }[];
                } & {
                    dish_id: number | null;
                    cart_item_id: number | null;
                    cart_item_combo_id: number | null;
                    cart_item_half_id: number;
                    cart_half_note: string | null;
                })[];
            } & {
                dish_price_id: string | null;
                group_id: string | null;
                cart_item_id: number | null;
                is_half_half: boolean | null;
                cart_item_combo_id: number;
                cart_combo_note: string | null;
            })[];
            halves: ({
                cart_item_topping: {
                    topping_id: number | null;
                    cart_item_id: number | null;
                    quantity: number | null;
                    cart_item_combo_id: number | null;
                    cart_item_half_id: number | null;
                    item_topping_id: number;
                }[];
            } & {
                dish_id: number | null;
                cart_item_id: number | null;
                cart_item_combo_id: number | null;
                cart_item_half_id: number;
                cart_half_note: string | null;
            })[];
        } & {
            combo_id: number | null;
            dish_price_id: string | null;
            cart_id: number | null;
            cart_item_id: number;
            quantity: number | null;
            is_half_half: boolean | null;
            price_cart: number | null;
            cart_item_note: string | null;
        })[];
    } & {
        user_id: number | null;
        created_at: Date | null;
        cart_id: number;
        total_price_cart: number | null;
    }) | null>;
    /**
     * Xóa 1 cart_item và tất cả dữ liệu liên quan (cascade thủ công).
     * Do onDelete: NoAction nên phải xóa thủ công theo thứ tự.
     */
    static removeItemFromCart(cart_item_id: number): Promise<boolean>;
    /**
     * Cập nhật số lượng của 1 cart_item.
     */
    static updateItemQuantity(cart_item_id: number, quantity: number): Promise<boolean>;
    /**
     * Tính lại tổng tiền giỏ hàng từ tất cả cart_items.
     */
    static recalculateCartTotal(cart_id: number): Promise<number>;
    /**
     * Xóa tất cả items trong giỏ hàng (dùng khi checkout xong hoặc clear cart).
     */
    static clearCart(cart_id: number): Promise<boolean>;
}
export {};
//# sourceMappingURL=cartService.d.ts.map