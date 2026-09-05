"use client";

import { api } from "@/lib/api";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";

type AnalyticsRange = "today" | "yesterday" | "7d" | "30d" | "3m" | "6m" | "12m";

type DashboardAnalyticsData = {
  range: AnalyticsRange;
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
    type: "dish" | "combo";
  }>;
};

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full animate-pulse rounded-xl bg-gray-2 dark:bg-dark-2" />
  ),
});

const RANGE_OPTIONS: Array<{ value: AnalyticsRange; label: string }> = [
  { value: "today", label: "Hôm nay" },
  { value: "yesterday", label: "Hôm qua" },
  { value: "7d", label: "7 ngày" },
  { value: "30d", label: "30 ngày" },
  { value: "3m", label: "3 tháng" },
  { value: "6m", label: "6 tháng" },
  { value: "12m", label: "12 tháng" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  confirmed: "#0ABEF9",
  preparing: "#8B5CF6",
  shipped: "#6366F1",
  delivering: "#3B82F6",
  arrived: "#10B981",
  completed: "#22C55E",
  cancelled: "#EF4444",
  unknown: "#9CA3AF",
};

const cardClassName =
  "min-w-0 overflow-hidden rounded-2xl border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-6 xl:p-7.5";

const formatCurrency = (value: number) =>
  `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value)} ₫`;

const formatCompactCurrency = (value: number) => {
  const absoluteValue = Math.abs(value);
  if (absoluteValue >= 1_000_000_000) {
    return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(value / 1_000_000_000)} tỷ`;
  }
  if (absoluteValue >= 1_000_000) {
    return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(value / 1_000_000)} tr`;
  }
  if (absoluteValue >= 1_000) {
    return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value / 1_000)}k`;
  }
  return new Intl.NumberFormat("vi-VN").format(value);
};

const getIntegerAxis = (maximumValue: number) => {
  const roundedMaximum = Math.max(1, Math.ceil(maximumValue));
  const maximum =
    roundedMaximum <= 5 ? roundedMaximum : Math.ceil(roundedMaximum / 5) * 5;
  return { max: maximum, tickAmount: Math.min(5, maximum) };
};

const formatPeriod = (period: DashboardAnalyticsData["period"]) => {
  const formatter = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  });
  return `${formatter.format(new Date(period.start))} – ${formatter.format(new Date(period.end))}`;
};

export function DashboardAnalytics() {
  const [startDate, setStartDate] = useState(() => dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(() => dayjs().format('YYYY-MM-DD'));
  const [data, setData] = useState<DashboardAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setIsLoading(true);
    setError(null);

    api
      .get<{ data: DashboardAnalyticsData }>("/api/admin/dashboard-analytics", {
        params: { start: startDate, end: endDate },
        signal: controller.signal,
      })
      .then((response) => {
        if (!controller.signal.aborted) {
          setData(response.data.data);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError("Không thể tải dữ liệu phân tích. Vui lòng thử lại.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [startDate, endDate, retryKey]);

  const handleExportRevenue = (d: DashboardAnalyticsData) => {
    const rangeLabel = `${dayjs(startDate).format('DD/MM/YYYY')} đến ${dayjs(endDate).format('DD/MM/YYYY')}`;
    const trendRows = d.trend.map((t) =>
      `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee">${t.label}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${formatCurrency(t.revenue)}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center">${t.orders}</td></tr>`
    ).join('');
    const topDishRows = d.topDishes.slice(0, 5).map((dish, i) =>
      `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee">${i + 1}. ${dish.name}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center">${dish.quantity}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${formatCurrency(dish.revenue)}</td></tr>`
    ).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>\u00A0</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Segoe UI',Tahoma,sans-serif;padding:24px;color:#111;max-width:800px;margin:0 auto}
      h1{font-size:22px;font-weight:800;text-align:center;margin-bottom:4px}
      .subtitle{text-align:center;color:#555;font-size:13px;margin-bottom:20px}
      .summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px}
      .summary-card{background:#f9fafb;border-radius:8px;padding:14px;text-align:center}
      .summary-card .label{font-size:11px;color:#555;text-transform:uppercase;font-weight:600}
      .summary-card .value{font-size:18px;font-weight:800;color:#111;margin-top:4px}
      h2{font-size:15px;font-weight:700;margin:20px 0 8px;color:#111}
      table{width:100%;border-collapse:collapse;font-size:13px;color:#111}
      th{background:#f3f4f6;padding:8px;text-align:left;font-weight:700;border-bottom:2px solid #ddd}
      .print-btn{display:block;width:100%;margin-top:20px;padding:10px;background:#5750F1;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer}
      @media print{.print-btn{display:none!important}}
    </style></head><body>
    <h1>BÁO CÁO DOANH THU</h1>
    <p class="subtitle">Pizza & Pasta Inn | ${rangeLabel}</p>
    <div class="summary">
      <div class="summary-card"><div class="label">Tổng doanh thu</div><div class="value">${formatCurrency(d.summary.revenue)}</div></div>
      <div class="summary-card"><div class="label">Số đơn hàng</div><div class="value">${d.summary.orders}</div></div>
      <div class="summary-card"><div class="label">Trung bình/đơn</div><div class="value">${formatCurrency(d.summary.averageOrderValue)}</div></div>
      <div class="summary-card"><div class="label">Đã thanh toán</div><div class="value">${formatCurrency(d.summary.paidRevenue)}</div></div>
      <div class="summary-card"><div class="label">Chờ thanh toán</div><div class="value">${formatCurrency(d.summary.unpaidRevenue)}</div></div>
    </div>
    <h2>Doanh thu theo thời gian</h2>
    <table><thead><tr><th>Thời gian</th><th style="text-align:right">Doanh thu</th><th style="text-align:center">Đơn hàng</th></tr></thead><tbody>${trendRows}</tbody></table>
    <h2>Top 5 món bán chạy</h2>
    <table><thead><tr><th>Tên món</th><th style="text-align:center">Số lượng</th><th style="text-align:right">Doanh thu</th></tr></thead><tbody>${topDishRows}</tbody></table>
    <button class="print-btn" onclick="window.print()">In báo cáo</button>
    </body></html>`;

    const w = window.open('', '_blank', 'width=850,height=700');
    if (w) { w.document.write(html); w.document.close(); }
  };

  return (
    <section
      className="mt-5 md:mt-6 2xl:mt-7.5"
      aria-labelledby="dashboard-analytics-title"
    >
      <div className="mb-4 flex flex-col gap-4 md:mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2
              id="dashboard-analytics-title"
              className="text-2xl font-bold text-dark dark:text-white"
            >
              Phân tích kinh doanh
            </h2>
            <p className="mt-1 text-sm text-dark-5 dark:text-dark-6">
              Theo dõi doanh thu, đơn hàng và món bán chạy từ dữ liệu thực tế.
            </p>
          </div>

          {data && (
            <button
              type="button"
              onClick={() => handleExportRevenue(data)}
              className="shrink-0 rounded-lg bg-green-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-green-600 flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Xuất doanh thu
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-dark-5 dark:text-dark-6 whitespace-nowrap">Từ ngày</label>
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-stroke bg-white px-3 py-2 text-sm font-medium outline-none dark:border-dark-3 dark:bg-gray-dark dark:text-white focus:border-primary transition"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-dark-5 dark:text-dark-6 whitespace-nowrap">Đến ngày</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={dayjs().format('YYYY-MM-DD')}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-stroke bg-white px-3 py-2 text-sm font-medium outline-none dark:border-dark-3 dark:bg-gray-dark dark:text-white focus:border-primary transition"
            />
          </div>
        </div>
      </div>

      {!data && isLoading ? <DashboardAnalyticsSkeleton /> : null}

      {!data && error && !isLoading ? (
        <div
          className={`${cardClassName} grid min-h-64 place-items-center text-center`}
          role="alert"
        >
          <div className="max-w-md">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-red-light-6 text-xl font-bold text-red dark:bg-red/10">
              !
            </div>
            <h3 className="mt-4 text-lg font-bold text-dark dark:text-white">
              Chưa tải được biểu đồ
            </h3>
            <p className="mt-1 text-sm text-dark-5 dark:text-dark-6">{error}</p>
            <button
              type="button"
              onClick={() => setRetryKey((value) => value + 1)}
              className="mt-5 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
            >
              Tải lại dữ liệu
            </button>
          </div>
        </div>
      ) : null}

      {data ? (
        <div className="grid grid-cols-12 gap-4 md:gap-6 2xl:gap-7.5">
          <RevenueTrendCard data={data} range={data.range} />
          <OrderStatusCard data={data} />
          <PaymentTrendCard data={data} range={data.range} />
          <TopDishesCard data={data} />
        </div>
      ) : null}
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────
   1. DOANH THU & ĐƠN HÀNG — Gradient Area + Smooth Line
   ────────────────────────────────────────────────────────────── */
function RevenueTrendCard({
  data,
  range,
}: {
  data: DashboardAnalyticsData;
  range: AnalyticsRange;
}) {
  const orderAxis = getIntegerAxis(
    Math.max(0, ...data.trend.map((item) => item.orders)),
  );
  const options = useMemo<ApexOptions>(
    () => ({
      chart: {
        type: "line",
        fontFamily: "inherit",
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 800,
          animateGradually: { enabled: true, delay: 150 },
          dynamicAnimation: { enabled: true, speed: 350 },
        },
        dropShadow: {
          enabled: true,
          top: 4,
          left: 0,
          blur: 8,
          opacity: 0.15,
          color: "#6366F1",
        },
      },
      colors: ["#6366F1", "#F97316"],
      dataLabels: { enabled: false },
      stroke: {
        curve: "smooth",
        width: [3, 3],
        lineCap: "round",
      },
      markers: {
        size: [4, 4],
        strokeWidth: 2,
        strokeColors: "#fff",
        hover: { sizeOffset: 3 },
      },
      fill: {
        type: ["gradient", "solid"],
        gradient: {
          shade: "light",
          type: "vertical",
          opacityFrom: 0.45,
          opacityTo: 0.02,
          stops: [0, 90, 100],
          colorStops: [
            [
              { offset: 0, color: "#6366F1", opacity: 0.4 },
              { offset: 50, color: "#818CF8", opacity: 0.15 },
              { offset: 100, color: "#C7D2FE", opacity: 0.02 },
            ],
          ],
        },
      },
      grid: {
        borderColor: "#E5E7EB",
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
        padding: { top: 0, right: 5, bottom: 0, left: 5 },
      },
      labels: data.trend.map((item) => item.label),
      legend: {
        position: "top",
        horizontalAlign: "left",
        fontFamily: "inherit",
        fontWeight: 600,
        fontSize: "13px",
        markers: { size: 8, shape: "circle", offsetX: -2 },
        itemMargin: { horizontal: 12 },
      },
      xaxis: {
        axisBorder: { show: false },
        axisTicks: { show: false },
        tickAmount: range === "30d" ? 6 : undefined,
        labels: {
          rotate: 0,
          hideOverlappingLabels: true,
          style: { fontSize: "12px", colors: "#6B7280" },
        },
      },
      yaxis: [
        {
          labels: {
            formatter: (value) => formatCompactCurrency(value),
            style: { fontSize: "12px", colors: "#6B7280" },
          },
          title: {
            text: "Doanh thu",
            style: { fontSize: "12px", fontWeight: 600, color: "#6B7280" },
          },
        },
        {
          opposite: true,
          min: 0,
          max: orderAxis.max,
          tickAmount: orderAxis.tickAmount,
          labels: {
            formatter: (value) => `${value}`,
            style: { fontSize: "12px", colors: "#6B7280" },
          },
          title: {
            text: "Số đơn",
            style: { fontSize: "12px", fontWeight: 600, color: "#6B7280" },
          },
        },
      ],
      tooltip: {
        shared: true,
        intersect: false,
        theme: "light",
        style: { fontSize: "13px" },
        y: {
          formatter: (value, context) =>
            context.seriesIndex === 0
              ? formatCurrency(value)
              : `${Math.round(value)} đơn`,
        },
      },
    }),
    [data.trend, orderAxis.max, orderAxis.tickAmount, range],
  );

  return (
    <article className={`${cardClassName} col-span-12 xl:col-span-8`}>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <h3 className="text-xl font-bold text-dark dark:text-white">
            Doanh thu &amp; đơn hàng
          </h3>
          <p className="mt-1 text-sm text-dark-5 dark:text-dark-6">
            {formatPeriod(data.period)}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
          <Metric
            label="Doanh thu"
            value={formatCurrency(data.summary.revenue)}
          />
          <Metric label="Số đơn" value={`${data.summary.orders} đơn`} />
          <Metric
            label="Trung bình/đơn"
            value={formatCurrency(data.summary.averageOrderValue)}
            className="col-span-2 sm:col-span-1"
          />
        </dl>
      </div>

      {data.summary.orders > 0 ? (
        <div className="-mx-3 mt-4 h-85 min-w-0" aria-hidden="true">
          <Chart
            options={options}
            series={[
              {
                name: "Doanh thu",
                type: "area",
                data: data.trend.map((item) => item.revenue),
              },
              {
                name: "Số đơn",
                type: "line",
                data: data.trend.map((item) => item.orders),
              },
            ]}
            type="line"
            height={340}
          />
        </div>
      ) : (
        <EmptyChart message="Chưa có đơn hàng trong khoảng thời gian này." />
      )}

      <table className="sr-only">
        <caption>Doanh thu và số đơn theo thời gian</caption>
        <thead>
          <tr>
            <th>Thời gian</th>
            <th>Doanh thu</th>
            <th>Số đơn</th>
          </tr>
        </thead>
        <tbody>
          {data.trend.map((item) => (
            <tr key={item.label}>
              <td>{item.label}</td>
              <td>{formatCurrency(item.revenue)}</td>
              <td>{item.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}

/* ──────────────────────────────────────────────────────────────
   2. TÌNH TRẠNG ĐƠN HÀNG — Radial Bar Chart
   ────────────────────────────────────────────────────────────── */
function OrderStatusCard({ data }: { data: DashboardAnalyticsData }) {
  const totalOrders = data.orderStatuses.reduce(
    (total, item) => total + item.count,
    0,
  );

  // Calculate percentages for radial bar
  const maxCount = Math.max(...data.orderStatuses.map((s) => s.count), 1);
  const series = data.orderStatuses.map((s) =>
    Math.round((s.count / maxCount) * 100),
  );

  const options = useMemo<ApexOptions>(
    () => ({
      chart: {
        type: "radialBar",
        fontFamily: "inherit",
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 1000,
        },
      },
      labels: data.orderStatuses.map((item) => item.label),
      colors: data.orderStatuses.map(
        (item) => STATUS_COLORS[item.status] || STATUS_COLORS.unknown,
      ),
      plotOptions: {
        radialBar: {
          hollow: {
            size: "30%",
          },
          track: {
            background: "#F3F4F6",
            strokeWidth: "100%",
            margin: 6,
          },
          dataLabels: {
            name: {
              show: true,
              fontSize: "13px",
              fontWeight: 600,
              offsetY: -5,
            },
            value: {
              show: true,
              fontSize: "16px",
              fontWeight: 700,
              offsetY: 4,
              formatter: ((_val: any, opts: any) => {
                const idx =
                  typeof opts?.seriesIndex === "number" ? opts.seriesIndex : -1;
                return idx >= 0
                  ? `${data.orderStatuses[idx]?.count ?? 0}`
                  : `${totalOrders}`;
              }) as any,
            },
            total: {
              show: true,
              label: "Tổng đơn",
              fontSize: "13px",
              fontWeight: 500,
              color: "#6B7280",
              formatter: () => `${totalOrders}`,
            },
          },
        },
      },
      stroke: {
        lineCap: "round",
      },
      legend: {
        show: true,
        position: "bottom",
        fontFamily: "inherit",
        fontSize: "12px",
        fontWeight: 500,
        itemMargin: { horizontal: 8, vertical: 4 },
        markers: { size: 8, shape: "circle", offsetX: -2 },
        formatter: (name, context) =>
          `${name}: ${data.orderStatuses[context.seriesIndex]?.count ?? 0}`,
      },
      tooltip: {
        enabled: true,
        y: {
          formatter: (_value, { seriesIndex }) =>
            `${data.orderStatuses[seriesIndex]?.count ?? 0} đơn`,
        },
      },
    }),
    [data.orderStatuses, totalOrders],
  );

  return (
    <article
      className={`${cardClassName} col-span-12 md:col-span-6 xl:col-span-4`}
    >
      <h3 className="text-xl font-bold text-dark dark:text-white">
        Tình trạng đơn hàng
      </h3>
      <p className="mt-1 text-sm text-dark-5 dark:text-dark-6">
        Phân bổ đơn theo tiến trình xử lý
      </p>

      {totalOrders > 0 ? (
        <div
          className="mt-4 grid min-h-85 place-items-center"
          aria-hidden="true"
        >
          <Chart
            options={options}
            series={series}
            type="radialBar"
            height={360}
            width="100%"
          />
        </div>
      ) : (
        <EmptyChart message="Chưa có trạng thái đơn hàng để thống kê." />
      )}

      <ul className="sr-only">
        {data.orderStatuses.map((item) => (
          <li key={item.status}>
            {item.label}: {item.count} đơn
          </li>
        ))}
      </ul>
    </article>
  );
}

/* ──────────────────────────────────────────────────────────────
   3. TRẠNG THÁI THANH TOÁN — Rounded Gradient Bar
   ────────────────────────────────────────────────────────────── */
function PaymentTrendCard({
  data,
  range,
}: {
  data: DashboardAnalyticsData;
  range: AnalyticsRange;
}) {
  const totalPaymentValue =
    data.summary.paidRevenue + data.summary.unpaidRevenue;
  const options = useMemo<ApexOptions>(
    () => ({
      chart: {
        type: "bar",
        stacked: true,
        fontFamily: "inherit",
        toolbar: { show: false },
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 800,
          animateGradually: { enabled: true, delay: 100 },
        },
      },
      colors: ["#10B981", "#F59E0B"],
      fill: {
        type: "gradient",
        gradient: {
          shade: "light",
          type: "vertical",
          opacityFrom: 1,
          opacityTo: 0.85,
          stops: [0, 100],
        },
      },
      dataLabels: { enabled: false },
      grid: {
        borderColor: "#E5E7EB",
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
        padding: { top: 0, right: 0, bottom: 0, left: 5 },
      },
      legend: {
        position: "top",
        horizontalAlign: "left",
        fontFamily: "inherit",
        fontWeight: 600,
        fontSize: "13px",
        markers: { size: 8, shape: "circle", offsetX: -2 },
        itemMargin: { horizontal: 12 },
      },
      plotOptions: {
        bar: {
          columnWidth: range === "30d" ? "50%" : "42%",
          borderRadius: 6,
          borderRadiusApplication: "end",
          borderRadiusWhenStacked: "last",
        },
      },
      labels: data.paymentTrend.map((item) => item.label),
      xaxis: {
        axisBorder: { show: false },
        axisTicks: { show: false },
        tickAmount: range === "30d" ? 6 : undefined,
        labels: {
          rotate: 0,
          hideOverlappingLabels: true,
          style: { fontSize: "12px", colors: "#6B7280" },
        },
      },
      yaxis: {
        labels: {
          formatter: (value) => formatCompactCurrency(value),
          style: { fontSize: "12px", colors: "#6B7280" },
        },
      },
      tooltip: {
        shared: true,
        intersect: false,
        theme: "light",
        style: { fontSize: "13px" },
        y: { formatter: (value) => formatCurrency(value) },
      },
    }),
    [data.paymentTrend, range],
  );

  return (
    <article className={`${cardClassName} col-span-12 xl:col-span-7`}>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h3 className="text-xl font-bold text-dark dark:text-white">
            Trạng thái thanh toán
          </h3>
          <p className="mt-1 text-sm text-dark-5 dark:text-dark-6">
            Giá trị đơn tạo mới theo trạng thái thanh toán hiện tại
          </p>
        </div>
        <dl className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Metric
            label="Đã thanh toán"
            value={formatCurrency(data.summary.paidRevenue)}
            accent="green"
          />
          <Metric
            label="Chờ thanh toán"
            value={formatCurrency(data.summary.unpaidRevenue)}
            accent="amber"
          />
        </dl>
      </div>

      {totalPaymentValue > 0 ? (
        <div className="-mx-3 mt-4 h-80 min-w-0" aria-hidden="true">
          <Chart
            options={options}
            series={[
              {
                name: "Đã thanh toán",
                data: data.paymentTrend.map((item) => item.paid),
              },
              {
                name: "Chưa thanh toán",
                data: data.paymentTrend.map((item) => item.unpaid),
              },
            ]}
            type="bar"
            height={320}
          />
        </div>
      ) : (
        <EmptyChart message="Chưa có dữ liệu thanh toán trong khoảng thời gian này." />
      )}

      <table className="sr-only">
        <caption>Giá trị đơn hàng theo trạng thái thanh toán</caption>
        <thead>
          <tr>
            <th>Thời gian</th>
            <th>Đã thanh toán</th>
            <th>Chờ thanh toán</th>
          </tr>
        </thead>
        <tbody>
          {data.paymentTrend.map((item) => (
            <tr key={item.label}>
              <td>{item.label}</td>
              <td>{formatCurrency(item.paid)}</td>
              <td>{formatCurrency(item.unpaid)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}

/* ──────────────────────────────────────────────────────────────
   4. MÓN BÁN CHẠY — Enhanced Horizontal Bar with Gradient
   ────────────────────────────────────────────────────────────── */
function TopDishesCard({ data }: { data: DashboardAnalyticsData }) {
  const dishes = data.topDishes.slice(0, 5);
  const quantityAxis = getIntegerAxis(
    Math.max(0, ...dishes.map((item) => item.quantity)),
  );

  // Gradient colors for each bar (indigo → purple palette)
  const barColors = ["#6366F1", "#8B5CF6", "#A78BFA", "#C084FC", "#D8B4FE"];

  const options = useMemo<ApexOptions>(
    () => ({
      chart: {
        type: "bar",
        fontFamily: "inherit",
        toolbar: { show: false },
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 900,
          animateGradually: { enabled: true, delay: 120 },
        },
      },
      colors: barColors,
      fill: {
        type: "gradient",
        gradient: {
          shade: "light",
          type: "horizontal",
          opacityFrom: 1,
          opacityTo: 0.8,
          stops: [0, 100],
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (value) => `${value}`,
        style: {
          fontSize: "13px",
          fontWeight: 700,
          colors: ["#FFFFFF"],
        },
        dropShadow: {
          enabled: true,
          top: 1,
          left: 1,
          blur: 2,
          opacity: 0.3,
        },
      },
      grid: {
        borderColor: "#E5E7EB",
        strokeDashArray: 4,
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: false } },
        padding: { top: -5, right: 10, bottom: 0, left: 10 },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: "55%",
          borderRadius: 8,
          borderRadiusApplication: "end",
          distributed: true,
        },
      },
      xaxis: {
        categories: dishes.map((item) => item.name),
        min: 0,
        max: quantityAxis.max,
        tickAmount: quantityAxis.tickAmount,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          formatter: (value) => `${value}`,
          style: { fontSize: "12px", colors: "#6B7280" },
        },
      },
      yaxis: {
        labels: {
          maxWidth: 150,
          style: {
            fontSize: "13px",
            fontWeight: 600,
            colors: "#374151",
          },
          formatter: (value) => {
            const label = String(value);
            return label.length > 18 ? `${label.slice(0, 16)}…` : label;
          },
        },
      },
      legend: { show: false },
      tooltip: {
        theme: "light",
        style: { fontSize: "13px" },
        y: { formatter: (value) => `${value} phần đã bán` },
      },
    }),
    [dishes, quantityAxis.max, quantityAxis.tickAmount],
  );

  return (
    <article className={`${cardClassName} col-span-12 xl:col-span-5`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-dark dark:text-white">
            Món bán chạy
          </h3>
          <p className="mt-1 text-sm text-dark-5 dark:text-dark-6">
            Top 5 theo số lượng đã bán
          </p>
        </div>
      </div>

      {dishes.length > 0 ? (
        <div className="mt-4 -ml-2 h-80 min-w-0" aria-hidden="true">
          <Chart
            options={options}
            series={[
              { name: "Đã bán", data: dishes.map((item) => item.quantity) },
            ]}
            type="bar"
            height={320}
          />
        </div>
      ) : (
        <EmptyChart message="Chưa có món bán chạy trong khoảng thời gian này." />
      )}

      <ol className="sr-only">
        {dishes.map((item) => (
          <li key={`${item.type}-${item.name}`}>
            {item.name}: {item.quantity} phần, {formatCurrency(item.revenue)}
          </li>
        ))}
      </ol>
    </article>
  );
}

/* ──────────────────────────────────────────────────────────────
   SHARED COMPONENTS
   ────────────────────────────────────────────────────────────── */
function Metric({
  label,
  value,
  className = "",
  accent,
}: {
  label: string;
  value: string;
  className?: string;
  accent?: "green" | "amber";
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium text-dark-5 dark:text-dark-6">
        {label}
      </dt>
      <dd
        className={`mt-0.5 text-sm font-bold whitespace-nowrap sm:text-base ${
          accent === "green"
            ? "text-green"
            : accent === "amber"
              ? "text-yellow-dark-2"
              : "text-dark dark:text-white"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="grid min-h-72 place-items-center text-center">
      <div>
        <div className="mx-auto grid size-11 place-items-center rounded-full bg-gray-2 text-lg font-bold text-dark-5 dark:bg-dark-2 dark:text-dark-6">
          —
        </div>
        <p className="mt-3 text-sm text-dark-5 dark:text-dark-6">{message}</p>
      </div>
    </div>
  );
}

function DashboardAnalyticsSkeleton() {
  return (
    <div
      className="grid animate-pulse grid-cols-12 gap-4 md:gap-6 2xl:gap-7.5"
      aria-label="Đang tải biểu đồ"
    >
      {[
        "xl:col-span-8",
        "md:col-span-6 xl:col-span-4",
        "xl:col-span-7",
        "xl:col-span-5",
      ].map((className, index) => (
        <div
          key={className}
          className={`${cardClassName} col-span-12 ${className}`}
        >
          <div className="h-6 w-44 rounded bg-gray-3 dark:bg-dark-2" />
          <div className="mt-2 h-4 w-60 max-w-full rounded bg-gray-2 dark:bg-dark-2" />
          <div
            className={`mt-8 h-72 rounded-xl bg-gray-2 dark:bg-dark-2 ${index === 1 ? "mx-auto max-w-72 rounded-full" : ""}`}
          />
        </div>
      ))}
    </div>
  );
}
