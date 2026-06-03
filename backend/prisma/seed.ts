import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding data...');

  // Xoá data cũ
  await prisma.shopReview.deleteMany();
  await prisma.orderItemTopping.deleteMany();
  await prisma.orderItemHalf.deleteMany();
  await prisma.orderItemCombo.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  
  await prisma.cartItemTopping.deleteMany();
  await prisma.cartItemHalf.deleteMany();
  await prisma.cartItemCombo.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();

  await prisma.userAddress.deleteMany();
  await prisma.user.deleteMany();
  
  await prisma.store.deleteMany();
  
  // Tạo các chi nhánh cửa hàng (với tọa độ GPS chính xác để tính khoảng cách giao hàng)
  await prisma.store.create({
    data: {
      store_name: 'District 5 Branch',
      address: '21 Dao Tan Street, An Dong Ward, Ho Chi Minh City, Vietnam',
      hotline: '028 3924 0343',
      latitude: 10.7536,
      longitude: 106.6634,
      is_active: true,
    },
  });

  await prisma.store.create({
    data: {
      store_name: 'District 7 Branch',
      address: 'C001 Pham Thai Buong Street, Tan Hung Ward, Ho Chi Minh City, Vietnam',
      hotline: '028 5412 1197 - 028 5412 1196',
      latitude: 10.7296,
      longitude: 106.7002,
      is_active: true,
    },
  });
  
  await prisma.comboItem.deleteMany();
  await prisma.comboGroup.deleteMany();
  await prisma.combo.deleteMany();
  
  await prisma.dishPrice.deleteMany();
  await prisma.dish.deleteMany();
  await prisma.topping.deleteMany();
  await prisma.crust.deleteMany();
  await prisma.size.deleteMany();
  await prisma.category.deleteMany();

  // Tạo Categories
  const catPizza = await prisma.category.create({ data: { category_name: 'Pizza' } });
  const catPasta = await prisma.category.create({ data: { category_name: 'Mì Ý' } });

  // Tạo Sizes
  const sizeS = await prisma.size.create({ data: { size_name: 'Nhỏ (7 inch)' } });
  const sizeM = await prisma.size.create({ data: { size_name: 'Vừa (9 inch)' } });
  const sizeL = await prisma.size.create({ data: { size_name: 'Lớn (12 inch)' } });

  // Tạo Crusts
  const crustThin = await prisma.crust.create({ data: { crust_name: 'Đế Mỏng' } });
  const crustThick = await prisma.crust.create({ data: { crust_name: 'Đế Dày' } });
  const crustCheese = await prisma.crust.create({ data: { crust_name: 'Viền Phô Mai' } });

  // Tạo Toppings
  await prisma.topping.createMany({
    data: [
      { topping_name: 'Thêm Phô Mai', price_topping: 15000 },
      { topping_name: 'Thêm Xúc Xích', price_topping: 20000 },
      { topping_name: 'Thêm Dứa', price_topping: 10000 },
    ],
  });

  // Tạo Dishes
  const dish1 = await prisma.dish.create({
    data: {
      category_id: catPizza.category_id,
      dish_name: 'Pizza Hải Sản Nhiệt Đới',
      image: 'https://example.com/pizza-hai-san.jpg',
      ingredient: 'Tôm, mực, dứa, phô mai',
      dish_status: true,
    },
  });

  const dish2 = await prisma.dish.create({
    data: {
      category_id: catPasta.category_id,
      dish_name: 'Mì Ý Sốt Bò Băm',
      image: 'https://example.com/mi-y.jpg',
      ingredient: 'Mì Ý, bò băm, cà chua',
      dish_status: true,
    },
  });

  // Tạo Dish Prices
  await prisma.dishPrice.create({
    data: {
      dish_price_id: `dish_${dish1.dish_id}_size_${sizeM.size_id}_crust_${crustThick.crust_id}`,
      dish_id: dish1.dish_id,
      size_id: sizeM.size_id,
      crust_id: crustThick.crust_id,
      dish_price: 159000,
    },
  });

  await prisma.dishPrice.create({
    data: {
      dish_price_id: `dish_${dish2.dish_id}_size_null_crust_null`,
      dish_id: dish2.dish_id,
      size_id: null,
      crust_id: null,
      dish_price: 89000,
    },
  });

  // Admin user
  const adminPassword = await bcrypt.hash('admin', 10);
  await prisma.user.create({
    data: {
      username: 'Admin',
      email: 'admin@gmail.com',
      password: adminPassword,
      role: 'admin',
      user_status: true,
    }
  });

  console.log('Seeding done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
