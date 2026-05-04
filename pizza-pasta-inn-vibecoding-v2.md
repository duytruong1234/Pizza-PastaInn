# 🍕 Pizza&PastaInn — Vibe Coding Guide v2 (Production)

> Stack: **Next.js 14** + **Express** + **PostgreSQL** + **Prisma** + **Tailwind CSS** + **Redis** + **Cloudinary**

---

## 1. Cấu trúc thư mục

```
pizza-pasta-inn/
├── frontend/                        # Next.js 14 (App Router)
│   ├── app/
│   │   ├── layout.tsx               # Root layout (font, theme, providers)
│   │   ├── page.tsx                 # Trang chủ / menu
│   │   ├── (auth)/                  # Route group — không có layout chung
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── checkout/
│   │   │   └── page.tsx             # Thanh toán
│   │   ├── orders/
│   │   │   ├── page.tsx             # Lịch sử đơn hàng
│   │   │   └── [id]/page.tsx        # Chi tiết / theo dõi đơn
│   │   ├── profile/
│   │   │   ├── page.tsx             # Thông tin cá nhân
│   │   │   └── addresses/page.tsx   # Quản lý địa chỉ giao hàng
│   │   ├── combo/
│   │   │   └── page.tsx             # Trang combo (nếu tách riêng)
│   │   └── admin/
│   │       ├── layout.tsx           # Admin layout (sidebar riêng)
│   │       ├── page.tsx             # Dashboard tổng quan
│   │       ├── orders/page.tsx      # Kanban quản lý đơn hàng
│   │       ├── dishes/
│   │       │   ├── page.tsx         # Danh sách món ăn
│   │       │   └── [id]/page.tsx    # Sửa món ăn
│   │       ├── combos/page.tsx      # Quản lý combo
│   │       ├── toppings/page.tsx    # Quản lý topping
│   │       ├── reviews/page.tsx     # Quản lý đánh giá
│   │       └── users/page.tsx       # Quản lý tài khoản
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   └── Footer.tsx
│   │   ├── menu/
│   │   │   ├── CategoryTabs.tsx
│   │   │   ├── MenuGrid.tsx
│   │   │   ├── DishCard.tsx
│   │   │   └── ComboCard.tsx
│   │   ├── cart/
│   │   │   ├── CartSidebar.tsx
│   │   │   └── CartItem.tsx
│   │   ├── modals/
│   │   │   ├── DishDetailModal.tsx  # Chọn size / đế / topping
│   │   │   ├── HalfHalfModal.tsx    # Chọn 2 vị pizza
│   │   │   └── ComboDetailModal.tsx # Chọn món trong combo theo group
│   │   ├── order/
│   │   │   ├── OrderCard.tsx
│   │   │   ├── OrderStatusBadge.tsx
│   │   │   └── OrderTimeline.tsx
│   │   └── ui/                      # Shared UI: Button, Input, Badge, Toast...
│   ├── store/
│   │   ├── cartStore.ts             # Zustand — giỏ hàng (dish + combo + half)
│   │   └── authStore.ts             # Zustand — user session
│   ├── hooks/
│   │   ├── useMenu.ts               # React Query: fetch dishes + combos
│   │   ├── useCart.ts               # Sync cart lên server
│   │   └── useOrders.ts             # Fetch lịch sử đơn
│   ├── lib/
│   │   ├── api.ts                   # axios instance (baseURL + interceptor JWT)
│   │   └── utils.ts                 # formatPrice, formatDate, cn()...
│   └── types/
│       └── index.ts                 # TypeScript types dùng chung
│
├── backend/                         # Node.js + Express
│   ├── src/
│   │   ├── app.ts                   # Express app entry
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── menu.ts
│   │   │   ├── cart.ts
│   │   │   ├── orders.ts
│   │   │   ├── users.ts             # profile, địa chỉ
│   │   │   ├── stores.ts            # chi nhánh
│   │   │   └── admin/
│   │   │       ├── orders.ts
│   │   │       ├── dishes.ts
│   │   │       ├── combos.ts
│   │   │       ├── toppings.ts
│   │   │       ├── reviews.ts
│   │   │       └── users.ts
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── menuController.ts
│   │   │   ├── cartController.ts
│   │   │   ├── orderController.ts
│   │   │   ├── userController.ts
│   │   │   └── admin/
│   │   │       ├── adminOrderController.ts
│   │   │       ├── adminDishController.ts
│   │   │       └── adminComboController.ts
│   │   ├── services/                # Business logic tách khỏi controller
│   │   │   ├── cartService.ts       # Tính giá, merge cart
│   │   │   ├── orderService.ts      # Tạo đơn, snapshot giá
│   │   │   ├── paymentService.ts    # VNPay / MoMo / ZaloPay
│   │   │   └── uploadService.ts     # Cloudinary upload
│   │   ├── middleware/
│   │   │   ├── auth.ts              # JWT verify
│   │   │   ├── checkRole.ts         # admin / customer
│   │   │   └── errorHandler.ts      # Global error handler
│   │   ├── validators/              # Zod schemas validate request body
│   │   │   ├── authValidator.ts
│   │   │   ├── cartValidator.ts
│   │   │   └── orderValidator.ts
│   │   ├── utils/
│   │   │   ├── response.ts          # sendSuccess / sendError helpers
│   │   │   ├── redis.ts             # Redis client singleton
│   │   │   └── logger.ts            # Winston logger
│   │   └── lib/
│   │       └── prisma.ts            # Prisma client singleton
│   └── prisma/
│       ├── schema.prisma
│       └── seed.ts
│
└── shared/
    └── types.ts                     # Types dùng chung FE + BE
```

---

## 2. Khởi tạo dự án

```bash
mkdir pizza-pasta-inn && cd pizza-pasta-inn

# --- FRONTEND ---
npx create-next-app@latest frontend \
  --typescript --tailwind --eslint --app --src-dir=false

cd frontend
npm install zustand @tanstack/react-query axios
npm install class-variance-authority clsx tailwind-merge  # cho cn() utility

cd ..

# --- BACKEND ---
mkdir backend && cd backend
npm init -y
npm install express cors dotenv bcryptjs jsonwebtoken
npm install zod                        # validate input
npm install ioredis                    # Redis client
npm install multer                     # upload file
npm install cloudinary                 # Cloudinary SDK
npm install winston                    # logging
npm install -D typescript ts-node @types/express @types/node \
  @types/cors @types/bcryptjs @types/jsonwebtoken \
  @types/multer nodemon

# Prisma
npm install prisma @prisma/client
npx prisma init

cd ..
```

---

## 3. Màu sắc & Theme (Tailwind)

```ts
// frontend/tailwind.config.ts
colors: {
  pizza: {
    red:       '#c0392b',
    darkred:   '#8B0000',
    green:     '#1a4a1a',
    darkgreen: '#0d2b0d',
    gold:      '#d4a017',
    cream:     '#f5f0e8',
    card:      '#2a1f1a',
    sidebar:   '#1c1208',
  }
}
```

---

## 4. Prisma Schema (đầy đủ — khớp 100% với database thực tế)

```prisma
// backend/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── LOOKUP TABLES ────────────────────────────────────────────────────────────

model Category {
  category_id   Int    @id @default(autoincrement())
  category_name String @db.VarChar(50)

  dishes Dish[]

  @@map("categories")
}

model Size {
  size_id    Int     @id @default(autoincrement())
  size_name  String  @db.VarChar(50)
  is_visible Boolean @default(true)

  dish_prices DishPrice[]

  @@map("sizes")
}

model Crust {
  crust_id   Int     @id @default(autoincrement())
  crust_name String  @db.VarChar(50)
  is_visible Boolean @default(true)

  dish_prices DishPrice[]

  @@map("crusts")
}

model Topping {
  topping_id Int    @id @default(autoincrement())
  name       String @db.VarChar(100)   // tên field là "name", không phải "topping_name"
  price      Int    @default(0)

  cart_item_toppings  CartItemTopping[]
  order_item_toppings OrderItemTopping[]

  @@map("toppings")
}

// ─── MENU ─────────────────────────────────────────────────────────────────────

model Dish {
  dish_id     Int     @id @default(autoincrement())
  category_id Int?
  dish_name   String  @db.VarChar(100)
  image       String?
  ingredient  String?
  dish_status Boolean?

  category          Category?         @relation(fields: [category_id], references: [category_id])
  prices            DishPrice[]
  cart_item_halves  CartItemHalf[]
  order_item_halves OrderItemHalf[]

  @@map("dishes")
}

model DishPrice {
  dish_price_id String @id @db.VarChar(100)  // ví dụ: "dish_1_size_2_crust_3"
  dish_id       Int?
  size_id       Int?
  crust_id      Int?
  dish_price    Int    @default(0)

  dish  Dish?  @relation(fields: [dish_id], references: [dish_id], onDelete: Cascade)
  size  Size?  @relation(fields: [size_id], references: [size_id])
  crust Crust? @relation(fields: [crust_id], references: [crust_id])

  combo_items     ComboItem[]
  cart_items      CartItem[]
  cart_item_combos CartItemCombo[]
  order_items     OrderItem[]
  order_item_combos OrderItemCombo[]

  @@map("dish_prices")
}

// ─── COMBO ────────────────────────────────────────────────────────────────────

model Combo {
  combo_id    Int     @id @default(autoincrement())
  combo_name  String  @db.VarChar(100)
  combo_price Int
  description String?
  is_active   Boolean @default(true)

  groups     ComboGroup[]
  cart_items CartItem[]
  order_items OrderItem[]

  @@map("combos")
}

model ComboGroup {
  // group_id là VARCHAR (ví dụ: "combo_1_group_1") — dùng string PK
  group_id   String @id @db.VarChar(50)
  combo_id   Int?
  group_name String
  min_select Int    @default(1)
  max_select Int    @default(1)

  combo        Combo?         @relation(fields: [combo_id], references: [combo_id], onDelete: Cascade)
  combo_items  ComboItem[]
  cart_combos  CartItemCombo[]
  order_combos OrderItemCombo[]

  @@map("combo_groups")
}

model ComboItem {
  combo_item_id Int    @id @default(autoincrement())
  group_id      String? @db.VarChar(50)
  dish_price_id String? @db.VarChar(100)
  price_extra   Int    @default(0)

  group      ComboGroup? @relation(fields: [group_id], references: [group_id], onDelete: Cascade)
  dish_price DishPrice?  @relation(fields: [dish_price_id], references: [dish_price_id], onDelete: Cascade)

  @@map("combo_items")
}

// ─── STORE ────────────────────────────────────────────────────────────────────

model Store {
  store_id   Int     @id @default(autoincrement())
  store_name String? @db.VarChar(255)
  address    String?
  latitude   Decimal?
  longitude  Decimal?
  hotline    String? @db.VarChar(20)
  is_active  Boolean?

  @@map("stores")
}

// ─── USER ─────────────────────────────────────────────────────────────────────

model User {
  user_id     Int      @id @default(autoincrement())
  username    String?  @db.VarChar(100)
  email       String?  @db.VarChar(100) @unique
  phone       String?  @db.VarChar(20)
  password    String?  @db.VarChar(255)
  role        String?  @db.VarChar(50)  // "customer" | "cashier" | "admin"
  user_status Boolean?
  created_at  DateTime?

  cart      Cart?
  orders    Order[]
  addresses UserAddress[]
  reviews   ShopReview[]

  @@map("users")
}

model UserAddress {
  user_address_id Int      @id @default(autoincrement())
  user_id         Int?
  address_line    String?
  is_default      Boolean?

  user   User?   @relation(fields: [user_id], references: [user_id])
  orders Order[]

  @@map("user_address")
}

// ─── CART ─────────────────────────────────────────────────────────────────────

model Cart {
  cart_id          Int       @id @default(autoincrement())
  user_id          Int?      @unique
  created_at       DateTime?
  order_note       String?
  total_price_cart Int?

  user  User?      @relation(fields: [user_id], references: [user_id])
  items CartItem[]

  @@map("carts")
}

model CartItem {
  cart_item_id   Int     @id @default(autoincrement())
  cart_id        Int?
  dish_price_id  String? @db.VarChar(100)  // null nếu là combo
  combo_id       Int?
  quantity       Int?
  is_half_half   Boolean?
  price_cart     Int?
  cart_item_note String?

  cart       Cart?           @relation(fields: [cart_id], references: [cart_id])
  dish_price DishPrice?      @relation(fields: [dish_price_id], references: [dish_price_id])
  combo      Combo?          @relation(fields: [combo_id], references: [combo_id])
  toppings   CartItemTopping[]
  halves     CartItemHalf[]
  combos     CartItemCombo[]

  @@map("cart_items")
}

// Topping của cart_item (món đơn) HOẶC cart_item_combo (slot combo) — không gắn trực tiếp vào half
// Nếu is_half_half=true thì topping gắn vào combo slot (cart_item_combo_id), không phải half riêng
model CartItemTopping {
  item_topping_id    Int  @id @default(autoincrement())
  cart_item_id       Int?   // null nếu là topping của combo slot
  cart_item_combo_id Int?   // null nếu là topping của món lẻ
  topping_id         Int?
  quantity           Int?

  cart_item       CartItem?      @relation(fields: [cart_item_id], references: [cart_item_id])
  cart_item_combo CartItemCombo? @relation(fields: [cart_item_combo_id], references: [cart_item_combo_id])
  topping         Topping?       @relation(fields: [topping_id], references: [topping_id])

  @@map("cart_item_topping")
}

// Slot món trong combo (1 cart_item combo → nhiều cart_item_combo slot theo group)
model CartItemCombo {
  cart_item_combo_id Int     @id @default(autoincrement())
  cart_item_id       Int?
  group_id           String? @db.VarChar(50)
  dish_price_id      String? @db.VarChar(100)
  is_half_half       Boolean?
  cart_combo_note    String?

  cart_item  CartItem?    @relation(fields: [cart_item_id], references: [cart_item_id])
  group      ComboGroup?  @relation(fields: [group_id], references: [group_id])
  dish_price DishPrice?   @relation(fields: [dish_price_id], references: [dish_price_id])
  toppings   CartItemTopping[]
  halves     CartItemHalf[]

  @@map("cart_item_combos")
}

// Half pizza: gắn vào cart_item (món lẻ half) hoặc cart_item_combo (combo slot half)
model CartItemHalf {
  cart_item_half_id  Int    @id @default(autoincrement())
  cart_item_id       Int?   // null nếu là half của combo slot
  cart_item_combo_id Int?   // null nếu là half của món lẻ
  dish_id            Int?
  cart_half_note     String?

  cart_item       CartItem?      @relation(fields: [cart_item_id], references: [cart_item_id])
  cart_item_combo CartItemCombo? @relation(fields: [cart_item_combo_id], references: [cart_item_combo_id])
  dish            Dish?          @relation(fields: [dish_id], references: [dish_id])

  @@map("cart_item_half")
}

// ─── ORDER ────────────────────────────────────────────────────────────────────

model Order {
  order_id                Int       @id @default(autoincrement())
  user_id                 Int?
  user_address_id         Int?
  payment_method          String?   @db.VarChar(50)   // "cod" | "vnpay" | "momo" | "zalopay"
  payment_status          String?   @db.VarChar(50)   // "pending" | "paid" | "failed"
  total_price_dish        Int?
  shipping_fee            Int?
  discount_amount         Int?
  total_order             Int?
  order_note              String?
  created_at              DateTime?
  order_status            String?   @db.VarChar(50)   // "pending" | "confirmed" | "preparing" | "shipped" | "arrived" | "completed" | "cancelled"
  shipped_at              DateTime?
  estimated_delivery_time DateTime?
  arrived_at              DateTime?
  completed_at            DateTime?
  order_type              String?   @db.VarChar(50)   // "delivery" | "pickup"
  pickup_time             DateTime?

  user         User?        @relation(fields: [user_id], references: [user_id])
  user_address UserAddress? @relation(fields: [user_address_id], references: [user_address_id])
  items        OrderItem[]
  reviews      ShopReview[]

  @@map("orders")
}

model OrderItem {
  order_item_id   Int     @id @default(autoincrement())
  order_id        Int?
  dish_price_id   String? @db.VarChar(100)
  combo_id        Int?
  quantity        Int?
  is_half_half    Boolean?
  order_price     Int?
  order_item_note String?

  order      Order?     @relation(fields: [order_id], references: [order_id])
  dish_price DishPrice? @relation(fields: [dish_price_id], references: [dish_price_id])
  combo      Combo?     @relation(fields: [combo_id], references: [combo_id])
  toppings   OrderItemTopping[]
  halves     OrderItemHalf[]
  combos     OrderItemCombo[]

  @@map("order_items")
}

// Topping của order_item (món lẻ) HOẶC order_item_combo (slot combo) — không có half_id
model OrderItemTopping {
  order_item_topping_id Int  @id @default(autoincrement())
  order_item_id         Int?   // null nếu là topping của combo slot
  order_item_combo_id   Int?   // null nếu là topping của món lẻ
  topping_id            Int?
  quantity              Int?
  topping_price         Int?  // snapshot giá tại thời điểm đặt hàng

  order_item       OrderItem?      @relation(fields: [order_item_id], references: [order_item_id])
  order_item_combo OrderItemCombo? @relation(fields: [order_item_combo_id], references: [order_item_combo_id])
  topping          Topping?        @relation(fields: [topping_id], references: [topping_id])

  @@map("order_item_toppings")
}

model OrderItemCombo {
  order_item_combo_id Int     @id @default(autoincrement())
  order_item_id       Int?
  group_id            String? @db.VarChar(50)
  dish_price_id       String? @db.VarChar(100)
  is_half_half        Boolean?
  order_combo_note    String?

  order_item OrderItem?  @relation(fields: [order_item_id], references: [order_item_id])
  group      ComboGroup? @relation(fields: [group_id], references: [group_id])
  dish_price DishPrice?  @relation(fields: [dish_price_id], references: [dish_price_id])
  toppings   OrderItemTopping[]
  halves     OrderItemHalf[]

  @@map("order_item_combos")
}

// Half pizza trong order: gắn vào order_item (món lẻ) hoặc order_item_combo (slot combo)
model OrderItemHalf {
  order_item_half_id  Int    @id @default(autoincrement())
  order_item_id       Int?   // null nếu là half của combo slot
  order_item_combo_id Int?   // null nếu là half của món lẻ
  dish_id             Int?
  order_half_note     String?

  order_item       OrderItem?      @relation(fields: [order_item_id], references: [order_item_id])
  order_item_combo OrderItemCombo? @relation(fields: [order_item_combo_id], references: [order_item_combo_id])
  dish             Dish?           @relation(fields: [dish_id], references: [dish_id])

  @@map("order_item_half")
}

// ─── REVIEW ───────────────────────────────────────────────────────────────────

model ShopReview {
  review_id   Int       @id @default(autoincrement())
  user_id     Int?
  order_id    Int?
  rating_star Int?
  comment     String?
  image_url   String?
  shop_reply  String?
  created_at  DateTime?
  is_visible  Boolean?

  user  User?  @relation(fields: [user_id], references: [user_id])
  order Order? @relation(fields: [order_id], references: [order_id])

  @@map("shop_reviews")
}
```

> **📌 Ghi chú thiết kế quan trọng (đọc trước khi code):**
>
> **1. Topping không gắn vào half riêng lẻ** — `cart_item_topping` và `order_item_toppings` chỉ có 2 FK: `cart_item_id` (món lẻ) hoặc `cart_item_combo_id` (slot combo). Topping của pizza half-half được gắn vào *combo slot* chứa nó, không gắn vào từng nửa bánh riêng.
>
> **2. `dish_price_id` là VARCHAR** — format: `"dish_{dish_id}_size_{size_id}_crust_{crust_id}"`. Backend tự sinh khi tạo tổ hợp giá, không auto-increment.
>
> **3. `group_id` là VARCHAR** — format: `"combo_{combo_id}_group_{n}"`. Tương tự `dish_price_id`.
>
> **4. 3 roles** — `customer` (khách hàng), `cashier` (thu ngân — chỉ xem + cập nhật trạng thái đơn), `admin` (toàn quyền CRUD). Middleware `checkRole` cần phân biệt rõ.
>
> **5. Snapshot giá khi tạo đơn** — `order_price` trong `order_items` và `topping_price` trong `order_item_toppings` phải được chốt tại thời điểm `POST /orders`, không lấy lại từ `dish_prices` hay `toppings` sau này.

---

## 5. API Routes (đầy đủ)

### Auth
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/api/auth/register` | — | Đăng ký |
| POST | `/api/auth/login` | — | Đăng nhập → trả JWT |
| GET | `/api/auth/me` | ✅ | Thông tin user hiện tại |
| POST | `/api/auth/logout` | ✅ | Đăng xuất (blacklist token Redis) |

### Menu
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/api/menu/categories` | — | Danh mục |
| GET | `/api/menu/dishes` | — | Danh sách món (`?category_id=&search=`) |
| GET | `/api/menu/dishes/:id` | — | Chi tiết món + giá theo size/đế |
| GET | `/api/menu/toppings` | — | Danh sách topping |
| GET | `/api/menu/combos` | — | Danh sách combo |
| GET | `/api/menu/combos/:id` | — | Chi tiết combo + groups + items |
| GET | `/api/menu/sizes` | — | Danh sách size (is_visible=true) |
| GET | `/api/menu/crusts` | — | Danh sách đế (is_visible=true) |

### Cart
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/api/cart` | ✅ | Lấy giỏ hàng hiện tại (full nested) |
| POST | `/api/cart/items` | ✅ | Thêm món đơn vào giỏ |
| POST | `/api/cart/combos` | ✅ | Thêm combo vào giỏ |
| PATCH | `/api/cart/items/:id` | ✅ | Sửa số lượng / note |
| DELETE | `/api/cart/items/:id` | ✅ | Xóa 1 item khỏi giỏ |
| DELETE | `/api/cart` | ✅ | Xóa toàn bộ giỏ |

### Orders
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/api/orders` | ✅ | Tạo đơn từ giỏ hàng |
| GET | `/api/orders` | ✅ | Lịch sử đơn hàng của user |
| GET | `/api/orders/:id` | ✅ | Chi tiết đơn hàng |
| POST | `/api/orders/:id/review` | ✅ | Gửi đánh giá sau đơn |

### Users
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/api/users/profile` | ✅ | Thông tin cá nhân |
| PATCH | `/api/users/profile` | ✅ | Cập nhật tên / số điện thoại |
| PATCH | `/api/users/password` | ✅ | Đổi mật khẩu |
| GET | `/api/users/addresses` | ✅ | Danh sách địa chỉ |
| POST | `/api/users/addresses` | ✅ | Thêm địa chỉ |
| PATCH | `/api/users/addresses/:id` | ✅ | Sửa địa chỉ |
| DELETE | `/api/users/addresses/:id` | ✅ | Xóa địa chỉ |
| PATCH | `/api/users/addresses/:id/default` | ✅ | Đặt làm địa chỉ mặc định |

### Stores
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/api/stores` | — | Danh sách chi nhánh (is_active=true) |

### Payment
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/api/payment/vnpay/create` | ✅ | Tạo URL thanh toán VNPay |
| GET | `/api/payment/vnpay/return` | — | VNPay callback (return URL) |
| POST | `/api/payment/vnpay/ipn` | — | VNPay IPN webhook |
| POST | `/api/payment/momo/create` | ✅ | Tạo URL thanh toán MoMo |
| POST | `/api/payment/momo/ipn` | — | MoMo IPN webhook |

### Admin
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/api/admin/orders` | 🔐admin/cashier | Tất cả đơn (`?status=&date=`) |
| PATCH | `/api/admin/orders/:id/status` | 🔐admin/cashier | Cập nhật trạng thái đơn |
| GET | `/api/admin/dishes` | 🔐 | Danh sách món (cả ẩn) |
| POST | `/api/admin/dishes` | 🔐 | Thêm món mới |
| PATCH | `/api/admin/dishes/:id` | 🔐 | Sửa món |
| DELETE | `/api/admin/dishes/:id` | 🔐 | Xóa món |
| GET | `/api/admin/combos` | 🔐 | Danh sách combo |
| POST | `/api/admin/combos` | 🔐 | Thêm combo mới |
| PATCH | `/api/admin/combos/:id` | 🔐 | Sửa combo |
| DELETE | `/api/admin/combos/:id` | 🔐 | Xóa combo |
| GET | `/api/admin/toppings` | 🔐 | Danh sách topping |
| POST | `/api/admin/toppings` | 🔐 | Thêm topping |
| PATCH | `/api/admin/toppings/:id` | 🔐 | Sửa topping |
| DELETE | `/api/admin/toppings/:id` | 🔐 | Xóa topping |
| GET | `/api/admin/reviews` | 🔐 | Danh sách đánh giá |
| PATCH | `/api/admin/reviews/:id` | 🔐 | Reply / ẩn đánh giá |
| GET | `/api/admin/users` | 🔐 | Danh sách tài khoản |
| PATCH | `/api/admin/users/:id/status` | 🔐 | Khoá / mở tài khoản |
| POST | `/api/admin/upload` | 🔐 | Upload ảnh lên Cloudinary |

> ✅ = cần login | 🔐 = cần login + role admin

---

## 6. Zustand Stores

### cartStore.ts — đầy đủ 3 loại item

```ts
// frontend/store/cartStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ToppingItem {
  topping_id: number
  topping_name: string
  price: number
  quantity: number
}

interface HalfPizza {
  dish_id: number
  dish_name: string
  note?: string
  toppings: ToppingItem[]
}

// Món đơn (có thể là half-half)
interface CartDishItem {
  type: 'dish'
  cart_item_id: string          // temp UUID (nanoid)
  dish_price_id: string
  dish_name: string
  image?: string
  size_name: string
  crust_name: string
  is_half_half: boolean
  half?: HalfPizza              // pizza nửa thứ 2
  toppings: ToppingItem[]
  quantity: number
  unit_price: number
  note?: string
}

// Slot món trong combo (1 group → 1 slot)
interface ComboSlot {
  group_id: string
  group_name: string
  dish_price_id: string
  dish_name: string
  size_name: string
  crust_name: string
  is_half_half: boolean
  half?: HalfPizza
  toppings: ToppingItem[]
  price_extra: number
  note?: string
}

// Combo
interface CartComboItem {
  type: 'combo'
  cart_item_id: string
  combo_id: number
  combo_name: string
  slots: ComboSlot[]
  quantity: number
  base_price: number            // combo_price gốc
  note?: string
}

type CartItem = CartDishItem | CartComboItem

// ─── Store ───────────────────────────────────────────────────────────────────

interface CartStore {
  items: CartItem[]
  addDish: (item: CartDishItem) => void
  addCombo: (item: CartComboItem) => void
  updateQty: (id: string, qty: number) => void
  removeItem: (id: string) => void
  clearCart: () => void
  totalItems: () => number
  totalPrice: () => number
}

const calcDishPrice = (item: CartDishItem): number => {
  const toppingSum = item.toppings.reduce((s, t) => s + t.price * t.quantity, 0)
  const halfToppingSum = item.half?.toppings.reduce((s, t) => s + t.price * t.quantity, 0) ?? 0
  return (item.unit_price + toppingSum + halfToppingSum) * item.quantity
}

const calcComboPrice = (item: CartComboItem): number => {
  const extraSum = item.slots.reduce((s, slot) => {
    const toppingSum = slot.toppings.reduce((t, tp) => t + tp.price * tp.quantity, 0)
    const halfToppingSum = slot.half?.toppings.reduce((t, tp) => t + tp.price * tp.quantity, 0) ?? 0
    return s + slot.price_extra + toppingSum + halfToppingSum
  }, 0)
  return (item.base_price + extraSum) * item.quantity
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addDish: (item) => set(s => {
        const exists = s.items.find(i => i.cart_item_id === item.cart_item_id)
        if (exists) {
          return {
            items: s.items.map(i =>
              i.cart_item_id === item.cart_item_id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            )
          }
        }
        return { items: [...s.items, item] }
      }),

      addCombo: (item) => set(s => ({ items: [...s.items, item] })),

      updateQty: (id, qty) => set(s => ({
        items: qty <= 0
          ? s.items.filter(i => i.cart_item_id !== id)
          : s.items.map(i => i.cart_item_id === id ? { ...i, quantity: qty } : i)
      })),

      removeItem: (id) => set(s => ({ items: s.items.filter(i => i.cart_item_id !== id) })),

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((s, i) => s + i.quantity, 0),

      totalPrice: () => get().items.reduce((s, item) => {
        if (item.type === 'dish') return s + calcDishPrice(item)
        if (item.type === 'combo') return s + calcComboPrice(item)
        return s
      }, 0),
    }),
    { name: 'pizza-cart' }
  )
)
```

### authStore.ts

```ts
// frontend/store/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  user_id: number
  username: string
  email: string
  phone?: string
  role: 'customer' | 'cashier' | 'admin'  // cashier = thu ngân
}

interface AuthStore {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  isAdmin: () => boolean
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      clearAuth: () => set({ user: null, token: null }),
      isAdmin: () => get().user?.role === 'admin',
      isCashier: () => get().user?.role === 'cashier',
      canManageOrders: () => ['admin', 'cashier'].includes(get().user?.role ?? ''),
    }),
    { name: 'pizza-auth' }
  )
)
```

---

## 7. Env Variables (đầy đủ)

```env
# backend/.env
DATABASE_URL="postgresql://user:password@localhost:5432/pizza_pasta_inn"
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_EXPIRES_IN="7d"
PORT=4000

# Redis
REDIS_URL="redis://localhost:6379"

# Cloudinary
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# VNPay (https://sandbox.vnpayment.vn)
VNPAY_TMN_CODE=""
VNPAY_HASH_SECRET=""
VNPAY_URL="https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
VNPAY_RETURN_URL="http://localhost:3000/checkout/vnpay-return"

# MoMo
MOMO_PARTNER_CODE=""
MOMO_ACCESS_KEY=""
MOMO_SECRET_KEY=""
MOMO_ENDPOINT="https://test-payment.momo.vn/v2/gateway/api/create"

# ZaloPay (tuỳ chọn)
ZALOPAY_APP_ID=""
ZALOPAY_KEY1=""
ZALOPAY_KEY2=""
ZALOPAY_ENDPOINT="https://sb-openapi.zalopay.vn/v2/create"
```

```env
# frontend/.env.local
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
NEXT_PUBLIC_GOOGLE_MAPS_KEY=""
```

---

## 8. Thứ tự build (checklist chuẩn production)

### Giai đoạn 1 — Setup & Database (Tuần 1)
- [ ] Khởi tạo Next.js + cấu hình Tailwind với màu pizza
- [ ] Khởi tạo Express backend + TypeScript
- [ ] Kết nối PostgreSQL + init Prisma
- [ ] Viết **toàn bộ** Prisma schema (mục 4 bên trên)
- [ ] Chạy `prisma migrate dev --name init`
- [ ] Viết `seed.ts`: categories, sizes, crusts, toppings, dishes, dish_prices, combos, combo_groups, combo_items, stores
- [ ] Setup Redis (ioredis client singleton)
- [ ] Setup global error handler + response helpers

### Giai đoạn 2 — Auth (Tuần 1–2)
- [ ] API `POST /auth/register` + bcrypt hash password
- [ ] API `POST /auth/login` → trả `accessToken` (JWT, 7d)
- [ ] Middleware `verifyToken` cho routes cần auth
- [ ] Middleware `checkRole('admin')` cho admin routes
- [ ] API `GET /auth/me`
- [ ] API `POST /auth/logout` (lưu token vào Redis blacklist)
- [ ] Frontend: form đăng nhập / đăng ký
- [ ] Frontend: lưu token + user vào `authStore` (persist)
- [ ] Frontend: axios interceptor — tự gắn `Authorization: Bearer <token>`

### Giai đoạn 3 — Menu UI (Tuần 2–4)
- [ ] API `GET /menu/categories`, `/menu/dishes`, `/menu/sizes`, `/menu/crusts`
- [ ] API `GET /menu/toppings?size_id=`
- [ ] API `GET /menu/combos` + `GET /menu/combos/:id`
- [ ] Component `CategoryTabs`, `MenuGrid`, `DishCard`, `ComboCard`
- [ ] Modal `DishDetailModal` — chọn size, đế, topping, note
- [ ] Modal `HalfHalfModal` — search + chọn pizza nửa thứ 2
- [ ] Modal `ComboDetailModal` — chọn món theo từng group (min/max_select)
- [ ] Component `CartSidebar` + `CartItem` (hiển thị đủ dish / combo / half)
- [ ] Zustand `cartStore` — addDish / addCombo / updateQty / removeItem
- [ ] Tính tổng tiền realtime (bao gồm topping + price_extra)

### Giai đoạn 4 — Tài khoản & Địa chỉ (Tuần 4)
- [ ] API CRUD `/users/profile`, `/users/password`
- [ ] API CRUD `/users/addresses` (thêm / sửa / xóa / đặt default)
- [ ] Trang `/profile` — sửa thông tin
- [ ] Trang `/profile/addresses` — quản lý địa chỉ

### Giai đoạn 5 — Checkout & Đơn hàng (Tuần 5–6)
- [ ] API `POST /cart/items` + `POST /cart/combos` — sync giỏ lên DB
- [ ] Trang `/checkout`:
  - Chọn địa chỉ giao hàng (hoặc nhập mới)
  - Chọn chi nhánh (pickup)
  - Chọn phương thức thanh toán (COD / VNPay / MoMo)
  - Ghi chú đơn hàng
- [ ] API `POST /orders` — snapshot giá vào order_items + order_item_toppings
- [ ] Tích hợp VNPay (sandbox) — tạo URL + xử lý IPN callback
- [ ] Tích hợp MoMo (sandbox) — tạo URL + xử lý IPN callback
- [ ] Trang `/orders` — lịch sử đơn hàng
- [ ] Trang `/orders/[id]` — chi tiết + timeline trạng thái

### Giai đoạn 6 — Admin (Tuần 7–8)
- [ ] Layout admin riêng (sidebar, auth guard)
- [ ] Trang `/admin/orders` — Kanban: pending → confirmed → preparing → shipped → arrived → completed
- [ ] API `PATCH /admin/orders/:id/status` — cập nhật trạng thái
- [ ] Trang `/admin/dishes` — CRUD món ăn + upload ảnh Cloudinary
- [ ] Trang `/admin/combos` — CRUD combo + combo_groups + combo_items
- [ ] Trang `/admin/toppings` — CRUD topping
- [ ] Trang `/admin/reviews` — duyệt, reply, ẩn đánh giá
- [ ] Trang `/admin/users` — xem + khoá tài khoản

### Giai đoạn 7 — Hoàn thiện & Deploy (Tuần 9)
- [ ] Trang đánh giá: gửi review sau khi đơn completed
- [ ] SEO: `next/metadata`, `sitemap.xml`, JSON-LD schema
- [ ] Rate limiting (express-rate-limit) cho auth routes
- [ ] CORS config chặt chẽ cho production
- [ ] Deploy frontend: **Vercel**
- [ ] Deploy backend + PostgreSQL + Redis: **Railway** hoặc **Render**

---

## 9. Scripts hữu ích

```bash
# Dev
cd backend && npx ts-node src/app.ts
cd frontend && npm run dev

# Prisma
npx prisma migrate dev --name init    # tạo migration lần đầu
npx prisma migrate dev --name <name>  # migration khi sửa schema
npx prisma studio                     # GUI xem database
npx prisma db seed                    # seed data mẫu
npx prisma generate                   # regenerate Prisma client

# Build production
cd frontend && npm run build
cd backend && npx tsc && node dist/app.js

# Redis (local)
redis-server
redis-cli ping  # → PONG
```

---

## 10. Tips Vibe Coding

> Paste từng phần vào AI, nêu rõ context để được code tốt nhất.

**Prompt mẫu:**

```
Tôi đang làm web pizza Pizza&PastaInn.
Stack: Next.js 14 + Express + PostgreSQL + Prisma + Tailwind.
Database: [dán schema liên quan từ mục 4]
API: [dán endpoint liên quan từ mục 5]

Hãy viết [component/API/hook/service] cho [tính năng cụ thể].
Yêu cầu: TypeScript strict, xử lý lỗi đầy đủ, comment tiếng Việt.
```

**Thứ tự vibe coding hiệu quả:**
1. Schema trước → migrate → seed → mới code API
2. API endpoint → test Postman → mới code UI
3. Một tính năng hoàn chỉnh (API + UI) rồi mới sang tính năng khác
4. Commit git sau mỗi tính năng: `feat: add combo cart flow`
5. Không sửa schema sau khi đã có data thật — dùng `prisma migrate dev` đúng cách

---

*Tài liệu v2 — cập nhật đầy đủ theo database thực tế (Pizza_PastaInn.backup)*
*23 bảng | Next.js 14 + Express + PostgreSQL + Prisma + Redis + Cloudinary*
