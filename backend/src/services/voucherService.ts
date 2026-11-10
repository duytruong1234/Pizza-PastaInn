import fs from 'fs';
import path from 'path';
import prisma from '../lib/prisma';

export interface VoucherItem {
  voucher_id: number;
  code: string;
  title: string;
  description: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_order_value: number;
  max_discount: number | null;
  start_date: string;
  end_date: string;
  usage_limit: number;
  used_count: number;
  is_active: boolean;
}

export interface LoyaltyRedemptionRecord {
  order_id: number;
  user_id: number;
  points_used: number;
  discount_amount: number;
  created_at: string;
}

export interface LoyaltyAdjustmentRecord {
  adjustment_id: number;
  user_id: number;
  points_delta: number;
  reason: string;
  created_at: string;
}

export interface LoyaltyConfig {
  is_enabled: boolean;
  spend_per_point: number;
  point_value_vnd: number;
  silver_threshold: number;
  gold_threshold: number;
  diamond_threshold: number;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const VOUCHERS_FILE = path.join(DATA_DIR, 'vouchers.json');
const LOYALTY_FILE = path.join(DATA_DIR, 'loyalty_redemptions.json');
const LOYALTY_ADJUSTMENTS_FILE = path.join(DATA_DIR, 'loyalty_adjustments.json');
const LOYALTY_CONFIG_FILE = path.join(DATA_DIR, 'loyalty_config.json');

const DEFAULT_LOYALTY_CONFIG: LoyaltyConfig = {
  is_enabled: true,
  spend_per_point: 10000,
  point_value_vnd: 1000,
  silver_threshold: 50,
  gold_threshold: 150,
  diamond_threshold: 300,
};

const DEFAULT_VOUCHERS: VoucherItem[] = [
  {
    voucher_id: 1,
    code: 'WELCOME20',
    title: 'Giảm 20% đơn hàng',
    description: 'Giảm 20% tối đa 50.000đ cho đơn từ 150.000đ',
    discount_type: 'percent',
    discount_value: 20,
    min_order_value: 150000,
    max_discount: 50000,
    start_date: '2025-01-01',
    end_date: '2027-12-31',
    usage_limit: 500,
    used_count: 24,
    is_active: true,
  },
  {
    voucher_id: 2,
    code: 'PIZZA30K',
    title: 'Giảm 30.000đ',
    description: 'Giảm trực tiếp 30.000đ cho đơn hàng từ 200.000đ',
    discount_type: 'fixed',
    discount_value: 30000,
    min_order_value: 200000,
    max_discount: 30000,
    start_date: '2025-01-01',
    end_date: '2027-12-31',
    usage_limit: 500,
    used_count: 41,
    is_active: true,
  },
  {
    voucher_id: 3,
    code: 'FREESHIP',
    title: 'Hỗ trợ 20.000đ phí giao hàng',
    description: 'Giảm ngay 20.000đ cho đơn giao tận nơi từ 180.000đ',
    discount_type: 'fixed',
    discount_value: 20000,
    min_order_value: 180000,
    max_discount: 20000,
    start_date: '2025-01-01',
    end_date: '2027-12-31',
    usage_limit: 1000,
    used_count: 68,
    is_active: true,
  },
  {
    voucher_id: 4,
    code: 'PARTY50K',
    title: 'Ưu đãi tiệc 50.000đ',
    description: 'Giảm 50.000đ cho đơn hàng nhóm từ 350.000đ',
    discount_type: 'fixed',
    discount_value: 50000,
    min_order_value: 350000,
    max_discount: 50000,
    start_date: '2025-01-01',
    end_date: '2027-12-31',
    usage_limit: 300,
    used_count: 15,
    is_active: true,
  },
  {
    voucher_id: 5,
    code: 'VIP80K',
    title: 'Đại tiệc giảm 80.000đ',
    description: 'Giảm ngay 80.000đ cho đơn hàng từ 500.000đ',
    discount_type: 'fixed',
    discount_value: 80000,
    min_order_value: 500000,
    max_discount: 80000,
    start_date: '2025-01-01',
    end_date: '2027-12-31',
    usage_limit: 200,
    used_count: 9,
    is_active: true,
  },
];

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export class VoucherService {
  static loadVouchers(): VoucherItem[] {
    ensureDataDir();
    if (!fs.existsSync(VOUCHERS_FILE)) {
      fs.writeFileSync(VOUCHERS_FILE, JSON.stringify(DEFAULT_VOUCHERS, null, 2), 'utf-8');
      return [...DEFAULT_VOUCHERS];
    }
    try {
      const raw = fs.readFileSync(VOUCHERS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [...DEFAULT_VOUCHERS];
    } catch {
      return [...DEFAULT_VOUCHERS];
    }
  }

  static saveVouchers(vouchers: VoucherItem[]) {
    ensureDataDir();
    fs.writeFileSync(VOUCHERS_FILE, JSON.stringify(vouchers, null, 2), 'utf-8');
  }

  static listActiveVouchers(): VoucherItem[] {
    const now = new Date();
    return VoucherService.loadVouchers().filter((v) => {
      if (!v.is_active) return false;
      if (v.usage_limit > 0 && v.used_count >= v.usage_limit) return false;
      const end = new Date(`${v.end_date}T23:59:59`);
      if (!isNaN(end.getTime()) && end < now) return false;
      return true;
    });
  }

  static validateVoucher(code: string, subtotal: number, shippingFee = 0): {
    valid: boolean;
    message: string;
    voucher?: VoucherItem;
    discount_amount: number;
  } {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) {
      return { valid: false, message: 'Vui lòng nhập mã giảm giá', discount_amount: 0 };
    }

    const vouchers = VoucherService.loadVouchers();
    const voucher = vouchers.find((v) => v.code.toUpperCase() === cleanCode);
    if (!voucher || !voucher.is_active) {
      return { valid: false, message: 'Mã giảm giá không tồn tại hoặc đã ngừng áp dụng', discount_amount: 0 };
    }

    const now = new Date();
    const start = new Date(`${voucher.start_date}T00:00:00`);
    const end = new Date(`${voucher.end_date}T23:59:59`);
    if (!isNaN(start.getTime()) && now < start) {
      return { valid: false, message: 'Mã giảm giá chưa đến thời gian áp dụng', discount_amount: 0 };
    }
    if (!isNaN(end.getTime()) && now > end) {
      return { valid: false, message: 'Mã giảm giá đã hết hạn', discount_amount: 0 };
    }
    if (voucher.usage_limit > 0 && voucher.used_count >= voucher.usage_limit) {
      return { valid: false, message: 'Mã giảm giá đã hết lượt sử dụng', discount_amount: 0 };
    }
    if (subtotal < voucher.min_order_value) {
      return {
        valid: false,
        message: `Đơn hàng tối thiểu ${voucher.min_order_value.toLocaleString('vi-VN')}đ để dùng mã ${voucher.code}`,
        discount_amount: 0,
      };
    }

    let discount = 0;
    if (voucher.discount_type === 'percent') {
      discount = Math.round((subtotal * voucher.discount_value) / 100);
      if (voucher.max_discount && voucher.max_discount > 0) {
        discount = Math.min(discount, voucher.max_discount);
      }
    } else {
      discount = voucher.discount_value;
    }

    const maxAllowed = subtotal + shippingFee;
    discount = Math.max(0, Math.min(discount, maxAllowed));

    return {
      valid: true,
      message: `Áp dụng mã ${voucher.code} thành công (-${discount.toLocaleString('vi-VN')}đ)`,
      voucher,
      discount_amount: discount,
    };
  }

  static incrementVoucherUsage(code: string) {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) return;
    const vouchers = VoucherService.loadVouchers();
    const idx = vouchers.findIndex((v) => v.code.toUpperCase() === cleanCode);
    if (idx !== -1) {
      vouchers[idx].used_count = (vouchers[idx].used_count || 0) + 1;
      VoucherService.saveVouchers(vouchers);
    }
  }

  static createVoucher(payload: Partial<VoucherItem>): VoucherItem {
    const vouchers = VoucherService.loadVouchers();
    const code = (payload.code || '').trim().toUpperCase();
    if (!code) {
      throw new Error('Mã giảm giá không được để trống');
    }
    if (vouchers.some((v) => v.code.toUpperCase() === code)) {
      throw new Error(`Mã ${code} đã tồn tại`);
    }
    const nextId = vouchers.reduce((max, v) => Math.max(max, v.voucher_id), 0) + 1;
    const newItem: VoucherItem = {
      voucher_id: nextId,
      code,
      title: payload.title || `Ưu đãi ${code}`,
      description: payload.description || '',
      discount_type: payload.discount_type === 'percent' ? 'percent' : 'fixed',
      discount_value: Number(payload.discount_value) || 0,
      min_order_value: Number(payload.min_order_value) || 0,
      max_discount: payload.max_discount != null ? Number(payload.max_discount) : null,
      start_date: payload.start_date || new Date().toISOString().slice(0, 10),
      end_date: payload.end_date || '2027-12-31',
      usage_limit: Number(payload.usage_limit) || 100,
      used_count: 0,
      is_active: payload.is_active !== false,
    };
    vouchers.unshift(newItem);
    VoucherService.saveVouchers(vouchers);
    return newItem;
  }

  static updateVoucher(voucherId: number, payload: Partial<VoucherItem>): VoucherItem {
    const vouchers = VoucherService.loadVouchers();
    const idx = vouchers.findIndex((v) => v.voucher_id === voucherId);
    if (idx === -1) {
      throw new Error('Không tìm thấy mã giảm giá');
    }
    const current = vouchers[idx];
    const updatedCode = payload.code ? payload.code.trim().toUpperCase() : current.code;
    if (
      updatedCode !== current.code &&
      vouchers.some((v) => v.voucher_id !== voucherId && v.code.toUpperCase() === updatedCode)
    ) {
      throw new Error(`Mã ${updatedCode} đã tồn tại`);
    }

    const updated: VoucherItem = {
      ...current,
      code: updatedCode,
      title: payload.title !== undefined ? payload.title : current.title,
      description: payload.description !== undefined ? payload.description : current.description,
      discount_type:
        payload.discount_type !== undefined
          ? payload.discount_type === 'percent'
            ? 'percent'
            : 'fixed'
          : current.discount_type,
      discount_value:
        payload.discount_value !== undefined ? Number(payload.discount_value) : current.discount_value,
      min_order_value:
        payload.min_order_value !== undefined ? Number(payload.min_order_value) : current.min_order_value,
      max_discount:
        payload.max_discount !== undefined
          ? payload.max_discount != null
            ? Number(payload.max_discount)
            : null
          : current.max_discount,
      start_date: payload.start_date !== undefined ? payload.start_date : current.start_date,
      end_date: payload.end_date !== undefined ? payload.end_date : current.end_date,
      usage_limit: payload.usage_limit !== undefined ? Number(payload.usage_limit) : current.usage_limit,
      is_active: payload.is_active !== undefined ? Boolean(payload.is_active) : current.is_active,
    };

    vouchers[idx] = updated;
    VoucherService.saveVouchers(vouchers);
    return updated;
  }

  static deleteVoucher(voucherId: number) {
    const vouchers = VoucherService.loadVouchers();
    const filtered = vouchers.filter((v) => v.voucher_id !== voucherId);
    VoucherService.saveVouchers(filtered);
  }

  // ── Loyalty Points & Membership Tiers ──────────────────────────────────────

  static loadLoyaltyConfig(): LoyaltyConfig {
    ensureDataDir();
    if (!fs.existsSync(LOYALTY_CONFIG_FILE)) {
      fs.writeFileSync(LOYALTY_CONFIG_FILE, JSON.stringify(DEFAULT_LOYALTY_CONFIG, null, 2), 'utf-8');
      return { ...DEFAULT_LOYALTY_CONFIG };
    }
    try {
      const raw = fs.readFileSync(LOYALTY_CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        is_enabled: parsed?.is_enabled !== false,
        spend_per_point: Math.max(1000, Number(parsed?.spend_per_point) || DEFAULT_LOYALTY_CONFIG.spend_per_point),
        point_value_vnd: Math.max(100, Number(parsed?.point_value_vnd) || DEFAULT_LOYALTY_CONFIG.point_value_vnd),
        silver_threshold: Math.max(1, Number(parsed?.silver_threshold) || DEFAULT_LOYALTY_CONFIG.silver_threshold),
        gold_threshold: Math.max(2, Number(parsed?.gold_threshold) || DEFAULT_LOYALTY_CONFIG.gold_threshold),
        diamond_threshold: Math.max(3, Number(parsed?.diamond_threshold) || DEFAULT_LOYALTY_CONFIG.diamond_threshold),
      };
    } catch {
      return { ...DEFAULT_LOYALTY_CONFIG };
    }
  }

  static updateLoyaltyConfig(payload: Partial<LoyaltyConfig>): LoyaltyConfig {
    const current = VoucherService.loadLoyaltyConfig();
    const updated: LoyaltyConfig = {
      is_enabled: payload.is_enabled !== undefined ? Boolean(payload.is_enabled) : current.is_enabled,
      spend_per_point:
        payload.spend_per_point !== undefined
          ? Math.max(1000, Number(payload.spend_per_point) || 10000)
          : current.spend_per_point,
      point_value_vnd:
        payload.point_value_vnd !== undefined
          ? Math.max(100, Number(payload.point_value_vnd) || 1000)
          : current.point_value_vnd,
      silver_threshold:
        payload.silver_threshold !== undefined
          ? Math.max(1, Number(payload.silver_threshold) || 50)
          : current.silver_threshold,
      gold_threshold:
        payload.gold_threshold !== undefined
          ? Math.max(2, Number(payload.gold_threshold) || 150)
          : current.gold_threshold,
      diamond_threshold:
        payload.diamond_threshold !== undefined
          ? Math.max(3, Number(payload.diamond_threshold) || 300)
          : current.diamond_threshold,
    };
    ensureDataDir();
    fs.writeFileSync(LOYALTY_CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    return updated;
  }

  static loadLoyaltyAdjustments(): LoyaltyAdjustmentRecord[] {
    ensureDataDir();
    if (!fs.existsSync(LOYALTY_ADJUSTMENTS_FILE)) {
      fs.writeFileSync(LOYALTY_ADJUSTMENTS_FILE, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    try {
      const raw = fs.readFileSync(LOYALTY_ADJUSTMENTS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  static adjustUserPoints(userId: number, pointsDelta: number, reason: string): LoyaltyAdjustmentRecord {
    const uid = Number(userId);
    const delta = Math.trunc(Number(pointsDelta));
    if (!uid || isNaN(uid)) {
      throw new Error('Khách hàng không hợp lệ');
    }
    if (!delta || isNaN(delta)) {
      throw new Error('Số điểm điều chỉnh phải khác 0');
    }
    const list = VoucherService.loadLoyaltyAdjustments();
    const nextId = list.reduce((max, item) => Math.max(max, item.adjustment_id || 0), 0) + 1;
    const record: LoyaltyAdjustmentRecord = {
      adjustment_id: nextId,
      user_id: uid,
      points_delta: delta,
      reason: (reason || '').trim() || (delta > 0 ? 'Cộng điểm thưởng từ Quản trị viên' : 'Điều chỉnh giảm điểm'),
      created_at: new Date().toISOString(),
    };
    list.push(record);
    ensureDataDir();
    fs.writeFileSync(LOYALTY_ADJUSTMENTS_FILE, JSON.stringify(list, null, 2), 'utf-8');
    return record;
  }

  static deleteLoyaltyAdjustment(adjustmentId: number) {
    ensureDataDir();
    const list = VoucherService.loadLoyaltyAdjustments();
    const filtered = list.filter((a) => a.adjustment_id !== adjustmentId);
    fs.writeFileSync(LOYALTY_ADJUSTMENTS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
  }

  static loadLoyaltyRedemptions(): LoyaltyRedemptionRecord[] {
    ensureDataDir();
    if (!fs.existsSync(LOYALTY_FILE)) {
      fs.writeFileSync(LOYALTY_FILE, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    try {
      const raw = fs.readFileSync(LOYALTY_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  static saveLoyaltyRedemption(record: LoyaltyRedemptionRecord) {
    ensureDataDir();
    const list = VoucherService.loadLoyaltyRedemptions();
    list.push(record);
    fs.writeFileSync(LOYALTY_FILE, JSON.stringify(list, null, 2), 'utf-8');
  }

  static refundOrderRedemption(orderId: number) {
    ensureDataDir();
    const list = VoucherService.loadLoyaltyRedemptions();
    const filtered = list.filter((r) => r.order_id !== orderId);
    if (filtered.length !== list.length) {
      fs.writeFileSync(LOYALTY_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
    }
  }

  private static computeTierInfo(earnedPoints: number, config: LoyaltyConfig) {
    let tierKey: 'bronze' | 'silver' | 'gold' | 'diamond' = 'bronze';
    let tierName = 'Hạng Đồng (Bronze)';
    let nextTierName: string | null = 'Hạng Bạc (Silver)';
    let pointsToNextTier = Math.max(0, config.silver_threshold - earnedPoints);
    let tierBenefit = `Tích 1 điểm cho mỗi ${config.spend_per_point.toLocaleString('vi-VN')}đ chi tiêu (1 điểm = ${config.point_value_vnd.toLocaleString('vi-VN')}đ)`;

    if (earnedPoints >= config.diamond_threshold) {
      tierKey = 'diamond';
      tierName = 'Hạng Kim Cương (Diamond)';
      nextTierName = null;
      pointsToNextTier = 0;
      tierBenefit = 'Thành viên VIP cao cấp • Đổi điểm trực tiếp & ưu tiên xử lý đơn hàng';
    } else if (earnedPoints >= config.gold_threshold) {
      tierKey = 'gold';
      tierName = 'Hạng Vàng (Gold)';
      nextTierName = 'Hạng Kim Cương (Diamond)';
      pointsToNextTier = Math.max(0, config.diamond_threshold - earnedPoints);
      tierBenefit = 'Thành viên Vàng • Đổi điểm giảm giá trực tiếp khi thanh toán';
    } else if (earnedPoints >= config.silver_threshold) {
      tierKey = 'silver';
      tierName = 'Hạng Bạc (Silver)';
      nextTierName = 'Hạng Vàng (Gold)';
      pointsToNextTier = Math.max(0, config.gold_threshold - earnedPoints);
      tierBenefit = 'Thành viên Bạc • Đổi điểm giảm giá trực tiếp khi thanh toán';
    }

    return {
      tierKey,
      tierName,
      nextTierName,
      pointsToNextTier,
      tierBenefit,
    };
  }

  static async getUserLoyaltySummary(userId: number) {
    const config = VoucherService.loadLoyaltyConfig();
    const completedOrders = await prisma.order.findMany({
      where: {
        user_id: userId,
        order_status: 'completed',
      },
      select: {
        order_id: true,
        total_order: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });

    const totalSpent = completedOrders.reduce((sum, o) => sum + (o.total_order || 0), 0);
    const orderPoints = Math.floor(totalSpent / config.spend_per_point);

    const adjustments = VoucherService.loadLoyaltyAdjustments().filter((a) => a.user_id === userId);
    const bonusPoints = adjustments.reduce((sum, a) => sum + (a.points_delta || 0), 0);
    const earnedPoints = Math.max(0, orderPoints + bonusPoints);

    const redemptions = VoucherService.loadLoyaltyRedemptions().filter((r) => r.user_id === userId);
    const redeemedPoints = redemptions.reduce((sum, r) => sum + (r.points_used || 0), 0);
    const availablePoints = config.is_enabled ? Math.max(0, earnedPoints - redeemedPoints) : 0;

    const { tierKey, tierName, nextTierName, pointsToNextTier, tierBenefit } =
      VoucherService.computeTierInfo(earnedPoints, config);

    return {
      user_id: userId,
      is_enabled: config.is_enabled,
      spend_per_point: config.spend_per_point,
      completed_orders_count: completedOrders.length,
      total_spent: totalSpent,
      order_points: orderPoints,
      bonus_points: bonusPoints,
      earned_points: earnedPoints,
      redeemed_points: redeemedPoints,
      available_points: availablePoints,
      point_value_vnd: config.point_value_vnd,
      max_redeemable_vnd: availablePoints * config.point_value_vnd,
      tier_key: tierKey,
      tier_name: tierName,
      next_tier_name: nextTierName,
      points_to_next_tier: pointsToNextTier,
      amount_to_next_tier: pointsToNextTier * config.spend_per_point,
      tier_benefit: tierBenefit,
      recent_history: completedOrders.slice(0, 10).map((o) => ({
        order_id: o.order_id,
        total_order: o.total_order || 0,
        points_earned: Math.floor((o.total_order || 0) / config.spend_per_point),
        created_at: o.created_at,
      })),
      redemptions: redemptions.slice(-10).reverse(),
      adjustments: adjustments.slice(-10).reverse(),
    };
  }

  static async getAdminLoyaltyOverview() {
    const config = VoucherService.loadLoyaltyConfig();
    const allRedemptions = VoucherService.loadLoyaltyRedemptions();
    const allAdjustments = VoucherService.loadLoyaltyAdjustments();

    const users = await prisma.user.findMany({
      select: {
        user_id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        created_at: true,
        orders: {
          where: { order_status: 'completed' },
          select: {
            order_id: true,
            total_order: true,
            created_at: true,
          },
          orderBy: { created_at: 'desc' },
        },
      },
      orderBy: { user_id: 'asc' },
    });

    const userMap = new Map<number, { username: string; email: string; phone: string }>();
    for (const u of users) {
      userMap.set(u.user_id, {
        username: u.username || `Khách #${u.user_id}`,
        email: u.email || '',
        phone: u.phone || '',
      });
    }

    const tierDistribution = {
      diamond: 0,
      gold: 0,
      silver: 0,
      bronze: 0,
    };

    let totalEarnedPoints = 0;
    let totalRedeemedPoints = 0;
    let totalAvailablePoints = 0;
    let membersWithPoints = 0;

    const members = users.map((u) => {
      const completedOrders = u.orders || [];
      const totalSpent = completedOrders.reduce((sum, o) => sum + (o.total_order || 0), 0);
      const orderPoints = Math.floor(totalSpent / config.spend_per_point);

      const userAdjustments = allAdjustments.filter((a) => a.user_id === u.user_id);
      const bonusPoints = userAdjustments.reduce((sum, a) => sum + (a.points_delta || 0), 0);
      const earnedPoints = Math.max(0, orderPoints + bonusPoints);

      const userRedemptions = allRedemptions.filter((r) => r.user_id === u.user_id);
      const redeemedPoints = userRedemptions.reduce((sum, r) => sum + (r.points_used || 0), 0);
      const availablePoints = Math.max(0, earnedPoints - redeemedPoints);

      const { tierKey, tierName, nextTierName, pointsToNextTier } = VoucherService.computeTierInfo(
        earnedPoints,
        config
      );

      tierDistribution[tierKey] += 1;
      totalEarnedPoints += earnedPoints;
      totalRedeemedPoints += redeemedPoints;
      totalAvailablePoints += availablePoints;
      if (earnedPoints > 0 || availablePoints > 0) {
        membersWithPoints += 1;
      }

      return {
        user_id: u.user_id,
        username: u.username,
        email: u.email,
        phone: u.phone || '',
        role: u.role,
        created_at: u.created_at,
        completed_orders_count: completedOrders.length,
        total_spent: totalSpent,
        order_points: orderPoints,
        bonus_points: bonusPoints,
        earned_points: earnedPoints,
        redeemed_points: redeemedPoints,
        available_points: availablePoints,
        max_redeemable_vnd: availablePoints * config.point_value_vnd,
        tier_key: tierKey,
        tier_name: tierName,
        next_tier_name: nextTierName,
        points_to_next_tier: pointsToNextTier,
        recent_orders: completedOrders.slice(0, 10).map((o) => ({
          order_id: o.order_id,
          total_order: o.total_order || 0,
          points_earned: Math.floor((o.total_order || 0) / config.spend_per_point),
          created_at: o.created_at,
        })),
        redemptions: [...userRedemptions].reverse(),
        adjustments: [...userAdjustments].reverse(),
      };
    });

    // Sort members by earned_points DESC, then total_spent DESC
    members.sort((a, b) => {
      if (b.earned_points !== a.earned_points) return b.earned_points - a.earned_points;
      return b.total_spent - a.total_spent;
    });

    const totalDiscountRedeemedVnd = allRedemptions.reduce((sum, r) => sum + (r.discount_amount || 0), 0);

    const recentRedemptions = [...allRedemptions]
      .reverse()
      .slice(0, 30)
      .map((r) => {
        const u = userMap.get(r.user_id);
        return {
          ...r,
          username: u?.username || `Khách #${r.user_id}`,
          email: u?.email || '',
          phone: u?.phone || '',
        };
      });

    const recentAdjustments = [...allAdjustments]
      .reverse()
      .slice(0, 30)
      .map((a) => {
        const u = userMap.get(a.user_id);
        return {
          ...a,
          username: u?.username || `Khách #${a.user_id}`,
          email: u?.email || '',
          phone: u?.phone || '',
        };
      });

    return {
      config,
      stats: {
        total_members: members.length,
        members_with_points: membersWithPoints,
        total_earned_points: totalEarnedPoints,
        total_redeemed_points: totalRedeemedPoints,
        total_available_points: totalAvailablePoints,
        total_discount_redeemed_vnd: totalDiscountRedeemedVnd,
        tier_distribution: tierDistribution,
      },
      members,
      recent_redemptions: recentRedemptions,
      recent_adjustments: recentAdjustments,
    };
  }
}
