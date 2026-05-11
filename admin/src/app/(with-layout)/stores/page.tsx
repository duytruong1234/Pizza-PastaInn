// Trang quản lý chi nhánh
"use client";

import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface Store {
  store_id: number;
  store_name: string;
  address: string;
  hotline: string;
  is_active: boolean;
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/admin/stores")
      .then((res) => setStores(res.data.data))
      .catch(() => setStores([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark dark:text-white">QUẢN LÝ CHI NHÁNH</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-stroke bg-white p-6 dark:border-dark-3 dark:bg-gray-dark">
              <div className="h-6 w-3/4 rounded bg-gray-200 dark:bg-dark-2" />
              <div className="mt-3 h-4 w-full rounded bg-gray-200 dark:bg-dark-2" />
              <div className="mt-2 h-4 w-1/2 rounded bg-gray-200 dark:bg-dark-2" />
            </div>
          ))
        ) : stores.length === 0 ? (
          <div className="col-span-full text-center text-gray-400 py-12">Chưa có chi nhánh</div>
        ) : (
          stores.map((store) => (
            <div key={store.store_id} className="rounded-2xl border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-bold text-dark dark:text-white">
                  {store.store_name || `Chi nhánh #${store.store_id}`}
                </h3>
                <Badge variant={store.is_active ? "success" : "danger"}>
                  {store.is_active ? "Hoạt động" : "Đóng cửa"}
                </Badge>
              </div>
              {store.address && (
                <p className="mt-2 text-sm text-gray-500">{store.address}</p>
              )}
              {store.hotline && (
                <p className="mt-1 text-sm text-gray-500">{store.hotline}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
