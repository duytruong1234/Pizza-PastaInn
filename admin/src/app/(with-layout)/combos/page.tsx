// Trang quản lý combo
"use client";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface Combo {
  combo_id: number; combo_name: string; combo_price: number;
  description: string | null; is_active: boolean;
  categories?: { category_name: string };
  groups: Array<{
    group_id: string; group_name: string;
    combo_items: Array<{ dish_price?: { dish?: { dish_name: string } } }>;
  }>;
}

export default function CombosPage() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/admin/combos").then(r => setCombos(r.data.data)).catch(() => setCombos([])).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-dark dark:text-white">Quản lý Combo</h1>
      <div className="grid gap-4 lg:grid-cols-2">
        {loading ? (
          [1, 2].map(i => (
            <div key={i} className="animate-pulse rounded-2xl border border-stroke bg-white p-6 dark:border-dark-3 dark:bg-gray-dark">
              <div className="h-6 w-3/4 rounded bg-gray-200 dark:bg-dark-2" />
              <div className="mt-3 h-4 w-1/2 rounded bg-gray-200 dark:bg-dark-2" />
            </div>
          ))
        ) : combos.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400">Chưa có combo</div>
        ) : combos.map(combo => (
          <div key={combo.combo_id} className="rounded-2xl border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-dark dark:text-white">{combo.combo_name}</h3>
                <p className="text-sm text-gray-400">{combo.categories?.category_name}</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-primary">{combo.combo_price.toLocaleString()}đ</span>
                <div>
                  <Badge variant={combo.is_active ? "success" : "danger"}>
                    {combo.is_active ? 'Đang bán' : 'Ngưng'}
                  </Badge>
                </div>
              </div>
            </div>
            {combo.description && <p className="mt-2 text-sm text-gray-500">{combo.description}</p>}
            {combo.groups.length > 0 && (
              <div className="mt-4 space-y-2">
                {combo.groups.map(g => (
                  <div key={g.group_id} className="rounded-lg bg-gray-50 p-3 dark:bg-dark-2">
                    <p className="text-xs font-medium text-gray-500">{g.group_name}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {g.combo_items.map((item, i) => (
                        <span key={i} className="rounded bg-white px-2 py-0.5 text-xs text-dark shadow-sm dark:bg-dark-3 dark:text-white">
                          {item.dish_price?.dish?.dish_name || 'N/A'}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
