import prisma from '../lib/prisma';

/**
 * PHÂN TÍCH MUA CÙNG (Co-occurrence Statistics) — Thống kê tần suất đơn hàng gọi chung
 *
 * - Giỏ hàng = 1 đơn hàng không bị huỷ, chỉ gồm các MÓN LẺ (không tính combo).
 *   Pizza nửa-nửa được tính 2 nửa là 2 món.
 * - Mỗi món chỉ tính tối đa 1 lần / đơn (dù khách gọi nhiều phần).
 *
 * Chỉ số thống kê trực tiếp:
 *   Số đơn gọi chung = count(X ∪ Y)
 *   Tỷ trọng đơn     = count(X ∪ Y) / N
 *   Tỷ lệ gọi kèm    = count(X ∪ Y) / count(X)
 */

const EXCLUDED_DISH_IDS = [62, 63, 64, 65];
const MAIN_ROLES = new Set(['pizza', 'spaghetti', 'gratin']);

// Giả định dùng cho ước tính doanh thu khi lập combo (hiển thị minh bạch trên giao diện)
const COMBO_ASSUMPTIONS = {
  pairDiscount: 0.1, // Giảm 10% với combo 2 món
  tripleDiscount: 0.12, // Giảm 12% với combo 3 món
  conversionRate: 0.1, // 10% đơn chỉ gọi một phần của bộ món sẽ nâng lên combo
  cannibalizationRate: 0.6, // 60% đơn vốn đã gọi đủ bộ món sẽ chuyển sang giá combo
};

type DishRole = 'pizza' | 'spaghetti' | 'gratin' | 'side' | 'drink';

interface DishMeta {
  dish_id: number;
  code: string;
  dish_name: string;
  ingredient: string;
  image: string | null;
  category_id: number | null;
  category_name: string;
  role: DishRole;
  dish_type: string;
  unitPrice: number;
  dish_price_id: string | null;
  prices: {
    dish_price_id: string;
    size_id: number | null;
    crust_id: number | null;
    size_name: string;
    crust_name: string;
    dish_price: number;
  }[];
}

export interface CoOccurrenceParams {
  year?: number;
  minCoOrders?: number; // Số đơn gọi chung tối thiểu
  minAttachRate?: number; // Tỷ lệ gọi kèm tối thiểu (0..1)
}

interface SummaryStep {
  step: number;
  title: string;
  fromLabel: string;
  fromValue: number;
  toLabel: string;
  toValue: number;
  desc: string;
}

export interface CoPurchasedRelation {
  antecedent: number[];
  consequent: number;
  count: number;
  orderShare: number;
  attachRate: number;
}

interface CoOccurrenceResult {
  year: number | null;
  totalOrders: number;
  minCoOrders: number;
  minAttachRate: number;
  itemCounts: Map<number, number>;
  pairCounts: Map<string, number>;
  qualifiedPairs: Map<string, number>;
  qualifiedTriples: Map<string, number>;
  steps: SummaryStep[];
  relations: CoPurchasedRelation[];
  dishMeta: Map<number, DishMeta>;
  computedAt: string;
}

const pairKey = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);
const tripleKey = (ids: number[]) => [...ids].sort((x, y) => x - y).join('-');
const round = (v: number, d = 4) => Number(v.toFixed(d));
const formatDishCode = (id: number) => `MA${String(id).padStart(3, '0')}`;

const roleFromCategory = (name: string): DishRole => {
  const cat = name.toLowerCase();
  if (cat.includes('pizza')) return 'pizza';
  if (cat.includes('spaghetti')) return 'spaghetti';
  if (cat.includes('gratin') || cat.includes('risotto') || cat.includes('forno')) return 'gratin';
  if (cat.includes('drink') || cat.includes('uống')) return 'drink';
  return 'side';
};

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; value: CoOccurrenceResult }>();

export class BasketAnalysisService {
  static clearCache() {
    cache.clear();
  }

  /** Thông tin món lẻ đang kinh doanh (mã, danh mục, đơn giá đại diện) */
  private static async loadDishMeta(): Promise<Map<number, DishMeta>> {
    const dishes = await prisma.dish.findMany({
      where: { dish_status: true, dish_id: { notIn: EXCLUDED_DISH_IDS } },
      include: { category: true, prices: { include: { size: true, crust: true } } },
      orderBy: { dish_id: 'asc' },
    });
    const map = new Map<number, DishMeta>();
    for (const d of dishes) {
      const catName = d.category?.category_name || 'Khác';
      const sortedValidPrices = [...d.prices]
        .filter((p) => (p.dish_price || 0) > 0)
        .sort((a, b) => Number(a.dish_price) - Number(b.dish_price));
      const rep =
        sortedValidPrices.find((p) => (p.size?.size_name || '').toLowerCase() === 'regular') ||
        sortedValidPrices[0] ||
        null;
      map.set(d.dish_id, {
        dish_id: d.dish_id,
        code: formatDishCode(d.dish_id),
        dish_name: d.dish_name,
        ingredient: d.ingredient || '',
        image: d.image || null,
        category_id: d.category_id,
        category_name: catName,
        role: roleFromCategory(catName),
        dish_type: d.dish_type || 'man',
        unitPrice: rep?.dish_price || 0,
        dish_price_id: rep?.dish_price_id || null,
        prices: sortedValidPrices.map((p) => ({
          dish_price_id: p.dish_price_id,
          size_id: p.size_id ?? null,
          crust_id: p.crust_id ?? null,
          size_name: p.size?.size_name || '',
          crust_name: p.crust?.crust_name || '',
          dish_price: Number(p.dish_price),
        })),
      });
    }
    return map;
  }

  /**
   * Đọc toàn bộ "giỏ món lẻ" từ CSDL:
   * - Không lấy dòng thuộc combo (combo_id IS NULL)
   * - Gộp cả 2 nửa của pizza nửa-nửa (order_item_half)
   * - Khử trùng (order_id, dish_id) để mỗi món chỉ tính 1 lần / đơn
   */
  private static async loadTransactions(year?: number): Promise<number[][]> {
    const yearFilter = year
      ? `AND o.created_at >= '${year}-01-01'::timestamp AND o.created_at < '${year + 1}-01-01'::timestamp`
      : '';
    const rows = await prisma.$queryRawUnsafe<Array<{ order_id: number; dish_id: number }>>(`
      SELECT DISTINCT order_id, dish_id FROM (
        SELECT o.order_id, dp.dish_id
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.order_id
        JOIN dish_prices dp ON dp.dish_price_id = oi.dish_price_id
        WHERE COALESCE(o.order_status, '') <> 'cancelled'
          AND oi.combo_id IS NULL
          AND COALESCE(oi.is_half_half, false) = false
          AND dp.dish_id IS NOT NULL
          ${yearFilter}
        UNION ALL
        SELECT o.order_id, h.dish_id
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.order_id
        JOIN order_item_half h ON h.order_item_id = oi.order_item_id
        WHERE COALESCE(o.order_status, '') <> 'cancelled'
          AND oi.combo_id IS NULL
          AND h.dish_id IS NOT NULL
          ${yearFilter}
      ) x
      WHERE x.dish_id NOT IN (${EXCLUDED_DISH_IDS.join(',')})
      ORDER BY x.order_id
    `);

    const transactions: number[][] = [];
    let currentId: number | null = null;
    let current: number[] = [];
    for (const r of rows) {
      const oid = Number(r.order_id);
      if (oid !== currentId) {
        if (current.length) transactions.push(current.sort((a, b) => a - b));
        currentId = oid;
        current = [];
      }
      current.push(Number(r.dish_id));
    }
    if (current.length) transactions.push(current.sort((a, b) => a - b));
    return transactions;
  }

  /**
   * Thống kê tần suất gọi chung đơn hàng (đếm trực tiếp số đơn chứa từng món, cặp 2 món, nhóm 3 món).
   */
  static async computeCoOccurrence(params: CoOccurrenceParams = {}): Promise<CoOccurrenceResult> {
    const minAttachRate = params.minAttachRate ?? 0.1;
    const rawMinOrders = params.minCoOrders;
    const cacheKey = JSON.stringify({
      y: params.year ?? null,
      minCoOrders: rawMinOrders ?? 'auto',
      minAttachRate,
    });
    const hit = cache.get(cacheKey);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

    const [dishMeta, transactions] = await Promise.all([
      this.loadDishMeta(),
      this.loadTransactions(params.year),
    ]);
    const N = transactions.length;
    const minCoOrders =
      rawMinOrders !== undefined && rawMinOrders > 0
        ? Math.round(rawMinOrders)
        : Math.max(2, Math.ceil(0.003 * N));

    // BƯỚC 1: Đếm số đơn xuất hiện của từng món lẻ
    const itemCounts = new Map<number, number>();
    for (const t of transactions) {
      for (const id of t) itemCounts.set(id, (itemCounts.get(id) || 0) + 1);
    }

    // BƯỚC 2: Đếm trực tiếp số đơn gọi chung từng cặp 2 món và nhóm 3 món
    const pairCounts = new Map<string, number>();
    const tripleCounts = new Map<string, number>();
    for (const t of transactions) {
      for (let i = 0; i < t.length; i++) {
        for (let j = i + 1; j < t.length; j++) {
          const pk = `${t[i]}-${t[j]}`;
          pairCounts.set(pk, (pairCounts.get(pk) || 0) + 1);
          // Đếm bộ 3 món cho các giỏ hàng thông thường (tối đa 10 món lẻ/đơn để tránh tổ hợp dư thừa)
          if (t.length <= 10) {
            for (let k = j + 1; k < t.length; k++) {
              const tk = `${t[i]}-${t[j]}-${t[k]}`;
              tripleCounts.set(tk, (tripleCounts.get(tk) || 0) + 1);
            }
          }
        }
      }
    }

    const qualifiedPairs = new Map<string, number>();
    for (const [k, c] of pairCounts) {
      if (c >= minCoOrders) qualifiedPairs.set(k, c);
    }

    const qualifiedTriples = new Map<string, number>();
    for (const [k, c] of tripleCounts) {
      if (c >= minCoOrders) qualifiedTriples.set(k, c);
    }

    // BƯỚC 3: Tổng hợp chiều gọi kèm X → Y đạt tỷ lệ gọi kèm tối thiểu
    const relations: CoPurchasedRelation[] = [];
    let candidateDirections = 0;

    const pushRelation = (antecedent: number[], consequent: number, count: number, antCount: number) => {
      if (antCount <= 0) return;
      candidateDirections++;
      const attachRate = count / antCount;
      if (attachRate >= minAttachRate) {
        relations.push({
          antecedent,
          consequent,
          count,
          orderShare: N > 0 ? round(count / N) : 0,
          attachRate: round(attachRate),
        });
      }
    };

    for (const [k, c] of qualifiedPairs) {
      const [a, b] = k.split('-').map(Number);
      pushRelation([a], b, c, itemCounts.get(a) || 0);
      pushRelation([b], a, c, itemCounts.get(b) || 0);
    }
    for (const [k, c] of qualifiedTriples) {
      const ids = k.split('-').map(Number);
      for (let i = 0; i < 3; i++) {
        const cons = ids[i];
        const ant = ids.filter((_, idx) => idx !== i);
        pushRelation(ant, cons, c, pairCounts.get(pairKey(ant[0], ant[1])) || 0);
      }
    }

    // Xếp hạng ưu tiên kết hợp có tỷ lệ gọi kèm cao và số đơn chung thực tế lớn
    relations.sort(
      (x, y) =>
        y.attachRate * Math.log1p(y.count) - x.attachRate * Math.log1p(x.count) ||
        y.count - x.count
    );

    const steps: SummaryStep[] = [
      {
        step: 1,
        title: 'Bước 1 · Gom giỏ món lẻ',
        fromLabel: 'Đơn hợp lệ',
        fromValue: N,
        toLabel: 'Món xuất hiện',
        toValue: itemCounts.size,
        desc: 'Trích xuất danh sách món lẻ không trùng lặp trên từng đơn hàng (pizza nửa-nửa tính 2 món).',
      },
      {
        step: 2,
        title: 'Bước 2 · Đếm đơn gọi chung',
        fromLabel: 'Cặp xuất hiện',
        fromValue: pairCounts.size,
        toLabel: `≥ ${minCoOrders} đơn`,
        toValue: qualifiedPairs.size,
        desc: 'Đếm trực tiếp số đơn hàng chứa đồng thời từng cặp 2 món và nhóm 3 món.',
      },
      {
        step: 3,
        title: 'Bước 3 · Lọc tỷ lệ gọi kèm',
        fromLabel: 'Chiều ghép',
        fromValue: candidateDirections,
        toLabel: 'Đạt ngưỡng',
        toValue: relations.length,
        desc: `Giữ lại các kết hợp có tỷ lệ khách gọi kèm từ ${Math.round(minAttachRate * 100)}% trở lên.`,
      },
    ];

    const result: CoOccurrenceResult = {
      year: params.year ?? null,
      totalOrders: N,
      minCoOrders,
      minAttachRate,
      itemCounts,
      pairCounts,
      qualifiedPairs,
      qualifiedTriples,
      steps,
      relations,
      dishMeta,
      computedAt: new Date().toISOString(),
    };
    cache.set(cacheKey, { at: Date.now(), value: result });
    return result;
  }

  /** Các combo cố định đang bán (dùng để tránh gợi ý trùng & đánh giá combo hiện có) */
  private static async loadActiveCombos() {
    const rows = await prisma.$queryRawUnsafe<
      Array<{ combo_id: number; combo_name: string; combo_price: number; dishes: number[] | null }>
    >(`
      SELECT c.combo_id, c.combo_name, c.combo_price,
             ARRAY_AGG(DISTINCT dp.dish_id) FILTER (WHERE dp.dish_id IS NOT NULL) AS dishes
      FROM combos c
      LEFT JOIN combo_groups g ON g.combo_id = c.combo_id
      LEFT JOIN combo_items ci ON ci.group_id = g.group_id
      LEFT JOIN dish_prices dp ON dp.dish_price_id = ci.dish_price_id
      WHERE COALESCE(c.is_active, true) = true
      GROUP BY c.combo_id
      ORDER BY c.combo_id
    `);
    return rows.map((r) => ({
      combo_id: Number(r.combo_id),
      combo_name: r.combo_name,
      combo_price: Number(r.combo_price) || 0,
      dishes: (r.dishes || []).map(Number),
    }));
  }

  /**
   * API tổng hợp cho trang Admin "Phân tích Mua Cùng"
   */
  static async getAdminAnalysis(params: CoOccurrenceParams & { top?: number; categoryId?: number }) {
    const stats = await this.computeCoOccurrence(params);
    const N = stats.totalOrders;
    const meta = stats.dishMeta;
    const top = Math.min(30, Math.max(5, params.top ?? 15));

    const dishInfo = (id: number) => {
      const m = meta.get(id);
      return {
        dish_id: id,
        code: formatDishCode(id),
        dish_name: m?.dish_name || `Món #${id}`,
        image: m?.image || null,
        category_name: m?.category_name || 'Khác',
        role: m?.role || 'side',
        unitPrice: m?.unitPrice || 0,
        dish_price_id: m?.dish_price_id || null,
        orderCount: stats.itemCounts.get(id) || 0,
        orderShare: N > 0 ? round((stats.itemCounts.get(id) || 0) / N) : 0,
      };
    };

    const pairStats = (a: number, b: number) => {
      const count = stats.pairCounts.get(pairKey(a, b)) || 0;
      const cA = stats.itemCounts.get(a) || 0;
      const cB = stats.itemCounts.get(b) || 0;
      const attachRateAB = cA > 0 ? count / cA : 0;
      const attachRateBA = cB > 0 ? count / cB : 0;
      return {
        count,
        orderShare: N > 0 ? round(count / N) : 0,
        attachRateAB: round(attachRateAB),
        attachRateBA: round(attachRateBA),
      };
    };

    // ── Ma trận mua cùng: Top N món phổ biến nhất (có thể lọc theo danh mục) ──
    let matrixIds = [...stats.itemCounts.entries()]
      .filter(([id]) => meta.has(id))
      .filter(([id]) => !params.categoryId || meta.get(id)?.category_id === params.categoryId)
      .sort((a, b) => b[1] - a[1])
      .slice(0, top)
      .map(([id]) => id);

    // Nhóm theo vai trò để ma trận dễ đọc (món chính trước, món phụ, đồ uống sau)
    const roleOrder: Record<string, number> = { pizza: 0, spaghetti: 1, gratin: 2, side: 3, drink: 4 };
    matrixIds = matrixIds.sort(
      (a, b) =>
        (roleOrder[meta.get(a)?.role || 'side'] ?? 9) - (roleOrder[meta.get(b)?.role || 'side'] ?? 9) ||
        (stats.itemCounts.get(b) || 0) - (stats.itemCounts.get(a) || 0)
    );

    const matrixCells: Array<{ a: number; b: number } & ReturnType<typeof pairStats>> = [];
    let maxCount = 0;
    let maxAttachRate = 0;
    for (let i = 0; i < matrixIds.length; i++) {
      for (let j = i + 1; j < matrixIds.length; j++) {
        const s = pairStats(matrixIds[i], matrixIds[j]);
        maxCount = Math.max(maxCount, s.count);
        maxAttachRate = Math.max(maxAttachRate, s.attachRateAB, s.attachRateBA);
        matrixCells.push({ a: matrixIds[i], b: matrixIds[j], ...s });
      }
    }

    // ── Bảng cặp & nhóm món hay gọi kèm (chỉ gồm các món đang kinh doanh) ──
    const activeRelations = stats.relations.filter(
      (r) => meta.has(r.consequent) && r.antecedent.every((id) => meta.has(id))
    );
    const topRelations = activeRelations.slice(0, 40).map((r) => ({
      ...r,
      antecedentDishes: r.antecedent.map(dishInfo),
      consequentDish: dishInfo(r.consequent),
    }));

    // ── Gợi ý thiết lập Combo ──
    const combos = await this.loadActiveCombos();
    const fixedCombos = combos.filter((c) => c.dishes.length > 0 && c.dishes.length <= 6);
    const flexibleCombos = combos.filter((c) => c.dishes.length > 6);
    const coveredByFixed = (ids: number[]) =>
      fixedCombos.find((c) => ids.every((id) => c.dishes.includes(id)));

    type ComboSuggestion = {
      key: string;
      size: number;
      dishes: ReturnType<typeof dishInfo>[];
      count: number;
      orderShare: number;
      attachRate: number;
      bestPairText: string;
      originalPrice: number;
      suggestedPrice: number;
      discountPercent: number;
      opportunityOrders: number;
      estimatedNetGain: number;
      estimatedUpliftPercent: number;
      flexibleComboNames: string[];
      suggestedName: string;
    };
    const suggestions: ComboSuggestion[] = [];
    const comboMinAttachRate = Math.max(0.12, stats.minAttachRate);

    const buildSuggestion = (ids: number[], count: number): ComboSuggestion | null => {
      const metas = ids.map((id) => meta.get(id));
      if (metas.some((m) => !m)) return null;
      const roles = new Set(metas.map((m) => m!.role));
      const cats = new Set(metas.map((m) => m!.category_name));
      if (cats.size < 2) return null; // phải khác danh mục
      if (!metas.some((m) => MAIN_ROLES.has(m!.role))) return null; // phải có món chính
      if (coveredByFixed(ids)) return null; // đã có combo cố định

      // Chọn chiều đại diện "món chính → món gọi kèm" có tỷ lệ gọi kèm cao nhất
      let best: { ant: number[]; cons: number; attachRate: number; antCount: number } | null = null;
      let bestRank = -1;
      for (const cons of ids) {
        const ant = ids.filter((x) => x !== cons);
        const antCount =
          ant.length === 1
            ? stats.itemCounts.get(ant[0]) || 0
            : stats.pairCounts.get(pairKey(ant[0], ant[1])) || 0;
        if (antCount <= 0) continue;
        const attachRate = count / antCount;
        const consIsAddon = !MAIN_ROLES.has(meta.get(cons)?.role || 'side');
        const antHasMain = ant.some((id) => MAIN_ROLES.has(meta.get(id)?.role || 'side'));
        const rank = (consIsAddon && antHasMain ? 10 : 0) + attachRate;
        if (rank > bestRank) {
          bestRank = rank;
          best = { ant, cons, attachRate, antCount };
        }
      }
      if (!best || best.attachRate < comboMinAttachRate) return null;

      if (ids.length === 3) {
        // Mọi cặp con đều phải thực sự từng đi chung đủ ngưỡng
        for (let i = 0; i < 3; i++) {
          for (let j = i + 1; j < 3; j++) {
            const sub = pairStats(ids[i], ids[j]);
            if (sub.count < stats.minCoOrders || Math.max(sub.attachRateAB, sub.attachRateBA) < 0.05) {
              return null;
            }
          }
        }
      }

      const originalPrice = metas.reduce((s, m) => s + (m!.unitPrice || 0), 0);
      const discount = ids.length === 2 ? COMBO_ASSUMPTIONS.pairDiscount : COMBO_ASSUMPTIONS.tripleDiscount;
      const suggestedPrice = Math.round((originalPrice * (1 - discount)) / 1000) * 1000;

      // Ước tính doanh thu tăng thêm (công thức minh bạch)
      let opportunityGain = 0;
      let opportunityOrders = 0;
      if (ids.length === 2) {
        const [a, b] = ids;
        const onlyA = (stats.itemCounts.get(a) || 0) - count;
        const onlyB = (stats.itemCounts.get(b) || 0) - count;
        opportunityOrders = onlyA + onlyB;
        opportunityGain =
          onlyA * Math.max(0, suggestedPrice - (meta.get(a)?.unitPrice || 0)) +
          onlyB * Math.max(0, suggestedPrice - (meta.get(b)?.unitPrice || 0));
      } else {
        const antPrice = best.ant.reduce((s, id) => s + (meta.get(id)?.unitPrice || 0), 0);
        opportunityOrders = best.antCount - count;
        opportunityGain = opportunityOrders * Math.max(0, suggestedPrice - antPrice);
      }
      const cannibalization =
        count * COMBO_ASSUMPTIONS.cannibalizationRate * Math.max(0, originalPrice - suggestedPrice);
      const estimatedNetGain = Math.round(opportunityGain * COMBO_ASSUMPTIONS.conversionRate - cannibalization);
      const currentRevenue = ids.reduce(
        (s, id) => s + (stats.itemCounts.get(id) || 0) * (meta.get(id)?.unitPrice || 0),
        0
      );

      const names = metas.map((m) => m!.dish_name);
      const consName = meta.get(best.cons)?.dish_name || '';
      const antNames = best.ant.map((id) => meta.get(id)?.dish_name || '').join(' + ');
      const roleLabel = roles.has('drink') ? 'Bữa Chính & Nước' : roles.has('side') ? 'Bữa Chính & Món Phụ' : 'Bữa Đôi';

      return {
        key: tripleKey(ids),
        size: ids.length,
        dishes: ids.map(dishInfo),
        count,
        orderShare: N > 0 ? round(count / N) : 0,
        attachRate: round(best.attachRate),
        bestPairText: `${Math.round(best.attachRate * 100)}% đơn có ${antNames} đã gọi thêm ${consName}`,
        originalPrice,
        suggestedPrice,
        discountPercent: Math.round(discount * 100),
        opportunityOrders,
        estimatedNetGain,
        estimatedUpliftPercent: currentRevenue > 0 ? round((estimatedNetGain / currentRevenue) * 100, 1) : 0,
        flexibleComboNames: flexibleCombos
          .filter((c) => ids.every((id) => c.dishes.includes(id)))
          .map((c) => c.combo_name),
        suggestedName: `Combo ${names[0].replace(/\s*\(.*?\)\s*/g, '').trim()} · ${roleLabel}`,
      };
    };

    for (const [k, c] of stats.qualifiedPairs) {
      const s = buildSuggestion(k.split('-').map(Number), c);
      if (s) suggestions.push(s);
    }
    for (const [k, c] of stats.qualifiedTriples) {
      const s = buildSuggestion(k.split('-').map(Number), c);
      if (s) suggestions.push(s);
    }
    suggestions.sort((x, y) => y.count * y.attachRate - x.count * x.attachRate || y.count - x.count);
    const pairSuggestions = suggestions.filter((s) => s.size === 2).slice(0, 6);
    const tripleSuggestions = suggestions.filter((s) => s.size === 3).slice(0, 3);

    // ── Đánh giá combo cố định hiện có dựa trên số đơn gọi chung & tỷ lệ gọi kèm thực tế ──
    const comboHealth = fixedCombos.map((c) => {
      const ids = c.dishes.filter((id) => meta.has(id));
      const pairs: Array<{ a: number; b: number; count: number; attachRate: number }> = [];
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const s = pairStats(ids[i], ids[j]);
          pairs.push({
            a: ids[i],
            b: ids[j],
            count: s.count,
            attachRate: round(Math.max(s.attachRateAB, s.attachRateBA)),
          });
        }
      }
      const valid = pairs.filter((p) => p.count > 0);
      const avgAttachRate = valid.length ? valid.reduce((s, p) => s + p.attachRate, 0) / valid.length : 0;
      const totalCoOrders = valid.reduce((s, p) => s + p.count, 0);
      const verdict =
        valid.length === 0
          ? 'insufficient'
          : avgAttachRate >= 0.12
            ? 'good'
            : avgAttachRate >= 0.05
              ? 'neutral'
              : 'weak';
      return {
        combo_id: c.combo_id,
        combo_name: c.combo_name,
        combo_price: c.combo_price,
        dishes: ids.map(dishInfo),
        avgAttachRate: round(avgAttachRate),
        totalCoOrders,
        pairs: pairs.map((p) => ({ ...p, aName: meta.get(p.a)?.dish_name, bName: meta.get(p.b)?.dish_name })),
        verdict,
      };
    });

    // ── Ví dụ tính trực tiếp từ cặp món gọi kèm mạnh nhất ──
    const exampleRel = activeRelations.find((r) => r.antecedent.length === 1) || null;
    const workedExample = exampleRel
      ? {
          antecedent: dishInfo(exampleRel.antecedent[0]),
          consequent: dishInfo(exampleRel.consequent),
          N,
          countA: stats.itemCounts.get(exampleRel.antecedent[0]) || 0,
          countB: stats.itemCounts.get(exampleRel.consequent) || 0,
          countAB: exampleRel.count,
          orderShare: exampleRel.orderShare,
          attachRate: exampleRel.attachRate,
        }
      : null;

    const avgBasketSize =
      N > 0 ? round([...stats.itemCounts.values()].reduce((s, c) => s + c, 0) / N, 2) : 0;

    return {
      meta: {
        year: stats.year,
        totalOrders: N,
        avgBasketSize,
        distinctPairs: stats.pairCounts.size,
        minCoOrders: stats.minCoOrders,
        minAttachRate: stats.minAttachRate,
        comboMinAttachRate,
        computedAt: stats.computedAt,
        assumptions: COMBO_ASSUMPTIONS,
      },
      summary: {
        steps: stats.steps,
        totalRelations: activeRelations.length,
      },
      matrix: {
        dishes: matrixIds.map(dishInfo),
        cells: matrixCells,
        maxCount,
        maxAttachRate: round(maxAttachRate),
      },
      relations: topRelations,
      comboSuggestions: [...pairSuggestions, ...tripleSuggestions],
      comboHealth,
      workedExample,
    };
  }

  /**
   * Gợi ý "Món ngon hay gọi kèm" cho khách hàng dựa trên thống kê đơn hàng gọi chung.
   * Xếp hạng theo tỷ lệ gọi kèm × ln(1 + số đơn gọi chung), cộng dồn theo các món đang có trong giỏ.
   * Trả về null nếu chưa đủ dữ liệu (để dùng phương án dự phòng).
   */
  static async getCustomerRecommendations(cartDishIds: number[], limit = 4) {
    const stats = await this.computeCoOccurrence({ minAttachRate: 0.05 });
    if (stats.totalOrders === 0 || stats.relations.length === 0) return null;
    const cart = new Set(cartDishIds);
    const minPairCount = stats.totalOrders >= 200 ? 15 : 1;

    // Kiểm tra nếu toàn bộ món ăn (không tính đồ uống) trong giỏ đều là món chay
    const cartFoodMetas = cartDishIds
      .map((id) => stats.dishMeta.get(id))
      .filter((m): m is DishMeta => !!m && m.role !== 'drink');
    const isStrictlyVegetarianCart =
      cartFoodMetas.length > 0 && cartFoodMetas.every((m) => m.dish_type === 'chay');

    const scores = new Map<
      number,
      { score: number; best: { from: number[]; attachRate: number; count: number } }
    >();

    for (const r of stats.relations) {
      if (cart.has(r.consequent) || r.count < minPairCount) continue;
      if (!r.antecedent.every((id) => cart.has(id))) continue;
      const consMeta = stats.dishMeta.get(r.consequent);
      if (!consMeta || consMeta.unitPrice <= 0) continue;
      if (isStrictlyVegetarianCart && consMeta.role !== 'drink' && consMeta.dish_type !== 'chay') {
        continue;
      }

      // Cân bằng: món phụ/đồ uống đi kèm với tỷ lệ gọi kèm thực tế trên đơn hàng
      const s = r.attachRate * Math.log1p(r.count) * (r.antecedent.length === 2 ? 1.2 : 1);
      const cur = scores.get(r.consequent);
      if (!cur) {
        scores.set(r.consequent, {
          score: s,
          best: { from: r.antecedent, attachRate: r.attachRate, count: r.count },
        });
      } else {
        cur.score += s;
        if (r.attachRate > cur.best.attachRate) {
          cur.best = { from: r.antecedent, attachRate: r.attachRate, count: r.count };
        }
      }
    }
    if (scores.size === 0) return null;

    const ranked = [...scores.entries()].sort((a, b) => b[1].score - a[1].score);
    const picked: typeof ranked = [];
    let drinks = 0;
    for (const entry of ranked) {
      const m = stats.dishMeta.get(entry[0]);
      if (!m) continue;
      if (m.role === 'drink') {
        if (drinks >= 2) continue;
        drinks++;
      }
      picked.push(entry);
      if (picked.length >= limit) break;
    }

    return picked.map(([dishId, info]) => {
      const m = stats.dishMeta.get(dishId)!;
      return {
        dish_id: dishId,
        dish_name: m.dish_name,
        category: m.category_name,
        ingredient: m.ingredient,
        dish_type: m.dish_type,
        image: m.image || '',
        price: m.unitPrice,
        dish_price_id: m.dish_price_id,
        prices: m.prices,
        co_order_count: info.best.count,
        attach_rate: info.best.attachRate,
        score: round(info.score),
        reason_dish_ids: info.best.from,
        reason_dish_names: info.best.from
          .map((id) => stats.dishMeta.get(id)?.dish_name || '')
          .filter(Boolean),
      };
    });
  }
}
