import prisma from '../lib/prisma';

/**
 * PHÂN TÍCH GIỎ HÀNG (Market Basket Analysis) — Thuật toán Apriori (Agrawal & Srikant, 1994)
 *
 * - Giỏ hàng (transaction) = 1 đơn hàng không bị huỷ, chỉ gồm các MÓN LẺ (không tính combo).
 *   Pizza nửa-nửa được tính 2 nửa là 2 món.
 * - Mỗi món chỉ tính 1 lần / đơn (dù khách gọi nhiều phần).
 *
 * Chỉ số:
 *   Support(X)      = số đơn chứa X / N
 *   Confidence(X→Y) = Support(X ∪ Y) / Support(X)
 *   Lift(X→Y)       = Confidence(X→Y) / Support(Y)
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
  image: string | null;
  category_id: number | null;
  category_name: string;
  role: DishRole;
  dish_type: string;
  unitPrice: number;
  dish_price_id: string | null;
}

export interface AprioriParams {
  year?: number;
  minSupport?: number; // tỉ lệ 0..1
  minConfidence?: number; // tỉ lệ 0..1
  minLift?: number;
}

interface AprioriLevelTrace {
  k: number;
  candidates: number;
  frequent: number;
}

export interface AssociationRule {
  antecedent: number[];
  consequent: number;
  count: number;
  support: number;
  confidence: number;
  lift: number;
}

interface AprioriResult {
  year: number | null;
  totalOrders: number;
  minSupport: number;
  minSupportCount: number;
  minConfidence: number;
  minLift: number;
  itemCounts: Map<number, number>;
  pairCounts: Map<string, number>; // đếm đầy đủ mọi cặp (dùng cho ma trận)
  frequentPairs: Map<string, number>;
  frequentTriples: Map<string, number>;
  trace: AprioriLevelTrace[];
  rules: AssociationRule[];
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
const cache = new Map<string, { at: number; value: AprioriResult }>();

export class BasketAnalysisService {
  static clearCache() {
    cache.clear();
  }

  /** Thông tin món lẻ đang kinh doanh (mã, danh mục, đơn giá đại diện) */
  private static async loadDishMeta(): Promise<Map<number, DishMeta>> {
    const dishes = await prisma.dish.findMany({
      where: { dish_status: true, dish_id: { notIn: EXCLUDED_DISH_IDS } },
      include: { category: true, prices: true },
      orderBy: { dish_id: 'asc' },
    });
    const map = new Map<number, DishMeta>();
    for (const d of dishes) {
      const valid = (d.prices || [])
        .filter((p) => (Number(p.dish_price) || 0) > 0)
        .sort((a, b) => (Number(a.dish_price) || 0) - (Number(b.dish_price) || 0));
      const chosen = valid[0] || d.prices?.[0];
      const catName = d.category?.category_name || 'Khác';
      map.set(d.dish_id, {
        dish_id: d.dish_id,
        code: formatDishCode(d.dish_id),
        dish_name: d.dish_name,
        image: d.image || null,
        category_id: d.category_id ?? null,
        category_name: catName,
        role: roleFromCategory(catName),
        dish_type: d.dish_type || 'man',
        unitPrice: Number(chosen?.dish_price) || 0,
        dish_price_id: chosen?.dish_price_id || null,
      });
    }
    return map;
  }

  /**
   * BƯỚC 0: Tạo tập giao dịch D — mỗi đơn hàng là một tập món lẻ (không tính combo).
   */
  private static async loadTransactions(year?: number): Promise<number[][]> {
    const yearFilter = year
      ? `AND EXTRACT(YEAR FROM (o.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')) = ${Number(year)}`
      : '';
    const rows = await prisma.$queryRawUnsafe<Array<{ order_id: number; dish_id: number }>>(`
      SELECT DISTINCT x.order_id, x.dish_id FROM (
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
   * Thuật toán Apriori (k ≤ 3) + sinh luật kết hợp.
   */
  static async runApriori(params: AprioriParams = {}): Promise<AprioriResult> {
    const minSupport = params.minSupport ?? 0.003;
    const minConfidence = params.minConfidence ?? 0.1;
    const minLift = params.minLift ?? 1.2;
    const cacheKey = JSON.stringify({ y: params.year ?? null, minSupport, minConfidence, minLift });
    const hit = cache.get(cacheKey);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

    const [dishMeta, transactions] = await Promise.all([
      this.loadDishMeta(),
      this.loadTransactions(params.year),
    ]);
    const N = transactions.length;
    const minSupportCount = Math.max(2, Math.ceil(minSupport * N));
    const trace: AprioriLevelTrace[] = [];

    // BƯỚC 1: C1 → L1 (đếm từng món, loại món có support < ngưỡng)
    const itemCounts = new Map<number, number>();
    for (const t of transactions) {
      for (const id of t) itemCounts.set(id, (itemCounts.get(id) || 0) + 1);
    }
    const L1 = new Set<number>();
    for (const [id, c] of itemCounts) if (c >= minSupportCount) L1.add(id);
    trace.push({ k: 1, candidates: itemCounts.size, frequent: L1.size });

    // BƯỚC 2: C2 → L2 (đếm cặp món cùng xuất hiện trong một đơn)
    const pairCounts = new Map<string, number>();
    for (const t of transactions) {
      for (let i = 0; i < t.length; i++) {
        for (let j = i + 1; j < t.length; j++) {
          const k = `${t[i]}-${t[j]}`;
          pairCounts.set(k, (pairCounts.get(k) || 0) + 1);
        }
      }
    }
    const c2Size = (L1.size * (L1.size - 1)) / 2;
    const frequentPairs = new Map<string, number>();
    for (const [k, c] of pairCounts) {
      const [a, b] = k.split('-').map(Number);
      if (L1.has(a) && L1.has(b) && c >= minSupportCount) frequentPairs.set(k, c);
    }
    trace.push({ k: 2, candidates: c2Size, frequent: frequentPairs.size });

    // BƯỚC 3: C3 (nối L2 & tỉa theo tính chất Apriori) → L3
    const pairsByFirst = new Map<number, number[]>();
    for (const k of frequentPairs.keys()) {
      const [a, b] = k.split('-').map(Number);
      if (!pairsByFirst.has(a)) pairsByFirst.set(a, []);
      pairsByFirst.get(a)!.push(b);
    }
    const C3 = new Set<string>();
    for (const [a, partners] of pairsByFirst) {
      partners.sort((x, y) => x - y);
      for (let i = 0; i < partners.length; i++) {
        for (let j = i + 1; j < partners.length; j++) {
          const b = partners[i];
          const c = partners[j];
          // Tỉa: mọi tập con 2 phần tử phải thuộc L2
          if (frequentPairs.has(pairKey(b, c))) C3.add(`${a}-${b}-${c}`);
        }
      }
    }
    const tripleCounts = new Map<string, number>();
    if (C3.size > 0) {
      for (const t of transactions) {
        const f = t.filter((id) => L1.has(id));
        if (f.length < 3) continue;
        for (let i = 0; i < f.length; i++) {
          for (let j = i + 1; j < f.length; j++) {
            for (let k = j + 1; k < f.length; k++) {
              const key = `${f[i]}-${f[j]}-${f[k]}`;
              if (C3.has(key)) tripleCounts.set(key, (tripleCounts.get(key) || 0) + 1);
            }
          }
        }
      }
    }
    const frequentTriples = new Map<string, number>();
    for (const [k, c] of tripleCounts) if (c >= minSupportCount) frequentTriples.set(k, c);
    trace.push({ k: 3, candidates: C3.size, frequent: frequentTriples.size });

    // BƯỚC 4: Sinh luật X → Y, giữ luật đạt Confidence & Lift tối thiểu
    const rules: AssociationRule[] = [];
    const pushRule = (antecedent: number[], consequent: number, count: number, antCount: number) => {
      const conf = count / antCount;
      const supY = (itemCounts.get(consequent) || 0) / N;
      const lift = supY > 0 ? conf / supY : 0;
      if (conf >= minConfidence && lift >= minLift) {
        rules.push({
          antecedent,
          consequent,
          count,
          support: round(count / N),
          confidence: round(conf),
          lift: round(lift, 3),
        });
      }
    };
    for (const [k, c] of frequentPairs) {
      const [a, b] = k.split('-').map(Number);
      pushRule([a], b, c, itemCounts.get(a) || 1);
      pushRule([b], a, c, itemCounts.get(b) || 1);
    }
    for (const [k, c] of frequentTriples) {
      const ids = k.split('-').map(Number);
      for (let i = 0; i < 3; i++) {
        const cons = ids[i];
        const ant = ids.filter((_, idx) => idx !== i);
        pushRule(ant, cons, c, frequentPairs.get(pairKey(ant[0], ant[1])) || 1);
      }
    }
    rules.sort((x, y) => y.lift * y.confidence - x.lift * x.confidence);

    const result: AprioriResult = {
      year: params.year ?? null,
      totalOrders: N,
      minSupport,
      minSupportCount,
      minConfidence,
      minLift,
      itemCounts,
      pairCounts,
      frequentPairs,
      frequentTriples,
      trace,
      rules,
      dishMeta,
      computedAt: new Date().toISOString(),
    };
    cache.set(cacheKey, { at: Date.now(), value: result });
    return result;
  }

  /** Các combo cố định đang bán (dùng để tránh gợi ý trùng & đánh giá sức khoẻ combo) */
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
  static async getAdminAnalysis(params: AprioriParams & { top?: number; categoryId?: number }) {
    const ap = await this.runApriori(params);
    const N = ap.totalOrders;
    const meta = ap.dishMeta;
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
        orderCount: ap.itemCounts.get(id) || 0,
        support: N > 0 ? round((ap.itemCounts.get(id) || 0) / N) : 0,
      };
    };
    const pairStats = (a: number, b: number) => {
      const count = ap.pairCounts.get(pairKey(a, b)) || 0;
      const cA = ap.itemCounts.get(a) || 0;
      const cB = ap.itemCounts.get(b) || 0;
      const confAB = cA > 0 ? count / cA : 0;
      const confBA = cB > 0 ? count / cB : 0;
      const lift = cA > 0 && cB > 0 ? (count * N) / (cA * cB) : 0;
      const expected = N > 0 ? (cA * cB) / N : 0;
      return {
        count,
        support: N > 0 ? round(count / N) : 0,
        confidenceAB: round(confAB),
        confidenceBA: round(confBA),
        lift: round(lift, 3),
        expected: round(expected, 1),
      };
    };

    // ── Ma trận mua cùng: Top N món phổ biến nhất (có thể lọc theo danh mục) ──
    let matrixIds = [...ap.itemCounts.entries()]
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
        (ap.itemCounts.get(b) || 0) - (ap.itemCounts.get(a) || 0)
    );
    const matrixCells: Array<{ a: number; b: number } & ReturnType<typeof pairStats>> = [];
    let maxCount = 0;
    let maxLift = 0;
    for (let i = 0; i < matrixIds.length; i++) {
      for (let j = i + 1; j < matrixIds.length; j++) {
        const s = pairStats(matrixIds[i], matrixIds[j]);
        maxCount = Math.max(maxCount, s.count);
        maxLift = Math.max(maxLift, s.lift);
        matrixCells.push({ a: matrixIds[i], b: matrixIds[j], ...s });
      }
    }

    // ── Bảng luật kết hợp nổi bật ──
    const topRules = ap.rules.slice(0, 40).map((r) => ({
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
      support: number;
      confidence: number;
      lift: number;
      excessOrders: number;
      bestRuleText: string;
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
    const comboMinLift = Math.max(1.5, ap.minLift);

    const buildSuggestion = (ids: number[], count: number): ComboSuggestion | null => {
      const metas = ids.map((id) => meta.get(id));
      if (metas.some((m) => !m)) return null;
      const roles = new Set(metas.map((m) => m!.role));
      const cats = new Set(metas.map((m) => m!.category_name));
      if (cats.size < 2) return null; // phải khác danh mục
      if (!metas.some((m) => MAIN_ROLES.has(m!.role))) return null; // phải có món chính
      if (coveredByFixed(ids)) return null; // đã có combo cố định

      // Luật đại diện cho bộ món: ưu tiên luật "món chính → món gọi kèm", sau đó Confidence cao nhất
      let best: { ant: number[]; cons: number; conf: number; lift: number; antCount: number } | null = null;
      let bestRank = -1;
      for (const cons of ids) {
        const ant = ids.filter((x) => x !== cons);
        const antCount =
          ant.length === 1 ? ap.itemCounts.get(ant[0]) || 0 : ap.pairCounts.get(pairKey(ant[0], ant[1])) || 0;
        if (antCount <= 0) continue;
        const conf = count / antCount;
        const supY = (ap.itemCounts.get(cons) || 0) / N;
        const lift = supY > 0 ? conf / supY : 0;
        const consIsAddon = !MAIN_ROLES.has(meta.get(cons)?.role || 'side');
        const antHasMain = ant.some((id) => MAIN_ROLES.has(meta.get(id)?.role || 'side'));
        const rank = (consIsAddon && antHasMain ? 10 : 0) + conf;
        if (rank > bestRank) {
          bestRank = rank;
          best = { ant, cons, conf, lift, antCount };
        }
      }
      if (!best || best.lift < comboMinLift) return null;
      if (ids.length === 3) {
        // Mọi cặp con đều phải hút nhau (Lift ≥ 1)
        for (let i = 0; i < 3; i++)
          for (let j = i + 1; j < 3; j++) if (pairStats(ids[i], ids[j]).lift < 1) return null;
      }

      const expected = (best.antCount * (ap.itemCounts.get(best.cons) || 0)) / N;
      const excessOrders = Math.max(0, count - expected);

      const originalPrice = metas.reduce((s, m) => s + (m!.unitPrice || 0), 0);
      const discount = ids.length === 2 ? COMBO_ASSUMPTIONS.pairDiscount : COMBO_ASSUMPTIONS.tripleDiscount;
      const suggestedPrice = Math.round((originalPrice * (1 - discount)) / 1000) * 1000;

      // Ước tính doanh thu tăng thêm (công thức minh bạch)
      let opportunityGain = 0;
      let opportunityOrders = 0;
      if (ids.length === 2) {
        const [a, b] = ids;
        const onlyA = (ap.itemCounts.get(a) || 0) - count;
        const onlyB = (ap.itemCounts.get(b) || 0) - count;
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
        (s, id) => s + (ap.itemCounts.get(id) || 0) * (meta.get(id)?.unitPrice || 0),
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
        support: round(count / N),
        confidence: round(best.conf),
        lift: round(best.lift, 3),
        excessOrders: Math.round(excessOrders),
        bestRuleText: `${Math.round(best.conf * 100)}% đơn có ${antNames} đã gọi thêm ${consName}`,
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

    for (const [k, c] of ap.frequentPairs) {
      const s = buildSuggestion(k.split('-').map(Number), c);
      if (s) suggestions.push(s);
    }
    for (const [k, c] of ap.frequentTriples) {
      const s = buildSuggestion(k.split('-').map(Number), c);
      if (s) suggestions.push(s);
    }
    // Xếp hạng theo "số đơn chung vượt kỳ vọng ngẫu nhiên"
    suggestions.sort((x, y) => y.excessOrders - x.excessOrders);
    const pairSuggestions = suggestions.filter((s) => s.size === 2).slice(0, 6);
    const tripleSuggestions = suggestions.filter((s) => s.size === 3).slice(0, 3);

    // ── Sức khoẻ combo cố định hiện có (các món trong combo có thật sự hay gọi chung?) ──
    const comboHealth = fixedCombos.map((c) => {
      const ids = c.dishes.filter((id) => meta.has(id));
      const pairs: Array<{ a: number; b: number; count: number; lift: number }> = [];
      for (let i = 0; i < ids.length; i++)
        for (let j = i + 1; j < ids.length; j++) {
          const s = pairStats(ids[i], ids[j]);
          pairs.push({ a: ids[i], b: ids[j], count: s.count, lift: s.lift });
        }
      const valid = pairs.filter((p) => p.count > 0);
      const avgLift = valid.length ? valid.reduce((s, p) => s + p.lift, 0) / valid.length : 0;
      const verdict = valid.length === 0 ? 'insufficient' : avgLift >= 1.2 ? 'good' : avgLift >= 0.9 ? 'neutral' : 'weak';
      return {
        combo_id: c.combo_id,
        combo_name: c.combo_name,
        combo_price: c.combo_price,
        dishes: ids.map(dishInfo),
        avgLift: round(avgLift, 3),
        pairs: pairs.map((p) => ({ ...p, aName: meta.get(p.a)?.dish_name, bName: meta.get(p.b)?.dish_name })),
        verdict,
      };
    });

    // ── Ví dụ tính tay (luật mạnh nhất) để minh hoạ công thức ──
    const exampleRule = ap.rules.find((r) => r.antecedent.length === 1) || null;
    const workedExample = exampleRule
      ? {
          antecedent: dishInfo(exampleRule.antecedent[0]),
          consequent: dishInfo(exampleRule.consequent),
          N,
          countA: ap.itemCounts.get(exampleRule.antecedent[0]) || 0,
          countB: ap.itemCounts.get(exampleRule.consequent) || 0,
          countAB: exampleRule.count,
          support: exampleRule.support,
          confidence: exampleRule.confidence,
          lift: exampleRule.lift,
        }
      : null;

    const avgBasketSize =
      N > 0 ? round([...ap.itemCounts.values()].reduce((s, c) => s + c, 0) / N, 2) : 0;

    return {
      meta: {
        year: ap.year,
        totalOrders: N,
        avgBasketSize,
        distinctPairs: ap.pairCounts.size,
        minSupport: ap.minSupport,
        minSupportCount: ap.minSupportCount,
        minConfidence: ap.minConfidence,
        minLift: ap.minLift,
        comboMinLift,
        computedAt: ap.computedAt,
        assumptions: COMBO_ASSUMPTIONS,
      },
      apriori: {
        trace: ap.trace,
        totalRules: ap.rules.length,
      },
      matrix: {
        dishes: matrixIds.map(dishInfo),
        cells: matrixCells,
        maxCount,
        maxLift: round(maxLift, 3),
      },
      rules: topRules,
      comboSuggestions: [...pairSuggestions, ...tripleSuggestions],
      comboHealth,
      workedExample,
    };
  }

  /**
   * Gợi ý "Thường được gọi cùng" cho khách hàng dựa trên luật kết hợp.
   * Điểm(A→B) = Confidence × ln(Lift), cộng dồn theo các món đang có trong giỏ.
   * Trả về null nếu chưa đủ dữ liệu (để dùng phương án dự phòng).
   */
  static async getCustomerRecommendations(cartDishIds: number[], limit = 4) {
    const ap = await this.runApriori({ minSupport: 0.002, minConfidence: 0.05, minLift: 1.1 });
    if (ap.totalOrders === 0 || ap.rules.length === 0) return null;
    const cart = new Set(cartDishIds);
    const MIN_PAIR_COUNT = 15;

    const scores = new Map<
      number,
      { score: number; best: { from: number[]; confidence: number; lift: number; count: number } }
    >();
    for (const r of ap.rules) {
      if (cart.has(r.consequent) || r.count < MIN_PAIR_COUNT || r.lift <= 1) continue;
      if (!r.antecedent.every((id) => cart.has(id))) continue;
      const s = r.confidence * Math.log(r.lift) * (r.antecedent.length === 2 ? 1.2 : 1);
      const cur = scores.get(r.consequent);
      if (!cur) {
        scores.set(r.consequent, {
          score: s,
          best: { from: r.antecedent, confidence: r.confidence, lift: r.lift, count: r.count },
        });
      } else {
        cur.score += s;
        if (r.confidence > cur.best.confidence)
          cur.best = { from: r.antecedent, confidence: r.confidence, lift: r.lift, count: r.count };
      }
    }
    if (scores.size === 0) return null;

    const ranked = [...scores.entries()].sort((a, b) => b[1].score - a[1].score);
    const picked: typeof ranked = [];
    let drinks = 0;
    for (const entry of ranked) {
      const m = ap.dishMeta.get(entry[0]);
      if (!m) continue;
      if (m.role === 'drink') {
        if (drinks >= 2) continue;
        drinks++;
      }
      picked.push(entry);
      if (picked.length >= limit) break;
    }

    return picked.map(([dishId, info]) => {
      const m = ap.dishMeta.get(dishId)!;
      return {
        dish_id: dishId,
        dish_name: m.dish_name,
        category: m.category_name,
        image: m.image || '',
        price: m.unitPrice,
        dish_price_id: m.dish_price_id,
        co_order_count: info.best.count,
        confidence: info.best.confidence,
        lift: info.best.lift,
        score: round(info.score),
        reason_dish_ids: info.best.from,
        reason_dish_names: info.best.from.map((id) => ap.dishMeta.get(id)?.dish_name || ''),
      };
    });
  }
}
