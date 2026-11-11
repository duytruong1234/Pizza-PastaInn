"use client";

import { api } from "@/lib/api";
import {
  ArrowRight,
  BadgeCheck,
  Calculator,
  CircleAlert,
  Filter,
  GitBranch,
  Grid3x3,
  Network,
  PackagePlus,
  RefreshCw,
  Search,
  Sigma,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface DishInfo {
  dish_id: number;
  code: string;
  dish_name: string;
  image: string | null;
  category_name: string;
  role: string;
  unitPrice: number;
  dish_price_id: string | null;
  orderCount: number;
  orderShare: number;
}

interface MatrixCell {
  a: number;
  b: number;
  count: number;
  orderShare: number;
  attachRateAB: number;
  attachRateBA: number;
}

interface RelationItem {
  antecedent: number[];
  consequent: number;
  count: number;
  orderShare: number;
  attachRate: number;
  antecedentDishes: DishInfo[];
  consequentDish: DishInfo;
}

interface ComboSuggestion {
  key: string;
  size: number;
  dishes: DishInfo[];
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
}

interface ComboHealth {
  combo_id: number;
  combo_name: string;
  combo_price: number;
  dishes: DishInfo[];
  avgAttachRate: number;
  totalCoOrders: number;
  pairs: Array<{ a: number; b: number; count: number; attachRate: number; aName?: string; bName?: string }>;
  verdict: "good" | "neutral" | "weak" | "insufficient";
}

interface BasketResponse {
  meta: {
    year: number | null;
    totalOrders: number;
    avgBasketSize: number;
    distinctPairs: number;
    minCoOrders: number;
    minAttachRate: number;
    comboMinAttachRate: number;
    computedAt: string;
    assumptions: {
      pairDiscount: number;
      tripleDiscount: number;
      conversionRate: number;
      cannibalizationRate: number;
    };
  };
  summary: {
    steps: Array<{
      step: number;
      title: string;
      fromLabel: string;
      fromValue: number;
      toLabel: string;
      toValue: number;
      desc: string;
    }>;
    totalRelations: number;
  };
  matrix: {
    dishes: DishInfo[];
    cells: MatrixCell[];
    maxCount: number;
    maxAttachRate: number;
  };
  relations: RelationItem[];
  comboSuggestions: ComboSuggestion[];
  comboHealth: ComboHealth[];
  workedExample: {
    antecedent: DishInfo;
    consequent: DishInfo;
    N: number;
    countA: number;
    countB: number;
    countAB: number;
    orderShare: number;
    attachRate: number;
  } | null;
}

type ColorMode = "rate" | "count";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const getImageUrl = (img: string | null | undefined) => {
  if (!img) return null;
  if (img.startsWith("http")) return img;
  return `${API_BASE}${img.startsWith("/") ? "" : "/"}${img}`;
};

const formatInt = (v: number) => new Intl.NumberFormat("vi-VN").format(Math.round(v || 0));
const formatPct = (v: number, d = 1) =>
  `${new Intl.NumberFormat("vi-VN", { minimumFractionDigits: d, maximumFractionDigits: d }).format((v || 0) * 100)}%`;
const formatCurrency = (v: number) =>
  `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Math.round(v || 0))} ₫`;
const formatCompactCurrency = (v: number) => {
  const abs = Math.abs(v || 0);
  if (abs >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2).replace(".", ",")} tỷ`;
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(".", ",")} tr`;
  return formatCurrency(v);
};

const shortName = (name: string) => {
  const clean = name.replace(/\s*\(.*?\)\s*/g, " ").trim();
  return clean.length > 16 ? `${clean.slice(0, 15)}…` : clean;
};

// Thang màu ma trận — Số đơn chung (5 mức theo tỉ lệ so với ô lớn nhất)
const countCellClass = (count: number, max: number) => {
  if (count <= 0) return "bg-white text-slate-300 dark:bg-gray-dark dark:text-slate-600";
  const r = max > 0 ? count / max : 0;
  if (r >= 0.75) return "bg-orange-600 text-white";
  if (r >= 0.5) return "bg-orange-400 text-white";
  if (r >= 0.3) return "bg-orange-200 text-orange-950";
  if (r >= 0.15) return "bg-orange-100 text-orange-900";
  return "bg-orange-50 text-slate-600 dark:bg-orange-950/20 dark:text-slate-300";
};

// Thang màu ma trận — Tỷ lệ gọi kèm (Hàng → Cột)
const rateCellClass = (rate: number, count: number) => {
  if (count <= 0) return "bg-white text-slate-300 dark:bg-gray-dark dark:text-slate-600";
  if (rate >= 0.3) return "bg-orange-600 text-white";
  if (rate >= 0.2) return "bg-orange-400 text-white";
  if (rate >= 0.12) return "bg-orange-200 text-orange-950";
  if (rate >= 0.06) return "bg-orange-100 text-orange-900";
  if (rate >= 0.03) return "bg-slate-50 text-slate-600 dark:bg-dark-2 dark:text-slate-300";
  return "bg-sky-50 text-sky-800 dark:bg-sky-950/30 dark:text-sky-300";
};

const rateLabel = (rate: number) => {
  if (rate >= 0.3) return { text: "Hay gọi kèm rất cao", cls: "bg-orange-600 text-white" };
  if (rate >= 0.2) return { text: "Hay gọi kèm cao", cls: "bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300" };
  if (rate >= 0.1) return { text: "Phổ biến vừa phải", cls: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" };
  if (rate >= 0.04) return { text: "Thỉnh thoảng đi chung", cls: "bg-slate-100 text-slate-600 dark:bg-dark-2 dark:text-slate-300" };
  return { text: "Ít gọi chung", cls: "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300" };
};

export default function BasketAnalysisPage() {
  const router = useRouter();
  const [year, setYear] = useState<string>("2026");
  const [top, setTop] = useState<number>(15);
  const [categoryId, setCategoryId] = useState<string>("");
  const [minCoOrders, setMinCoOrders] = useState<string>("auto");
  const [minAttachRate, setMinAttachRate] = useState<number>(10);
  const [colorMode, setColorMode] = useState<ColorMode>("rate");
  const [categories, setCategories] = useState<Array<{ category_id: number; category_name: string }>>([]);
  const [data, setData] = useState<BasketResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState<{ a: number; b: number } | null>(null);
  const [relationSearch, setRelationSearch] = useState("");

  useEffect(() => {
    api
      .get("/api/admin/categories")
      .then((r) =>
        setCategories(
          (r.data?.data || []).filter((c: any) => !String(c.category_name).toLowerCase().includes("combo"))
        )
      )
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: BasketResponse }>("/api/admin/basket-analysis", {
        params: {
          year: year === "all" ? undefined : year,
          top,
          categoryId: categoryId || undefined,
          minCoOrders: minCoOrders === "auto" ? undefined : Number(minCoOrders),
          minAttachRate,
        },
      });
      setData(res.data?.data || null);
    } catch {
      toast.error("Không thể tải dữ liệu phân tích mua cùng");
    } finally {
      setLoading(false);
    }
  }, [year, top, categoryId, minCoOrders, minAttachRate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const cellMap = useMemo(() => {
    const m = new Map<string, MatrixCell>();
    for (const c of data?.matrix.cells || []) {
      m.set(`${c.a}-${c.b}`, c);
      m.set(`${c.b}-${c.a}`, {
        ...c,
        a: c.b,
        b: c.a,
        attachRateAB: c.attachRateBA,
        attachRateBA: c.attachRateAB,
      });
    }
    return m;
  }, [data]);

  const dishById = useMemo(() => {
    const m = new Map<number, DishInfo>();
    for (const d of data?.matrix.dishes || []) m.set(d.dish_id, d);
    return m;
  }, [data]);

  // Mặc định chọn ô có số đơn gọi chung & tỷ lệ gọi kèm nổi bật nhất trong ma trận
  useEffect(() => {
    if (!data?.matrix.cells.length) {
      setSelectedCell(null);
      return;
    }
    const best = [...data.matrix.cells]
      .filter((c) => c.count >= (data.meta.minCoOrders || 1))
      .sort((x, y) => Math.max(y.attachRateAB, y.attachRateBA) - Math.max(x.attachRateAB, x.attachRateBA))[0];
    if (best) {
      if (best.attachRateBA > best.attachRateAB) {
        setSelectedCell({ a: best.b, b: best.a });
      } else {
        setSelectedCell({ a: best.a, b: best.b });
      }
    }
  }, [data]);

  const selected = selectedCell ? cellMap.get(`${selectedCell.a}-${selectedCell.b}`) : undefined;
  const selA = selectedCell ? dishById.get(selectedCell.a) : undefined;
  const selB = selectedCell ? dishById.get(selectedCell.b) : undefined;

  const filteredRelations = useMemo(() => {
    const q = relationSearch.trim().toLowerCase();
    const list = data?.relations || [];
    if (!q) return list.slice(0, 20);
    return list
      .filter(
        (r) =>
          r.consequentDish.dish_name.toLowerCase().includes(q) ||
          r.antecedentDishes.some((d) => d.dish_name.toLowerCase().includes(q))
      )
      .slice(0, 20);
  }, [data, relationSearch]);

  const handleCreateComboDraft = (s: ComboSuggestion) => {
    const missing = s.dishes.filter((d) => !d.dish_price_id);
    if (missing.length) {
      toast.error("Một số món chưa có bảng giá, không thể tạo combo nháp");
      return;
    }
    const draft = {
      combo_name: s.suggestedName,
      combo_price: s.suggestedPrice,
      description: `Đề xuất từ Phân tích Mua Cùng: ${s.bestPairText} (${formatInt(s.count)} đơn gọi chung).`,
      groups: s.dishes.map((d) => ({
        group_name: d.dish_name,
        min_select: 1,
        max_select: 1,
        items: [{ dish_price_id: d.dish_price_id as string, price_extra: 0 }],
      })),
    };
    sessionStorage.setItem("comboDraft", JSON.stringify(draft));
    router.push("/combos");
  };

  const meta = data?.meta;
  const yearLabel = year === "all" ? "2023 – 2026" : year;

  return (
    <div className="space-y-5">
      {/* 1. Thanh bộ lọc */}
      <div className="rounded-2xl border border-slate-200/90 bg-white px-5 py-4 shadow-xs dark:border-dark-3 dark:bg-gray-dark">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">
              Phân Tích Mua Cùng ({yearLabel})
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Thống kê tần suất các món lẻ xuất hiện chung trong cùng đơn hàng (không tính combo, pizza nửa-nửa tính 2 món)
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <FilterSelect label="Năm" value={year} onChange={setYear}>
              <option value="all">Tất cả (2023 – 2026)</option>
              {[2023, 2024, 2025, 2026].map((y) => (
                <option key={y} value={String(y)}>
                  Năm {y}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect label="Danh mục ma trận" value={categoryId} onChange={setCategoryId}>
              <option value="">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.category_id} value={String(c.category_id)}>
                  {c.category_name}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect label="Số món" value={String(top)} onChange={(v) => setTop(Number(v))}>
              {[10, 15, 20].map((n) => (
                <option key={n} value={n}>
                  Top {n} món
                </option>
              ))}
            </FilterSelect>
            <FilterSelect label="Đơn chung tối thiểu" value={minCoOrders} onChange={setMinCoOrders}>
              <option value="auto">Tự động theo quy mô</option>
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={String(n)}>
                  Từ {n} đơn
                </option>
              ))}
            </FilterSelect>
            <FilterSelect label="Tỷ lệ gọi kèm tối thiểu" value={String(minAttachRate)} onChange={(v) => setMinAttachRate(Number(v))}>
              {[5, 10, 20, 30].map((n) => (
                <option key={n} value={n}>
                  {n}%
                </option>
              ))}
            </FilterSelect>
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-[#0284C7] px-4 text-xs font-bold text-white shadow-xs transition hover:bg-sky-700 disabled:opacity-60"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Làm mới dữ liệu</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Thẻ chỉ số tổng quan */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-stroke bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Đơn hàng phân tích (N)</p>
          <p className="mt-2 text-2xl font-black text-dark dark:text-white">{formatInt(meta?.totalOrders || 0)} đơn</p>
          <p className="mt-1 text-xs text-gray-400">Đơn có ít nhất 1 món lẻ, không huỷ</p>
        </div>
        <div className="rounded-2xl border border-stroke bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Số món trung bình / đơn</p>
          <p className="mt-2 text-2xl font-black text-emerald-600">
            {meta ? String(meta.avgBasketSize).replace(".", ",") : "0"} món
          </p>
          <p className="mt-1 text-xs text-gray-400">{formatInt(meta?.distinctPairs || 0)} cặp món khác nhau xuất hiện</p>
        </div>
        <div className="rounded-2xl border border-stroke bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Kết hợp gọi kèm nổi bật</p>
          <p className="mt-2 text-2xl font-black text-primary">{formatInt(data?.summary.totalRelations || 0)} kết hợp</p>
          <p className="mt-1 text-xs text-gray-400">
            Đơn chung ≥ {formatInt(meta?.minCoOrders || 0)} · Tỷ lệ kèm ≥ {minAttachRate}%
          </p>
        </div>
        <div className="rounded-2xl border border-stroke bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Gợi ý thiết lập combo</p>
          <p className="mt-2 text-2xl font-black text-amber-600">{formatInt(data?.comboSuggestions.length || 0)} bộ</p>
          <p className="mt-1 text-xs text-gray-400">
            Tỷ lệ gọi kèm ≥ {formatPct(meta?.comboMinAttachRate || 0, 0)}, khác danh mục
          </p>
        </div>
      </div>

      {/* 3. Quy trình tổng hợp + Công thức + Ví dụ */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark sm:p-6 xl:col-span-7">
          <SectionTitle
            icon={Network}
            title="Quy Trình Thống Kê Ghép Cặp Đơn Hàng"
            sub={`Ngưỡng tối thiểu ${formatInt(meta?.minCoOrders || 0)} đơn gọi chung · Tỷ lệ gọi kèm ≥ ${minAttachRate}%`}
          />
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {(data?.summary.steps || []).map((st, idx) => (
              <div key={st.step} className="relative rounded-xl border border-slate-200/90 bg-slate-50/60 p-4 dark:border-dark-3 dark:bg-dark-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {st.title}
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <span className="rounded-md bg-white px-2 py-1 tabular-nums shadow-2xs dark:bg-gray-dark">
                    {st.fromLabel}: {formatInt(st.fromValue)}
                  </span>
                  <ArrowRight className="size-3.5 shrink-0 text-slate-400" />
                  <span className="rounded-md bg-sky-600 px-2 py-1 tabular-nums text-white">
                    {st.toLabel}: {formatInt(st.toValue)}
                  </span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{st.desc}</p>
                {idx < 2 && (
                  <ArrowRight className="absolute -right-3 top-1/2 hidden size-5 -translate-y-1/2 rounded-full bg-white p-0.5 text-slate-400 shadow-2xs dark:bg-gray-dark md:block" />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-4 dark:border-dark-3">
            <p className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
              <Sigma className="size-4 text-sky-600" /> Chỉ số đo lường mức độ gọi kèm X → Y
            </p>
            <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-slate-600 dark:text-slate-300 md:grid-cols-3">
              <FormulaBox name="Số đơn gọi chung" formula="Đếm số đơn có cả X và Y" note="Tần suất xuất hiện chung thực tế" />
              <FormulaBox name="Tỷ lệ gọi kèm" formula="Đơn có (X và Y) / Đơn có X" note="Gọi X thì bao nhiêu % gọi thêm Y" />
              <FormulaBox name="Tỷ trọng đơn hàng" formula="Đơn có (X và Y) / Tổng đơn N" note="Tỷ lệ xuất hiện trên toàn hệ thống" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark sm:p-6 xl:col-span-5">
          <SectionTitle icon={Calculator} title="Ví Dụ Tính Từ Dữ Liệu Thật" sub="Cặp món gọi kèm nổi bật nhất trong kỳ phân tích" />
          {data?.workedExample ? (
            <WorkedExample ex={data.workedExample} />
          ) : (
            <p className="mt-6 text-sm text-slate-500">{loading ? "Đang tính toán..." : "Chưa đủ dữ liệu để tạo ví dụ."}</p>
          )}
        </div>
      </div>

      {/* 4. Ma trận mua cùng + Chi tiết cặp món */}
      <div className="grid grid-cols-1 gap-5 2xl:grid-cols-12">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark sm:p-6 2xl:col-span-9">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SectionTitle
              icon={Grid3x3}
              title="Ma Trận Mua Cùng 2 Chiều"
              sub={
                colorMode === "rate"
                  ? "Màu theo tỷ lệ gọi kèm (hàng → cột): khách gọi món ở hàng thì bao nhiêu % gọi thêm món ở cột"
                  : "Màu theo tổng số đơn hàng gọi chung cả hai món"
              }
            />
            <div className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 text-xs font-bold dark:border-dark-3 dark:bg-dark-2">
              {(
                [
                  { id: "rate", label: "Theo tỷ lệ gọi kèm" },
                  { id: "count", label: "Theo số đơn chung" },
                ] as Array<{ id: ColorMode; label: string }>
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setColorMode(m.id)}
                  className={`h-8 cursor-pointer rounded-md px-3 transition ${
                    colorMode === m.id
                      ? "bg-white text-slate-900 shadow-2xs dark:bg-gray-dark dark:text-white"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <MatrixLegend mode={colorMode} max={data?.matrix.maxCount || 0} />

          <div className="mt-3 overflow-auto rounded-xl border border-slate-200/90 dark:border-dark-3">
            {loading && !data ? (
              <div className="h-[420px] animate-pulse bg-slate-100 dark:bg-dark-2" />
            ) : (
              <table className="border-collapse text-[11px]">
                <thead>
                  <tr>
                    <th className="sticky left-0 top-0 z-20 min-w-[190px] border-b border-r border-slate-200 bg-slate-50 px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:border-dark-3 dark:bg-dark-2 dark:text-slate-400">
                      Món ăn
                    </th>
                    {(data?.matrix.dishes || []).map((d) => (
                      <th
                        key={d.dish_id}
                        title={`${d.code} - ${d.dish_name}`}
                        className="sticky top-0 z-10 h-[92px] min-w-[52px] border-b border-slate-200 bg-slate-50 px-1 align-bottom dark:border-dark-3 dark:bg-dark-2"
                      >
                        <div className="mx-auto flex h-full w-5 items-end justify-center">
                          <span className="origin-bottom-left translate-x-2 -rotate-[60deg] whitespace-nowrap pb-1 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                            {shortName(d.dish_name)}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.matrix.dishes || []).map((row) => (
                    <tr key={row.dish_id}>
                      <td className="sticky left-0 z-10 border-r border-t border-slate-200 bg-white px-3 py-1.5 dark:border-dark-3 dark:bg-gray-dark">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-semibold text-slate-400">{row.code}</span>
                          <span className="max-w-[140px] truncate font-semibold text-slate-800 dark:text-slate-100" title={row.dish_name}>
                            {row.dish_name}
                          </span>
                        </div>
                      </td>
                      {(data?.matrix.dishes || []).map((col) => {
                        if (row.dish_id === col.dish_id) {
                          return (
                            <td key={col.dish_id} className="border-t border-slate-100 bg-slate-100/70 text-center text-slate-300 dark:border-dark-3 dark:bg-dark-2">
                              —
                            </td>
                          );
                        }
                        const c = cellMap.get(`${row.dish_id}-${col.dish_id}`);
                        const count = c?.count || 0;
                        const rate = c?.attachRateAB || 0;
                        const isSel =
                          selectedCell &&
                          ((selectedCell.a === row.dish_id && selectedCell.b === col.dish_id) ||
                            (selectedCell.a === col.dish_id && selectedCell.b === row.dish_id));
                        return (
                          <td key={col.dish_id} className="border-t border-white p-0 dark:border-dark-3">
                            <button
                              type="button"
                              onClick={() => setSelectedCell({ a: row.dish_id, b: col.dish_id })}
                              title={`${row.dish_name} → ${col.dish_name}: ${formatInt(count)} đơn chung · Tỷ lệ gọi kèm ${formatPct(rate, 1)}`}
                              className={`h-8 w-full min-w-[52px] cursor-pointer px-1 text-center font-semibold tabular-nums transition hover:brightness-95 ${
                                colorMode === "rate" ? rateCellClass(rate, count) : countCellClass(count, data?.matrix.maxCount || 0)
                              } ${isSel ? "ring-2 ring-inset ring-slate-900 dark:ring-white" : ""}`}
                            >
                              {count <= 0 ? "·" : colorMode === "rate" ? formatPct(rate, 0) : formatInt(count)}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <p className="mt-2 text-right text-[11px] text-slate-400">Nhấn vào một ô để xem chi tiết cặp món</p>
        </div>

        {/* Chi tiết cặp món */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark sm:p-6 2xl:col-span-3">
          <SectionTitle icon={Filter} title="Chi Tiết Cặp Món" sub="Đọc nhanh ý nghĩa của ô đang chọn" />
          {selected && selA && selB ? (
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                {[selA, selB].map((d) => (
                  <div key={d.dish_id} className="flex items-center gap-3 rounded-xl border border-slate-200/80 p-2.5 dark:border-dark-3">
                    <DishThumb dish={d} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{d.dish_name}</p>
                      <p className="text-[11px] text-slate-500">
                        {d.code} · {formatInt(d.orderCount)} đơn ({formatPct(d.orderShare)})
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <MiniStat label="Số đơn gọi chung" value={formatInt(selected.count)} />
                <MiniStat label="Tỷ trọng đơn chung" value={formatPct(selected.orderShare, 2)} />
                <MiniStat label="Gọi A → kèm B" value={formatPct(selected.attachRateAB, 1)} highlight />
                <MiniStat label="Gọi B → kèm A" value={formatPct(selected.attachRateBA, 1)} />
              </div>

              <div className="space-y-2.5">
                <AttachRateBar label={`${shortName(selA.dish_name)} → ${shortName(selB.dish_name)}`} value={selected.attachRateAB} />
                <AttachRateBar label={`${shortName(selB.dish_name)} → ${shortName(selA.dish_name)}`} value={selected.attachRateBA} />
              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600 dark:bg-dark-2 dark:text-slate-300">
                <span className={`mb-1.5 inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${rateLabel(selected.attachRateAB).cls}`}>
                  {rateLabel(selected.attachRateAB).text}
                </span>
                <p>
                  <strong>{formatPct(selected.attachRateAB, 0)}</strong> khách gọi {selA.dish_name} đã gọi thêm {selB.dish_name} (xuất hiện
                  chung trong <strong>{formatInt(selected.count)}</strong> đơn hàng).
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-500">Chọn một ô trong ma trận.</p>
          )}
        </div>
      </div>

      {/* 5. Gợi ý thiết lập Combo */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark sm:p-6">
        <SectionTitle
          icon={Sparkles}
          title="Gợi Ý Thiết Lập Combo Cho Quản Lý"
          sub="Bộ món có tỷ lệ gọi kèm cao, khác danh mục, có món chính và chưa có combo cố định"
        />
        {data && data.comboSuggestions.length === 0 && !loading ? (
          <p className="mt-6 text-sm text-slate-500">
            Không có bộ món nào đạt ngưỡng. Thử giảm số đơn chung tối thiểu hoặc tỷ lệ gọi kèm tối thiểu.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {(data?.comboSuggestions || []).map((s, idx) => (
              <ComboCard key={s.key} s={s} rank={idx} onCreate={() => handleCreateComboDraft(s)} />
            ))}
          </div>
        )}
        {meta && (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-3 text-[11px] leading-relaxed text-slate-500 dark:border-dark-3 dark:text-slate-400">
            <strong className="text-slate-700 dark:text-slate-200">Cách ước tính doanh thu tăng thêm:</strong> giá combo = tổng giá lẻ giảm{" "}
            {Math.round(meta.assumptions.pairDiscount * 100)}% (2 món) hoặc {Math.round(meta.assumptions.tripleDiscount * 100)}% (3 món).
            Lợi ích = {Math.round(meta.assumptions.conversionRate * 100)}% số đơn chỉ gọi một phần bộ món nâng lên combo × (giá combo − giá món đã gọi),
            trừ phần giảm giá cho {Math.round(meta.assumptions.cannibalizationRate * 100)}% số đơn vốn đã gọi đủ bộ món. Đây là số ước tính để tham khảo.
          </div>
        )}
      </div>

      {/* 6. Bảng cặp món hay gọi kèm + Đánh giá combo hiện có */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark sm:p-6 xl:col-span-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SectionTitle icon={GitBranch} title="Cặp & Nhóm Món Hay Gọi Kèm" sub="Dùng cho gợi ý món ăn kèm phía khách hàng" />
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={relationSearch}
                onChange={(e) => setRelationSearch(e.target.value)}
                placeholder="Tìm theo món..."
                className="h-9 w-52 rounded-lg border border-slate-200 bg-slate-50/70 pl-8 pr-2.5 text-xs font-medium text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              />
            </div>
          </div>
          <div className="mt-4 max-h-[520px] overflow-auto rounded-xl border border-slate-200/80 dark:border-dark-3">
            <table className="w-full min-w-[680px] border-collapse text-left text-xs">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs dark:bg-dark-2">
                <tr className="border-b border-slate-200/80 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:border-dark-3 dark:text-slate-400">
                  <th className="py-3 pl-3.5 pr-2">Nếu khách gọi</th>
                  <th className="px-2 py-3">Thường gọi thêm</th>
                  <th className="px-2 py-3 text-right">Số đơn chung</th>
                  <th className="px-2 py-3 text-right">Tỷ trọng đơn</th>
                  <th className="w-44 px-3 py-3">Tỷ lệ gọi kèm</th>
                  <th className="py-3 pl-2 pr-3.5 text-right">Mức độ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-3">
                {filteredRelations.map((r, i) => (
                  <tr key={`${r.antecedent.join("-")}_${r.consequent}_${i}`} className="hover:bg-slate-50/80 dark:hover:bg-dark-2/60">
                    <td className="py-2.5 pl-3.5 pr-2 font-semibold text-slate-800 dark:text-slate-100">
                      {r.antecedentDishes.map((d) => d.dish_name).join(" + ")}
                    </td>
                    <td className="px-2 py-2.5">
                      <span className="inline-flex items-center gap-1.5 font-bold text-sky-700 dark:text-sky-400">
                        <ArrowRight className="size-3" />
                        {r.consequentDish.dish_name}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-right tabular-nums text-slate-700 dark:text-slate-200">{formatInt(r.count)}</td>
                    <td className="px-2 py-2.5 text-right tabular-nums text-slate-500">{formatPct(r.orderShare, 2)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-dark-3">
                          <div className="h-full rounded-full bg-sky-600" style={{ width: `${Math.min(100, r.attachRate * 100)}%` }} />
                        </div>
                        <span className="w-11 text-right font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                          {formatPct(r.attachRate, 0)}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 pl-2 pr-3.5 text-right">
                      <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${rateLabel(r.attachRate).cls}`}>
                        {rateLabel(r.attachRate).text}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredRelations.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Không có cặp món phù hợp
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark sm:p-6 xl:col-span-4">
          <SectionTitle icon={BadgeCheck} title="Đánh Giá Combo Đang Bán" sub="Món trong combo có thật sự hay được gọi chung khi mua lẻ?" />
          <div className="mt-4 space-y-3">
            {(data?.comboHealth || []).map((c) => {
              const v =
                c.verdict === "good"
                  ? { text: "Bộ món hợp lý", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" }
                  : c.verdict === "neutral"
                    ? { text: "Trung tính", cls: "bg-slate-100 text-slate-600 dark:bg-dark-2 dark:text-slate-300" }
                    : c.verdict === "weak"
                      ? { text: "Nên xem lại", cls: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" }
                      : { text: "Chưa đủ dữ liệu", cls: "bg-slate-100 text-slate-500 dark:bg-dark-2 dark:text-slate-400" };
              return (
                <div key={c.combo_id} className="rounded-xl border border-slate-200/80 p-3.5 dark:border-dark-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-slate-900 dark:text-white">{c.combo_name}</p>
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${v.cls}`}>{v.text}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">{c.dishes.map((d) => d.dish_name).join(" · ")}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Tỷ lệ gọi kèm trung bình</span>
                    <span className="font-bold tabular-nums text-slate-800 dark:text-slate-100">
                      {c.verdict === "insufficient" ? "—" : `${formatPct(c.avgAttachRate, 1)} (${formatInt(c.totalCoOrders)} đơn)`}
                    </span>
                  </div>
                </div>
              );
            })}
            {data && data.comboHealth.length === 0 && <p className="text-sm text-slate-500">Chưa có combo cố định nào.</p>}
            <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500 dark:bg-dark-2 dark:text-slate-400">
              <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
              <span>Combo linh hoạt (nhiều lựa chọn trong mỗi nhóm) không được chấm điểm vì không có bộ món cố định.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Thành phần giao diện phụ ──────────────────────────────────────────────

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 dark:border-dark-3 dark:bg-dark-2 dark:text-white"
      >
        {children}
      </select>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400">
        <Icon className="size-[18px]" />
      </div>
      <div>
        <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">{title}</h2>
        {sub && <p className="text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

function FormulaBox({ name, formula, note }: { name: string; formula: string; note: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 dark:bg-dark-2">
      <p className="text-[11px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">{name}</p>
      <p className="mt-1 font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-100">{formula}</p>
      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{note}</p>
    </div>
  );
}

function WorkedExample({ ex }: { ex: NonNullable<BasketResponse["workedExample"]> }) {
  const rows = [
    { k: "N (tổng số đơn phân tích)", v: formatInt(ex.N) },
    { k: `Số đơn có ${ex.antecedent.dish_name}`, v: formatInt(ex.countA) },
    { k: `Số đơn có ${ex.consequent.dish_name}`, v: formatInt(ex.countB) },
    { k: "Số đơn gọi chung cả hai món", v: formatInt(ex.countAB) },
  ];
  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 p-2.5 dark:border-dark-3">
        <DishThumb dish={ex.antecedent} />
        <ArrowRight className="size-4 shrink-0 text-slate-400" />
        <DishThumb dish={ex.consequent} />
        <p className="ml-1 text-sm font-bold text-slate-900 dark:text-white">
          {ex.antecedent.dish_name} → {ex.consequent.dish_name}
        </p>
      </div>
      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 text-xs dark:divide-dark-3 dark:border-dark-3">
        {rows.map((r) => (
          <div key={r.k} className="flex items-center justify-between px-3 py-2">
            <span className="text-slate-500 dark:text-slate-400">{r.k}</span>
            <span className="font-bold tabular-nums text-slate-800 dark:text-slate-100">{r.v}</span>
          </div>
        ))}
      </div>
      <div className="space-y-1.5 rounded-xl bg-slate-50 p-3 font-mono text-[11px] text-slate-700 dark:bg-dark-2 dark:text-slate-200">
        <p>
          Tỷ lệ gọi kèm = {formatInt(ex.countAB)} / {formatInt(ex.countA)} = <strong>{formatPct(ex.attachRate, 1)}</strong>
        </p>
        <p>
          Tỷ trọng đơn hàng = {formatInt(ex.countAB)} / {formatInt(ex.N)} = <strong>{formatPct(ex.orderShare, 2)}</strong>
        </p>
      </div>
      <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
        <TrendingUp className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
        <span>
          Cứ 100 đơn gọi {ex.antecedent.dish_name} thì có khoảng <strong>{Math.round(ex.attachRate * 100)} đơn</strong> khách gọi thêm{" "}
          {ex.consequent.dish_name}.
        </span>
      </p>
    </div>
  );
}

function MatrixLegend({ mode, max }: { mode: ColorMode; max: number }) {
  const items =
    mode === "rate"
      ? [
          { cls: "bg-sky-50", label: "< 3% Rất ít" },
          { cls: "bg-slate-50", label: "3% – 6%" },
          { cls: "bg-orange-100", label: "6% – 12%" },
          { cls: "bg-orange-200", label: "12% – 20%" },
          { cls: "bg-orange-400", label: "20% – 30% Hay gọi kèm" },
          { cls: "bg-orange-600", label: "> 30% Rất phổ biến" },
        ]
      : [
          { cls: "bg-orange-50", label: `< ${formatInt(max * 0.15)}` },
          { cls: "bg-orange-100", label: `${formatInt(max * 0.15)} – ${formatInt(max * 0.3)}` },
          { cls: "bg-orange-200", label: `${formatInt(max * 0.3)} – ${formatInt(max * 0.5)}` },
          { cls: "bg-orange-400", label: `${formatInt(max * 0.5)} – ${formatInt(max * 0.75)}` },
          { cls: "bg-orange-600", label: `> ${formatInt(max * 0.75)} đơn` },
        ];
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-500 dark:text-slate-400">
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5">
          <span className={`size-3 rounded-xs border border-slate-200/70 ${it.cls}`} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

function DishThumb({ dish }: { dish: DishInfo }) {
  const url = getImageUrl(dish.image);
  return url ? (
    <img src={url} alt={dish.dish_name} className="size-9 shrink-0 rounded-lg border border-slate-200/80 object-cover dark:border-dark-3" />
  ) : (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 font-mono text-[9px] font-bold text-slate-500 dark:border-dark-3 dark:bg-dark-2">
      {dish.code}
    </div>
  );
}

function MiniStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-2.5 ${highlight ? "bg-orange-50 dark:bg-orange-950/30" : "bg-slate-50 dark:bg-dark-2"}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-0.5 text-base font-extrabold tabular-nums ${highlight ? "text-orange-600 dark:text-orange-400" : "text-slate-900 dark:text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function AttachRateBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="font-semibold text-slate-600 dark:text-slate-300">Tỷ lệ gọi kèm {label}</span>
        <span className="font-bold tabular-nums text-slate-900 dark:text-white">{formatPct(value, 1)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-dark-3">
        <div className="h-full rounded-full bg-sky-600" style={{ width: `${Math.min(100, value * 100)}%` }} />
      </div>
    </div>
  );
}

function ComboCard({ s, rank, onCreate }: { s: ComboSuggestion; rank: number; onCreate: () => void }) {
  const tier =
    s.attachRate >= 0.25
      ? {
          text: "Cơ hội rất cao",
          cls: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300",
        }
      : s.attachRate >= 0.16
        ? {
            text: "Cơ hội cao",
            cls: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-300",
          }
        : {
            text: "Tiềm năng",
            cls: "border-slate-200 bg-slate-50 text-slate-600 dark:border-dark-3 dark:bg-dark-2 dark:text-slate-300",
          };
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 transition hover:border-sky-300 hover:shadow-xs dark:border-dark-3 dark:bg-gray-dark">
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tier.cls}`}>{tier.text}</span>
          <span className="font-mono text-[11px] font-bold text-slate-400">
            #{String(rank + 1).padStart(2, "0")} · {s.size} món
          </span>
        </div>
        <h3 className="mt-2.5 text-sm font-bold leading-snug text-slate-900 dark:text-white">{s.suggestedName}</h3>
        <div className="mt-3 space-y-1.5">
          {s.dishes.map((d) => (
            <div key={d.dish_id} className="flex items-center gap-2.5">
              <DishThumb dish={d} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{d.dish_name}</p>
                <p className="text-[10px] text-slate-400">{d.category_name}</p>
              </div>
              <span className="text-[11px] font-semibold tabular-nums text-slate-500">{formatCurrency(d.unitPrice)}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{s.bestPairText}.</p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-slate-50 py-1.5 dark:bg-dark-2">
            <p className="text-[10px] font-semibold text-slate-500">Đơn chung</p>
            <p className="text-sm font-extrabold tabular-nums text-slate-900 dark:text-white">{formatInt(s.count)}</p>
          </div>
          <div className="rounded-lg bg-orange-50 py-1.5 dark:bg-orange-950/30">
            <p className="text-[10px] font-semibold text-slate-500">Tỷ lệ kèm</p>
            <p className="text-sm font-extrabold tabular-nums text-orange-600 dark:text-orange-400">{formatPct(s.attachRate, 0)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 py-1.5 dark:bg-dark-2">
            <p className="text-[10px] font-semibold text-slate-500">Tỷ trọng đơn</p>
            <p className="text-sm font-extrabold tabular-nums text-slate-900 dark:text-white">{formatPct(s.orderShare, 1)}</p>
          </div>
        </div>
        {s.flexibleComboNames.length > 0 && (
          <p className="mt-2 text-[11px] text-slate-500">Hiện có thể chọn trong combo linh hoạt: {s.flexibleComboNames.join(", ")}</p>
        )}
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3 dark:border-dark-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Giá đề xuất</p>
            <p className="text-base font-extrabold tabular-nums text-slate-900 dark:text-white">
              {formatCurrency(s.suggestedPrice)}{" "}
              <span className="text-xs font-medium text-slate-400 line-through">{formatCurrency(s.originalPrice)}</span>
            </p>
          </div>
          <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
            -{s.discountPercent}%
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-slate-500">Doanh thu ước tính tăng</span>
          <span className={`font-bold tabular-nums ${s.estimatedNetGain >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600"}`}>
            {s.estimatedNetGain >= 0 ? "+" : ""}
            {formatCompactCurrency(s.estimatedNetGain)} ({s.estimatedUpliftPercent >= 0 ? "+" : ""}
            {String(s.estimatedUpliftPercent).replace(".", ",")}%)
          </span>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="mt-3 inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-slate-900 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-700"
        >
          <PackagePlus className="size-3.5" />
          <span>Tạo combo nháp</span>
        </button>
      </div>
    </div>
  );
}
