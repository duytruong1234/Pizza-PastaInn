"use client";

import { api } from "@/lib/api";
import type { ApexOptions } from "apexcharts";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  ChevronRight,
  Layers,
  Package,
  Printer,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Utensils,
  Wallet,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => (
    <div className="h-[340px] w-full animate-pulse rounded-xl bg-slate-100 dark:bg-dark-2" />
  ),
});

interface DishForecastDetail {
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

interface DishSalesSummaryItem {
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
  trendStatus: "growing" | "stable" | "declining";
  trendLabel: string;
  monthlyByYear: Record<number, number[]>;
  monthlyRevenueByYear: Record<number, number[]>;
  forecastNextMonth: DishForecastDetail;
}

interface CategorySalesAnalyticsItem {
  key: string;
  label: string;
  groupType: "all" | "category" | "diet";
  categoryId: number | null;
  dishesCount: number;
  yearlyTotals: Record<number, number>;
  yearlyRevenueTotals: Record<number, number>;
  monthlyByYear: Record<number, number[]>;
  monthlyRevenueByYear: Record<number, number[]>;
}

interface SynchronizedAnalyticsResponse {
  availableYears: number[];
  selectedYear: number;
  compareYear: number;
  nextMonthForecastTarget: {
    month: number;
    year: number;
    label: string;
  };
  categoryAnalytics: CategorySalesAnalyticsItem[];
  summary: {
    totalDishesTracked: number;
    totalQuantitySelectedYear: number;
    totalRevenueSelectedYear: number;
    totalOrdersSelectedYear: number;
    averageOrderValueSelectedYear: number;
    overallYoYGrowthPercent: number;
    growingDishesCount: number;
    decliningDishesCount: number;
    totalForecastNextMonth: number;
    totalForecastRevenueNextMonth: number;
  };
  overallMonthlyByYear: Record<number, number[]>;
  overallRevenueByYear: Record<number, number[]>;
  overallOrdersByYear: Record<number, number[]>;
  yearlyQuantityTotals: Record<number, number>;
  yearlyRevenueTotals: Record<number, number>;
  yearlyOrdersTotals: Record<number, number>;
  dishes: DishSalesSummaryItem[];
}

type MetricMode = "quantity" | "revenue";

const MONTH_LABELS = [
  "T01",
  "T02",
  "T03",
  "T04",
  "T05",
  "T06",
  "T07",
  "T08",
  "T09",
  "T10",
  "T11",
  "T12",
];

const YEAR_PALETTE: Record<
  number,
  { color: string; badgeBg: string; softBg: string; border: string; text: string }
> = {
  2023: {
    color: "#0D9488",
    badgeBg: "bg-[#0D9488]",
    softBg: "bg-teal-50 dark:bg-teal-950/40",
    border: "border-teal-300 dark:border-teal-800",
    text: "text-teal-700 dark:text-teal-300",
  },
  2024: {
    color: "#2563EB",
    badgeBg: "bg-[#2563EB]",
    softBg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-300 dark:border-blue-800",
    text: "text-blue-700 dark:text-blue-300",
  },
  2025: {
    color: "#8B5CF6",
    badgeBg: "bg-[#7C3AED]",
    softBg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-300 dark:border-violet-800",
    text: "text-violet-700 dark:text-violet-300",
  },
  2026: {
    color: "#E11D48",
    badgeBg: "bg-[#E11D48]",
    softBg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-300 dark:border-rose-800",
    text: "text-rose-700 dark:text-rose-300",
  },
};

const CATEGORY_COLORS = [
  "#4F46E5", // Indigo
  "#0D9488", // Teal
  "#E11D48", // Rose
  "#8B5CF6", // Violet
  "#EA580C", // Deep Orange
];

const formatInt = (val: number) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(val || 0));

const formatDecimal = (val: number) =>
  new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(val || 0);

const formatCurrency = (val: number) =>
  `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Math.round(val || 0))} ₫`;

const formatCompactCurrency = (value: number) => {
  const abs = Math.abs(value || 0);
  if (abs >= 1_000_000_000) {
    return `${new Intl.NumberFormat("vi-VN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 1_000_000_000)} tỷ`;
  }
  if (abs >= 1_000_000) {
    return `${new Intl.NumberFormat("vi-VN", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 1_000_000)} tr`;
  }
  return formatCurrency(value);
};

const formatDishCode = (id: number) => `MA${String(id).padStart(3, "0")}`;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const getImageUrl = (img: string | null | undefined): string | null => {
  if (!img) return null;
  if (img.startsWith("http")) return img;
  return `${API_BASE}${img.startsWith("/") ? "" : "/"}${img}`;
};

export function DashboardAnalytics() {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedScopeKey, setSelectedScopeKey] = useState<string>("all");
  const [metricMode, setMetricMode] = useState<MetricMode>("quantity");
  const [visibleYears, setVisibleYears] = useState<number[]>([
    2023, 2024, 2025, 2026,
  ]);
  const [showForecast, setShowForecast] = useState<boolean>(false);
  const [leaderboardLimit, setLeaderboardLimit] = useState<number>(10);
  const [dishSearch, setDishSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "growing" | "stable" | "declining"
  >("all");
  const [data, setData] = useState<SynchronizedAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{
        success: boolean;
        data: SynchronizedAnalyticsResponse;
      }>("/api/admin/dish-sales/analytics", {
        params: { year: selectedYear },
      });
      if (res.data?.data) {
        setData(res.data.data);
      }
    } catch {
      toast.error("Không thể tải dữ liệu phân tích bán hàng");
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleRefreshData = async () => {
    setRefreshing(true);
    try {
      await api.post("/api/admin/dish-sales/seed");
      await fetchAnalytics();
      toast.success(
        "Đã mô phỏng phiếu bán hàng (2023 – 2026) và cập nhật đồng bộ vào bảng tiêu hao"
      );
    } catch {
      toast.error("Không thể làm mới dữ liệu");
    } finally {
      setRefreshing(false);
    }
  };

  const toggleYear = (yr: number) => {
    setVisibleYears((prev) => {
      if (prev.includes(yr)) {
        if (prev.length === 1) return prev;
        return prev.filter((y) => y !== yr);
      }
      return [...prev, yr].sort((a, b) => a - b);
    });
  };

  const availableYears = useMemo(
    () => data?.availableYears || [2023, 2024, 2025, 2026],
    [data]
  );

  const sortedDishesByCode = useMemo(() => {
    return [...(data?.dishes || [])].sort((a, b) => a.dish_id - b.dish_id);
  }, [data]);

  // Xác định đối tượng đang phân tích (Toàn hệ thống / Danh mục / Món lẻ cụ thể)
  const activeScope = useMemo(() => {
    if (!data) return null;

    if (selectedScopeKey.startsWith("dish_")) {
      const dishId = Number(selectedScopeKey.replace("dish_", ""));
      const dish = data.dishes.find((d) => d.dish_id === dishId);
      if (dish) {
        return {
          key: selectedScopeKey,
          title: `${formatDishCode(dish.dish_id)} - ${dish.dish_name}`,
          subtitle: `Món ăn lẻ • Danh mục: ${dish.category_name} • Đơn giá: ${formatCurrency(dish.unitPrice)}`,
          monthlyQtyByYear: dish.monthlyByYear,
          monthlyRevByYear: dish.monthlyRevenueByYear,
          yearlyQtyTotals: dish.yearlyTotals,
          yearlyRevTotals: dish.yearlyRevenueTotals,
          forecastQty: dish.forecastNextMonth?.predictedQuantity || 0,
          forecastRev:
            (dish.forecastNextMonth?.predictedQuantity || 0) * dish.unitPrice,
          forecastExplanation: dish.forecastNextMonth?.explanation || "",
        };
      }
    }

    const catGroup =
      data.categoryAnalytics?.find((c) => c.key === selectedScopeKey) ||
      data.categoryAnalytics?.[0];

    if (catGroup) {
      const groupDishes = data.dishes.filter((d) => {
        if (catGroup.key === "all") return true;
        if (catGroup.key === "diet_man") return d.dish_type !== "chay";
        if (catGroup.key === "diet_chay") return d.dish_type === "chay";
        return d.category_id === catGroup.categoryId;
      });
      const forecastQty = groupDishes.reduce(
        (s, d) => s + (d.forecastNextMonth?.predictedQuantity || 0),
        0
      );
      const forecastRev = groupDishes.reduce(
        (s, d) =>
          s + (d.forecastNextMonth?.predictedQuantity || 0) * d.unitPrice,
        0
      );

      return {
        key: catGroup.key,
        title: catGroup.label,
        subtitle: `Tổng hợp doanh số tiêu thụ của ${catGroup.dishesCount} món ăn trong thực đơn`,
        monthlyQtyByYear: catGroup.monthlyByYear,
        monthlyRevByYear: catGroup.monthlyRevenueByYear,
        yearlyQtyTotals: catGroup.yearlyTotals,
        yearlyRevTotals: catGroup.yearlyRevenueTotals,
        forecastQty,
        forecastRev,
        forecastExplanation: `Dự báo tổng hợp từ ${catGroup.dishesCount} món ăn bằng phương pháp trung bình trượt trọng số 3 tháng (WMA-3) kết hợp hệ số mùa vụ lịch sử 2023–2026.`,
      };
    }

    return null;
  }, [data, selectedScopeKey]);

  // Tính toán thống kê 12 tháng của năm đang chọn
  const currentYearStats = useMemo(() => {
    const qtyArr =
      activeScope?.monthlyQtyByYear?.[selectedYear] || Array(12).fill(0);
    const revArr =
      activeScope?.monthlyRevByYear?.[selectedYear] || Array(12).fill(0);
    const activeArr = metricMode === "quantity" ? qtyArr : revArr;

    let maxVal = -1;
    let maxIdx = 0;
    let minVal = Number.MAX_SAFE_INTEGER;
    let minIdx = 0;
    let total = 0;

    for (let i = 0; i < 12; i++) {
      const v = activeArr[i] || 0;
      total += v;
      if (v > maxVal) {
        maxVal = v;
        maxIdx = i;
      }
      if (v < minVal) {
        minVal = v;
        minIdx = i;
      }
    }

    if (maxVal < 0) maxVal = 0;
    if (minVal === Number.MAX_SAFE_INTEGER) minVal = 0;
    const avg = total / 12;

    const totalQty = qtyArr.reduce((s, v) => s + (v || 0), 0);
    const totalRev = revArr.reduce((s, v) => s + (v || 0), 0);

    const prevYr = selectedYear - 1;
    const prevArr =
      (metricMode === "quantity"
        ? activeScope?.monthlyQtyByYear?.[prevYr]
        : activeScope?.monthlyRevByYear?.[prevYr]) || [];
    const prevTotal = prevArr.reduce((s, v) => s + (v || 0), 0);
    const yoyPercent =
      prevTotal > 0
        ? Number((((total - prevTotal) / prevTotal) * 100).toFixed(1))
        : 0;

    return {
      activeArr,
      qtyArr,
      revArr,
      maxVal,
      maxIdx,
      minVal,
      minIdx,
      total,
      avg,
      totalQty,
      totalRev,
      yoyPercent,
    };
  }, [activeScope, selectedYear, metricMode]);

  const formatMetricValue = useCallback(
    (val: number, compact = false) => {
      if (metricMode === "revenue") {
        return compact ? formatCompactCurrency(val) : formatCurrency(val);
      }
      return `${formatInt(val)} phần`;
    },
    [metricMode]
  );

  const barColors = useMemo(() => {
    return currentYearStats.activeArr.map((_, idx) => {
      if (idx === currentYearStats.maxIdx) return "#10B981"; // Xanh lục bảo (Emerald): Tháng cao nhất
      if (idx === currentYearStats.minIdx) return "#F43F5E"; // Đỏ hồng (Rose): Tháng thấp nhất
      return "#4F46E5"; // Xanh chàm (Indigo): Các tháng bình thường
    });
  }, [currentYearStats]);

  const barChartOptions: ApexOptions = useMemo(() => {
    const rawMax = Math.max(10, currentYearStats.maxVal * 1.15);
    const step = metricMode === "revenue" ? 10_000_000 : 10;
    const maxAxis = Math.ceil(rawMax / step) * step;

    return {
      chart: {
        type: "bar",
        toolbar: { show: false },
        fontFamily: "inherit",
        animations: {
          enabled: true,
          speed: 500,
        },
        dropShadow: {
          enabled: true,
          top: 4,
          left: 0,
          blur: 6,
          color: "#4F46E5",
          opacity: 0.14,
        },
      },
      colors: barColors,
      fill: {
        type: "gradient",
        gradient: {
          shade: "light",
          type: "vertical",
          shadeIntensity: 0.25,
          inverseColors: false,
          opacityFrom: 0.98,
          opacityTo: 0.78,
          stops: [0, 100],
        },
      },
      plotOptions: {
        bar: {
          columnWidth: "46%",
          borderRadius: 6,
          borderRadiusApplication: "end",
          distributed: true,
        },
      },
      dataLabels: {
        enabled: false,
      },
      legend: { show: false },
      xaxis: {
        categories: MONTH_LABELS,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: {
            fontSize: "12px",
            fontWeight: 600,
            colors: "#64748B",
          },
        },
      },
      yaxis: {
        min: 0,
        max: maxAxis,
        tickAmount: 6,
        labels: {
          formatter: (val) =>
            metricMode === "revenue"
              ? formatCompactCurrency(val)
              : `${formatInt(val)} phần`,
          style: {
            fontSize: "12px",
            fontWeight: 500,
            colors: "#64748B",
          },
        },
      },
      grid: {
        borderColor: "#E2E8F0",
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
      },
      annotations: {
        yaxis: [
          {
            y: Number(currentYearStats.avg.toFixed(1)),
            borderColor: "#6366F1",
            strokeDashArray: 4,
            borderWidth: 1.5,
          },
        ],
      },
      tooltip: {
        theme: "light",
        y: {
          formatter: (val, opts) => {
            const idx = opts?.dataPointIndex ?? 0;
            const q = currentYearStats.qtyArr[idx] || 0;
            const r = currentYearStats.revArr[idx] || 0;
            return metricMode === "revenue"
              ? `${formatCurrency(val)} (${formatInt(q)} phần)`
              : `${formatInt(val)} phần (${formatCompactCurrency(r)})`;
          },
        },
      },
    };
  }, [barColors, currentYearStats, metricMode]);

  const barChartSeries = useMemo(
    () => [
      {
        name: metricMode === "revenue" ? "Doanh thu" : "Sản lượng bán",
        data: currentYearStats.activeArr,
      },
    ],
    [currentYearStats.activeArr, metricMode]
  );

  // Biểu đồ đường đa năm (2023 - 2026)
  const multiYearSeries = useMemo(() => {
    if (!activeScope) return [];
    return visibleYears.map((yr) => ({
      name: `Năm ${yr}`,
      data:
        (metricMode === "quantity"
          ? activeScope.monthlyQtyByYear?.[yr]
          : activeScope.monthlyRevByYear?.[yr]) || Array(12).fill(0),
    }));
  }, [activeScope, visibleYears, metricMode]);

  const multiYearLineOptions: ApexOptions = useMemo(() => {
    const allVals = multiYearSeries.flatMap((s) => s.data);
    const maxVal = Math.max(10, ...allVals);
    const step = metricMode === "revenue" ? 10_000_000 : 10;
    const maxAxis = Math.ceil((maxVal * 1.15) / step) * step;

    return {
      chart: {
        type: "line",
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: "inherit",
        animations: {
          enabled: true,
          speed: 500,
        },
        dropShadow: {
          enabled: true,
          top: 6,
          left: 0,
          blur: 6,
          color: "#0F172A",
          opacity: 0.1,
        },
      },
      colors: visibleYears.map((yr) => YEAR_PALETTE[yr]?.color || "#0284C7"),
      stroke: {
        curve: "smooth",
        width: 3,
        lineCap: "round",
      },
      markers: {
        size: 5,
        strokeWidth: 2.5,
        strokeColors: "#FFFFFF",
        hover: { size: 7, sizeOffset: 2 },
      },
      dataLabels: { enabled: false },
      legend: {
        show: true,
        position: "top",
        horizontalAlign: "center",
        fontSize: "12px",
        fontWeight: 600,
        markers: {
          size: 7,
          shape: "square",
        },
        itemMargin: { horizontal: 14 },
      },
      xaxis: {
        categories: MONTH_LABELS,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: {
            fontSize: "12px",
            fontWeight: 600,
            colors: "#64748B",
          },
        },
      },
      yaxis: {
        min: 0,
        max: maxAxis,
        tickAmount: 6,
        labels: {
          formatter: (val) =>
            metricMode === "revenue"
              ? formatCompactCurrency(val)
              : `${formatInt(val)} phần`,
          style: {
            fontSize: "12px",
            fontWeight: 500,
            colors: "#64748B",
          },
        },
      },
      grid: {
        borderColor: "#E2E8F0",
        strokeDashArray: 4,
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: true } },
      },
      tooltip: {
        theme: "light",
        shared: true,
        intersect: false,
        y: {
          formatter: (val) =>
            metricMode === "revenue"
              ? formatCurrency(val)
              : `${formatInt(val)} phần`,
        },
      },
    };
  }, [multiYearSeries, visibleYears, metricMode]);

  // Phân tích tỷ trọng theo Danh mục trong năm đang chọn
  const categoryBreakdownList = useMemo(() => {
    if (!data?.categoryAnalytics) return [];
    const cats = data.categoryAnalytics.filter(
      (c) => c.groupType === "category"
    );
    const totalYearQty = data.yearlyQuantityTotals?.[selectedYear] || 1;
    const totalYearRev = data.yearlyRevenueTotals?.[selectedYear] || 1;

    return cats
      .map((c, i) => {
        const qty = c.yearlyTotals?.[selectedYear] || 0;
        const rev = c.yearlyRevenueTotals?.[selectedYear] || 0;
        const prevQty = c.yearlyTotals?.[selectedYear - 1] || 0;
        const yoy =
          prevQty > 0
            ? Number((((qty - prevQty) / prevQty) * 100).toFixed(1))
            : 0;
        const pct =
          metricMode === "quantity"
            ? Number(((qty / totalYearQty) * 100).toFixed(1))
            : Number(((rev / totalYearRev) * 100).toFixed(1));
        return {
          ...c,
          cleanName: c.label.replace("Danh mục: ", ""),
          qty,
          rev,
          pct,
          yoy,
          color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
        };
      })
      .sort((a, b) =>
        metricMode === "quantity" ? b.qty - a.qty : b.rev - a.rev
      )
      .map((item, idx) => ({
        ...item,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      }));
  }, [data, selectedYear, metricMode]);

  const categoryDonutOptions: ApexOptions = useMemo(() => {
    const totalVal =
      metricMode === "quantity"
        ? data?.yearlyQuantityTotals?.[selectedYear] || 0
        : data?.yearlyRevenueTotals?.[selectedYear] || 0;

    return {
      chart: {
        type: "donut",
        fontFamily: "inherit",
        animations: { enabled: true, speed: 450 },
      },
      labels: categoryBreakdownList.map((c) => c.cleanName),
      colors: categoryBreakdownList.map((c) => c.color),
      stroke: {
        width: 3,
        colors: ["#FFFFFF"],
      },
      dataLabels: { enabled: false },
      legend: { show: false },
      plotOptions: {
        pie: {
          donut: {
            size: "72%",
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: "11px",
                fontWeight: 600,
                color: "#64748B",
                offsetY: -6,
              },
              value: {
                show: true,
                fontSize: "18px",
                fontWeight: 800,
                color: "#0F172A",
                offsetY: 6,
                formatter: (val) =>
                  metricMode === "revenue"
                    ? formatCompactCurrency(Number(val))
                    : `${formatInt(Number(val))} phần`,
              },
              total: {
                show: true,
                label: `TỔNG NĂM ${selectedYear}`,
                fontSize: "10px",
                fontWeight: 700,
                color: "#64748B",
                formatter: () =>
                  metricMode === "revenue"
                    ? formatCompactCurrency(totalVal)
                    : `${formatInt(totalVal)} phần`,
              },
            },
          },
        },
      },
      tooltip: {
        theme: "light",
        y: {
          formatter: (val) =>
            metricMode === "revenue"
              ? formatCurrency(val)
              : `${formatInt(val)} phần`,
        },
      },
    };
  }, [categoryBreakdownList, data, selectedYear, metricMode]);

  const categoryDonutSeries = useMemo(
    () =>
      categoryBreakdownList.map((c) =>
        metricMode === "quantity" ? c.qty : c.rev
      ),
    [categoryBreakdownList, metricMode]
  );

  // Danh sách xếp hạng món ăn chủ lực (có lọc tìm kiếm, lọc tình trạng bán hàng & giới hạn hiển thị)
  const rankedDishesInScope = useMemo(() => {
    if (!data?.dishes) {
      return {
        items: [],
        maxMetric: 1,
        totalCount: 0,
        growingCount: 0,
        stableCount: 0,
        decliningCount: 0,
      };
    }
    let list = [...data.dishes];
    if (selectedScopeKey.startsWith("cat_")) {
      const catId = Number(selectedScopeKey.replace("cat_", ""));
      list = list.filter((d) => d.category_id === catId);
    } else if (selectedScopeKey === "diet_man") {
      list = list.filter((d) => d.dish_type !== "chay");
    } else if (selectedScopeKey === "diet_chay") {
      list = list.filter((d) => d.dish_type === "chay");
    }

    const growingCount = list.filter((d) => d.trendStatus === "growing").length;
    const stableCount = list.filter((d) => d.trendStatus === "stable").length;
    const decliningCount = list.filter(
      (d) => d.trendStatus === "declining"
    ).length;

    if (statusFilter !== "all") {
      list = list.filter((d) => d.trendStatus === statusFilter);
    }

    if (dishSearch.trim()) {
      const q = dishSearch.trim().toLowerCase();
      list = list.filter(
        (d) =>
          d.dish_name.toLowerCase().includes(q) ||
          formatDishCode(d.dish_id).toLowerCase().includes(q) ||
          d.category_name.toLowerCase().includes(q) ||
          (d.trendLabel || "").toLowerCase().includes(q)
      );
    }

    list.sort((a, b) =>
      metricMode === "quantity"
        ? (b.yearlyTotals?.[selectedYear] || 0) -
          (a.yearlyTotals?.[selectedYear] || 0)
        : (b.yearlyRevenueTotals?.[selectedYear] || 0) -
          (a.yearlyRevenueTotals?.[selectedYear] || 0)
    );

    const maxMetric =
      list.length > 0
        ? Math.max(
            1,
            metricMode === "quantity"
              ? list[0].yearlyTotals?.[selectedYear] || 1
              : list[0].yearlyRevenueTotals?.[selectedYear] || 1
          )
        : 1;

    return {
      items: list.slice(0, leaderboardLimit),
      maxMetric,
      totalCount: list.length,
      growingCount,
      stableCount,
      decliningCount,
    };
  }, [
    data,
    selectedScopeKey,
    selectedYear,
    metricMode,
    dishSearch,
    statusFilter,
    leaderboardLimit,
  ]);

  const handlePrintReport = () => {
    if (!activeScope) return;
    const rowsHtml = availableYears
      .map((yr) => {
        const qArr = activeScope.monthlyQtyByYear?.[yr] || Array(12).fill(0);
        const totalQ = qArr.reduce((s, v) => s + v, 0);
        const totalR = activeScope.yearlyRevTotals?.[yr] || 0;
        const cells = qArr
          .map(
            (v) =>
              `<td style="padding:6px;border:1px solid #ddd;text-align:center">${formatInt(v)}</td>`
          )
          .join("");
        return `<tr>
          <td style="padding:6px;border:1px solid #ddd;font-weight:700">Năm ${yr}</td>
          ${cells}
          <td style="padding:6px;border:1px solid #ddd;font-weight:700;text-align:right">${formatInt(totalQ)} phần</td>
          <td style="padding:6px;border:1px solid #ddd;font-weight:700;text-align:right">${formatCompactCurrency(totalR)}</td>
        </tr>`;
      })
      .join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Báo cáo Phân tích Bán hàng</title>
      <style>
        body{font-family:'Segoe UI',Tahoma,sans-serif;padding:24px;color:#111}
        h1{font-size:20px;text-align:center;margin-bottom:4px}
        p.sub{text-align:center;color:#555;font-size:13px;margin-bottom:20px}
        table{width:100%;border-collapse:collapse;font-size:12px;margin-top:12px}
        th{background:#f1f5f9;padding:8px 6px;border:1px solid #cbd5e1}
      </style></head><body>
      <h1>BÁO CÁO PHÂN TÍCH DỮ LIỆU BÁN HÀNG (2023 – 2026)</h1>
      <p class="sub">Pizza & Pasta Inn • Phạm vi: ${activeScope.title}</p>
      <table>
        <thead>
          <tr>
            <th>Năm</th>
            ${MONTH_LABELS.map((m) => `<th>${m}</th>`).join("")}
            <th>Tổng sản lượng</th>
            <th>Tổng doanh thu</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <script>window.onload = () => window.print();</script>
    </body></html>`;

    const w = window.open("", "_blank", "width=1000,height=720");
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  };

  return (
    <section className="space-y-5">
      {/* 1. Thanh Bộ Lọc Ngang */}
      <div className="rounded-2xl border border-slate-200/90 bg-white px-5 py-4 shadow-xs dark:border-dark-3 dark:bg-gray-dark">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-wrap items-end gap-4">
            {/* Chọn đối tượng / danh mục / món ăn phân tích */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Layers className="size-3.5 text-indigo-600" />
                <span>Đối tượng phân tích:</span>
              </label>
              <select
                value={selectedScopeKey}
                onChange={(e) => setSelectedScopeKey(e.target.value)}
                className="h-10 min-w-[270px] cursor-pointer rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-bold text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              >
                <optgroup label="Tổng hợp Cửa hàng & Danh mục">
                  {(data?.categoryAnalytics || []).map((grp) => (
                    <option key={grp.key} value={grp.key}>
                      {grp.label} ({grp.dishesCount} món)
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Chi tiết từng Món ăn lẻ">
                  {sortedDishesByCode.map((d) => (
                    <option key={`dish_${d.dish_id}`} value={`dish_${d.dish_id}`}>
                      {formatDishCode(d.dish_id)} - {d.dish_name} (phần)
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Chọn Năm phân tích */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Calendar className="size-3.5 text-indigo-600" />
                <span>Năm phân tích:</span>
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="h-10 min-w-[140px] cursor-pointer rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-bold text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    Năm {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Chuyển đổi Đơn vị: Sản lượng (phần) vs Doanh thu (VNĐ) */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <SlidersHorizontal className="size-3.5 text-indigo-600" />
                <span>Chỉ tiêu biểu đồ:</span>
              </label>
              <div className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-slate-100/80 p-1 dark:border-dark-3 dark:bg-dark-2">
                <button
                  type="button"
                  onClick={() => setMetricMode("quantity")}
                  className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition ${
                    metricMode === "quantity"
                      ? "bg-white text-indigo-700 shadow-2xs dark:bg-gray-dark dark:text-indigo-400"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                  }`}
                >
                  <Package className="size-3.5" />
                  <span>Sản lượng (phần)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMetricMode("revenue")}
                  className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition ${
                    metricMode === "revenue"
                      ? "bg-white text-indigo-700 shadow-2xs dark:bg-gray-dark dark:text-indigo-400"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                  }`}
                >
                  <Wallet className="size-3.5" />
                  <span>Doanh thu (VNĐ)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Cụm nút hành động bên phải */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleRefreshData}
              disabled={refreshing}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-[#4F46E5] px-4 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-700 disabled:opacity-60"
            >
              <RefreshCw
                className={`size-3.5 ${refreshing ? "animate-spin" : ""}`}
              />
              <span>{refreshing ? "Đang đồng bộ..." : "Làm mới dữ liệu"}</span>
            </button>

            <Link
              href="/dish-sales"
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            >
              <Utensils className="size-3.5 text-indigo-600" />
              <span>Thống kê món lẻ</span>
              <ChevronRight className="size-3.5" />
            </Link>

            <button
              type="button"
              onClick={handlePrintReport}
              className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            >
              <Printer className="size-3.5" />
              <span>Xuất báo cáo</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Khối Biểu Đồ Cột 12 Tháng + Lưới 2x2 Thẻ Chỉ Số */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark sm:p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white sm:text-lg">
              {metricMode === "quantity"
                ? `Lượng Tiêu Hao 12 Tháng Năm ${selectedYear} (phần)`
                : `Doanh Thu Bán Hàng 12 Tháng Năm ${selectedYear} (VNĐ)`}{" "}
              <span className="font-medium text-slate-400">/</span>{" "}
              <span className="text-indigo-600 dark:text-indigo-400">
                {activeScope?.title}
              </span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-xs bg-[#10B981]" />
              Tháng cao điểm ({MONTH_LABELS[currentYearStats.maxIdx]})
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-xs bg-[#4F46E5]" />
              Tháng bình thường
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-xs bg-[#F43F5E]" />
              Tháng thấp điểm ({MONTH_LABELS[currentYearStats.minIdx]})
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-3.5 border-t-2 border-dashed border-[#6366F1]" />
              Trung bình năm
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
          {/* Cột trái: Biểu đồ cột 12 tháng */}
          <div className="lg:col-span-8">
            <div className="h-[340px] w-full">
              {loading ? (
                <div className="h-full w-full animate-pulse rounded-xl bg-slate-100 dark:bg-dark-2" />
              ) : (
                <Chart
                  options={barChartOptions}
                  series={barChartSeries}
                  type="bar"
                  height="100%"
                />
              )}
            </div>
          </div>

          {/* Cột phải: Lưới 2x2 gồm 4 thẻ chỉ số */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-4">
            {/* Tổng trong năm */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs transition hover:border-slate-300 dark:border-dark-3 dark:bg-dark-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {metricMode === "quantity"
                  ? "TỔNG TIÊU HAO TRONG NĂM"
                  : "TỔNG DOANH THU TRONG NĂM"}
              </p>
              <p className="mt-2.5 text-2xl font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-white">
                {formatMetricValue(currentYearStats.total, true)}
              </p>
              <p className="mt-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {metricMode === "quantity"
                  ? `Doanh thu: ${formatCompactCurrency(currentYearStats.totalRev)}`
                  : `Lượng tiêu hao: ${formatInt(currentYearStats.totalQty)} phần`}
              </p>
            </div>

            {/* Trung bình mỗi tháng */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs transition hover:border-indigo-300 dark:border-dark-3 dark:bg-dark-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                TRUNG BÌNH MỖI THÁNG
              </p>
              <p className="mt-2.5 text-2xl font-extrabold tabular-nums tracking-tight text-[#4F46E5] dark:text-indigo-400">
                {metricMode === "quantity"
                  ? `${formatDecimal(currentYearStats.avg)} phần`
                  : formatCompactCurrency(currentYearStats.avg)}
              </p>
              <p className="mt-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                {currentYearStats.yoyPercent >= 0 ? "+" : ""}
                {currentYearStats.yoyPercent}% so với năm {selectedYear - 1}
              </p>
            </div>

            {/* Tháng cao nhất */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs transition hover:border-emerald-300 dark:border-dark-3 dark:bg-dark-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                THÁNG CAO NHẤT
              </p>
              <p className="mt-2.5 text-2xl font-extrabold tabular-nums tracking-tight text-[#059669] dark:text-emerald-400">
                {formatMetricValue(currentYearStats.maxVal, true)}
              </p>
              <p className="mt-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Đạt đỉnh vào tháng {MONTH_LABELS[currentYearStats.maxIdx]}
              </p>
            </div>

            {/* Tháng thấp nhất */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs transition hover:border-rose-300 dark:border-dark-3 dark:bg-dark-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                THÁNG THẤP NHẤT
              </p>
              <p className="mt-2.5 text-2xl font-extrabold tabular-nums tracking-tight text-[#E11D48] dark:text-rose-400">
                {formatMetricValue(currentYearStats.minVal, true)}
              </p>
              <p className="mt-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Thấp điểm vào tháng {MONTH_LABELS[currentYearStats.minIdx]}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Khối So Sánh Chuỗi Giữa Các Năm (2023 - 2026) + Bảng Thống Kê Đa Năm */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white sm:text-lg">
              So Sánh Chuỗi{" "}
              {metricMode === "quantity" ? "Tiêu Hao" : "Doanh Thu"} Giữa Các
              Năm
            </h2>
          </div>

          {/* Checkbox chọn các năm so sánh (2023, 2024, 2025, 2026) */}
          <div className="flex flex-wrap items-center gap-4">
            {availableYears.map((yr) => {
              const checked = visibleYears.includes(yr);
              return (
                <label
                  key={yr}
                  className="inline-flex cursor-pointer select-none items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleYear(yr)}
                    className="size-4 cursor-pointer rounded border-slate-300 accent-[#4F46E5] focus:ring-indigo-500"
                  />
                  <span>Năm {yr}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Biểu đồ đường đa năm */}
        <div className="mt-3 h-[330px] w-full">
          {loading ? (
            <div className="h-full w-full animate-pulse rounded-xl bg-slate-100 dark:bg-dark-2" />
          ) : (
            <Chart
              options={multiYearLineOptions}
              series={multiYearSeries}
              type="line"
              height="100%"
            />
          )}
        </div>

        {/* Bảng Thống Kê Số Liệu Từng Tháng Qua Các Năm */}
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Bảng Thống Kê Số Liệu{" "}
              {metricMode === "quantity" ? "Tiêu Hao" : "Doanh Thu"} Từng Tháng
              Qua Các Năm
            </h3>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200/90 dark:border-dark-3">
            <table className="w-full min-w-[920px] border-collapse text-center text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase text-slate-500 dark:border-dark-3 dark:bg-dark-2 dark:text-slate-400">
                  <th className="py-3 pl-4 pr-3 text-left">NĂM KHẢO SÁT</th>
                  {MONTH_LABELS.map((m) => (
                    <th key={m} className="px-2 py-3">
                      {m}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-indigo-600 dark:text-indigo-400">
                    TỔNG CỘNG
                  </th>
                  <th className="px-3 py-3 text-slate-700 dark:text-slate-200">
                    TB/THÁNG
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-3">
                {availableYears.map((yr) => {
                  const arr =
                    (metricMode === "quantity"
                      ? activeScope?.monthlyQtyByYear?.[yr]
                      : activeScope?.monthlyRevByYear?.[yr]) || Array(12).fill(0);
                  const totalYr = arr.reduce((s, v) => s + (v || 0), 0);
                  const avgYr = totalYr / 12;
                  const palette = YEAR_PALETTE[yr] || YEAR_PALETTE[2024];

                  return (
                    <tr
                      key={yr}
                      className="transition hover:bg-slate-50/80 dark:hover:bg-dark-2/50"
                    >
                      <td className="py-3 pl-4 pr-3 text-left">
                        <span
                          className={`inline-block rounded-md px-2.5 py-1 text-xs font-bold text-white ${palette.badgeBg}`}
                        >
                          Năm {yr}
                        </span>
                      </td>
                      {arr.map((val, idx) => (
                        <td
                          key={idx}
                          className="px-2 py-3 font-medium tabular-nums text-slate-700 dark:text-slate-200"
                        >
                          {metricMode === "quantity"
                            ? formatInt(val)
                            : formatCompactCurrency(val)}
                        </td>
                      ))}
                      <td className="px-3 py-3 font-extrabold tabular-nums text-[#4F46E5] dark:text-indigo-400">
                        {metricMode === "quantity"
                          ? `${formatInt(totalYr)} phần`
                          : formatCompactCurrency(totalYr)}
                      </td>
                      <td className="px-3 py-3 font-extrabold tabular-nums text-slate-900 dark:text-white">
                        {metricMode === "quantity"
                          ? `${formatDecimal(avgYr)} phần`
                          : formatCompactCurrency(avgYr)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. Phân Bổ Danh Mục (Biểu Đồ Donut + Ma Trận) & Bảng Phân Tích Tiêu Hao / Tình Trạng Bán Hàng */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* Cột trái (5/12): Biểu đồ Donut Tỷ Trọng Danh Mục + Ma trận số liệu */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark sm:p-6 xl:col-span-5">
          <div>
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-4 dark:border-dark-3">
              <div>
                <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                  Tỷ Trọng Theo Nhóm Thực Đơn ({selectedYear})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Chọn một nhóm thực đơn bên dưới để lọc dữ liệu toàn trang
                </p>
              </div>
              {selectedScopeKey.startsWith("cat_") && (
                <button
                  type="button"
                  onClick={() => setSelectedScopeKey("all")}
                  className="cursor-pointer text-xs font-semibold text-sky-600 hover:underline"
                >
                  Đặt lại
                </button>
              )}
            </div>

            {/* Biểu đồ Donut tương tác */}
            <div className="my-4 flex items-center justify-center">
              <div className="h-[235px] w-full max-w-[320px]">
                {loading ? (
                  <div className="mx-auto size-[200px] animate-pulse rounded-full bg-slate-100 dark:bg-dark-2" />
                ) : (
                  <Chart
                    options={categoryDonutOptions}
                    series={categoryDonutSeries}
                    type="donut"
                    height="100%"
                  />
                )}
              </div>
            </div>

            {/* Bảng ma trận tỷ trọng danh mục */}
            <div className="overflow-hidden rounded-xl border border-slate-200/80 dark:border-dark-3">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:border-dark-3 dark:bg-dark-2 dark:text-slate-400">
                    <th className="py-2.5 pl-3.5 pr-2">Danh mục</th>
                    <th className="px-2 py-2.5 text-right">Lượng tiêu hao</th>
                    <th className="px-2 py-2.5 text-right">Doanh thu</th>
                    <th className="py-2.5 pl-2 pr-3.5 text-right">Tỷ trọng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-3">
                  {categoryBreakdownList.map((cat) => {
                    const isSelected = selectedScopeKey === cat.key;
                    return (
                      <tr
                        key={cat.key}
                        onClick={() =>
                          setSelectedScopeKey(isSelected ? "all" : cat.key)
                        }
                        className={`cursor-pointer transition ${
                          isSelected
                            ? "bg-sky-50/80 dark:bg-sky-950/30"
                            : "hover:bg-slate-50/80 dark:hover:bg-dark-2/60"
                        }`}
                      >
                        <td className="py-3 pl-3.5 pr-2">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="size-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">
                                {cat.cleanName}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {cat.dishesCount} món ăn
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-right font-bold tabular-nums text-slate-800 dark:text-slate-200">
                          {formatInt(cat.qty)} phần
                        </td>
                        <td className="px-2 py-3 text-right font-semibold tabular-nums text-slate-600 dark:text-slate-300">
                          {formatCompactCurrency(cat.rev)}
                        </td>
                        <td className="py-3 pl-2 pr-3.5 text-right">
                          <div className="inline-flex flex-col items-end gap-1">
                            <span className="font-extrabold tabular-nums text-slate-900 dark:text-white">
                              {cat.pct}%
                            </span>
                            <div className="h-1 w-14 overflow-hidden rounded-full bg-slate-100 dark:bg-dark-3">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min(100, cat.pct)}%`,
                                  backgroundColor: cat.color,
                                }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Chuỗi tổng hợp tốc độ tăng trưởng 4 năm (2023 -> 2026) */}
          <div className="mt-5 border-t border-slate-100 pt-4 dark:border-dark-3">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Tổng Hợp Lượng Tiêu Hao Theo Năm ({activeScope?.title})
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {availableYears.map((yr) => {
                const yQty = activeScope?.yearlyQtyTotals?.[yr] || 0;
                const yRev = activeScope?.yearlyRevTotals?.[yr] || 0;
                const prevQty = activeScope?.yearlyQtyTotals?.[yr - 1] || 0;
                const growth =
                  prevQty > 0
                    ? Number((((yQty - prevQty) / prevQty) * 100).toFixed(1))
                    : null;
                const isCurrent = yr === selectedYear;

                return (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setSelectedYear(yr)}
                    className={`cursor-pointer rounded-xl border p-2.5 text-left transition ${
                      isCurrent
                        ? "border-slate-900 bg-slate-900 text-white dark:border-sky-500 dark:bg-sky-950/60"
                        : "border-slate-200/80 bg-slate-50/50 hover:border-slate-300 dark:border-dark-3 dark:bg-dark-2"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span
                        className={
                          isCurrent
                            ? "text-slate-300"
                            : "text-slate-500 dark:text-slate-400"
                        }
                      >
                        {yr}
                      </span>
                      {growth !== null && (
                        <span
                          className={
                            isCurrent
                              ? "text-emerald-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }
                        >
                          +{growth}%
                        </span>
                      )}
                    </div>
                    <p
                      className={`mt-1 text-sm font-extrabold tabular-nums ${
                        isCurrent
                          ? "text-white"
                          : "text-slate-900 dark:text-white"
                      }`}
                    >
                      {metricMode === "quantity"
                        ? formatInt(yQty)
                        : formatCompactCurrency(yRev)}
                    </p>
                    <p
                      className={`text-[10px] tabular-nums ${
                        isCurrent ? "text-slate-300" : "text-slate-400"
                      }`}
                    >
                      {metricMode === "quantity"
                        ? formatCompactCurrency(yRev)
                        : `${formatInt(yQty)} phần`}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cột phải (7/12): Bảng Phân Tích Lượng Tiêu Hao & Tình Trạng Bán Hàng */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark sm:p-6 xl:col-span-7">
          <div>
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 dark:border-dark-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                    Phân Tích Lượng Tiêu Hao & Tình Trạng Bán Hàng ({selectedYear})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {activeScope?.title} • Tổng hợp trực tiếp từ phiếu bán hàng sang bảng tiêu hao
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {selectedScopeKey !== "all" && (
                    <button
                      type="button"
                      onClick={() => setSelectedScopeKey("all")}
                      className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-dark-3 dark:bg-dark-2 dark:text-slate-200"
                    >
                      <ArrowLeft className="size-3.5" />
                      <span>Toàn cửa hàng</span>
                    </button>
                  )}

                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={dishSearch}
                      onChange={(e) => setDishSearch(e.target.value)}
                      placeholder="Tìm món ăn..."
                      className="h-8 w-40 rounded-lg border border-slate-200 bg-slate-50/70 pl-8 pr-2.5 text-xs font-medium text-slate-900 outline-none transition focus:w-48 focus:border-sky-500 focus:bg-white dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                    />
                  </div>

                  <div className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 text-[11px] font-bold dark:border-dark-3 dark:bg-dark-2">
                    {[10, 20, 61].map((lim) => (
                      <button
                        key={lim}
                        type="button"
                        onClick={() => setLeaderboardLimit(lim)}
                        className={`cursor-pointer rounded-md px-2 py-1 transition ${
                          leaderboardLimit === lim
                            ? "bg-white text-slate-900 shadow-2xs dark:bg-gray-dark dark:text-white"
                            : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {lim === 61 ? "Tất cả" : `Top ${lim}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bộ lọc nhanh theo Tình trạng bán hàng (Phân tích từ lượng tiêu hao) */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                {[
                  {
                    id: "all" as const,
                    label: "Tất cả",
                    count:
                      rankedDishesInScope.growingCount +
                      rankedDishesInScope.stableCount +
                      rankedDishesInScope.decliningCount,
                  },
                  {
                    id: "growing" as const,
                    label: "Bán chạy · Tăng trưởng",
                    count: rankedDishesInScope.growingCount,
                  },
                  {
                    id: "stable" as const,
                    label: "Tiêu thụ ổn định",
                    count: rankedDishesInScope.stableCount,
                  },
                  {
                    id: "declining" as const,
                    label: "Tiêu thụ chậm · Cần đẩy gợi ý",
                    count: rankedDishesInScope.decliningCount,
                  },
                ].map((tab) => {
                  const active = statusFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setStatusFilter(tab.id)}
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                        active
                          ? "border-slate-900 bg-slate-900 text-white dark:border-sky-500 dark:bg-sky-950/60"
                          : "border-slate-200/90 bg-slate-50/70 text-slate-600 hover:bg-slate-100 dark:border-dark-3 dark:bg-dark-2 dark:text-slate-300"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                          active
                            ? "bg-white/20 text-white"
                            : "bg-slate-200/80 text-slate-700 dark:bg-dark-3 dark:text-slate-300"
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 max-h-[540px] overflow-y-auto overflow-x-auto rounded-xl border border-slate-200/80 dark:border-dark-3">
              <table className="w-full min-w-[720px] border-collapse text-left text-xs">
                <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs dark:bg-dark-2">
                  <tr className="border-b border-slate-200/80 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:border-dark-3 dark:text-slate-400">
                    <th className="w-12 py-3 pl-3.5 pr-2 text-center">#</th>
                    <th className="px-2 py-3">Món ăn</th>
                    <th className="w-40 px-3 py-3 text-right">
                      Lượng tiêu hao ({selectedYear})
                    </th>
                    <th className="px-3 py-3 text-right">
                      Doanh thu ({selectedYear})
                    </th>
                    <th className="px-2.5 py-3 text-center">Biên độ tháng</th>
                    <th className="py-3 pl-2.5 pr-3.5 text-right">
                      Tình trạng bán hàng
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-3">
                  {rankedDishesInScope.items.map((dish, idx) => {
                    const yrQty = dish.yearlyTotals?.[selectedYear] || 0;
                    const yrRev = dish.yearlyRevenueTotals?.[selectedYear] || 0;
                    const activeMetric =
                      metricMode === "quantity" ? yrQty : yrRev;
                    const widthPct = Math.max(
                      6,
                      Math.round(
                        (activeMetric / rankedDishesInScope.maxMetric) * 100
                      )
                    );

                    const mArr = dish.monthlyByYear?.[selectedYear] || [];
                    let peakM = 0;
                    let peakV = -1;
                    let lowM = 0;
                    let lowV = Number.MAX_SAFE_INTEGER;
                    mArr.forEach((v, i) => {
                      if (v > peakV) {
                        peakV = v;
                        peakM = i;
                      }
                      if (v < lowV) {
                        lowV = v;
                        lowM = i;
                      }
                    });
                    if (lowV === Number.MAX_SAFE_INTEGER) lowV = 0;

                    const dishScopeKey = `dish_${dish.dish_id}`;
                    const isSelectedDish = selectedScopeKey === dishScopeKey;

                    const statusBadgeClass =
                      dish.trendStatus === "growing"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : dish.trendStatus === "declining"
                          ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300"
                          : "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-300";

                    return (
                      <tr
                        key={dish.dish_id}
                        onClick={() =>
                          setSelectedScopeKey(
                            isSelectedDish ? "all" : dishScopeKey
                          )
                        }
                        className={`group cursor-pointer transition ${
                          isSelectedDish
                            ? "bg-sky-50/90 dark:bg-sky-950/40"
                            : "hover:bg-slate-50/90 dark:hover:bg-dark-2/60"
                        }`}
                      >
                        <td className="py-3 pl-3.5 pr-2 text-center">
                          <span
                            className={`inline-flex size-6 items-center justify-center rounded-md font-mono text-[11px] font-bold ${
                              idx < 3
                                ? "bg-slate-900 text-white dark:bg-sky-500 dark:text-slate-950"
                                : "text-slate-400 dark:text-slate-500"
                            }`}
                          >
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                        </td>

                        <td className="px-2 py-3">
                          <div className="flex items-center gap-3">
                            {dish.image ? (
                              <img
                                src={getImageUrl(dish.image)!}
                                alt={dish.dish_name}
                                className="size-9 shrink-0 rounded-lg border border-slate-200/80 object-cover dark:border-dark-3"
                              />
                            ) : (
                              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 font-mono text-[10px] font-bold text-slate-500 dark:border-dark-3 dark:bg-dark-2">
                                {formatDishCode(dish.dish_id)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="truncate font-bold text-slate-900 group-hover:text-sky-600 dark:text-white dark:group-hover:text-sky-400">
                                {dish.dish_name}
                              </p>
                              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                                <span className="font-mono font-semibold text-slate-500 dark:text-slate-400">
                                  {formatDishCode(dish.dish_id)}
                                </span>
                                <span>•</span>
                                <span>{dish.category_name}</span>
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-3 text-right">
                          <div className="inline-flex w-full flex-col items-end gap-1">
                            <span className="font-extrabold tabular-nums text-slate-900 dark:text-white">
                              {formatInt(yrQty)}{" "}
                              <span className="font-normal text-slate-400">
                                phần
                              </span>
                            </span>
                            <span className="text-[10px] tabular-nums text-slate-400">
                              TB {formatDecimal(dish.avgMonthly || yrQty / 12)}{" "}
                              phần/tháng
                            </span>
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-dark-3">
                              <div
                                className="h-full rounded-full bg-sky-600 transition-all duration-300 dark:bg-sky-400"
                                style={{ width: `${widthPct}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-3 text-right">
                          <p className="font-bold tabular-nums text-slate-900 dark:text-white">
                            {formatCompactCurrency(yrRev)}
                          </p>
                          <p className="mt-0.5 text-[10px] tabular-nums text-slate-400">
                            {formatCurrency(dish.unitPrice)}/phần
                          </p>
                        </td>

                        <td className="px-2.5 py-3 text-center">
                          <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200/80 bg-slate-50/70 px-2 py-1 text-[11px] tabular-nums dark:border-dark-3 dark:bg-dark-2">
                            <span className="font-bold text-slate-700 dark:text-slate-200">
                              {MONTH_LABELS[peakM]}: {peakV}
                            </span>
                            <span className="text-slate-300 dark:text-slate-600">
                              /
                            </span>
                            <span className="text-slate-500 dark:text-slate-400">
                              {MONTH_LABELS[lowM]}: {lowV}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 pl-2.5 pr-3.5 text-right">
                          <div className="inline-flex flex-col items-end gap-1">
                            <span
                              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${statusBadgeClass}`}
                            >
                              {dish.trendLabel ||
                                (dish.trendStatus === "growing"
                                  ? "Bán chạy · Tăng trưởng"
                                  : dish.trendStatus === "declining"
                                    ? "Tiêu thụ chậm · Cần đẩy gợi ý"
                                    : "Tiêu thụ ổn định")}
                            </span>
                            <span className="text-[11px] font-bold tabular-nums">
                              {dish.yoyGrowthPercent >= 0 ? (
                                <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                                  <ArrowUpRight className="size-3" />+
                                  {dish.yoyGrowthPercent}% vs {selectedYear - 1}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                                  <ArrowDownRight className="size-3" />
                                  {dish.yoyGrowthPercent}% vs {selectedYear - 1}
                                </span>
                              )}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Chân bảng: liên kết điều hướng nhanh */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-dark-3 dark:text-slate-400">
            <span>
              Hiển thị{" "}
              <strong className="text-slate-900 dark:text-white">
                {rankedDishesInScope.items.length}
              </strong>{" "}
              / {rankedDishesInScope.totalCount} món ăn trong phạm vi đang chọn
            </span>
            <Link
              href="/dish-sales"
              className="inline-flex items-center gap-1 font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400"
            >
              <span>Mở trang phân tích chi tiết từng món lẻ</span>
              <ChevronRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
