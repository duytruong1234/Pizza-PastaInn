"use client";

import { api } from "@/lib/api";
import type { ApexOptions } from "apexcharts";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BarChart3,
  LineChart,
  Package,
  RefreshCw,
  Table2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import dynamic from "next/dynamic";
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
  trendStatus?: "growing" | "stable" | "declining";
  trendLabel?: string;
  monthlyByYear: Record<number, number[]>;
  monthlyRevenueByYear: Record<number, number[]>;
  forecastNextMonth: DishForecastDetail;
}

interface AnalyticsResponse {
  availableYears: number[];
  selectedYear: number;
  nextMonthForecastTarget?: {
    month: number;
    year: number;
    label: string;
  };
  dishes: DishSalesSummaryItem[];
}

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

const YEAR_PALETTE: Record<number, { color: string; badgeBg: string }> = {
  2023: { color: "#0D9488", badgeBg: "bg-[#0D9488]" },
  2024: { color: "#2563EB", badgeBg: "bg-[#2563EB]" },
  2025: { color: "#8B5CF6", badgeBg: "bg-[#7C3AED]" },
  2026: { color: "#E11D48", badgeBg: "bg-[#E11D48]" },
};

const formatInt = (val: number) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(val || 0));

const formatDecimal = (val: number) =>
  new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(val || 0);

const formatCurrency = (val: number) =>
  `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Math.round(val || 0))} ₫`;

const formatDishCode = (id: number) => `MA${String(id).padStart(3, "0")}`;

export default function DishSalesPage() {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedDishId, setSelectedDishId] = useState<number | null>(null);
  const [visibleYears, setVisibleYears] = useState<number[]>([
    2023, 2024, 2025, 2026,
  ]);
  const [showForecast, setShowForecast] = useState<boolean>(false);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: AnalyticsResponse }>(
        "/api/admin/dish-sales/analytics",
        {
          params: {
            year: selectedYear,
          },
        }
      );
      if (res.data?.data) {
        const d = res.data.data;
        const sortedDishes = [...(d.dishes || [])].sort(
          (a, b) => a.dish_id - b.dish_id
        );
        setAnalytics({
          ...d,
          dishes: sortedDishes,
        });
        if (d.availableYears?.length) {
          setVisibleYears((prev) =>
            prev.length > 0 ? prev : d.availableYears
          );
        }
        if (sortedDishes.length > 0) {
          setSelectedDishId((prev) => {
            if (prev && sortedDishes.some((item) => item.dish_id === prev)) {
              return prev;
            }
            return sortedDishes[0].dish_id;
          });
        }
      }
    } catch {
      toast.error("Không thể tải dữ liệu thống kê bán hàng món lẻ");
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

  const selectedDish = useMemo(() => {
    if (!analytics?.dishes?.length) return null;
    return (
      analytics.dishes.find((d) => d.dish_id === selectedDishId) ||
      analytics.dishes[0]
    );
  }, [analytics, selectedDishId]);

  const availableYears = useMemo(
    () => analytics?.availableYears || [2023, 2024, 2025, 2026],
    [analytics]
  );

  // Dữ liệu 12 tháng của món đang chọn trong năm khảo sát
  const monthlyStats = useMemo(() => {
    const monthly =
      selectedDish?.monthlyByYear?.[selectedYear] || Array(12).fill(0);

    let maxVal = -1;
    let maxIdx = 0;
    let minVal = Number.MAX_SAFE_INTEGER;
    let minIdx = 0;
    let total = 0;

    for (let i = 0; i < 12; i++) {
      const v = monthly[i] || 0;
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

    return {
      monthly,
      maxVal,
      maxIdx,
      minVal,
      minIdx,
      total,
      avg,
    };
  }, [selectedDish, selectedYear]);

  const barColors = useMemo(() => {
    return monthlyStats.monthly.map((_, idx) => {
      if (idx === monthlyStats.maxIdx) return "#10B981"; // Tháng cao nhất (Xanh lục bảo Emerald)
      if (idx === monthlyStats.minIdx) return "#F43F5E"; // Tháng thấp nhất (Đỏ hồng Rose)
      return "#4F46E5"; // Các tháng bình thường (Xanh chàm Indigo)
    });
  }, [monthlyStats]);

  // Nâng cấp giao diện biểu đồ cột 12 tháng (Gradient + DropShadow + Tooltip hiện đại, không hiện số đè lên cột)
  const barChartOptions: ApexOptions = useMemo(() => {
    const maxAxis = Math.max(
      10,
      Math.ceil((monthlyStats.maxVal * 1.15) / 10) * 10
    );

    return {
      chart: {
        type: "bar",
        toolbar: { show: false },
        fontFamily: "inherit",
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 550,
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
          shadeIntensity: 0.2,
          opacityFrom: 0.98,
          opacityTo: 0.82,
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
      legend: {
        show: false,
      },
      states: {
        hover: {
          filter: {
            type: "darken",
          },
        },
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
        tickAmount: 8,
        labels: {
          formatter: (val) => `${formatInt(val)} phần`,
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
            y: Number(monthlyStats.avg.toFixed(1)),
            borderColor: "#6366F1",
            strokeDashArray: 4,
            borderWidth: 2,
          },
        ],
      },
      tooltip: {
        theme: "light",
        y: {
          formatter: (val) =>
            `${formatInt(val)} phần (${formatCurrency(val * (selectedDish?.unitPrice || 0))})`,
        },
      },
    };
  }, [barColors, monthlyStats.avg, monthlyStats.maxVal, selectedDish?.unitPrice]);

  const barChartSeries = useMemo(
    () => [
      {
        name: "Lượng bán",
        data: monthlyStats.monthly,
      },
    ],
    [monthlyStats.monthly]
  );

  // Biểu đồ đường so sánh chuỗi bán hàng giữa các năm (2023 - 2026)
  const multiYearSeries = useMemo(() => {
    if (!selectedDish) return [];
    return visibleYears.map((yr) => ({
      name: `Năm ${yr}`,
      data: selectedDish.monthlyByYear?.[yr] || Array(12).fill(0),
    }));
  }, [selectedDish, visibleYears]);

  const multiYearLineOptions: ApexOptions = useMemo(() => {
    const allVals = multiYearSeries.flatMap((s) => s.data);
    const maxVal = Math.max(10, ...allVals);
    const maxAxis = Math.ceil((maxVal * 1.15) / 10) * 10;

    return {
      chart: {
        type: "line",
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: "inherit",
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 600,
        },
        dropShadow: {
          enabled: true,
          top: 6,
          left: 0,
          blur: 6,
          opacity: 0.14,
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
        hover: { sizeOffset: 3 },
      },
      dataLabels: {
        enabled: false,
      },
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
        tickAmount: 8,
        labels: {
          formatter: (val) => `${formatInt(val)} phần`,
          style: {
            fontSize: "12px",
            fontWeight: 500,
            colors: "#64748B",
          },
        },
      },
      grid: {
        borderColor: "#E2E8F0",
        strokeDashArray: 3,
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: true } },
      },
      tooltip: {
        theme: "light",
        shared: true,
        intersect: false,
        y: {
          formatter: (val) => `${formatInt(val)} phần`,
        },
      },
    };
  }, [multiYearSeries, visibleYears]);

  return (
    <div className="space-y-6">
      {/* 1. Thanh điều khiển & Bộ lọc trên cùng (Giữ nguyên bố cục chuẩn) */}
      <div className="rounded-2xl border border-stroke bg-white px-5 py-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            {/* Chọn Món ăn phân tích */}
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-dark-5 dark:text-dark-6">
                MÓN ĂN PHÂN TÍCH:
              </label>
              <select
                value={selectedDish?.dish_id || ""}
                onChange={(e) => setSelectedDishId(Number(e.target.value))}
                className="min-w-[270px] cursor-pointer rounded-lg border border-stroke bg-white px-3.5 py-2 text-sm font-bold text-dark outline-none transition focus:border-[#4F46E5] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              >
                {(analytics?.dishes || []).map((dish) => (
                  <option
                    key={dish.dish_id}
                    value={dish.dish_id}
                    className="bg-white text-dark dark:bg-gray-dark dark:text-white"
                  >
                    {formatDishCode(dish.dish_id)} - {dish.dish_name} (phần)
                  </option>
                ))}
              </select>
            </div>

            {/* Chọn Năm phân tích */}
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-dark-5 dark:text-dark-6">
                NĂM PHÂN TÍCH:
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="min-w-[140px] cursor-pointer rounded-lg border border-stroke bg-white px-3.5 py-2 text-sm font-bold text-dark outline-none transition focus:border-[#4F46E5] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              >
                {availableYears.map((yr) => (
                  <option
                    key={yr}
                    value={yr}
                    className="bg-white text-dark dark:bg-gray-dark dark:text-white"
                  >
                    Năm {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cụm nút Làm mới bên phải */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleRefreshData}
              disabled={refreshing}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#4F46E5] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#4338CA] disabled:opacity-60"
            >
              <RefreshCw
                className={`size-3.5 ${refreshing ? "animate-spin" : ""}`}
              />
              <span>{refreshing ? "Đang làm mới..." : "Làm mới dữ liệu"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Khối Biểu Đồ Cột 12 Tháng + 4 Thẻ Chỉ Số Bên Phải */}
      <div className="rounded-2xl border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <BarChart3 className="size-5 text-[#4F46E5]" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-dark dark:text-white sm:text-lg">
                  Lượng Tiêu Hao 12 Tháng Năm {selectedYear} (phần)
                </h2>
                {selectedDish && (
                  <span
                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold ${
                      selectedDish.trendStatus === "growing"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : selectedDish.trendStatus === "declining"
                          ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300"
                          : "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800/60 dark:bg-indigo-950/40 dark:text-indigo-300"
                    }`}
                  >
                    Tình trạng bán hàng:{" "}
                    {selectedDish.trendLabel ||
                      (selectedDish.trendStatus === "growing"
                        ? "Bán chạy · Tăng trưởng"
                        : selectedDish.trendStatus === "declining"
                          ? "Tiêu thụ chậm · Cần đẩy gợi ý"
                          : "Tiêu thụ ổn định")}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-dark-5 dark:text-dark-6">
                {selectedDish
                  ? `${formatDishCode(selectedDish.dish_id)} - ${selectedDish.dish_name} • Danh mục: ${selectedDish.category_name} • Đơn giá: ${formatCurrency(selectedDish.unitPrice)} • Tổng hợp từ phiếu bán hàng`
                  : "Đang tải dữ liệu món ăn..."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-dark-5 dark:text-dark-6">
            <div className="flex items-center gap-1.5">
              <span className="inline-block size-3 rounded-xs bg-[#10B981]" />
              <span>Tháng cao nhất</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block size-3 rounded-xs bg-[#4F46E5]" />
              <span>Tháng bình thường</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block size-3 rounded-xs bg-[#F43F5E]" />
              <span>Tháng thấp nhất</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-5 border-t-2 border-dashed border-[#6366F1]" />
              <span>Trung bình ({formatDecimal(monthlyStats.avg)} phần)</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
          {/* Cột trái: Biểu đồ Cột 12 Tháng */}
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

          {/* Cột phải: Lưới 2x2 gồm 4 Thẻ Chỉ Số */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-4">
            {/* Tổng lượng bán trong năm */}
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 dark:border-dark-3 dark:bg-dark-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-dark-6">
                  TỔNG TIÊU HAO TRONG NĂM
                </p>
                <Package className="size-4 text-slate-400" />
              </div>
              <p className="mt-2 text-2xl font-extrabold text-dark dark:text-white">
                {formatInt(monthlyStats.total)} phần
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500 dark:text-dark-6">
                Doanh thu:{" "}
                <strong className="text-dark dark:text-white">
                  {formatCurrency(
                    monthlyStats.total * (selectedDish?.unitPrice || 0)
                  )}
                </strong>
              </p>
            </div>

            {/* Trung bình mỗi tháng */}
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 dark:border-dark-3 dark:bg-dark-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-dark-6">
                  TRUNG BÌNH MỖI THÁNG
                </p>
                <Activity className="size-4 text-[#4F46E5]" />
              </div>
              <p className="mt-2 text-2xl font-extrabold text-[#4F46E5] dark:text-indigo-400">
                {formatDecimal(monthlyStats.avg)} phần
              </p>
              <p className="mt-1 inline-flex items-center gap-0.5 text-xs font-medium text-slate-500 dark:text-dark-6">
                <span>Tăng trưởng YoY:</span>
                {(selectedDish?.yoyGrowthPercent || 0) >= 0 ? (
                  <strong className="inline-flex items-center text-emerald-600">
                    <ArrowUpRight className="size-3.5" />+
                    {selectedDish?.yoyGrowthPercent || 0}%
                  </strong>
                ) : (
                  <strong className="inline-flex items-center text-amber-600">
                    <ArrowDownRight className="size-3.5" />
                    {selectedDish?.yoyGrowthPercent || 0}%
                  </strong>
                )}
              </p>
            </div>

            {/* Tháng cao nhất */}
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 dark:border-dark-3 dark:bg-dark-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-dark-6">
                  THÁNG CAO NHẤT
                </p>
                <Award className="size-4 text-[#059669]" />
              </div>
              <p className="mt-2 text-2xl font-extrabold text-[#059669] dark:text-emerald-400">
                {formatInt(monthlyStats.maxVal)} phần
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500 dark:text-dark-6">
                Đạt đỉnh vào <strong>{MONTH_LABELS[monthlyStats.maxIdx]}</strong>
              </p>
            </div>

            {/* Tháng thấp nhất */}
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 dark:border-dark-3 dark:bg-dark-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-dark-6">
                  THÁNG THẤP NHẤT
                </p>
                <TrendingDown className="size-4 text-[#E11D48]" />
              </div>
              <p className="mt-2 text-2xl font-extrabold text-[#E11D48] dark:text-rose-400">
                {formatInt(monthlyStats.minVal)} phần
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500 dark:text-dark-6">
                Thấp điểm vào <strong>{MONTH_LABELS[monthlyStats.minIdx]}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Khối So Sánh Chuỗi Bán Hàng Giữa Các Năm (2023 - 2026) + Bảng Thống Kê Đa Năm */}
      <div className="rounded-2xl border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <LineChart className="size-5 text-[#4F46E5]" />
            <div>
              <h2 className="text-base font-bold text-dark dark:text-white sm:text-lg">
                So Sánh Chuỗi Tiêu Hao Giữa Các Năm (2023 – 2026)
              </h2>
              <p className="mt-0.5 text-xs text-dark-5 dark:text-dark-6">
                Đối chiếu biến động lượng tiêu hao từng tháng từ năm 2023 đến năm 2026
              </p>
            </div>
          </div>

          {/* Checkboxes chọn năm hiển thị */}
          <div className="flex flex-wrap items-center gap-4">
            {availableYears.map((yr) => {
              const checked = visibleYears.includes(yr);
              return (
                <label
                  key={yr}
                  className="inline-flex cursor-pointer select-none items-center gap-1.5 text-xs font-bold text-dark dark:text-white"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleYear(yr)}
                    className="size-4 cursor-pointer rounded border-gray-300 accent-[#4F46E5]"
                  />
                  <span>Năm {yr}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Biểu đồ đường đa năm */}
        <div className="mt-3 h-[340px] w-full">
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
        <div className="mt-6 border-t border-stroke pt-5 dark:border-dark-3">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-bold text-dark dark:text-white sm:text-sm">
            <Table2 className="size-4 text-[#4F46E5]" />
            <span>Bảng Thống Kê Số Liệu Tiêu Hao Từng Tháng Qua Các Năm:</span>
          </h3>

          <div className="overflow-x-auto rounded-xl border border-stroke dark:border-dark-3">
            <table className="w-full min-w-[880px] border-collapse text-center text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-stroke bg-slate-50 text-[11px] font-bold uppercase text-slate-500 dark:border-dark-3 dark:bg-dark-2 dark:text-dark-6">
                  <th className="py-3 pl-4 pr-3 text-left">NĂM KHẢO SÁT</th>
                  {MONTH_LABELS.map((m) => (
                    <th key={m} className="px-2 py-3">
                      {m}
                    </th>
                  ))}
                  <th className="bg-indigo-50/60 px-3 py-3 text-[#4F46E5] dark:bg-indigo-950/30 dark:text-indigo-400">
                    TỔNG CỘNG
                  </th>
                  <th className="px-3 py-3 text-dark dark:text-white">
                    TB/THÁNG
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke dark:divide-dark-3">
                {availableYears.map((yr) => {
                  const arr =
                    selectedDish?.monthlyByYear?.[yr] || Array(12).fill(0);
                  const totalYr = arr.reduce((s, v) => s + (v || 0), 0);
                  const avgYr = totalYr / 12;
                  const palette = YEAR_PALETTE[yr] || {
                    color: "#4F46E5",
                    badgeBg: "bg-[#4F46E5]",
                  };

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
                      {arr.map((qty, idx) => (
                        <td
                          key={idx}
                          className="px-2 py-3 font-medium text-slate-700 dark:text-slate-200"
                        >
                          {formatInt(qty)}
                        </td>
                      ))}
                      <td className="bg-indigo-50/40 px-3 py-3 font-extrabold text-[#4F46E5] dark:bg-indigo-950/20 dark:text-indigo-400">
                        {formatInt(totalYr)} phần
                      </td>
                      <td className="px-3 py-3 font-extrabold text-dark dark:text-white">
                        {formatDecimal(avgYr)} phần
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
