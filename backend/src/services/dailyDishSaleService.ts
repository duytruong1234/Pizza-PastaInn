import prisma from '../lib/prisma';
import { logger } from '../utils/logger';

const VIETNAM_UTC_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * Chuẩn hóa dish_id:
 * - Các biến thể Garlic Bread nội bộ của Combo (62: 4 miếng, 63: 8 miếng, 64: 2 miếng)
 *   được quy về món lẻ Garlic Bread gốc (dish_id = 44).
 * - Dish 65 (Half-Half placeholder) trả về null vì đã được tách thành 2 nửa pizza cụ thể ở bảng order_item_half.
 */
export function normalizeIndividualDishId(dishId: number | null | undefined): number | null {
  if (!dishId || dishId <= 0) return null;
  if (dishId === 65) return null; // Half-Half container
  if (dishId === 62 || dishId === 63 || dishId === 64) return 44; // Garlic Bread
  return dishId;
}

/**
 * Hệ số nhân số lượng món lẻ nằm trong tên nhóm Combo (ví dụ: "2 Pepsi", "Pepsi 2 can", "Choose Pepsi 4 can...")
 */
function getComboGroupQuantityMultiplier(groupName: string | null | undefined, dishId: number): number {
  if (!groupName) return 1;
  const lower = groupName.toLowerCase();
  // Nếu khách chọn chai Pepsi 1.5L (dish_id = 53) trong nhóm "Choose Pepsi 4 can or 1 Pepsi 1,5L" thì tính là 1 chai
  if (dishId === 53) return 1;
  if (dishId === 50) {
    if (lower.includes('4 can') || lower.includes('4 pepsi')) return 4;
    if (lower.includes('2 can') || lower.includes('2 pepsi')) return 2;
  }
  return 1;
}

/**
 * Chuyển Date bất kỳ sang chuỗi YYYY-MM-DD theo múi giờ Việt Nam (UTC+7)
 */
export function toVietnamDateString(date: Date): string {
  const vn = new Date(date.getTime() + VIETNAM_UTC_OFFSET_MS);
  const y = vn.getUTCFullYear();
  const m = String(vn.getUTCMonth() + 1).padStart(2, '0');
  const d = String(vn.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Tạo đối tượng Date chuẩn UTC 00:00:00 từ chuỗi YYYY-MM-DD để lưu vào cột @db.Date
 */
export function parseDateOnlyUTC(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

export interface DishForecastDetail {
  month: number;
  year: number;
  label: string;
  predictedQuantity: number;
  minQuantity: number;
  maxQuantity: number;
  avgDailyPredicted: number;
  wma3: number;
  seasonalIndex: number;
  sameMonthLastYear: number;
  sameMonthTwoYearsAgo: number;
  yoyFactor: number;
  changeVsLastCompleteMonthPercent: number;
  explanation: string;
}

export interface DishSalesSummaryItem {
  dish_id: number;
  dish_name: string;
  image: string | null;
  category_id: number | null;
  category_name: string;
  dish_type: string;
  unitPrice: number;
  yearlyTotals: Record<number, number>;
  yearlyRevenueTotals: Record<number, number>;
  selectedYearTotal: number;
  selectedYearRevenue: number;
  compareYearSamePeriodTotal: number;
  compareYearFullTotal: number;
  yoyGrowthPercent: number;
  avgMonthly: number;
  avgDaily: number;
  bestMonth: {
    month: number;
    label: string;
    quantity: number;
    revenue: number;
  };
  lowestMonth: {
    month: number;
    label: string;
    quantity: number;
    revenue: number;
  };
  trendStatus: 'growing' | 'stable' | 'declining';
  trendLabel: string;
  monthlyByYear: Record<number, number[]>;
  monthlyRevenueByYear: Record<number, number[]>;
  forecastNextMonth: DishForecastDetail;
}

export interface CategorySalesAnalyticsItem {
  key: string;
  label: string;
  groupType: 'all' | 'category' | 'diet';
  categoryId: number | null;
  dishesCount: number;
  yearlyTotals: Record<number, number>;
  yearlyRevenueTotals: Record<number, number>;
  monthlyByYear: Record<number, number[]>;
  monthlyRevenueByYear: Record<number, number[]>;
}

export class DailyDishSaleService {
  private static initialized = false;

  /**
   * Đảm bảo bảng daily_dish_sale tồn tại và có dữ liệu từ năm 2023 đến 2026
   */
  static async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS daily_dish_sale (
          daily_dish_sale_id SERIAL PRIMARY KEY,
          dish_id INTEGER NOT NULL REFERENCES dishes(dish_id) ON DELETE CASCADE ON UPDATE NO ACTION,
          sale_date DATE NOT NULL,
          quantity_sold INTEGER NOT NULL DEFAULT 0,
          CONSTRAINT daily_dish_sale_dish_id_sale_date_key UNIQUE (dish_id, sale_date)
        );
        CREATE INDEX IF NOT EXISTS daily_dish_sale_sale_date_idx ON daily_dish_sale(sale_date);
        CREATE INDEX IF NOT EXISTS daily_dish_sale_dish_id_idx ON daily_dish_sale(dish_id);
      `);

      const checkRows = await prisma.$queryRawUnsafe<
        Array<{ cnt: number; min_yr: number | null; sim_orders: number }>
      >(`
        SELECT
          (SELECT COUNT(*)::int FROM daily_dish_sale) AS cnt,
          (SELECT MIN(EXTRACT(YEAR FROM sale_date))::int FROM daily_dish_sale) AS min_yr,
          (SELECT COUNT(*)::int FROM orders WHERE customer_email = 'lichsu.banhang@pizzapastainn.vn') AS sim_orders
      `);
      const cnt = Number(checkRows?.[0]?.cnt || 0);
      const minYr = Number(checkRows?.[0]?.min_yr || 9999);
      const simOrders = Number(checkRows?.[0]?.sim_orders || 0);

      // Nếu chưa mô phỏng bảng bán hàng (orders) giai đoạn 2023-2026 hoặc bảng daily_dish_sale trống -> mô phỏng orders rồi đồng bộ sang daily_dish_sale
      if (simOrders < 500 || cnt < 1000 || minYr > 2023) {
        await this.seedSimulatedSalesData(true);
      }
      this.initialized = true;
    } catch (err) {
      logger.error('DailyDishSaleService.ensureInitialized error:', err);
    }
  }

  /**
   * Bóc tách tất cả món ăn lẻ (dish_id -> số lượng) từ một đơn hàng:
   * - Món lẻ thường: cộng theo quantity của order_item
   * - Pizza Half-Half: cộng cho từng nửa pizza trong order_item_half
   * - Combo: tách từng món lẻ đã chọn trong order_item_combos (và các nhóm cố định trong combo_groups)
   *   để cộng đúng vào dish_id của món lẻ đó.
   */
  static extractDishQuantitiesFromOrder(order: any): Map<number, number> {
    const dishCounts = new Map<number, number>();
    const addDish = (rawDishId: number | null | undefined, qty: number) => {
      const normalized = normalizeIndividualDishId(rawDishId);
      if (!normalized || qty <= 0) return;
      dishCounts.set(normalized, (dishCounts.get(normalized) || 0) + qty);
    };

    for (const item of order.items || []) {
      const itemQty = Math.max(1, Number(item.quantity) || 1);

      // 1. Nếu là Combo -> tách các món lẻ cấu thành Combo
      if (item.combo_id) {
        const coveredGroupIds = new Set<string>();
        const groupNameMap = new Map<string, string>();

        if (item.combo?.groups) {
          for (const g of item.combo.groups) {
            if (g.group_id) groupNameMap.set(g.group_id, g.group_name || '');
          }
        }

        // 1a. Các lựa chọn đã lưu trong order_item_combos
        if (Array.isArray(item.combos) && item.combos.length > 0) {
          for (const sel of item.combos) {
            if (sel.group_id) coveredGroupIds.add(sel.group_id);

            if (sel.is_half_half && Array.isArray(sel.halves) && sel.halves.length > 0) {
              for (const half of sel.halves) {
                addDish(half.dish_id, itemQty);
              }
            } else if (sel.dish_price?.dish_id) {
              const rawDishId = sel.dish_price.dish_id;
              const gName = sel.group_id ? groupNameMap.get(sel.group_id) : '';
              const mult = getComboGroupQuantityMultiplier(gName, rawDishId);
              addDish(rawDishId, itemQty * mult);
            }
          }
        }

        // 1b. Các nhóm món cố định trong Combo (nếu chưa có trong order_item_combos)
        if (item.combo?.groups) {
          for (const g of item.combo.groups) {
            if (g.group_id && coveredGroupIds.has(g.group_id)) continue;
            if (Array.isArray(g.combo_items) && g.combo_items.length > 0) {
              // Lấy món đầu tiên (nhóm cố định 1 món hoặc mặc định của nhóm)
              const firstComboItem = g.combo_items.find(
                (ci: any) => ci.dish_price?.dish_id && ci.dish_price.dish_id !== 65
              ) || g.combo_items[0];
              const rawDishId = firstComboItem?.dish_price?.dish_id;
              if (rawDishId) {
                const mult = getComboGroupQuantityMultiplier(g.group_name, rawDishId);
                addDish(rawDishId, itemQty * mult);
              }
            }
          }
        }
        continue;
      }

      // 2. Nếu là Pizza Half-Half lẻ
      if (item.is_half_half || (Array.isArray(item.halves) && item.halves.length > 0)) {
        for (const half of item.halves || []) {
          addDish(half.dish_id, itemQty);
        }
        continue;
      }

      // 3. Nếu là món lẻ thông thường
      if (item.dish_price?.dish_id) {
        addDish(item.dish_price.dish_id, itemQty);
      }
    }

    return dishCounts;
  }

  /**
   * Ghi nhận (hoặc hoàn tác khi hủy đơn) số lượng món lẻ bán ra của 1 đơn hàng vào bảng daily_dish_sale
   * @param orderId Mã đơn hàng
   * @param direction 1 (cộng thêm khi tạo đơn) hoặc -1 (trừ đi khi hủy đơn)
   */
  static async recordOrderSales(orderId: number, direction: 1 | -1 = 1): Promise<void> {
    try {
      await this.ensureInitialized();

      const order = await prisma.order.findUnique({
        where: { order_id: orderId },
        include: {
          items: {
            include: {
              dish_price: true,
              halves: true,
              combos: {
                include: {
                  dish_price: true,
                  halves: true,
                },
              },
              combo: {
                include: {
                  groups: {
                    include: {
                      combo_items: {
                        include: {
                          dish_price: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!order || !order.created_at) return;

      const saleDateStr = toVietnamDateString(order.created_at);
      const dishCounts = this.extractDishQuantitiesFromOrder(order);

      for (const [dishId, qty] of dishCounts.entries()) {
        const delta = qty * direction;
        await prisma.$executeRawUnsafe(
          `
          INSERT INTO daily_dish_sale (dish_id, sale_date, quantity_sold)
          VALUES ($1, $2::date, GREATEST(0, $3))
          ON CONFLICT (dish_id, sale_date)
          DO UPDATE SET quantity_sold = GREATEST(0, daily_dish_sale.quantity_sold + $3)
          `,
          dishId,
          saleDateStr,
          delta
        );
      }
    } catch (err) {
      logger.error(`DailyDishSaleService.recordOrderSales(${orderId}) error:`, err);
    }
  }

  /**
   * Đồng bộ / Cập nhật bảng tiêu hao (daily_dish_sale) CHỈ từ bảng bán hàng (orders + order_items + order_item_combos + order_item_half).
   * Tuyệt đối không tự sinh số liệu khống ngoài bảng bán hàng.
   */
  static async syncDailyDishSalesFromOrders(): Promise<number> {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS daily_dish_sale (
        daily_dish_sale_id SERIAL PRIMARY KEY,
        dish_id INTEGER NOT NULL REFERENCES dishes(dish_id) ON DELETE CASCADE ON UPDATE NO ACTION,
        sale_date DATE NOT NULL,
        quantity_sold INTEGER NOT NULL DEFAULT 0,
        CONSTRAINT daily_dish_sale_dish_id_sale_date_key UNIQUE (dish_id, sale_date)
      );
      CREATE INDEX IF NOT EXISTS daily_dish_sale_sale_date_idx ON daily_dish_sale(sale_date);
      CREATE INDEX IF NOT EXISTS daily_dish_sale_dish_id_idx ON daily_dish_sale(dish_id);
      TRUNCATE TABLE daily_dish_sale RESTART IDENTITY;
    `);

    const aggregatedMap = new Map<string, { dish_id: number; dateStr: string; qty: number }>();
    const addAgg = (rawDishId: number | null | undefined, dateStr: string, qty: number) => {
      const normalized = normalizeIndividualDishId(rawDishId);
      if (!normalized || qty <= 0) return;
      const key = `${normalized}_${dateStr}`;
      const cur = aggregatedMap.get(key);
      if (cur) {
        cur.qty += qty;
      } else {
        aggregatedMap.set(key, { dish_id: normalized, dateStr, qty });
      }
    };

    // 1. Tổng hợp trực tiếp các dòng món lẻ (không phải Combo / Half-Half) từ bảng orders + order_items
    const directRows = await prisma.$queryRawUnsafe<
      Array<{ dish_id: number; sale_date_str: string; total_qty: number }>
    >(`
      SELECT
        dp.dish_id::int AS dish_id,
        TO_CHAR((o.created_at AT TIME ZONE 'UTC') + INTERVAL '7 hours', 'YYYY-MM-DD') AS sale_date_str,
        SUM(COALESCE(oi.quantity, 1))::int AS total_qty
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.order_id
      JOIN dish_prices dp ON dp.dish_price_id = oi.dish_price_id
      WHERE COALESCE(o.order_status, '') <> 'cancelled'
        AND o.created_at IS NOT NULL
        AND oi.combo_id IS NULL
        AND COALESCE(oi.is_half_half, false) = false
      GROUP BY dp.dish_id, TO_CHAR((o.created_at AT TIME ZONE 'UTC') + INTERVAL '7 hours', 'YYYY-MM-DD')
    `);

    for (const row of directRows) {
      addAgg(row.dish_id, row.sale_date_str, Number(row.total_qty) || 0);
    }

    // 2. Bóc tách các đơn hàng có chứa Combo hoặc Pizza Half-Half trong bảng orders
    const complexOrders = await prisma.order.findMany({
      where: {
        order_status: { not: 'cancelled' },
        items: {
          some: {
            OR: [{ combo_id: { not: null } }, { is_half_half: true }],
          },
        },
      },
      include: {
        items: {
          where: {
            OR: [{ combo_id: { not: null } }, { is_half_half: true }],
          },
          include: {
            dish_price: true,
            halves: true,
            combos: {
              include: {
                dish_price: true,
                halves: true,
              },
            },
            combo: {
              include: {
                groups: {
                  include: {
                    combo_items: {
                      include: {
                        dish_price: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    for (const order of complexOrders) {
      if (!order.created_at) continue;
      const dateStr = toVietnamDateString(order.created_at);
      const extracted = this.extractDishQuantitiesFromOrder(order);
      for (const [dishId, qty] of extracted.entries()) {
        addAgg(dishId, dateStr, qty);
      }
    }

    const rowsToInsert = Array.from(aggregatedMap.values()).map((item) => ({
      dish_id: item.dish_id,
      sale_date: parseDateOnlyUTC(item.dateStr),
      quantity_sold: item.qty,
    }));

    const BATCH_SIZE = 4000;
    for (let i = 0; i < rowsToInsert.length; i += BATCH_SIZE) {
      const batch = rowsToInsert.slice(i, i + BATCH_SIZE);
      await prisma.dailyDishSale.createMany({
        data: batch,
        skipDuplicates: true,
      });
    }

    return rowsToInsert.length;
  }

  /**
   * Mô phỏng dữ liệu bán hàng từ năm 2023 đến 2026:
   * - BƯỚC 1: Mô phỏng các đơn hàng thực tế vào bảng bán hàng (orders + order_items) giai đoạn 2023–2026.
   * - BƯỚC 2: Cập nhật bảng tiêu hao (daily_dish_sale) 100% từ dữ liệu bảng bán hàng (orders + order_items).
   */
  static async seedSimulatedSalesData(resetExisting = true): Promise<{
    totalInsertedRows: number;
    simulatedOrdersCount: number;
    simulatedOrderItemsCount: number;
    dishesCount: number;
    startDate: string;
    endDate: string;
  }> {
    const SIMULATED_EMAIL_TAG = 'lichsu.banhang@pizzapastainn.vn';

    if (resetExisting) {
      // Xóa các đơn hàng mô phỏng cũ (giữ nguyên 100% đơn hàng thật của khách hàng)
      await prisma.$executeRawUnsafe(
        `DELETE FROM order_items WHERE order_id IN (SELECT order_id FROM orders WHERE customer_email = $1)`,
        SIMULATED_EMAIL_TAG
      );
      await prisma.$executeRawUnsafe(
        `DELETE FROM orders WHERE customer_email = $1`,
        SIMULATED_EMAIL_TAG
      );
    }

    // 1. Lấy tất cả các món lẻ đang hoạt động kèm bảng giá dish_prices
    const dishes = await prisma.dish.findMany({
      where: {
        dish_status: true,
        dish_id: { notIn: [62, 63, 64, 65] },
      },
      include: { category: true, prices: true },
      orderBy: { dish_id: 'asc' },
    });

    // Map món ăn -> dish_price_id & đơn giá chuẩn
    const dishPriceInfoMap = new Map<number, { dish_price_id: string; price: number }>();
    for (const d of dishes) {
      const validPrices = (d.prices || []).filter((p) => (Number(p.dish_price) || 0) > 0);
      const chosen = validPrices[0] || d.prices?.[0];
      if (chosen) {
        dishPriceInfoMap.set(d.dish_id, {
          dish_price_id: chosen.dish_price_id,
          price: Math.max(15000, Number(chosen.dish_price) || 120000),
        });
      }
    }

    // 2. Lấy đơn hàng thật của khách hàng để khấu trừ vào định mức tháng (giúp tổng số cuối cùng khớp chuẩn)
    const realOrders = await prisma.order.findMany({
      where: {
        order_status: { not: 'cancelled' },
      },
      include: {
        items: {
          include: {
            dish_price: true,
            halves: true,
            combos: {
              include: {
                dish_price: true,
                halves: true,
              },
            },
            combo: {
              include: {
                groups: {
                  include: {
                    combo_items: {
                      include: {
                        dish_price: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Map lưu sản lượng từ đơn hàng thật theo tháng: key = `${dish_id}_${YYYY}_${MM}`
    const realMonthlyMap = new Map<string, number>();
    for (const order of realOrders) {
      if (!order.created_at) continue;
      const dateStr = toVietnamDateString(order.created_at);
      const [yrStr, moStr] = dateStr.split('-');
      const yr = Number(yrStr);
      const mo = Number(moStr);
      const extracted = this.extractDishQuantitiesFromOrder(order);
      for (const [dishId, qty] of extracted.entries()) {
        const mKey = `${dishId}_${yr}_${mo}`;
        realMonthlyMap.set(mKey, (realMonthlyMap.get(mKey) || 0) + qty);
      }
    }

    const startDateStr = '2023-01-01';
    const endDateStr = '2026-12-31';

    const pseudoRandom = (seed: number): number => {
      const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
      return x - Math.floor(x);
    };

    const dishProfiles = dishes.map((dish) => {
      const id = dish.dish_id;
      const cat = (dish.category?.category_name || '').toLowerCase();

      let baseMonthly2023 = 30;
      if ([11, 2, 9, 8, 12, 1, 5].includes(id)) {
        const rankBoost: Record<number, number> = {
          11: 74, // Seafood Pizza (#1)
          2: 70,  // BBQ Pizza (#2)
          9: 67,  // Hawaiian Pizza (#3)
          8: 63,  // Gold Pizza (#4)
          12: 60, // Pepperoni Pizza
          1: 57,  // Texas Pizza
          5: 55,  // Super Supreme Pizza
        };
        baseMonthly2023 = rankBoost[id] || 60;
      } else if (cat.includes('pizza')) {
        baseMonthly2023 = 44 + (id % 4) * 3;
      } else if ([14, 15, 17, 19].includes(id)) {
        baseMonthly2023 = id === 14 ? 61 : id === 15 ? 56 : 46 + (id % 3) * 3;
      } else if (cat.includes('spaghetti')) {
        baseMonthly2023 = 36 + (id % 4) * 3;
      } else if ([32, 35, 24].includes(id)) {
        baseMonthly2023 = 36 + (id % 4) * 2;
      } else if (cat.includes('gratin') || cat.includes('forno')) {
        baseMonthly2023 = 22 + (id % 4) * 2;
      } else if ([44, 46, 42, 45].includes(id)) {
        baseMonthly2023 = id === 44 ? 58 : id === 46 ? 53 : 38 + (id % 3) * 3;
      } else if (cat.includes('salad')) {
        baseMonthly2023 = 26 + (id % 3) * 3;
      } else if (id === 50) {
        baseMonthly2023 = 64;
      } else if ([51, 52, 53, 54, 57].includes(id)) {
        baseMonthly2023 = 34 + (id % 4) * 3;
      } else {
        baseMonthly2023 = 24 + (id % 4) * 2;
      }

      const peakMonthsByMod: number[] = [7, 7, 12, 8, 7, 12, 7, 8, 7, 12];
      const lowMonthsByMod: number[] = [2, 2, 3, 2, 2, 3, 2, 2, 3, 2];
      const peakMonth = peakMonthsByMod[id % peakMonthsByMod.length];
      const lowMonth = lowMonthsByMod[id % lowMonthsByMod.length];
      const annualGrowthRate = 0.135 + (id % 4) * 0.01;

      return {
        dish_id: id,
        baseMonthly2023,
        annualGrowthRate,
        peakMonth,
        lowMonth,
      };
    });

    const baseMonthCurve = [
      0.86, // T01
      0.74, // T02
      0.88, // T03
      0.95, // T04
      1.03, // T05
      1.10, // T06
      1.26, // T07
      1.20, // T08
      1.04, // T09
      1.12, // T10
      1.16, // T11
      1.24, // T12
    ];

    const customerPool = [
      { name: 'Nguyễn Minh Tuấn', phone: '0903124568' },
      { name: 'Trần Thu Hà', phone: '0918456231' },
      { name: 'Lê Hoàng Nam', phone: '0987234119' },
      { name: 'Phạm Khánh Linh', phone: '0938765412' },
      { name: 'Vũ Đức Anh', phone: '0974512890' },
      { name: 'Đặng Ngọc Mai', phone: '0909334812' },
      { name: 'Bùi Quang Huy', phone: '0912887643' },
      { name: 'Hoàng Thanh Trúc', phone: '0965432198' },
      { name: 'Ngô Gia Bảo', phone: '0943218765' },
      { name: 'Đỗ Phương Thảo', phone: '0932145698' },
      { name: 'Lý Quốc Khánh', phone: '0908761234' },
      { name: 'Phan Thanh Tâm', phone: '0978123904' },
    ];
    const paymentMethods = ['cash', 'sepay', 'vnpay'];

    // ─── Cấu hình mô phỏng GIỎ HÀNG THẬT (phục vụ Phân tích Mua Cùng - Apriori) ───
    // Bộ sinh số ngẫu nhiên có hạt giống (mulberry32) → kết quả mô phỏng ổn định, tái lập được
    const makeRng = (seed: number) => {
      let a = seed >>> 0;
      return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    };

    type DishRole = 'pizza' | 'spaghetti' | 'gratin' | 'side' | 'drink';
    const roleMap = new Map<number, DishRole>();
    for (const d of dishes) {
      const cat = (d.category?.category_name || '').toLowerCase();
      let role: DishRole = 'side';
      if (cat.includes('pizza')) role = 'pizza';
      else if (cat.includes('spaghetti')) role = 'spaghetti';
      else if (cat.includes('gratin') || cat.includes('risotto') || cat.includes('forno')) role = 'gratin';
      else if (cat.includes('drink') || cat.includes('uống')) role = 'drink';
      roleMap.set(d.dish_id, role);
    }
    const isMainDish = (id: number) => {
      const r = roleMap.get(id);
      return r === 'pizza' || r === 'spaghetti' || r === 'gratin';
    };

    // Hành vi gọi kèm phổ biến: món chính → (món phụ / đồ uống) với trọng số hấp dẫn.
    // Thuật toán Apriori KHÔNG biết trước bảng này, nó phải tự tìm lại từ phiếu bán hàng.
    const ADDON_AFFINITY: Record<number, Record<number, number>> = {
      11: { 42: 16, 58: 12, 28: 5 }, // Seafood Pizza ↔ Salad A, Tiger Beer
      2: { 47: 15, 50: 12, 46: 5 }, // BBQ Pizza ↔ BBQ Wing (6), Pepsi
      9: { 50: 16, 59: 12 }, // Hawaiian Pizza ↔ Pepsi, Orange Juice
      12: { 45: 15, 53: 12 }, // Pepperoni Pizza ↔ French Fries, Pepsi 1,5L
      1: { 48: 14, 51: 12 }, // Texas Pizza ↔ Fried Chicken (2), 7 Up
      5: { 46: 15, 53: 13 }, // Super Supreme ↔ BBQ Wing (10), Pepsi 1,5L
      8: { 43: 14, 60: 12, 57: 5 }, // Gold Pizza (chay) ↔ Salad B, Lemon Juice
      10: { 43: 14, 57: 12, 60: 5 }, // Vegetable Pizza (chay) ↔ Salad B, Aquafina
      13: { 43: 12, 61: 12, 57: 5 }, // Deluxe Pizza (chay) ↔ Salad B, Apple Juice
      3: { 55: 14, 45: 5 }, // Kim Chi Pizza ↔ Sting
      4: { 45: 10, 54: 12 }, // Tuna Pizza ↔ French Fries, Mirinda
      6: { 45: 12, 54: 10 }, // Potato Pizza ↔ French Fries, Mirinda
      7: { 58: 14, 56: 10 }, // Hot Pizza ↔ Tiger Beer, Soda
      14: { 44: 18, 50: 8 }, // Meat Spaghetti ↔ Garlic Bread, Pepsi
      15: { 44: 14, 52: 8 }, // Chicken Red Spaghetti ↔ Garlic Bread, Pepsi Zero
      17: { 44: 10, 42: 8, 58: 5 },
      18: { 44: 10, 42: 8 },
      19: { 44: 12, 61: 8 },
      32: { 44: 12, 43: 10, 61: 10 }, // Carbonara ↔ Garlic Bread, Salad B, Apple Juice
      35: { 44: 12, 54: 8 },
      29: { 43: 10, 57: 10 }, // Chili Hot Spaghetti (chay)
      30: { 43: 8, 57: 6 },
      31: { 43: 8, 57: 6 },
      25: { 42: 8, 59: 4 },
      26: { 42: 8, 59: 4 },
      27: { 42: 8, 59: 4 },
      28: { 42: 8, 59: 4 },
    };
    const ROLE_ADDON_BASE: Record<string, number> = {
      'pizza>drink': 1.6,
      'pizza>side': 1.4,
      'spaghetti>drink': 1.0,
      'spaghetti>side': 1.0,
      'gratin>drink': 1.0,
      'gratin>side': 0.8,
    };
    const GRATIN_GENERIC: Record<number, number> = { 44: 4, 59: 5, 61: 5, 60: 3 };
    // Hệ số khuếch đại hành vi gọi kèm đặc trưng (so với gọi kèm ngẫu nhiên theo nhóm món)
    const SPECIFIC_BOOST = 3.5;
    const addonWeight = (mainId: number, addonId: number) => {
      const specific = ADDON_AFFINITY[mainId]?.[addonId];
      if (specific) return specific * SPECIFIC_BOOST;
      const mr = roleMap.get(mainId);
      if (mr === 'gratin' && GRATIN_GENERIC[addonId]) return GRATIN_GENERIC[addonId] * 2;
      return ROLE_ADDON_BASE[`${mr}>${roleMap.get(addonId)}`] || 0.8;
    };

    // Cặp món chính hay gọi chung trong một đơn (gọi 2 món chính)
    const MAIN_PAIR_AFFINITY: Record<string, number> = {
      '11-17': 10, '11-18': 10, '2-14': 10, '9-15': 9, '12-32': 9,
      '8-29': 9, '10-30': 8, '13-31': 8, '1-14': 6, '5-35': 6,
    };
    const mainPairWeight = (a: number, b: number) => {
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      if (MAIN_PAIR_AFFINITY[key]) return MAIN_PAIR_AFFINITY[key];
      const ra = roleMap.get(a);
      const rb = roleMap.get(b);
      if (ra === 'pizza' && rb === 'pizza') return 1.2;
      if ((ra === 'pizza' && rb === 'spaghetti') || (rb === 'pizza' && ra === 'spaghetti')) return 2;
      if ((ra === 'pizza' && rb === 'gratin') || (rb === 'pizza' && ra === 'gratin')) return 1.5;
      return 1;
    };

    // Chia tổng số phần thành các dòng món (mỗi dòng 1–3 phần theo xác suất)
    const splitQty = (total: number, dist: [number, number, number], rng: () => number) => {
      const parts: number[] = [];
      let left = total;
      while (left > 0) {
        const r = rng();
        let q = r < dist[0] ? 1 : r < dist[0] + dist[1] ? 2 : 3;
        q = Math.min(q, left);
        parts.push(q);
        left -= q;
      }
      return parts;
    };
    const shuffleInPlace = <T>(arr: T[], rng: () => number) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    };
    // Phân bố giờ đặt hàng theo giờ Việt Nam (cao điểm trưa & tối)
    const HOUR_WEIGHTS: Array<[number, number]> = [
      [10, 3], [11, 9], [12, 10], [13, 6], [14, 3], [15, 3],
      [16, 4], [17, 7], [18, 11], [19, 11], [20, 7], [21, 3],
    ];
    const HOUR_TOTAL = HOUR_WEIGHTS.reduce((s, [, w]) => s + w, 0);
    const pickHourVN = (rng: () => number) => {
      let r = rng() * HOUR_TOTAL;
      for (const [h, w] of HOUR_WEIGHTS) {
        r -= w;
        if (r <= 0) return h;
      }
      return 19;
    };

    // Lấy ID đơn hàng bắt đầu an toàn (lớn hơn tất cả đơn hàng hiện có)
    const maxOrderRow = await prisma.$queryRawUnsafe<Array<{ max_id: number }>>(
      `SELECT COALESCE(MAX(order_id), 100)::int AS max_id FROM orders`
    );
    let nextOrderId = Math.max(1000, (Number(maxOrderRow?.[0]?.max_id) || 100) + 1);

    const years = [2023, 2024, 2025, 2026];
    const ordersToInsert: Array<{
      order_id: number;
      payment_method: string;
      payment_status: string;
      total_price_dish: number;
      shipping_fee: number;
      discount_amount: number;
      total_order: number;
      order_note: string | null;
      created_at: Date;
      order_status: string;
      confirmed_at: Date;
      preparing_at: Date;
      shipped_at: Date;
      completed_at: Date;
      order_type: string;
      customer_name: string;
      customer_phone: string;
      customer_email: string;
      store_id: number;
    }> = [];

    const orderItemsToInsert: Array<{
      order_id: number;
      dish_price_id: string;
      quantity: number;
      is_half_half: boolean;
      order_price: number;
    }> = [];

    // Mô phỏng GIỎ HÀNG THẬT: mỗi đơn 1–5 món, giữ đúng tổng lượng tiêu hao tháng của từng món
    for (const year of years) {
      const yearIdx = year - 2023;

      for (let month = 1; month <= 12; month++) {
        const rng = makeRng(year * 100 + month);
        const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

        // 1. Định mức tiêu hao tháng của từng món (giữ nguyên mô hình tăng trưởng & mùa vụ)
        const monthQty = new Map<number, number>();
        for (const profile of dishProfiles) {
          const { dish_id, baseMonthly2023, annualGrowthRate, peakMonth, lowMonth } = profile;
          if (!dishPriceInfoMap.has(dish_id)) continue;

          const yearFactor = Math.pow(1 + annualGrowthRate, yearIdx);
          let seasonalFactor = baseMonthCurve[month - 1];

          if (month === peakMonth) {
            seasonalFactor = Math.max(seasonalFactor, 1.32);
          } else if (month === lowMonth) {
            seasonalFactor = Math.min(seasonalFactor, 0.71);
          } else {
            const minorJitter = (pseudoRandom(dish_id * 31 + month * 17) - 0.5) * 0.04;
            seasonalFactor = Math.max(0.76, Math.min(1.27, seasonalFactor + minorJitter));
          }

          const yearNoise = 0.985 + pseudoRandom(dish_id * 997 + year * 37 + month) * 0.03;
          const targetMonthlyQty = Math.max(
            18,
            Math.round(baseMonthly2023 * yearFactor * seasonalFactor * yearNoise)
          );

          const realQtyInMonth = realMonthlyMap.get(`${dish_id}_${year}_${month}`) || 0;
          const remainingSimQty = Math.max(0, targetMonthlyQty - realQtyInMonth);
          if (remainingSimQty > 0) monthQty.set(dish_id, remainingSimQty);
        }

        // 2. Tách món chính thành các dòng món rồi gom thành đơn (1–3 món chính / đơn)
        type SimLine = { dish_id: number; qty: number };
        type SimOrder = { lines: SimLine[]; mains: number[]; has: Set<number> };

        const mainLines: SimLine[] = [];
        for (const [dishId, qty] of monthQty.entries()) {
          if (!isMainDish(dishId)) continue;
          for (const q of splitQty(qty, [0.78, 0.18, 0.04], rng)) {
            mainLines.push({ dish_id: dishId, qty: q });
          }
        }
        shuffleInPlace(mainLines, rng);

        const simOrders: SimOrder[] = [];
        const usedLine = new Uint8Array(mainLines.length);
        for (let i = 0; i < mainLines.length; i++) {
          if (usedLine[i]) continue;
          usedLine[i] = 1;
          const first = mainLines[i];
          const order: SimOrder = {
            lines: [{ ...first }],
            mains: [first.dish_id],
            has: new Set([first.dish_id]),
          };

          // Đơn gọi thêm món chính thứ 2 (42%) và thứ 3 (≈10%), ưu tiên các cặp món chính hay đi chung
          for (let extra = 0; extra < 2; extra++) {
            if (rng() >= (extra === 0 ? 0.42 : 0.25)) break;
            const cands: Array<[number, number]> = [];
            let totalW = 0;
            for (let j = i + 1; j < mainLines.length && cands.length < 16; j++) {
              if (usedLine[j] || order.has.has(mainLines[j].dish_id)) continue;
              let w = 0;
              for (const m of order.mains) w += mainPairWeight(m, mainLines[j].dish_id);
              cands.push([j, w]);
              totalW += w;
            }
            if (cands.length === 0) break;
            let r = rng() * totalW;
            let pick = cands[cands.length - 1][0];
            for (const [j, w] of cands) {
              r -= w;
              if (r <= 0) {
                pick = j;
                break;
              }
            }
            usedLine[pick] = 1;
            const next = mainLines[pick];
            order.lines.push({ ...next });
            order.mains.push(next.dish_id);
            order.has.add(next.dish_id);
          }
          simOrders.push(order);
        }

        // Một phần nhỏ đơn chỉ gọi món phụ / đồ uống (không có món chính)
        const snackOrders = Math.round(simOrders.length * 0.06);
        for (let k = 0; k < snackOrders; k++) {
          simOrders.push({ lines: [], mains: [], has: new Set() });
        }

        // 3. Phân bổ món phụ & đồ uống vào đơn theo trọng số hấp dẫn với món chính trong đơn
        const nOrders = simOrders.length;
        const staticW = new Float64Array(nOrders);
        const dynW = new Float64Array(nOrders);
        const addonEntries = [...monthQty.entries()].filter(([id]) => !isMainDish(id));
        shuffleInPlace(addonEntries, rng);

        for (const [dishId, qty] of addonEntries) {
          const isDrink = roleMap.get(dishId) === 'drink';
          for (let o = 0; o < nOrders; o++) {
            const ord = simOrders[o];
            let w = ord.mains.length === 0 ? 1.2 : 1;
            for (const m of ord.mains) w += addonWeight(m, dishId);
            staticW[o] = w;
          }

          const parts = splitQty(qty, isDrink ? [0.62, 0.3, 0.08] : [0.82, 0.16, 0.02], rng);
          for (const q of parts) {
            let total = 0;
            for (let o = 0; o < nOrders; o++) {
              const ord = simOrders[o];
              const L = ord.lines.length;
              let p = L >= 5 ? 0.03 : L === 4 ? 0.35 : 1;
              if (ord.has.has(dishId)) p *= 0.12;
              const w = staticW[o] * p;
              dynW[o] = w;
              total += w;
            }
            let r = rng() * total;
            let pickIdx = nOrders - 1;
            for (let o = 0; o < nOrders; o++) {
              r -= dynW[o];
              if (r <= 0) {
                pickIdx = o;
                break;
              }
            }
            const target = simOrders[pickIdx];
            if (target.has.has(dishId)) {
              const line = target.lines.find((l) => l.dish_id === dishId);
              if (line) line.qty += q;
            } else {
              target.lines.push({ dish_id: dishId, qty: q });
              target.has.add(dishId);
            }
          }
        }

        // 4. Ghi phiếu bán hàng (orders + order_items) với thời gian đặt thực tế trong tháng
        for (const ord of simOrders) {
          if (ord.lines.length === 0) continue;
          const oid = nextOrderId++;
          let totalDishPrice = 0;
          for (const line of ord.lines) {
            const priceInfo = dishPriceInfoMap.get(line.dish_id)!;
            const linePrice = line.qty * priceInfo.price;
            totalDishPrice += linePrice;
            orderItemsToInsert.push({
              order_id: oid,
              dish_price_id: priceInfo.dish_price_id,
              quantity: line.qty,
              is_half_half: false,
              order_price: linePrice,
            });
          }

          const day = 1 + Math.floor(rng() * daysInMonth);
          const hourVN = pickHourVN(rng);
          const minute = Math.floor(rng() * 60);
          const createdAt = new Date(Date.UTC(year, month - 1, day, hourVN - 7, minute, 0));
          const confirmedAt = new Date(createdAt.getTime() + 3 * 60 * 1000);
          const preparingAt = new Date(createdAt.getTime() + 8 * 60 * 1000);
          const shippedAt = new Date(createdAt.getTime() + 22 * 60 * 1000);
          const completedAt = new Date(createdAt.getTime() + 38 * 60 * 1000);

          const cust = customerPool[Math.floor(rng() * customerPool.length)];
          const payMethod = paymentMethods[Math.floor(rng() * paymentMethods.length)];
          const isPickup = rng() < 0.25;
          const shippingFee = isPickup ? 0 : 15000;

          ordersToInsert.push({
            order_id: oid,
            payment_method: payMethod,
            payment_status: 'paid',
            total_price_dish: totalDishPrice,
            shipping_fee: shippingFee,
            discount_amount: 0,
            total_order: totalDishPrice + shippingFee,
            order_note: null,
            created_at: createdAt,
            order_status: 'completed',
            confirmed_at: confirmedAt,
            preparing_at: preparingAt,
            shipped_at: shippedAt,
            completed_at: completedAt,
            order_type: isPickup ? 'pickup' : 'delivery',
            customer_name: cust.name,
            customer_phone: cust.phone,
            customer_email: SIMULATED_EMAIL_TAG,
            store_id: rng() < 0.5 ? 1 : 2,
          });
        }
      }
    }

    // 3. Chèn hàng loạt vào bảng bán hàng (orders & order_items)
    const ORDER_BATCH = 5000;
    for (let i = 0; i < ordersToInsert.length; i += ORDER_BATCH) {
      await prisma.order.createMany({
        data: ordersToInsert.slice(i, i + ORDER_BATCH),
        skipDuplicates: true,
      });
    }

    const ITEM_BATCH = 4000;
    for (let i = 0; i < orderItemsToInsert.length; i += ITEM_BATCH) {
      const batch = orderItemsToInsert.slice(i, i + ITEM_BATCH);
      await prisma.orderItem.createMany({
        data: batch,
      });
    }

    // Cập nhật lại sequence order_id và order_item_id của PostgreSQL
    await prisma.$executeRawUnsafe(`
      SELECT setval(pg_get_serial_sequence('orders', 'order_id'), COALESCE((SELECT MAX(order_id) FROM orders), 1), true);
      SELECT setval(pg_get_serial_sequence('order_items', 'order_item_id'), COALESCE((SELECT MAX(order_item_id) FROM order_items), 1), true);
    `);

    // 4. BƯỚC QUAN TRỌNG: Cập nhật bảng tiêu hao (daily_dish_sale) 100% từ bảng bán hàng (orders + order_items)
    const totalInsertedRows = await this.syncDailyDishSalesFromOrders();

    this.initialized = true;
    return {
      totalInsertedRows,
      simulatedOrdersCount: ordersToInsert.length,
      simulatedOrderItemsCount: orderItemsToInsert.length,
      dishesCount: dishes.length,
      startDate: startDateStr,
      endDate: endDateStr,
    };
  }

  /**
   * Tổng hợp thống kê bán hàng của từng món lẻ, danh mục và toàn cửa hàng (đồng bộ 100% từ bảng daily_dish_sale)
   * qua các năm 2023, 2024, 2025, 2026.
   */
  static async getDishSalesAnalytics(params?: {
    year?: number;
    compareYear?: number;
    categoryId?: number;
    search?: string;
    trendFilter?: string;
  }) {
    await this.ensureInitialized();

    const dishes = await prisma.dish.findMany({
      where: {
        dish_status: true,
        dish_id: { notIn: [62, 63, 64, 65] },
      },
      include: { category: true, prices: true },
      orderBy: { dish_id: 'asc' },
    });

    // Tính đơn giá đại diện (unitPrice) cho từng món từ bảng dish_prices
    const dishUnitPriceMap = new Map<number, number>();
    for (const d of dishes) {
      const validPrices = (d.prices || [])
        .map((p) => Number(p.dish_price) || 0)
        .filter((p) => p > 0);
      const rawAvg =
        validPrices.length > 0
          ? validPrices.reduce((s, v) => s + v, 0) / validPrices.length
          : 120000;
      // Làm tròn đến hàng nghìn VNĐ
      const unitPrice = Math.max(15000, Math.round(rawAvg / 1000) * 1000);
      dishUnitPriceMap.set(d.dish_id, unitPrice);
    }

    // Truy vấn tổng hợp theo (dish_id, year, month, số ngày có dữ liệu trong tháng) trực tiếp từ PostgreSQL
    const monthlyAgg = await prisma.$queryRawUnsafe<
      Array<{
        dish_id: number;
        yr: number;
        mo: number;
        total_qty: number;
        days_count: number;
        max_day: number;
      }>
    >(`
      SELECT
        dish_id,
        EXTRACT(YEAR FROM sale_date)::int AS yr,
        EXTRACT(MONTH FROM sale_date)::int AS mo,
        SUM(quantity_sold)::int AS total_qty,
        COUNT(*)::int AS days_count,
        MAX(EXTRACT(DAY FROM sale_date))::int AS max_day
      FROM daily_dish_sale
      GROUP BY dish_id, yr, mo
      ORDER BY dish_id ASC, yr ASC, mo ASC
    `);

    // Xác định danh sách các năm có trong bảng daily_dish_sale (2023, 2024, 2025, 2026)
    const yearsSet = new Set<number>([2023, 2024, 2025, 2026]);
    let latestYear = 2026;
    let latestMonth = 12;
    let latestDayInLatestMonth = 31;

    for (const row of monthlyAgg) {
      yearsSet.add(row.yr);
      if (
        row.yr > latestYear ||
        (row.yr === latestYear && row.mo > latestMonth) ||
        (row.yr === latestYear && row.mo === latestMonth && row.max_day > latestDayInLatestMonth)
      ) {
        latestYear = row.yr;
        latestMonth = row.mo;
        latestDayInLatestMonth = row.max_day;
      }
    }

    const availableYears = Array.from(yearsSet).sort((a, b) => a - b);
    const selectedYear =
      params?.year && yearsSet.has(params.year) ? params.year : latestYear;
    const defaultCompareYear = availableYears.includes(selectedYear - 1)
      ? selectedYear - 1
      : availableYears[0];
    const compareYear =
      params?.compareYear && yearsSet.has(params.compareYear)
        ? params.compareYear
        : defaultCompareYear;

    const daysInLatestMonth = new Date(Date.UTC(latestYear, latestMonth, 0)).getUTCDate();
    const isLatestMonthPartial = latestDayInLatestMonth < daysInLatestMonth;

    // Dự báo cho tháng tiếp theo dựa trên năm được chọn
    const nowVn = new Date(Date.now() + VIETNAM_UTC_OFFSET_MS);
    const currentMonthVn = nowVn.getUTCMonth() + 1;
    const nextMonth = currentMonthVn === 12 ? 1 : currentMonthVn + 1;
    const nextMonthYear = currentMonthVn === 12 ? selectedYear + 1 : selectedYear;
    const daysInNextMonth = new Date(Date.UTC(nextMonthYear, nextMonth, 0)).getUTCDate();

    // Gom dữ liệu theo từng dish_id
    const dishMonthlyMap = new Map<
      number,
      Map<number, { qty: number[]; days: number[] }>
    >();

    for (const d of dishes) {
      const yearMap = new Map<number, { qty: number[]; days: number[] }>();
      for (const y of availableYears) {
        yearMap.set(y, {
          qty: Array(12).fill(0),
          days: Array(12).fill(0),
        });
      }
      dishMonthlyMap.set(d.dish_id, yearMap);
    }

    for (const row of monthlyAgg) {
      const yearMap = dishMonthlyMap.get(row.dish_id);
      if (!yearMap) continue;
      let entry = yearMap.get(row.yr);
      if (!entry) {
        entry = { qty: Array(12).fill(0), days: Array(12).fill(0) };
        yearMap.set(row.yr, entry);
      }
      if (row.mo >= 1 && row.mo <= 12) {
        entry.qty[row.mo - 1] = Number(row.total_qty) || 0;
        entry.days[row.mo - 1] = Number(row.days_count) || 0;
      }
    }

    // Tính toán tổng hợp theo từng món lẻ
    const allDishItems: DishSalesSummaryItem[] = dishes.map((dish) => {
      const unitPrice = dishUnitPriceMap.get(dish.dish_id) || 120000;
      const yearMap = dishMonthlyMap.get(dish.dish_id)!;
      const monthlyByYear: Record<number, number[]> = {};
      const monthlyRevenueByYear: Record<number, number[]> = {};
      const yearlyTotals: Record<number, number> = {};
      const yearlyRevenueTotals: Record<number, number> = {};

      for (const y of availableYears) {
        const arr = yearMap.get(y)?.qty || Array(12).fill(0);
        const revArr = arr.map((q) => q * unitPrice);
        monthlyByYear[y] = arr;
        monthlyRevenueByYear[y] = revArr;
        yearlyTotals[y] = arr.reduce((sum, v) => sum + v, 0);
        yearlyRevenueTotals[y] = revArr.reduce((sum, v) => sum + v, 0);
      }

      const selYearArr = monthlyByYear[selectedYear] || Array(12).fill(0);
      const selYearDays = yearMap.get(selectedYear)?.days || Array(12).fill(0);
      const cmpYearArr = monthlyByYear[compareYear] || Array(12).fill(0);
      const cmpYearDays = yearMap.get(compareYear)?.days || Array(12).fill(0);

      const selectedYearTotal = yearlyTotals[selectedYear] || 0;
      const selectedYearRevenue = yearlyRevenueTotals[selectedYear] || 0;
      const compareYearFullTotal = yearlyTotals[compareYear] || 0;

      let selectedSamePeriod = 0;
      let compareSamePeriod = 0;
      let activeMonthsCount = 0;

      for (let mIdx = 0; mIdx < 12; mIdx++) {
        if (selYearArr[mIdx] > 0) {
          activeMonthsCount += 1;
          selectedSamePeriod += selYearArr[mIdx];
          compareSamePeriod += cmpYearArr[mIdx] || 0;
        }
      }
      if (activeMonthsCount === 0) activeMonthsCount = 12;

      const yoyGrowthPercent =
        compareSamePeriod > 0
          ? Number((((selectedSamePeriod - compareSamePeriod) / compareSamePeriod) * 100).toFixed(1))
          : 0;

      let bestMonthIdx = 0;
      let bestMonthQty = -1;
      let lowestMonthIdx = 0;
      let lowestMonthQty = Number.MAX_SAFE_INTEGER;

      for (let mIdx = 0; mIdx < 12; mIdx++) {
        const qty = selYearArr[mIdx];
        if (qty <= 0) continue;

        if (qty > bestMonthQty) {
          bestMonthQty = qty;
          bestMonthIdx = mIdx;
        }
        if (qty < lowestMonthQty) {
          lowestMonthQty = qty;
          lowestMonthIdx = mIdx;
        }
      }

      if (bestMonthQty < 0) bestMonthQty = 0;
      if (lowestMonthQty === Number.MAX_SAFE_INTEGER) {
        lowestMonthQty = selYearArr[0] || 0;
        lowestMonthIdx = 0;
      }

      const avgMonthly = Math.round(selectedYearTotal / activeMonthsCount);
      const avgDaily = Number(
        (selectedYearTotal / (activeMonthsCount * 30.4)).toFixed(1)
      );

      let trendStatus: 'growing' | 'stable' | 'declining' = 'stable';
      let trendLabel = 'Tiêu thụ ổn định';
      if (yoyGrowthPercent >= 12 && avgMonthly >= 55) {
        trendStatus = 'growing';
        trendLabel = 'Bán chạy · Tăng trưởng';
      } else if (avgMonthly < 42 || yoyGrowthPercent < 8) {
        trendStatus = 'declining';
        trendLabel = 'Tiêu thụ chậm · Cần đẩy gợi ý';
      } else {
        trendStatus = 'stable';
        trendLabel = 'Tiêu thụ ổn định';
      }

      // ── DỰ BÁO THÁNG TIẾP THEO (Forecasting) ───────────────────────────────
      const refMonth = currentMonthVn >= 1 && currentMonthVn <= 12 ? currentMonthVn : 10;
      const m1 = selYearArr[refMonth - 1] || avgMonthly;
      const m2 = selYearArr[(refMonth - 2 + 12) % 12] || m1;
      const m3 = selYearArr[(refMonth - 3 + 12) % 12] || m2;

      const wma3 = Math.round(0.5 * m1 + 0.3 * m2 + 0.2 * m3);

      const prevYear1 = selectedYear - 1;
      const prevYear2 = selectedYear - 2;
      const sameMonthLastYear = (monthlyByYear[prevYear1] || [])[nextMonth - 1] || m1;
      const sameMonthTwoYearsAgo = (monthlyByYear[prevYear2] || [])[nextMonth - 1] || sameMonthLastYear;

      const avgPrevYear1 = (yearlyTotals[prevYear1] || selectedYearTotal) / 12;
      const avgPrevYear2 = (yearlyTotals[prevYear2] || selectedYearTotal) / 12;

      const si1 = avgPrevYear1 > 0 ? sameMonthLastYear / avgPrevYear1 : 1.0;
      const si2 = avgPrevYear2 > 0 ? sameMonthTwoYearsAgo / avgPrevYear2 : si1;
      const rawSeasonalIndex = (si1 * 0.6 + si2 * 0.4) || 1.0;
      const seasonalIndex = Number(Math.max(0.65, Math.min(1.55, rawSeasonalIndex)).toFixed(2));

      const yoyFactor = Number(Math.max(0.75, Math.min(1.45, 1 + yoyGrowthPercent / 100)).toFixed(2));

      const seasonalAdjustedRecent = wma3 * seasonalIndex;
      const historicalProjected =
        sameMonthLastYear > 0 ? sameMonthLastYear * yoyFactor : seasonalAdjustedRecent;

      const predictedQuantity = Math.max(
        1,
        Math.round(0.6 * seasonalAdjustedRecent + 0.4 * historicalProjected)
      );
      const minQuantity = Math.max(1, Math.round(predictedQuantity * 0.9));
      const maxQuantity = Math.round(predictedQuantity * 1.1);
      const avgDailyPredicted = Number((predictedQuantity / daysInNextMonth).toFixed(1));
      const changeVsLastCompleteMonthPercent =
        m1 > 0 ? Number((((predictedQuantity - m1) / m1) * 100).toFixed(1)) : 0;

      const explanation = `Kết hợp trung bình trượt 3 tháng gần nhất (${wma3} phần/tháng), hệ số mùa vụ Tháng ${nextMonth} (${seasonalIndex}x) và tốc độ tăng trưởng cùng kỳ (${yoyGrowthPercent >= 0 ? '+' : ''}${yoyGrowthPercent}%).`;

      return {
        dish_id: dish.dish_id,
        dish_name: dish.dish_name,
        image: dish.image,
        category_id: dish.category_id,
        category_name: dish.category?.category_name || 'Khác',
        dish_type: dish.dish_type,
        unitPrice,
        yearlyTotals,
        yearlyRevenueTotals,
        selectedYearTotal,
        selectedYearRevenue,
        compareYearSamePeriodTotal: compareSamePeriod,
        compareYearFullTotal,
        yoyGrowthPercent,
        avgMonthly,
        avgDaily,
        bestMonth: {
          month: bestMonthIdx + 1,
          label: `Tháng ${bestMonthIdx + 1}/${selectedYear}`,
          quantity: bestMonthQty,
          revenue: bestMonthQty * unitPrice,
        },
        lowestMonth: {
          month: lowestMonthIdx + 1,
          label: `Tháng ${lowestMonthIdx + 1}/${selectedYear}`,
          quantity: lowestMonthQty,
          revenue: lowestMonthQty * unitPrice,
        },
        trendStatus,
        trendLabel,
        monthlyByYear,
        monthlyRevenueByYear,
        forecastNextMonth: {
          month: nextMonth,
          year: nextMonthYear,
          label: `Tháng ${nextMonth}/${nextMonthYear}`,
          predictedQuantity,
          minQuantity,
          maxQuantity,
          avgDailyPredicted,
          wma3,
          seasonalIndex,
          sameMonthLastYear,
          sameMonthTwoYearsAgo,
          yoyFactor,
          changeVsLastCompleteMonthPercent,
          explanation,
        },
      };
    });

    // Tổng hợp biểu đồ 12 tháng toàn hệ thống (tất cả 61 món lẻ cộng lại theo từng năm)
    const overallMonthlyByYear: Record<number, number[]> = {};
    const overallRevenueByYear: Record<number, number[]> = {};
    const overallOrdersByYear: Record<number, number[]> = {};
    const yearlyQuantityTotals: Record<number, number> = {};
    const yearlyRevenueTotals: Record<number, number> = {};
    const yearlyOrdersTotals: Record<number, number> = {};

    for (const y of availableYears) {
      overallMonthlyByYear[y] = Array(12).fill(0);
      overallRevenueByYear[y] = Array(12).fill(0);
      overallOrdersByYear[y] = Array(12).fill(0);
      yearlyQuantityTotals[y] = 0;
      yearlyRevenueTotals[y] = 0;
      yearlyOrdersTotals[y] = 0;
    }

    for (const item of allDishItems) {
      for (const y of availableYears) {
        const qArr = item.monthlyByYear[y] || [];
        const rArr = item.monthlyRevenueByYear[y] || [];
        for (let m = 0; m < 12; m++) {
          overallMonthlyByYear[y][m] += qArr[m] || 0;
          overallRevenueByYear[y][m] += rArr[m] || 0;
        }
      }
    }

    for (const y of availableYears) {
      for (let m = 0; m < 12; m++) {
        // Trung bình 1 đơn hàng đặt khoảng 3.2 phần món ăn (gồm Pizza, Mì Ý/Khai vị, Nước uống)
        overallOrdersByYear[y][m] = Math.max(1, Math.round(overallMonthlyByYear[y][m] / 3.2));
      }
      yearlyQuantityTotals[y] = overallMonthlyByYear[y].reduce((s, v) => s + v, 0);
      yearlyRevenueTotals[y] = overallRevenueByYear[y].reduce((s, v) => s + v, 0);
      yearlyOrdersTotals[y] = overallOrdersByYear[y].reduce((s, v) => s + v, 0);
    }

    const categories = await prisma.category.findMany({
      where: {
        category_name: { not: 'Combo' },
      },
      orderBy: { category_id: 'asc' },
    });

    // Xây dựng dữ liệu phân tích đồng bộ theo Danh mục & Chế độ ăn (Chay / Mặn)
    const buildGroupAnalytics = (
      key: string,
      label: string,
      groupType: 'all' | 'category' | 'diet',
      categoryId: number | null,
      predicate: (d: DishSalesSummaryItem) => boolean
    ): CategorySalesAnalyticsItem => {
      const matched = allDishItems.filter(predicate);
      const mQty: Record<number, number[]> = {};
      const mRev: Record<number, number[]> = {};
      const yQty: Record<number, number> = {};
      const yRev: Record<number, number> = {};

      for (const y of availableYears) {
        mQty[y] = Array(12).fill(0);
        mRev[y] = Array(12).fill(0);
        for (const item of matched) {
          for (let m = 0; m < 12; m++) {
            mQty[y][m] += item.monthlyByYear[y]?.[m] || 0;
            mRev[y][m] += item.monthlyRevenueByYear[y]?.[m] || 0;
          }
        }
        yQty[y] = mQty[y].reduce((s, v) => s + v, 0);
        yRev[y] = mRev[y].reduce((s, v) => s + v, 0);
      }

      return {
        key,
        label,
        groupType,
        categoryId,
        dishesCount: matched.length,
        yearlyTotals: yQty,
        yearlyRevenueTotals: yRev,
        monthlyByYear: mQty,
        monthlyRevenueByYear: mRev,
      };
    };

    const categoryAnalytics: CategorySalesAnalyticsItem[] = [
      buildGroupAnalytics('all', 'Toàn hệ thống (Tất cả 61 món lẻ)', 'all', null, () => true),
      ...categories.map((cat) =>
        buildGroupAnalytics(
          `cat_${cat.category_id}`,
          `Danh mục: ${cat.category_name}`,
          'category',
          cat.category_id,
          (d) => d.category_id === cat.category_id
        )
      ),
      buildGroupAnalytics(
        'diet_man',
        'Nhóm khẩu vị: Món Mặn',
        'diet',
        null,
        (d) => d.dish_type !== 'chay'
      ),
      buildGroupAnalytics(
        'diet_chay',
        'Nhóm khẩu vị: Món Chay (Vegetarian)',
        'diet',
        null,
        (d) => d.dish_type === 'chay'
      ),
    ];

    // Áp dụng bộ lọc tìm kiếm / danh mục / xu hướng cho danh sách hiển thị
    let filteredDishes = [...allDishItems];
    if (params?.categoryId) {
      filteredDishes = filteredDishes.filter((d) => d.category_id === params.categoryId);
    }
    if (params?.trendFilter && ['growing', 'stable', 'declining'].includes(params.trendFilter)) {
      filteredDishes = filteredDishes.filter((d) => d.trendStatus === params.trendFilter);
    }
    if (params?.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      filteredDishes = filteredDishes.filter(
        (d) =>
          d.dish_name.toLowerCase().includes(q) ||
          d.category_name.toLowerCase().includes(q) ||
          String(d.dish_id) === q
      );
    }

    // Sắp xếp mặc định theo tổng lượng bán trong năm được chọn giảm dần
    filteredDishes.sort((a, b) => b.selectedYearTotal - a.selectedYearTotal);

    // Các chỉ số KPI tổng quan
    const totalQuantitySelectedYear = yearlyQuantityTotals[selectedYear] || 0;
    const totalRevenueSelectedYear = yearlyRevenueTotals[selectedYear] || 0;
    const totalOrdersSelectedYear = yearlyOrdersTotals[selectedYear] || 0;
    const totalQuantityCompareSamePeriod = allDishItems.reduce(
      (s, d) => s + d.compareYearSamePeriodTotal,
      0
    );
    const overallYoYGrowthPercent =
      totalQuantityCompareSamePeriod > 0
        ? Number(
            (
              ((totalQuantitySelectedYear - totalQuantityCompareSamePeriod) /
                totalQuantityCompareSamePeriod) *
              100
            ).toFixed(1)
          )
        : 0;

    const sortedBySelectedYear = [...allDishItems].sort(
      (a, b) => b.selectedYearTotal - a.selectedYearTotal
    );
    const sortedByGrowth = [...allDishItems].sort(
      (a, b) => b.yoyGrowthPercent - a.yoyGrowthPercent
    );

    const bestSellingDish = sortedBySelectedYear[0] || null;
    const lowestSellingDish =
      sortedBySelectedYear[sortedBySelectedYear.length - 1] || null;
    const fastestGrowingDish = sortedByGrowth[0] || null;
    const decliningDishesCount = allDishItems.filter(
      (d) => d.trendStatus === 'declining'
    ).length;
    const growingDishesCount = allDishItems.filter(
      (d) => d.trendStatus === 'growing'
    ).length;
    const totalForecastNextMonth = allDishItems.reduce(
      (s, d) => s + d.forecastNextMonth.predictedQuantity,
      0
    );
    const totalForecastRevenueNextMonth = allDishItems.reduce(
      (s, d) => s + d.forecastNextMonth.predictedQuantity * d.unitPrice,
      0
    );

    return {
      availableYears,
      selectedYear,
      compareYear,
      latestDataPoint: {
        year: latestYear,
        month: latestMonth,
        day: latestDayInLatestMonth,
        isPartialMonth: isLatestMonthPartial,
      },
      nextMonthForecastTarget: {
        month: nextMonth,
        year: nextMonthYear,
        label: `Tháng ${nextMonth}/${nextMonthYear}`,
      },
      categories,
      categoryAnalytics,
      summary: {
        totalDishesTracked: allDishItems.length,
        totalQuantitySelectedYear,
        totalRevenueSelectedYear,
        totalOrdersSelectedYear,
        averageOrderValueSelectedYear:
          totalOrdersSelectedYear > 0
            ? Math.round(totalRevenueSelectedYear / totalOrdersSelectedYear)
            : 0,
        totalQuantityCompareSamePeriod,
        overallYoYGrowthPercent,
        bestSellingDish: bestSellingDish
          ? {
              dish_id: bestSellingDish.dish_id,
              dish_name: bestSellingDish.dish_name,
              quantity: bestSellingDish.selectedYearTotal,
              revenue: bestSellingDish.selectedYearRevenue,
              bestMonthLabel: bestSellingDish.bestMonth.label,
            }
          : null,
        lowestSellingDish: lowestSellingDish
          ? {
              dish_id: lowestSellingDish.dish_id,
              dish_name: lowestSellingDish.dish_name,
              quantity: lowestSellingDish.selectedYearTotal,
              revenue: lowestSellingDish.selectedYearRevenue,
              lowestMonthLabel: lowestSellingDish.lowestMonth.label,
            }
          : null,
        fastestGrowingDish: fastestGrowingDish
          ? {
              dish_id: fastestGrowingDish.dish_id,
              dish_name: fastestGrowingDish.dish_name,
              yoyGrowthPercent: fastestGrowingDish.yoyGrowthPercent,
            }
          : null,
        growingDishesCount,
        decliningDishesCount,
        totalForecastNextMonth,
        totalForecastRevenueNextMonth,
      },
      overallMonthlyByYear,
      overallRevenueByYear,
      overallOrdersByYear,
      yearlyQuantityTotals,
      yearlyRevenueTotals,
      yearlyOrdersTotals,
      dishes: filteredDishes,
    };
  }

  /**
   * Lấy dữ liệu chi tiết theo ngày từ bảng daily_dish_sale (phục vụ biểu đồ ngày & bảng tra cứu nhật ký)
   */
  static async getDailyDishSaleRecords(params: {
    dishId?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    await this.ensureInitialized();

    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(10, params.limit || 25));

    const where: Record<string, any> = {};
    if (params.dishId) {
      where.dish_id = params.dishId;
    }
    if (params.startDate || params.endDate) {
      where.sale_date = {};
      if (params.startDate && /^\d{4}-\d{2}-\d{2}$/.test(params.startDate)) {
        where.sale_date.gte = parseDateOnlyUTC(params.startDate);
      }
      if (params.endDate && /^\d{4}-\d{2}-\d{2}$/.test(params.endDate)) {
        where.sale_date.lte = parseDateOnlyUTC(params.endDate);
      }
    }

    const [records, total, aggregateSum] = await Promise.all([
      prisma.dailyDishSale.findMany({
        where,
        include: {
          dish: {
            select: {
              dish_id: true,
              dish_name: true,
              image: true,
              category: { select: { category_name: true } },
            },
          },
        },
        orderBy: [{ sale_date: 'desc' }, { quantity_sold: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.dailyDishSale.count({ where }),
      prisma.dailyDishSale.aggregate({
        where,
        _sum: { quantity_sold: true },
        _avg: { quantity_sold: true },
        _max: { quantity_sold: true },
        _min: { quantity_sold: true },
      }),
    ]);

    // Nếu có chọn 1 món cụ thể, lấy thêm chuỗi thời gian 60 ngày gần nhất của món đó để vẽ biểu đồ biến động theo ngày
    let dailySeries: Array<{ sale_date: string; quantity_sold: number }> = [];
    if (params.dishId) {
      const seriesWhere: Record<string, any> = { dish_id: params.dishId };
      if (where.sale_date) {
        seriesWhere.sale_date = where.sale_date;
      }
      const recentRows = await prisma.dailyDishSale.findMany({
        where: seriesWhere,
        orderBy: { sale_date: 'desc' },
        take: 60,
        select: {
          sale_date: true,
          quantity_sold: true,
        },
      });
      dailySeries = recentRows
        .reverse()
        .map((r) => ({
          sale_date: r.sale_date.toISOString().slice(0, 10),
          quantity_sold: r.quantity_sold,
        }));
    }

    return {
      records: records.map((r) => ({
        daily_dish_sale_id: r.daily_dish_sale_id,
        dish_id: r.dish_id,
        dish_name: r.dish?.dish_name || `Món #${r.dish_id}`,
        category_name: r.dish?.category?.category_name || 'Khác',
        image: r.dish?.image || null,
        sale_date: r.sale_date.toISOString().slice(0, 10),
        quantity_sold: r.quantity_sold,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: {
        totalQuantity: aggregateSum._sum.quantity_sold || 0,
        avgQuantity: Number((aggregateSum._avg.quantity_sold || 0).toFixed(1)),
        maxQuantity: aggregateSum._max.quantity_sold || 0,
        minQuantity: aggregateSum._min.quantity_sold || 0,
      },
      dailySeries,
    };
  }
}
