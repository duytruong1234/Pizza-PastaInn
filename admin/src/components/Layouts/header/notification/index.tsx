"use client";

import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import { BellIcon } from "./icons";
import { api, API_URL } from "@/lib/api";

interface OrderItem {
  is_half_half?: boolean;
  dish_price?: {
    dish?: {
      dish_name?: string;
      image?: string;
    };
  } | null;
  combo?: {
    combo_name?: string;
    image_combo?: string;
  } | null;
}

interface OrderNotification {
  order_id: number;
  order_status: string;
  customer_name: string | null;
  customer_phone: string | null;
  total_order: number | null;
  created_at: string | null;
  user?: {
    username?: string;
    phone?: string;
  } | null;
  items?: OrderItem[];
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ xác nhận", color: "bg-amber-500" },
  confirmed: { label: "Đã xác nhận", color: "bg-blue-500" },
  preparing: { label: "Đang chuẩn bị", color: "bg-indigo-500" },
  shipped: { label: "Đang giao", color: "bg-purple-500" },
  arrived: { label: "Đã đến nơi", color: "bg-teal-500" },
  completed: { label: "Hoàn thành", color: "bg-green-500" },
  cancelled: { label: "Đã hủy", color: "bg-red-500" },
};

function formatCurrency(value: number | null): string {
  if (!value) return "0đ";
  return value.toLocaleString("vi-VN") + "đ";
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHr < 24) return `${diffHr} giờ trước`;
  if (diffDay < 7) return `${diffDay} ngày trước`;
  return date.toLocaleDateString("vi-VN");
}

const HALF_HALF_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?q=80&w=300&auto=format&fit=crop';

function getFirstItemImage(order: OrderNotification): string | null {
  if (!order.items || order.items.length === 0) return null;

  for (const item of order.items) {
    if (item.combo?.image_combo) return item.combo.image_combo;
    if (item.dish_price?.dish?.image) return item.dish_price.dish.image;
    if (item.is_half_half) return HALF_HALF_FALLBACK_IMAGE;
  }

  return null;
}

function resolveImageUrl(url: string | null): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_URL}${url}`;
}

export function Notification() {
  const [isOpen, setIsOpen] = useState(false);
  const [orders, setOrders] = useState<OrderNotification[]>([]);
  const [newCount, setNewCount] = useState(0);
  const [isDotVisible, setIsDotVisible] = useState(false);
  const isMobile = useIsMobile();
  const prevOrderIdsRef = useRef<Set<number>>(new Set());

  const fetchRecentOrders = useCallback(async () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("admin_token");
      if (!token) return;
      if (document.hidden && !isOpen) return;
    }

    try {
      const res = await api.get("/api/admin/orders", {
        params: { limit: 10, page: 1 },
      });
      if (res.data?.success && res.data?.data?.orders) {
        const fetchedOrders: OrderNotification[] = res.data.data.orders;
        setOrders(fetchedOrders);

        // Count pending orders as "new"
        const pendingCount = fetchedOrders.filter(
          (o) => o.order_status === "pending"
        ).length;

        // Check for truly new orders (not seen before)
        const currentIds = new Set(fetchedOrders.map((o) => o.order_id));
        const prevIds = prevOrderIdsRef.current;

        if (prevIds.size > 0) {
          const hasNewOrder = fetchedOrders.some(
            (o) => !prevIds.has(o.order_id)
          );
          if (hasNewOrder) {
            setIsDotVisible(true);
          }
        }

        prevOrderIdsRef.current = currentIds;
        setNewCount(pendingCount);

        if (pendingCount > 0) {
          setIsDotVisible(true);
        }
      }
    } catch {
      // Silently ignore transient network/polling errors so Next.js Dev Overlay is not triggered
    }
  }, [isOpen]);

  // Fetch on mount + poll every 10 seconds for near real-time
  useEffect(() => {
    fetchRecentOrders();
    const interval = setInterval(fetchRecentOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchRecentOrders]);

  // Refetch when dropdown opens, hide dot
  useEffect(() => {
    if (isOpen) {
      fetchRecentOrders();
      setIsDotVisible(false);
    }
  }, [isOpen, fetchRecentOrders]);

  const getCustomerName = (order: OrderNotification): string => {
    if (order.user?.username) return order.user.username;
    if (order.customer_name) return order.customer_name;
    return "Khách vãng lai";
  };

  const getCustomerPhone = (order: OrderNotification): string => {
    if (order.customer_phone) return order.customer_phone;
    if (order.user?.phone) return order.user.phone;
    return "";
  };

  return (
    <Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
      <DropdownTrigger
        className="grid size-12 cursor-pointer place-items-center rounded-full border bg-gray-2 text-dark outline-none hover:text-primary focus-visible:border-primary focus-visible:text-primary dark:border-dark-4 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3 dark:focus-visible:border-primary"
        aria-label="Xem thông báo"
      >
        <span className="relative">
          <BellIcon />

          {isDotVisible && (
            <span
              className={cn(
                "absolute top-0 right-0 z-1 size-2 rounded-full bg-red-light ring-2 ring-gray-2 dark:ring-dark-3",
              )}
            >
              <span className="absolute inset-0 -z-1 animate-ping rounded-full bg-red-light opacity-75" />
            </span>
          )}
        </span>
      </DropdownTrigger>

      <DropdownContent
        align={isMobile ? "end" : "center"}
        className="border border-stroke bg-white px-3.5 py-3 shadow-md min-[350px]:min-w-[22rem] dark:border-dark-3 dark:bg-gray-dark"
      >
        <div className="mb-1 flex items-center justify-between px-2 py-1.5">
          <span className="text-lg font-medium text-dark dark:text-white">
            Thông báo
          </span>
          {newCount > 0 && (
            <span className="rounded-md bg-primary px-2.25 py-0.5 text-xs font-medium text-white">
              {newCount} mới
            </span>
          )}
        </div>

        <ul className="mb-3 max-h-92 space-y-1 overflow-y-auto">
          {orders.length === 0 && (
            <li className="px-2 py-6 text-center">
              <span className="text-sm text-dark-5 dark:text-dark-6">
                Chưa có đơn hàng nào
              </span>
            </li>
          )}
          {orders.map((order) => {
            const status = STATUS_MAP[order.order_status] || {
              label: order.order_status,
              color: "bg-gray-400",
            };
            const isPending = order.order_status === "pending";
            const itemImage = getFirstItemImage(order);

            return (
              <li key={order.order_id} role="menuitem">
                <Link
                  href="/orders"
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3.5 rounded-lg px-2.5 py-2.5 outline-none transition-colors",
                    "hover:bg-gray-2 focus-visible:bg-gray-2 dark:hover:bg-dark-3 dark:focus-visible:bg-dark-3",
                    isPending && "bg-amber-50/60 dark:bg-amber-900/10"
                  )}
                >
                  {/* Order item image */}
                  {itemImage ? (
                    <img
                      src={resolveImageUrl(itemImage)}
                      className="size-12 shrink-0 rounded-full object-cover ring-2 ring-gray-100 dark:ring-dark-3"
                      alt="Order item"
                    />
                  ) : (
                    <div
                      className={cn(
                        "flex size-12 shrink-0 items-center justify-center rounded-full",
                        isPending
                          ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-gray-100 text-gray-500 dark:bg-dark-3 dark:text-dark-6"
                      )}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 01-8 0" />
                      </svg>
                    </div>
                  )}

                  {/* Order info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <strong className="block truncate text-sm font-semibold text-dark dark:text-white">
                        #{order.order_id} - {getCustomerName(order)}
                      </strong>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none text-white",
                          status.color
                        )}
                      >
                        {status.label}
                      </span>
                      <span className="text-xs font-medium text-dark-5 dark:text-dark-6">
                        {formatCurrency(order.total_order)}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      {getCustomerPhone(order) && (
                        <span className="text-[11px] text-dark-5 dark:text-dark-6">
                          {getCustomerPhone(order)}
                        </span>
                      )}
                      <span className="text-[11px] text-dark-5/60 dark:text-dark-6/60">
                        {timeAgo(order.created_at)}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        <Link
          href="/orders"
          onClick={() => setIsOpen(false)}
          className="block rounded-lg border border-primary p-2 text-center text-sm font-medium tracking-wide text-primary transition-colors outline-none hover:bg-blue-light-5 focus:bg-blue-light-5 focus:text-primary focus-visible:border-primary dark:border-dark-3 dark:text-dark-6 dark:hover:border-dark-5 dark:hover:bg-dark-3 dark:hover:text-dark-7 dark:focus-visible:border-dark-5 dark:focus-visible:bg-dark-3 dark:focus-visible:text-dark-7"
        >
          Xem tất cả đơn hàng
        </Link>
      </DropdownContent>
    </Dropdown>
  );
}
