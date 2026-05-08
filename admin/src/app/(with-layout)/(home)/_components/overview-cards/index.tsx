// Overview Cards — client component, fetch dữ liệu thật từ API
"use client";

import { api } from "@/lib/api";
import { compactFormat } from "@/lib/format-number";
import { useEffect, useState } from "react";
import { OverviewCard } from "./card";
import * as icons from "./icons";

interface StatsData {
  totalOrders: number;
  totalRevenue: number;
  totalDishes: number;
  totalCustomers: number;
}

export function OverviewCardsGroup() {
  const [stats, setStats] = useState<StatsData | null>(null);

  useEffect(() => {
    api
      .get("/api/admin/stats")
      .then((res) => setStats(res.data.data))
      .catch(() => setStats({ totalOrders: 0, totalRevenue: 0, totalDishes: 0, totalCustomers: 0 }));
  }, []);

  if (!stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse rounded-2xl border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
            <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-dark-2" />
            <div className="mt-6 h-6 w-20 rounded bg-gray-200 dark:bg-dark-2" />
            <div className="mt-2 h-4 w-32 rounded bg-gray-200 dark:bg-dark-2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 2xl:gap-7.5">
      <OverviewCard
        label="Tổng đơn hàng"
        data={{ value: compactFormat(stats.totalOrders), growthRate: 0 }}
        Icon={icons.Views}
      />

      <OverviewCard
        label="Doanh thu"
        data={{ value: compactFormat(stats.totalRevenue) + "đ", growthRate: 0 }}
        Icon={icons.Profit}
      />

      <OverviewCard
        label="Tổng món ăn"
        data={{ value: compactFormat(stats.totalDishes), growthRate: 0 }}
        Icon={icons.Product}
      />

      <OverviewCard
        label="Khách hàng"
        data={{ value: compactFormat(stats.totalCustomers), growthRate: 0 }}
        Icon={icons.Users}
      />
    </div>
  );
}
