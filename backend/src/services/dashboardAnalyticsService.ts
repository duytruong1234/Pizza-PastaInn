import prisma from '../lib/prisma';

export const DASHBOARD_ANALYTICS_RANGES = ['today', 'yesterday', '7d', '30d', '3m', '6m', '12m'] as const;

export type DashboardAnalyticsRange =
  (typeof DASHBOARD_ANALYTICS_RANGES)[number];

type BucketGranularity = 'hour' | 'day' | 'month';

interface TimeBucket {
  key: string;
  label: string;
}

interface TrendBucket extends TimeBucket {
  revenue: number;
  orders: number;
  paid: number;
  unpaid: number;
}

export interface DashboardAnalytics {
  range: DashboardAnalyticsRange;
  period: {
    start: string;
    end: string;
  };
  summary: {
    revenue: number;
    orders: number;
    paidRevenue: number;
    unpaidRevenue: number;
    averageOrderValue: number;
  };
  trend: Array<{
    label: string;
    revenue: number;
    orders: number;
  }>;
  paymentTrend: Array<{
    label: string;
    paid: number;
    unpaid: number;
  }>;
  orderStatuses: Array<{
    status: string;
    label: string;
    count: number;
  }>;
  topDishes: Array<{
    name: string;
    image: string | null;
    quantity: number;
    revenue: number;
    type: 'dish' | 'combo';
  }>;
}

const VIETNAM_UTC_OFFSET_MS = 7 * 60 * 60 * 1000;
const TOP_DISH_LIMIT = 10;

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xử lý',
  confirmed: 'Đã xác nhận',
  preparing: 'Đang chuẩn bị',
  shipped: 'Đang giao',
  arrived: 'Đã đến nơi',
  completed: 'Đã hoàn thành',
  cancelled: 'Đã hủy',
  unknown: 'Không xác định',
};

const STATUS_ORDER = [
  'pending',
  'confirmed',
  'preparing',
  'shipped',
  'arrived',
  'completed',
  'cancelled',
  'unknown',
];

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function getVietnamDateParts(date: Date) {
  const vietnamDate = new Date(date.getTime() + VIETNAM_UTC_OFFSET_MS);
  return {
    year: vietnamDate.getUTCFullYear(),
    month: vietnamDate.getUTCMonth(),
    day: vietnamDate.getUTCDate(),
    hour: vietnamDate.getUTCHours(),
  };
}

function vietnamMidnight(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day) - VIETNAM_UTC_OFFSET_MS);
}

function buildBuckets(
  range: DashboardAnalyticsRange,
  now: Date
): {
  start: Date;
  granularity: BucketGranularity;
  buckets: TrendBucket[];
} {
  const nowParts = getVietnamDateParts(now);

  // Today & Yesterday: hourly buckets
  if (range === 'today' || range === 'yesterday') {
    const dayOffset = range === 'yesterday' ? 1 : 0;
    const targetDay = new Date(
      Date.UTC(nowParts.year, nowParts.month, nowParts.day - dayOffset)
    );
    const start = vietnamMidnight(
      targetDay.getUTCFullYear(),
      targetDay.getUTCMonth(),
      targetDay.getUTCDate()
    );
    const bucketCount = range === 'yesterday' ? 24 : nowParts.hour + 1;

    const buckets = Array.from({ length: bucketCount }, (_, index) => ({
      key: `${targetDay.getUTCFullYear()}-${pad2(targetDay.getUTCMonth() + 1)}-${pad2(targetDay.getUTCDate())}-${pad2(index)}`,
      label: `${pad2(index)}h`,
      revenue: 0,
      orders: 0,
      paid: 0,
      unpaid: 0,
    }));

    return { start, granularity: 'hour', buckets };
  }

  // Monthly ranges: 3m, 6m, 12m
  if (range === '3m' || range === '6m' || range === '12m') {
    const monthCount = range === '3m' ? 3 : range === '6m' ? 6 : 12;
    const firstLocalMonth = new Date(
      Date.UTC(nowParts.year, nowParts.month - (monthCount - 1), 1)
    );
    const start = vietnamMidnight(
      firstLocalMonth.getUTCFullYear(),
      firstLocalMonth.getUTCMonth(),
      1
    );
    const buckets = Array.from({ length: monthCount }, (_, index) => {
      const localMonth = new Date(
        Date.UTC(
          firstLocalMonth.getUTCFullYear(),
          firstLocalMonth.getUTCMonth() + index,
          1
        )
      );
      const month = localMonth.getUTCMonth() + 1;
      return {
        key: `${localMonth.getUTCFullYear()}-${pad2(month)}`,
        label: `T${month}`,
        revenue: 0,
        orders: 0,
        paid: 0,
        unpaid: 0,
      };
    });

    return { start, granularity: 'month', buckets };
  }
  // Daily ranges: 7d, 30d
  const bucketCount = range === '7d' ? 7 : 30;
  const firstLocalDate = new Date(
    Date.UTC(nowParts.year, nowParts.month, nowParts.day - (bucketCount - 1))
  );
  const start = vietnamMidnight(
    firstLocalDate.getUTCFullYear(),
    firstLocalDate.getUTCMonth(),
    firstLocalDate.getUTCDate()
  );
  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const localDate = new Date(
      Date.UTC(
        firstLocalDate.getUTCFullYear(),
        firstLocalDate.getUTCMonth(),
        firstLocalDate.getUTCDate() + index
      )
    );
    const month = localDate.getUTCMonth() + 1;
    const day = localDate.getUTCDate();

    return {
      key: `${localDate.getUTCFullYear()}-${pad2(month)}-${pad2(day)}`,
      label: `${pad2(day)}/${pad2(month)}`,
      revenue: 0,
      orders: 0,
      paid: 0,
      unpaid: 0,
    };
  });

  return { start, granularity: 'day', buckets };
}

function getBucketKey(date: Date, granularity: BucketGranularity): string {
  const parts = getVietnamDateParts(date);
  const month = pad2(parts.month + 1);
  if (granularity === 'hour') {
    return `${parts.year}-${month}-${pad2(parts.day)}-${pad2(parts.hour)}`;
  }
  return granularity === 'month'
    ? `${parts.year}-${month}`
    : `${parts.year}-${month}-${pad2(parts.day)}`;
}

function normalizeStatus(status: string | null): string {
  const normalized = status?.trim().toLowerCase();
  if (normalized === 'delivering') return 'shipped';
  return normalized || 'unknown';
}

function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] || status;
}

function statusSortIndex(status: string): number {
  const index = STATUS_ORDER.indexOf(status);
  return index === -1 ? STATUS_ORDER.length : index;
}

export function isDashboardAnalyticsRange(
  value: unknown
): value is DashboardAnalyticsRange {
  return (
    typeof value === 'string' &&
    DASHBOARD_ANALYTICS_RANGES.includes(value as DashboardAnalyticsRange)
  );
}

export class DashboardAnalyticsService {
  static async getAnalytics(
    range: DashboardAnalyticsRange,
    now = new Date()
  ): Promise<DashboardAnalytics> {
    const { start, granularity, buckets } = buildBuckets(range, now);

    const orders = await prisma.order.findMany({
      where: {
        created_at: {
          gte: start,
          lte: now,
        },
      },
      select: {
        order_id: true,
        order_status: true,
        payment_status: true,
        total_order: true,
        created_at: true,
      },
    });

    const bucketByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));
    const statusCounts = new Map<string, number>();
    const topDishTotals = new Map<
      string,
      {
        name: string;
        image: string | null;
        quantity: number;
        revenue: number;
        type: 'dish' | 'combo';
      }
    >();

    let revenue = 0;
    let orderCount = 0;
    let revenueOrderCount = 0;
    let paidRevenue = 0;
    let unpaidRevenue = 0;
    const revenueOrderIds: number[] = [];

    for (const order of orders) {
      const status = normalizeStatus(order.order_status);
      statusCounts.set(status, (statusCounts.get(status) || 0) + 1);

      if (!order.created_at) {
        continue;
      }

      const bucket = bucketByKey.get(
        getBucketKey(order.created_at, granularity)
      );
      orderCount += 1;
      if (bucket) bucket.orders += 1;

      if (status === 'cancelled') continue;

      const amount = order.total_order || 0;
      const isPaid = order.payment_status?.trim().toLowerCase() === 'paid';

      revenue += amount;
      revenueOrderCount += 1;
      revenueOrderIds.push(order.order_id);

      if (isPaid) {
        paidRevenue += amount;
      } else {
        unpaidRevenue += amount;
      }

      if (bucket) {
        bucket.revenue += amount;
        if (isPaid) {
          bucket.paid += amount;
        } else {
          bucket.unpaid += amount;
        }
      }
    }

    const orderItems =
      revenueOrderIds.length > 0
        ? await prisma.orderItem.findMany({
            where: { order_id: { in: revenueOrderIds } },
            select: {
              quantity: true,
              order_price: true,
              dish_price: {
                select: {
                  dish: {
                    select: {
                      dish_id: true,
                      dish_name: true,
                      image: true,
                    },
                  },
                },
              },
              combo: {
                select: {
                  combo_id: true,
                  combo_name: true,
                  image_combo: true,
                },
              },
            },
          })
        : [];

    for (const item of orderItems) {
      const quantity = item.quantity || 0;
      const itemRevenue = item.order_price || 0;

      if (item.combo) {
        const key = `combo:${item.combo.combo_id}`;
        const current = topDishTotals.get(key) || {
          name: item.combo.combo_name,
          image: item.combo.image_combo,
          quantity: 0,
          revenue: 0,
          type: 'combo' as const,
        };
        current.quantity += quantity;
        current.revenue += itemRevenue;
        topDishTotals.set(key, current);
        continue;
      }

      const dish = item.dish_price?.dish;
      if (dish) {
        const key = `dish:${dish.dish_id}`;
        const current = topDishTotals.get(key) || {
          name: dish.dish_name,
          image: dish.image,
          quantity: 0,
          revenue: 0,
          type: 'dish' as const,
        };
        current.quantity += quantity;
        current.revenue += itemRevenue;
        topDishTotals.set(key, current);
      }
    }

    const orderStatuses = Array.from(statusCounts.entries())
      .map(([status, count]) => ({
        status,
        label: getStatusLabel(status),
        count,
      }))
      .sort((a, b) => {
        const orderDifference =
          statusSortIndex(a.status) - statusSortIndex(b.status);
        return orderDifference || a.status.localeCompare(b.status);
      });

    const topDishes = Array.from(topDishTotals.values())
      .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
      .slice(0, TOP_DISH_LIMIT);

    return {
      range,
      period: {
        start: start.toISOString(),
        end: now.toISOString(),
      },
      summary: {
        revenue,
        orders: orderCount,
        paidRevenue,
        unpaidRevenue,
        averageOrderValue:
          revenueOrderCount > 0 ? Math.round(revenue / revenueOrderCount) : 0,
      },
      trend: buckets.map(
        ({ label, revenue: bucketRevenue, orders: bucketOrders }) => ({
          label,
          revenue: bucketRevenue,
          orders: bucketOrders,
        })
      ),
      paymentTrend: buckets.map(({ label, paid, unpaid }) => ({
        label,
        paid,
        unpaid,
      })),
      orderStatuses,
      topDishes,
    };
  }
}
