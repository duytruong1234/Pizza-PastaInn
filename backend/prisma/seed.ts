import { PrismaClient } from '@prisma/client';

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
      { name: 'Thêm Phô Mai', price: 15000 },
      { name: 'Thêm Xúc Xích', price: 20000 },
      { name: 'Thêm Dứa', price: 10000 },
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
  await prisma.user.create({
    data: {
      username: 'Admin',
      email: 'admin@pizzapastainn.com',
      password: 'hashed_password_here', // Sẽ cần tự hash hoặc dùng bcrypt nếu tạo bằng tool
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
