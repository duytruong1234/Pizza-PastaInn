"use client";

import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { toast } from "sonner";
import { api, getApiErrorMessage } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui-elements/button";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { Switch } from "@/components/FormElements/switch";
import InputGroup from "@/components/FormElements/InputGroup";

interface VoucherItem {
  voucher_id: number;
  code: string;
  title: string;
  description: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_order_value: number;
  max_discount: number | null;
  start_date: string;
  end_date: string;
  usage_limit: number;
  used_count: number;
  is_active: boolean;
}

interface LoyaltyConfig {
  is_enabled: boolean;
  spend_per_point: number;
  point_value_vnd: number;
  silver_threshold: number;
  gold_threshold: number;
  diamond_threshold: number;
}

interface LoyaltyOrderItem {
  order_id: number;
  total_order: number;
  points_earned: number;
  created_at: string;
}

interface LoyaltyRedemptionItem {
  order_id: number;
  user_id: number;
  points_used: number;
  discount_amount: number;
  created_at: string;
  username?: string;
  email?: string;
  phone?: string;
}

interface LoyaltyAdjustmentItem {
  adjustment_id: number;
  user_id: number;
  points_delta: number;
  reason: string;
  created_at: string;
  username?: string;
  email?: string;
  phone?: string;
}

interface LoyaltyMember {
  user_id: number;
  username: string;
  email: string;
  phone: string;
  role: string;
  created_at: string;
  completed_orders_count: number;
  total_spent: number;
  order_points: number;
  bonus_points: number;
  earned_points: number;
  redeemed_points: number;
  available_points: number;
  max_redeemable_vnd: number;
  tier_key: "bronze" | "silver" | "gold" | "diamond";
  tier_name: string;
  next_tier_name: string | null;
  points_to_next_tier: number;
  recent_orders: LoyaltyOrderItem[];
  redemptions: LoyaltyRedemptionItem[];
  adjustments: LoyaltyAdjustmentItem[];
}

interface LoyaltyOverview {
  config: LoyaltyConfig;
  stats: {
    total_members: number;
    members_with_points: number;
    total_earned_points: number;
    total_redeemed_points: number;
    total_available_points: number;
    total_discount_redeemed_vnd: number;
    tier_distribution: {
      diamond: number;
      gold: number;
      silver: number;
      bronze: number;
    };
  };
  members: LoyaltyMember[];
  recent_redemptions: LoyaltyRedemptionItem[];
  recent_adjustments: LoyaltyAdjustmentItem[];
}

const EMPTY_VOUCHER_FORM = {
  code: "",
  title: "",
  description: "",
  discount_type: "percent" as "percent" | "fixed",
  discount_value: 20,
  min_order_value: 150000,
  max_discount: 50000 as number | null,
  start_date: dayjs().format("YYYY-MM-DD"),
  end_date: dayjs().add(1, "year").format("YYYY-MM-DD"),
  usage_limit: 500,
  is_active: true,
};

function formatCurrency(val: number | null | undefined) {
  return `${Number(val || 0).toLocaleString("vi-VN")} đ`;
}

function getTierBadgeStyle(tierKey: string) {
  switch (tierKey) {
    case "diamond":
      return "bg-cyan-500/15 text-cyan-600 border-cyan-500/30 dark:text-cyan-400";
    case "gold":
      return "bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400";
    case "silver":
      return "bg-slate-500/15 text-slate-700 border-slate-400/30 dark:text-slate-300";
    default:
      return "bg-orange-500/15 text-orange-700 border-orange-500/30 dark:text-orange-400";
  }
}

export default function VouchersAndLoyaltyAdminPage() {
  const [activeTab, setActiveTab] = useState<"vouchers" | "loyalty">("vouchers");

  // ── Vouchers State ──────────────────────────────────────────────────────────
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [vouchersLoading, setVouchersLoading] = useState(true);
  const [voucherSearch, setVoucherSearch] = useState("");
  const [voucherStatusFilter, setVoucherStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [voucherTypeFilter, setVoucherTypeFilter] = useState<"all" | "percent" | "fixed">("all");
  const [voucherPage, setVoucherPage] = useState(1);
  const [voucherPerPage, setVoucherPerPage] = useState(10);

  // Add / Edit / Delete Voucher Modals
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<VoucherItem | null>(null);
  const [voucherForm, setVoucherForm] = useState(EMPTY_VOUCHER_FORM);
  const [voucherErrors, setVoucherErrors] = useState<Record<string, string>>({});
  const [voucherSaving, setVoucherSaving] = useState(false);
  const [deletingVoucher, setDeletingVoucher] = useState<VoucherItem | null>(null);

  // ── Loyalty State ───────────────────────────────────────────────────────────
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyOverview | null>(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState(true);
  const [memberSearch, setMemberSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<"all" | "diamond" | "gold" | "silver" | "bronze">("all");
  const [memberPage, setMemberPage] = useState(1);
  const [memberPerPage, setMemberPerPage] = useState(10);

  // Loyalty Modals: Config, Adjust Points, Member Detail
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configForm, setConfigForm] = useState<LoyaltyConfig>({
    is_enabled: true,
    spend_per_point: 10000,
    point_value_vnd: 1000,
    silver_threshold: 50,
    gold_threshold: 150,
    diamond_threshold: 300,
  });
  const [configSaving, setConfigSaving] = useState(false);

  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
    user_id: 0,
    mode: "add" as "add" | "deduct",
    points: 20,
    reason: "",
  });
  const [adjustSaving, setAdjustSaving] = useState(false);

  const [selectedMember, setSelectedMember] = useState<LoyaltyMember | null>(null);

  // ── Data Fetching ───────────────────────────────────────────────────────────
  const fetchVouchers = async () => {
    setVouchersLoading(true);
    try {
      const res = await api.get("/api/vouchers/admin");
      setVouchers(res.data?.data || []);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể tải danh sách mã giảm giá"));
    } finally {
      setVouchersLoading(false);
    }
  };

  const fetchLoyaltyOverview = async () => {
    setLoyaltyLoading(true);
    try {
      const res = await api.get("/api/vouchers/admin/loyalty");
      const data: LoyaltyOverview = res.data?.data;
      setLoyaltyData(data);
      if (data?.config) {
        setConfigForm(data.config);
      }
      if (selectedMember && data?.members) {
        const refreshed = data.members.find((m) => m.user_id === selectedMember.user_id);
        if (refreshed) setSelectedMember(refreshed);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể tải dữ liệu tích điểm thành viên"));
    } finally {
      setLoyaltyLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
    fetchLoyaltyOverview();
  }, []);

  // ── Vouchers Computed & Handlers ────────────────────────────────────────────
  const isVoucherExpired = (v: VoucherItem) => {
    if (!v.end_date) return false;
    const end = new Date(`${v.end_date}T23:59:59`);
    return !isNaN(end.getTime()) && end < new Date();
  };

  const isVoucherExhausted = (v: VoucherItem) => {
    return v.usage_limit > 0 && v.used_count >= v.usage_limit;
  };

  const voucherStats = useMemo(() => {
    const total = vouchers.length;
    const active = vouchers.filter((v) => v.is_active && !isVoucherExpired(v) && !isVoucherExhausted(v)).length;
    const totalUsed = vouchers.reduce((sum, v) => sum + (v.used_count || 0), 0);
    const inactiveOrExpired = total - active;
    return { total, active, totalUsed, inactiveOrExpired };
  }, [vouchers]);

  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      if (voucherSearch.trim()) {
        const q = voucherSearch.toLowerCase();
        const match =
          v.code.toLowerCase().includes(q) ||
          v.title.toLowerCase().includes(q) ||
          v.description.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (voucherTypeFilter !== "all" && v.discount_type !== voucherTypeFilter) {
        return false;
      }
      const effectivelyActive = v.is_active && !isVoucherExpired(v) && !isVoucherExhausted(v);
      if (voucherStatusFilter === "active" && !effectivelyActive) return false;
      if (voucherStatusFilter === "inactive" && effectivelyActive) return false;
      return true;
    });
  }, [vouchers, voucherSearch, voucherTypeFilter, voucherStatusFilter]);

  const voucherTotalPages = Math.max(1, Math.ceil(filteredVouchers.length / voucherPerPage));
  const paginatedVouchers = filteredVouchers.slice(
    (voucherPage - 1) * voucherPerPage,
    voucherPage * voucherPerPage
  );

  const openCreateVoucher = () => {
    setEditingVoucher(null);
    setVoucherForm(EMPTY_VOUCHER_FORM);
    setVoucherErrors({});
    setShowVoucherModal(true);
  };

  const openEditVoucher = (v: VoucherItem) => {
    setEditingVoucher(v);
    setVoucherForm({
      code: v.code,
      title: v.title,
      description: v.description,
      discount_type: v.discount_type,
      discount_value: v.discount_value,
      min_order_value: v.min_order_value,
      max_discount: v.max_discount,
      start_date: v.start_date,
      end_date: v.end_date,
      usage_limit: v.usage_limit,
      is_active: v.is_active,
    });
    setVoucherErrors({});
    setShowVoucherModal(true);
  };

  const handleSaveVoucher = async () => {
    const errors: Record<string, string> = {};
    const cleanCode = voucherForm.code.trim().toUpperCase();
    if (!cleanCode) errors.code = "Vui lòng nhập mã giảm giá (VD: WELCOME20)";
    if (!voucherForm.title.trim()) errors.title = "Vui lòng nhập tiêu đề ưu đãi";
    if (!voucherForm.discount_value || voucherForm.discount_value <= 0) {
      errors.discount_value = "Giá trị giảm phải lớn hơn 0";
    }
    if (voucherForm.discount_type === "percent" && voucherForm.discount_value > 100) {
      errors.discount_value = "Phần trăm giảm không được vượt quá 100%";
    }
    if (voucherForm.min_order_value < 0) {
      errors.min_order_value = "Đơn tối thiểu không hợp lệ";
    }
    if (!voucherForm.start_date || !voucherForm.end_date) {
      errors.end_date = "Vui lòng chọn ngày bắt đầu và kết thúc";
    } else if (voucherForm.end_date < voucherForm.start_date) {
      errors.end_date = "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu";
    }

    setVoucherErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setVoucherSaving(true);
    try {
      const payload = {
        ...voucherForm,
        code: cleanCode,
        title: voucherForm.title.trim(),
        description: voucherForm.description.trim(),
        max_discount:
          voucherForm.discount_type === "percent"
            ? voucherForm.max_discount && voucherForm.max_discount > 0
              ? Number(voucherForm.max_discount)
              : null
            : Number(voucherForm.discount_value),
      };

      if (editingVoucher) {
        await api.put(`/api/vouchers/admin/${editingVoucher.voucher_id}`, payload);
        toast.success(`Đã cập nhật mã giảm giá ${cleanCode}`);
      } else {
        await api.post("/api/vouchers/admin", payload);
        toast.success(`Đã tạo mã giảm giá ${cleanCode}`);
      }
      setShowVoucherModal(false);
      fetchVouchers();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Lỗi lưu mã giảm giá"));
    } finally {
      setVoucherSaving(false);
    }
  };

  const handleToggleVoucherActive = async (v: VoucherItem, nextActive: boolean) => {
    try {
      await api.put(`/api/vouchers/admin/${v.voucher_id}`, { is_active: nextActive });
      setVouchers((prev) =>
        prev.map((item) => (item.voucher_id === v.voucher_id ? { ...item, is_active: nextActive } : item))
      );
      toast.success(
        nextActive ? `Đã kích hoạt mã ${v.code}` : `Đã tạm ngưng mã ${v.code}`
      );
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể cập nhật trạng thái mã"));
    }
  };

  const handleDeleteVoucher = async () => {
    if (!deletingVoucher) return;
    try {
      await api.delete(`/api/vouchers/admin/${deletingVoucher.voucher_id}`);
      toast.success(`Đã xóa mã giảm giá ${deletingVoucher.code}`);
      setDeletingVoucher(null);
      fetchVouchers();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể xóa mã giảm giá"));
    }
  };

  // ── Loyalty Computed & Handlers ─────────────────────────────────────────────
  const filteredMembers = useMemo(() => {
    const list = loyaltyData?.members || [];
    return list.filter((m) => {
      if (tierFilter !== "all" && m.tier_key !== tierFilter) return false;
      if (memberSearch.trim()) {
        const q = memberSearch.toLowerCase();
        const match =
          (m.username || "").toLowerCase().includes(q) ||
          (m.email || "").toLowerCase().includes(q) ||
          (m.phone || "").toLowerCase().includes(q) ||
          String(m.user_id).includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [loyaltyData, tierFilter, memberSearch]);

  const memberTotalPages = Math.max(1, Math.ceil(filteredMembers.length / memberPerPage));
  const paginatedMembers = filteredMembers.slice(
    (memberPage - 1) * memberPerPage,
    memberPage * memberPerPage
  );

  const openAdjustPointsForMember = (member?: LoyaltyMember) => {
    const defaultUser = member || loyaltyData?.members?.[0];
    setAdjustForm({
      user_id: defaultUser?.user_id || 0,
      mode: "add",
      points: 20,
      reason: "",
    });
    setShowAdjustModal(true);
  };

  const handleSaveLoyaltyConfig = async () => {
    if (
      configForm.silver_threshold >= configForm.gold_threshold ||
      configForm.gold_threshold >= configForm.diamond_threshold
    ) {
      toast.error("Mốc điểm thăng hạng phải tăng dần: Bạc < Vàng < Kim Cương");
      return;
    }
    setConfigSaving(true);
    try {
      await api.put("/api/vouchers/admin/loyalty/config", configForm);
      toast.success("Đã cập nhật cấu hình tích điểm & hạng thành viên");
      setShowConfigModal(false);
      fetchLoyaltyOverview();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể lưu cấu hình tích điểm"));
    } finally {
      setConfigSaving(false);
    }
  };

  const handleAdjustPoints = async () => {
    if (!adjustForm.user_id) {
      toast.error("Vui lòng chọn khách hàng");
      return;
    }
    if (!adjustForm.points || adjustForm.points <= 0) {
      toast.error("Số điểm phải lớn hơn 0");
      return;
    }
    const delta = adjustForm.mode === "add" ? Math.abs(adjustForm.points) : -Math.abs(adjustForm.points);
    setAdjustSaving(true);
    try {
      await api.post("/api/vouchers/admin/loyalty/adjust", {
        user_id: adjustForm.user_id,
        points_delta: delta,
        reason:
          adjustForm.reason.trim() ||
          (delta > 0 ? "Cộng điểm thưởng từ Quản trị viên" : "Điều chỉnh trừ điểm từ Quản trị viên"),
      });
      toast.success(
        delta > 0
          ? `Đã cộng +${delta} điểm cho khách hàng`
          : `Đã trừ ${Math.abs(delta)} điểm của khách hàng`
      );
      setShowAdjustModal(false);
      fetchLoyaltyOverview();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Lỗi điều chỉnh điểm thành viên"));
    } finally {
      setAdjustSaving(false);
    }
  };

  const handleDeleteAdjustment = async (adjustmentId: number) => {
    try {
      await api.delete(`/api/vouchers/admin/loyalty/adjust/${adjustmentId}`);
      toast.success("Đã hoàn tác điều chỉnh điểm");
      fetchLoyaltyOverview();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể hoàn tác điều chỉnh điểm"));
    }
  };

  const targetAdjustMember = useMemo(() => {
    return loyaltyData?.members?.find((m) => m.user_id === Number(adjustForm.user_id)) || null;
  }, [loyaltyData, adjustForm.user_id]);

  return (
    <div className="space-y-6">
      {/* Header & Main Section Switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">
            QUẢN LÝ KHO ƯU ĐÃI &amp; TÍCH ĐIỂM THÀNH VIÊN
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Đồng bộ trực tiếp với mục &ldquo;Kho ưu đãi &amp; Điểm&rdquo; tại trang tài khoản và trang thanh toán của khách hàng
          </p>
        </div>

        {/* 2-Tab Pill Switcher */}
        <div className="inline-flex rounded-xl border border-stroke bg-white p-1 shadow-xs dark:border-dark-3 dark:bg-gray-dark">
          <button
            type="button"
            onClick={() => setActiveTab("vouchers")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition cursor-pointer ${
              activeTab === "vouchers"
                ? "bg-primary text-white shadow-sm"
                : "text-gray-600 hover:text-dark dark:text-gray-300 dark:hover:text-white"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
              <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
              <path d="M13 5v2" />
              <path d="M13 17v2" />
              <path d="M13 11v2" />
            </svg>
            <span>Mã giảm giá ({vouchers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("loyalty")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition cursor-pointer ${
              activeTab === "loyalty"
                ? "bg-primary text-white shadow-sm"
                : "text-gray-600 hover:text-dark dark:text-gray-300 dark:hover:text-white"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
              <circle cx="12" cy="8" r="6" />
              <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
            </svg>
            <span>Tích điểm &amp; Hạng thành viên ({loyaltyData?.stats?.total_members ?? 0})</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          TAB 1: QUẢN LÝ MÃ GIẢM GIÁ (VOUCHERS)
         ===================================================================== */}
      {activeTab === "vouchers" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-stroke bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Tổng mã ưu đãi</p>
              <p className="mt-2 text-2xl font-black text-dark dark:text-white">{voucherStats.total} mã</p>
              <p className="mt-1 text-xs text-gray-400">Hiển thị trong kho voucher hệ thống</p>
            </div>

            <div className="rounded-2xl border border-stroke bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Đang hoạt động</p>
              <p className="mt-2 text-2xl font-black text-emerald-600">{voucherStats.active} mã</p>
              <p className="mt-1 text-xs text-gray-400">Khách hàng có thể sao chép &amp; áp dụng ngay</p>
            </div>

            <div className="rounded-2xl border border-stroke bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Tổng lượt đã dùng</p>
              <p className="mt-2 text-2xl font-black text-primary">{voucherStats.totalUsed} lượt</p>
              <p className="mt-1 text-xs text-gray-400">Tính trên các đơn hàng áp mã thành công</p>
            </div>

            <div className="rounded-2xl border border-stroke bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Tạm ngưng / Hết hạn</p>
              <p className="mt-2 text-2xl font-black text-amber-600">{voucherStats.inactiveOrExpired} mã</p>
              <p className="mt-1 text-xs text-gray-400">Đã tắt hoặc hết lượt / quá ngày kết thúc</p>
            </div>
          </div>

          {/* Main Voucher Card */}
          <div className="rounded-2xl border border-stroke bg-white px-5 pb-6 pt-6 shadow-sm sm:px-7.5 dark:border-dark-3 dark:bg-gray-dark">
            {/* Toolbar */}
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 flex-wrap items-center gap-3">
                <div className="flex w-full max-w-xs items-center">
                  <input
                    type="text"
                    placeholder="Tìm mã code, tiêu đề, mô tả..."
                    value={voucherSearch}
                    onChange={(e) => {
                      setVoucherSearch(e.target.value);
                      setVoucherPage(1);
                    }}
                    className="w-full rounded-l-lg border border-r-0 border-stroke bg-transparent py-2.5 pl-4 pr-3 text-sm outline-none focus:border-primary dark:border-dark-3"
                  />
                  <button
                    type="button"
                    className="flex items-center justify-center rounded-r-lg bg-primary px-4 py-2.5 text-white"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                      <path
                        fillRule="evenodd"
                        d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>

                <select
                  value={voucherStatusFilter}
                  onChange={(e) => {
                    setVoucherStatusFilter(e.target.value as any);
                    setVoucherPage(1);
                  }}
                  className="rounded-lg border border-stroke bg-transparent px-3 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-gray-dark"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Tạm ngưng / Hết hạn</option>
                </select>

                <select
                  value={voucherTypeFilter}
                  onChange={(e) => {
                    setVoucherTypeFilter(e.target.value as any);
                    setVoucherPage(1);
                  }}
                  className="rounded-lg border border-stroke bg-transparent px-3 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-gray-dark"
                >
                  <option value="all">Tất cả loại giảm</option>
                  <option value="percent">Giảm theo phần trăm (%)</option>
                  <option value="fixed">Giảm số tiền cố định (đ)</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={openCreateVoucher}
                  variant="primary"
                  size="small"
                  shape="rounded"
                  label="Thêm mã giảm giá"
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                      <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                    </svg>
                  }
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-stroke dark:border-dark-3">
              <div className="max-w-full overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-primary text-white">
                    <tr>
                      <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide">Mã Code</th>
                      <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide">Chương trình ưu đãi</th>
                      <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide">Mức giảm</th>
                      <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide">Đơn tối thiểu</th>
                      <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide">Thời hạn</th>
                      <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wide">Lượt dùng</th>
                      <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wide">Kích hoạt</th>
                      <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wide">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vouchersLoading ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center">
                          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        </td>
                      </tr>
                    ) : paginatedVouchers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                          Không tìm thấy mã giảm giá nào phù hợp.
                        </td>
                      </tr>
                    ) : (
                      paginatedVouchers.map((v, idx) => {
                        const expired = isVoucherExpired(v);
                        const exhausted = isVoucherExhausted(v);
                        const usagePercent =
                          v.usage_limit > 0
                            ? Math.min(100, Math.round(((v.used_count || 0) / v.usage_limit) * 100))
                            : 0;
                        return (
                          <tr
                            key={v.voucher_id}
                            className="border-b border-stroke last:border-0 hover:bg-gray-50/60 dark:border-dark-3 dark:hover:bg-dark-2/40"
                          >
                            <td className="whitespace-nowrap px-4 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 font-mono text-xs font-extrabold tracking-wider text-white shadow-xs ${
                                  idx % 2 === 0 ? "bg-[#ee2828]" : "bg-[#007a3f]"
                                }`}
                              >
                                {v.code}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <div className="font-bold text-dark dark:text-white">{v.title}</div>
                              <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                {v.description}
                              </div>
                            </td>

                            <td className="whitespace-nowrap px-4 py-4">
                              {v.discount_type === "percent" ? (
                                <div>
                                  <span className="font-bold text-primary">Giảm {v.discount_value}%</span>
                                  {v.max_discount ? (
                                    <span className="block text-xs text-gray-500">
                                      Tối đa {formatCurrency(v.max_discount)}
                                    </span>
                                  ) : null}
                                </div>
                              ) : (
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  -{formatCurrency(v.discount_value)}
                                </span>
                              )}
                            </td>

                            <td className="whitespace-nowrap px-4 py-4 font-medium text-dark dark:text-white">
                              {formatCurrency(v.min_order_value)}
                            </td>

                            <td className="whitespace-nowrap px-4 py-4 text-xs">
                              <div className="text-dark dark:text-white">
                                {dayjs(v.start_date).format("DD/MM/YYYY")} &rarr;{" "}
                                {dayjs(v.end_date).format("DD/MM/YYYY")}
                              </div>
                              {expired ? (
                                <span className="mt-0.5 inline-block font-semibold text-red-500">
                                  Đã hết hạn
                                </span>
                              ) : exhausted ? (
                                <span className="mt-0.5 inline-block font-semibold text-amber-500">
                                  Hết lượt dùng
                                </span>
                              ) : (
                                <span className="mt-0.5 inline-block text-emerald-600 dark:text-emerald-400">
                                  Còn hiệu lực
                                </span>
                              )}
                            </td>

                            <td className="whitespace-nowrap px-4 py-4 text-center">
                              <div className="mx-auto w-28">
                                <div className="flex justify-between text-xs font-semibold text-dark dark:text-white">
                                  <span>{v.used_count}</span>
                                  <span className="text-gray-400">/ {v.usage_limit}</span>
                                </div>
                                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-dark-3">
                                  <div
                                    className="h-full rounded-full bg-primary transition-all"
                                    style={{ width: `${usagePercent}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4 text-center">
                              <div className="inline-flex justify-center">
                                <Switch
                                  checked={v.is_active}
                                  onChange={(checked) => handleToggleVoucherActive(v, checked)}
                                />
                              </div>
                            </td>

                            <td className="whitespace-nowrap px-4 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEditVoucher(v)}
                                  title="Chỉnh sửa mã giảm giá"
                                  className="rounded p-1.5 text-amber-600 transition hover:bg-amber-50 dark:hover:bg-amber-900/20 cursor-pointer"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4.5">
                                    <path d="M5.433 13.917l1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                                    <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingVoucher(v)}
                                  title="Xóa mã giảm giá"
                                  className="rounded p-1.5 text-red-600 transition hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4.5">
                                    <path
                                      fillRule="evenodd"
                                      d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4Z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {!vouchersLoading && (
              <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
                <Pagination
                  currentPage={voucherPage}
                  totalPages={voucherTotalPages}
                  onPageChange={setVoucherPage}
                />
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>Hiển thị:</span>
                  <select
                    value={voucherPerPage}
                    onChange={(e) => {
                      setVoucherPerPage(Number(e.target.value));
                      setVoucherPage(1);
                    }}
                    className="rounded-lg border border-stroke bg-transparent px-2.5 py-1.5 text-sm outline-none dark:border-dark-3"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                  <span>
                    Trang {voucherPage} / {voucherTotalPages}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: QUẢN LÝ TÍCH ĐIỂM & HẠNG THÀNH VIÊN (LOYALTY)
         ===================================================================== */}
      {activeTab === "loyalty" && (
        <div className="space-y-6">
          {/* Top Summary & Rule Banner */}
          <div className="rounded-2xl border border-stroke bg-gradient-to-r from-[#1f1911] via-[#151210] to-[#0e0c0a] p-6 text-white shadow-md">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#f5c043]">
                  <span>
                    {loyaltyData?.config?.is_enabled !== false
                      ? "Chương trình tích điểm đang bật"
                      : "Chương trình tích điểm đang tạm tắt"}
                  </span>
                </div>
                <h2 className="text-xl font-black sm:text-2xl">
                  Quy tắc hiện tại: {formatCurrency(loyaltyData?.config?.spend_per_point ?? 10000)} chi tiêu = 1 điểm &bull; 1 điểm = {formatCurrency(loyaltyData?.config?.point_value_vnd ?? 1000)}
                </h2>
                <p className="text-xs text-gray-300">
                  Mốc hạng thành viên: Hạng Bạc từ{" "}
                  <strong className="text-[#f5c043]">{loyaltyData?.config?.silver_threshold ?? 50} điểm</strong>{" "}
                  &bull; Hạng Vàng từ{" "}
                  <strong className="text-[#f5c043]">{loyaltyData?.config?.gold_threshold ?? 150} điểm</strong>{" "}
                  &bull; Hạng Kim Cương từ{" "}
                  <strong className="text-[#f5c043]">{loyaltyData?.config?.diamond_threshold ?? 300} điểm</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-white/20 cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                    <path
                      fillRule="evenodd"
                      d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.992 6.992 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Cấu hình quy tắc tích điểm</span>
                </button>

                <button
                  type="button"
                  onClick={() => openAdjustPointsForMember()}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#f5c043] px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-zinc-950 shadow transition hover:bg-[#e5b33c] cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                    <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                  </svg>
                  <span>Cộng / Trừ điểm thành viên</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4 Loyalty KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-stroke bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Tổng thành viên</p>
              <p className="mt-2 text-2xl font-black text-dark dark:text-white">
                {loyaltyData?.stats?.total_members ?? 0} tài khoản
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Có {loyaltyData?.stats?.members_with_points ?? 0} thành viên đang có điểm
              </p>
            </div>

            <div className="rounded-2xl border border-stroke bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Tổng điểm đã tích lũy</p>
              <p className="mt-2 text-2xl font-black text-amber-600">
                {(loyaltyData?.stats?.total_earned_points ?? 0).toLocaleString("vi-VN")} điểm
              </p>
              <p className="mt-1 text-xs text-gray-400">Từ đơn hoàn thành &amp; điểm thưởng</p>
            </div>

            <div className="rounded-2xl border border-stroke bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Điểm khả dụng hiện tại</p>
              <p className="mt-2 text-2xl font-black text-emerald-600">
                {(loyaltyData?.stats?.total_available_points ?? 0).toLocaleString("vi-VN")} điểm
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Tương đương{" "}
                {formatCurrency(
                  (loyaltyData?.stats?.total_available_points ?? 0) *
                    (loyaltyData?.config?.point_value_vnd ?? 1000)
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-stroke bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Đã quy đổi giảm giá</p>
              <p className="mt-2 text-2xl font-black text-primary">
                {(loyaltyData?.stats?.total_redeemed_points ?? 0).toLocaleString("vi-VN")} điểm
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Tổng tiền đã giảm: {formatCurrency(loyaltyData?.stats?.total_discount_redeemed_vnd ?? 0)}
              </p>
            </div>
          </div>

          {/* Tier Filter Pills */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              {
                key: "all" as const,
                label: "Tất cả hạng",
                count: loyaltyData?.stats?.total_members ?? 0,
                sub: "Toàn bộ khách hàng",
              },
              {
                key: "diamond" as const,
                label: "Hạng Kim Cương",
                count: loyaltyData?.stats?.tier_distribution?.diamond ?? 0,
                sub: `Từ ${loyaltyData?.config?.diamond_threshold ?? 300} điểm`,
              },
              {
                key: "gold" as const,
                label: "Hạng Vàng",
                count: loyaltyData?.stats?.tier_distribution?.gold ?? 0,
                sub: `Từ ${loyaltyData?.config?.gold_threshold ?? 150} điểm`,
              },
              {
                key: "silver" as const,
                label: "Hạng Bạc",
                count: loyaltyData?.stats?.tier_distribution?.silver ?? 0,
                sub: `Từ ${loyaltyData?.config?.silver_threshold ?? 50} điểm`,
              },
              {
                key: "bronze" as const,
                label: "Hạng Đồng",
                count: loyaltyData?.stats?.tier_distribution?.bronze ?? 0,
                sub: `Dưới ${loyaltyData?.config?.silver_threshold ?? 50} điểm`,
              },
            ].map((item) => {
              const active = tierFilter === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setTierFilter(item.key);
                    setMemberPage(1);
                  }}
                  className={`rounded-2xl border p-4 text-left transition cursor-pointer ${
                    active
                      ? "border-primary bg-primary/5 shadow-xs dark:border-primary dark:bg-primary/15"
                      : "border-stroke bg-white hover:border-gray-300 dark:border-dark-3 dark:bg-gray-dark"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-300">
                      {item.label}
                    </span>
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-extrabold text-primary">
                      {item.count}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-gray-400">{item.sub}</p>
                </button>
              );
            })}
          </div>

          {/* Members Loyalty Table */}
          <div className="rounded-2xl border border-stroke bg-white px-5 pb-6 pt-6 shadow-sm sm:px-7.5 dark:border-dark-3 dark:bg-gray-dark">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex w-full max-w-md items-center">
                <input
                  type="text"
                  placeholder="Tìm theo tên khách hàng, email, số điện thoại..."
                  value={memberSearch}
                  onChange={(e) => {
                    setMemberSearch(e.target.value);
                    setMemberPage(1);
                  }}
                  className="w-full rounded-l-lg border border-r-0 border-stroke bg-transparent py-2.5 pl-4 pr-3 text-sm outline-none focus:border-primary dark:border-dark-3"
                />
                <button
                  type="button"
                  className="flex items-center justify-center rounded-r-lg bg-primary px-4 py-2.5 text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                    <path
                      fillRule="evenodd"
                      d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              <div className="text-sm text-gray-500">
                Hiển thị <strong>{filteredMembers.length}</strong> thành viên
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-stroke dark:border-dark-3">
              <div className="max-w-full overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-primary text-white">
                    <tr>
                      <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide">Khách hàng</th>
                      <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide">Hạng thành viên</th>
                      <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide">Tổng chi tiêu</th>
                      <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wide">Điểm đơn hàng</th>
                      <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wide">Điểm thưởng / Đ.chỉnh</th>
                      <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wide">Đã sử dụng</th>
                      <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wide">Điểm khả dụng</th>
                      <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wide">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loyaltyLoading ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center">
                          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        </td>
                      </tr>
                    ) : paginatedMembers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                          Không tìm thấy thành viên nào phù hợp.
                        </td>
                      </tr>
                    ) : (
                      paginatedMembers.map((m) => (
                        <tr
                          key={m.user_id}
                          className="border-b border-stroke last:border-0 hover:bg-gray-50/60 dark:border-dark-3 dark:hover:bg-dark-2/40"
                        >
                          <td className="px-4 py-4">
                            <div className="font-bold text-dark dark:text-white">
                              {m.username || `Khách #${m.user_id}`}
                            </div>
                            <div className="text-xs text-gray-500">
                              {m.email} {m.phone ? `• ${m.phone}` : ""}
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-4 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold uppercase ${getTierBadgeStyle(
                                m.tier_key
                              )}`}
                            >
                              {m.tier_name}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-right">
                            <div className="font-bold text-dark dark:text-white">
                              {formatCurrency(m.total_spent)}
                            </div>
                            <div className="text-xs text-gray-400">{m.completed_orders_count} đơn hoàn thành</div>
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-center font-semibold text-dark dark:text-white">
                            {m.order_points} điểm
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-center">
                            {m.bonus_points > 0 ? (
                              <span className="font-bold text-emerald-600">+{m.bonus_points} điểm</span>
                            ) : m.bonus_points < 0 ? (
                              <span className="font-bold text-red-500">{m.bonus_points} điểm</span>
                            ) : (
                              <span className="text-gray-400">0</span>
                            )}
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-center font-medium text-gray-600 dark:text-gray-300">
                            {m.redeemed_points} điểm
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-center">
                            <span className="inline-block rounded-lg bg-emerald-500/10 px-2.5 py-1 text-sm font-black text-emerald-600 dark:text-emerald-400">
                              {m.available_points} điểm
                            </span>
                            <span className="block text-[11px] text-gray-400">
                              ~ {formatCurrency(m.max_redeemable_vnd)}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => openAdjustPointsForMember(m)}
                                className="rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-bold text-primary transition hover:bg-primary hover:text-white cursor-pointer"
                              >
                                +/- Điểm
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedMember(m)}
                                className="rounded-lg border border-stroke px-2.5 py-1.5 text-xs font-semibold text-dark transition hover:bg-gray-100 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2 cursor-pointer"
                              >
                                Lịch sử
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {!loyaltyLoading && (
              <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
                <Pagination
                  currentPage={memberPage}
                  totalPages={memberTotalPages}
                  onPageChange={setMemberPage}
                />
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>Hiển thị:</span>
                  <select
                    value={memberPerPage}
                    onChange={(e) => {
                      setMemberPerPage(Number(e.target.value));
                      setMemberPage(1);
                    }}
                    className="rounded-lg border border-stroke bg-transparent px-2.5 py-1.5 text-sm outline-none dark:border-dark-3"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                  <span>
                    Trang {memberPage} / {memberTotalPages}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL THÊM / SỬA MÃ GIẢM GIÁ + XEM TRƯỚC THẺ VOUCHER
         ===================================================================== */}
      <Modal
        isOpen={showVoucherModal}
        setIsOpen={setShowVoucherModal}
        title={editingVoucher ? `CẬP NHẬT MÃ GIẢM GIÁ: ${editingVoucher.code}` : "THÊM MÃ GIẢM GIÁ MỚI"}
        className="max-w-2xl"
      >
        <div className="space-y-5 p-2 max-h-[80vh] overflow-y-auto">
          {/* Live Preview giống hệt giao diện Kho ưu đãi của khách hàng */}
          <div className="rounded-2xl border border-dashed border-stroke bg-gray-50 p-4 dark:border-dark-3 dark:bg-dark-2">
            <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Xem trước hiển thị tại trang khách hàng:
            </span>
            <div className="flex overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-white/10 dark:bg-[#151210]">
              <div className="relative flex w-1/3 flex-col items-center justify-center border-r-2 border-dashed border-white/20 bg-[#ee2828] p-4 text-center text-white">
                <span className="text-sm font-extrabold leading-tight">
                  {voucherForm.discount_type === "percent"
                    ? `GIẢM ${voucherForm.discount_value || 0}%`
                    : `GIẢM ${Math.round((Number(voucherForm.discount_value) || 0) / 1000)}K`}
                </span>
                <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-white/85">
                  ĐƠN TỪ {Math.round((Number(voucherForm.min_order_value) || 0) / 1000)}K
                </span>
              </div>
              <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                  <h4 className="text-sm font-extrabold uppercase text-zinc-900 dark:text-white">
                    {voucherForm.title || "TIÊU ĐỀ MÃ GIẢM GIÁ"}
                  </h4>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {voucherForm.description || "Mô tả điều kiện áp dụng mã ưu đãi..."}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2.5 text-xs dark:border-white/10">
                  <span className="font-mono font-extrabold text-[#ee2828]">
                    {(voucherForm.code || "MAUUDAI").toUpperCase()}
                  </span>
                  <span className="rounded-lg bg-[#007a3f]/10 px-2.5 py-1 text-[11px] font-extrabold text-[#007a3f] dark:bg-[#f5c043]/15 dark:text-[#f5c043]">
                    Sao chép mã
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InputGroup
              label="MÃ CODE (*)"
              type="text"
              placeholder="VD: WELCOME20, PIZZA50K..."
              value={voucherForm.code}
              handleChange={(e) => {
                setVoucherForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }));
                setVoucherErrors((prev) => ({ ...prev, code: "" }));
              }}
              error={voucherErrors.code}
            />

            <div>
              <label className="mb-2.5 block text-sm font-medium text-dark dark:text-white">
                LOẠI GIẢM GIÁ (*)
              </label>
              <select
                value={voucherForm.discount_type}
                onChange={(e) =>
                  setVoucherForm((prev) => ({
                    ...prev,
                    discount_type: e.target.value as "percent" | "fixed",
                  }))
                }
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-gray-dark"
              >
                <option value="percent">Giảm theo phần trăm (%)</option>
                <option value="fixed">Giảm số tiền cố định (VNĐ)</option>
              </select>
            </div>
          </div>

          <InputGroup
            label="TIÊU ĐỀ CHƯƠNG TRÌNH (*)"
            type="text"
            placeholder="VD: Giảm 20% đơn hàng"
            value={voucherForm.title}
            handleChange={(e) => {
              setVoucherForm((prev) => ({ ...prev, title: e.target.value }));
              setVoucherErrors((prev) => ({ ...prev, title: "" }));
            }}
            error={voucherErrors.title}
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
              MÔ TẢ CHI TIẾT
            </label>
            <textarea
              rows={2}
              placeholder="VD: Giảm 20% tối đa 50.000đ cho đơn từ 150.000đ"
              value={voucherForm.description}
              onChange={(e) => setVoucherForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <InputGroup
              label={voucherForm.discount_type === "percent" ? "MỨC GIẢM (%) (*)" : "SỐ TIỀN GIẢM (đ) (*)"}
              type="number"
              placeholder="20"
              value={voucherForm.discount_value || ""}
              handleChange={(e) => {
                setVoucherForm((prev) => ({ ...prev, discount_value: Number(e.target.value) }));
                setVoucherErrors((prev) => ({ ...prev, discount_value: "" }));
              }}
              error={voucherErrors.discount_value}
            />

            <InputGroup
              label="ĐƠN TỐI THIỂU (đ) (*)"
              type="number"
              placeholder="150000"
              value={voucherForm.min_order_value}
              handleChange={(e) =>
                setVoucherForm((prev) => ({ ...prev, min_order_value: Number(e.target.value) }))
              }
              error={voucherErrors.min_order_value}
            />

            {voucherForm.discount_type === "percent" ? (
              <InputGroup
                label="GIẢM TỐI ĐA (đ)"
                type="number"
                placeholder="50000"
                value={voucherForm.max_discount ?? ""}
                handleChange={(e) =>
                  setVoucherForm((prev) => ({
                    ...prev,
                    max_discount: e.target.value ? Number(e.target.value) : null,
                  }))
                }
              />
            ) : (
              <InputGroup
                label="GIỚI HẠN LƯỢT DÙNG (*)"
                type="number"
                placeholder="500"
                value={voucherForm.usage_limit}
                handleChange={(e) =>
                  setVoucherForm((prev) => ({ ...prev, usage_limit: Number(e.target.value) }))
                }
              />
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <InputGroup
              label="NGÀY BẮT ĐẦU (*)"
              type="date"
              value={voucherForm.start_date}
              handleChange={(e) =>
                setVoucherForm((prev) => ({ ...prev, start_date: e.target.value }))
              }
            />

            <InputGroup
              label="NGÀY KẾT THÚC (*)"
              type="date"
              value={voucherForm.end_date}
              handleChange={(e) => {
                setVoucherForm((prev) => ({ ...prev, end_date: e.target.value }));
                setVoucherErrors((prev) => ({ ...prev, end_date: "" }));
              }}
              error={voucherErrors.end_date}
            />

            {voucherForm.discount_type === "percent" && (
              <InputGroup
                label="GIỚI HẠN LƯỢT DÙNG (*)"
                type="number"
                placeholder="500"
                value={voucherForm.usage_limit}
                handleChange={(e) =>
                  setVoucherForm((prev) => ({ ...prev, usage_limit: Number(e.target.value) }))
                }
              />
            )}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-stroke p-3.5 dark:border-dark-3">
            <div>
              <p className="text-sm font-semibold text-dark dark:text-white">
                Kích hoạt mã giảm giá ngay
              </p>
              <p className="text-xs text-gray-500">
                Cho phép hiển thị trong Kho ưu đãi của khách hàng và áp dụng khi thanh toán
              </p>
            </div>
            <Switch
              checked={voucherForm.is_active}
              onChange={(checked) => setVoucherForm((prev) => ({ ...prev, is_active: checked }))}
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-stroke pt-4 dark:border-dark-3">
            <Button
              onClick={() => setShowVoucherModal(false)}
              variant="outlineDark"
              label="Hủy bỏ"
              shape="rounded"
            />
            <Button
              onClick={handleSaveVoucher}
              variant="primary"
              label={voucherSaving ? "Đang lưu..." : editingVoucher ? "Lưu thay đổi" : "Tạo mã giảm giá"}
              disabled={voucherSaving}
              shape="rounded"
            />
          </div>
        </div>
      </Modal>

      {/* =====================================================================
          MODAL XÁC NHẬN XÓA MÃ GIẢM GIÁ
         ===================================================================== */}
      <Modal
        isOpen={!!deletingVoucher}
        setIsOpen={() => setDeletingVoucher(null)}
        className="relative max-w-[400px] p-8"
      >
        {deletingVoucher && (
          <div className="flex flex-col items-center text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-[#d34053] dark:bg-red-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-bold text-dark dark:text-white">Xóa Mã Giảm Giá</h3>
            <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">
              Bạn có chắc chắn muốn xóa mã{" "}
              <span className="font-mono font-bold text-dark dark:text-white">
                {deletingVoucher.code}
              </span>
              ? Hành động này không thể hoàn tác.
            </p>
            <div className="flex w-full gap-4">
              <button
                type="button"
                onClick={() => setDeletingVoucher(null)}
                className="flex-1 rounded-xl bg-gray-100 py-3 font-medium text-dark transition hover:bg-gray-200 dark:bg-dark-3 dark:text-white cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteVoucher}
                className="flex-1 rounded-xl bg-[#d34053] py-3 font-medium text-white transition hover:bg-[#ba3849] cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* =====================================================================
          MODAL CẤU HÌNH QUY TẮC TÍCH ĐIỂM & HẠNG THÀNH VIÊN
         ===================================================================== */}
      <Modal
        isOpen={showConfigModal}
        setIsOpen={setShowConfigModal}
        title="CẤU HÌNH QUY TẮC TÍCH ĐIỂM & HẠNG THÀNH VIÊN"
      >
        <div className="space-y-5 p-2">
          <div className="flex items-center justify-between rounded-xl border border-stroke p-3.5 dark:border-dark-3">
            <div>
              <p className="text-sm font-semibold text-dark dark:text-white">
                Bật chương trình tích điểm thành viên
              </p>
              <p className="text-xs text-gray-500">
                Cho phép khách hàng tích điểm từ đơn hoàn thành và dùng điểm trừ tiền khi thanh toán
              </p>
            </div>
            <Switch
              checked={configForm.is_enabled}
              onChange={(checked) => setConfigForm((prev) => ({ ...prev, is_enabled: checked }))}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InputGroup
              label="CHI TIÊU ĐỂ NHẬN 1 ĐIỂM (VNĐ)"
              type="number"
              placeholder="10000"
              value={configForm.spend_per_point}
              handleChange={(e) =>
                setConfigForm((prev) => ({ ...prev, spend_per_point: Number(e.target.value) }))
              }
            />
            <InputGroup
              label="GIÁ TRỊ QUY ĐỔI 1 ĐIỂM (VNĐ)"
              type="number"
              placeholder="1000"
              value={configForm.point_value_vnd}
              handleChange={(e) =>
                setConfigForm((prev) => ({ ...prev, point_value_vnd: Number(e.target.value) }))
              }
            />
          </div>

          <div className="rounded-xl border border-stroke p-4 space-y-4 dark:border-dark-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Mốc điểm xét Hạng Thành Viên (Tổng điểm tích lũy)
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <InputGroup
                label="HẠNG BẠC (SILVER)"
                type="number"
                placeholder="50"
                value={configForm.silver_threshold}
                handleChange={(e) =>
                  setConfigForm((prev) => ({ ...prev, silver_threshold: Number(e.target.value) }))
                }
              />
              <InputGroup
                label="HẠNG VÀNG (GOLD)"
                type="number"
                placeholder="150"
                value={configForm.gold_threshold}
                handleChange={(e) =>
                  setConfigForm((prev) => ({ ...prev, gold_threshold: Number(e.target.value) }))
                }
              />
              <InputGroup
                label="HẠNG KIM CƯƠNG"
                type="number"
                placeholder="300"
                value={configForm.diamond_threshold}
                handleChange={(e) =>
                  setConfigForm((prev) => ({ ...prev, diamond_threshold: Number(e.target.value) }))
                }
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-stroke pt-4 dark:border-dark-3">
            <Button
              onClick={() => setShowConfigModal(false)}
              variant="outlineDark"
              label="Hủy bỏ"
              shape="rounded"
            />
            <Button
              onClick={handleSaveLoyaltyConfig}
              variant="primary"
              label={configSaving ? "Đang lưu..." : "Lưu cấu hình"}
              disabled={configSaving}
              shape="rounded"
            />
          </div>
        </div>
      </Modal>

      {/* =====================================================================
          MODAL CỘNG / TRỪ ĐIỂM THÀNH VIÊN THỦ CÔNG
         ===================================================================== */}
      <Modal
        isOpen={showAdjustModal}
        setIsOpen={setShowAdjustModal}
        title="ĐIỀU CHỈNH ĐIỂM TÍCH LŨY THÀNH VIÊN"
      >
        <div className="space-y-5 p-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
              CHỌN KHÁCH HÀNG (*)
            </label>
            <select
              value={adjustForm.user_id}
              onChange={(e) =>
                setAdjustForm((prev) => ({ ...prev, user_id: Number(e.target.value) }))
              }
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-gray-dark"
            >
              {(loyaltyData?.members || []).map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  #{m.user_id} — {m.username} ({m.email}) — Khả dụng: {m.available_points} điểm
                </option>
              ))}
            </select>
          </div>

          {targetAdjustMember && (
            <div className="rounded-xl border border-stroke bg-gray-50 p-3.5 text-xs dark:border-dark-3 dark:bg-dark-2 flex items-center justify-between">
              <div>
                <p className="font-bold text-dark dark:text-white">
                  {targetAdjustMember.username} &bull; {targetAdjustMember.tier_name}
                </p>
                <p className="text-gray-500 mt-0.5">
                  Điểm hiện tại: <strong>{targetAdjustMember.available_points} điểm</strong> (~{" "}
                  {formatCurrency(targetAdjustMember.max_redeemable_vnd)})
                </p>
              </div>
              <div className="text-right">
                <span className="text-gray-400 block">Sau điều chỉnh:</span>
                <span className="text-sm font-black text-primary">
                  {Math.max(
                    0,
                    targetAdjustMember.available_points +
                      (adjustForm.mode === "add"
                        ? Number(adjustForm.points || 0)
                        : -Number(adjustForm.points || 0))
                  )}{" "}
                  điểm
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAdjustForm((prev) => ({ ...prev, mode: "add" }))}
              className={`rounded-xl border py-3 text-sm font-bold transition cursor-pointer ${
                adjustForm.mode === "add"
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-stroke text-gray-600 dark:border-dark-3 dark:text-gray-300"
              }`}
            >
              + Cộng điểm thưởng
            </button>
            <button
              type="button"
              onClick={() => setAdjustForm((prev) => ({ ...prev, mode: "deduct" }))}
              className={`rounded-xl border py-3 text-sm font-bold transition cursor-pointer ${
                adjustForm.mode === "deduct"
                  ? "border-red-600 bg-red-600 text-white"
                  : "border-stroke text-gray-600 dark:border-dark-3 dark:text-gray-300"
              }`}
            >
              - Trừ điểm tích lũy
            </button>
          </div>

          <InputGroup
            label="SỐ ĐIỂM ĐIỀU CHỈNH (*)"
            type="number"
            placeholder="20"
            value={adjustForm.points || ""}
            handleChange={(e) =>
              setAdjustForm((prev) => ({ ...prev, points: Math.max(0, Number(e.target.value)) }))
            }
          />

          <InputGroup
            label="LÝ DO / GHI CHÚ (*)"
            type="text"
            placeholder="VD: Tặng điểm tri ân sinh nhật, Đền bù đơn hàng giao trễ..."
            value={adjustForm.reason}
            handleChange={(e) => setAdjustForm((prev) => ({ ...prev, reason: e.target.value }))}
          />

          <div className="mt-6 flex justify-end gap-3 border-t border-stroke pt-4 dark:border-dark-3">
            <Button
              onClick={() => setShowAdjustModal(false)}
              variant="outlineDark"
              label="Hủy bỏ"
              shape="rounded"
            />
            <Button
              onClick={handleAdjustPoints}
              variant="primary"
              label={
                adjustSaving
                  ? "Đang xử lý..."
                  : adjustForm.mode === "add"
                  ? "Xác nhận cộng điểm"
                  : "Xác nhận trừ điểm"
              }
              disabled={adjustSaving}
              shape="rounded"
            />
          </div>
        </div>
      </Modal>

      {/* =====================================================================
          MODAL CHI TIẾT LỊCH SỬ TÍCH ĐIỂM CỦA KHÁCH HÀNG
         ===================================================================== */}
      <Modal
        isOpen={!!selectedMember}
        setIsOpen={() => setSelectedMember(null)}
        title={
          selectedMember
            ? `HỒ SƠ ĐIỂM THÀNH VIÊN — ${selectedMember.username.toUpperCase()}`
            : "HỒ SƠ ĐIỂM THÀNH VIÊN"
        }
        className="max-w-3xl"
      >
        {selectedMember && (
          <div className="space-y-6 p-2 max-h-[80vh] overflow-y-auto">
            {/* Member Summary Banner */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-stroke p-3.5 dark:border-dark-3">
                <span className="text-xs text-gray-500">Hạng hiện tại</span>
                <p className="mt-1 text-sm font-black text-dark dark:text-white">
                  {selectedMember.tier_name}
                </p>
              </div>
              <div className="rounded-xl border border-stroke p-3.5 dark:border-dark-3">
                <span className="text-xs text-gray-500">Tổng điểm đã tích</span>
                <p className="mt-1 text-sm font-black text-amber-600">
                  {selectedMember.earned_points} điểm
                </p>
              </div>
              <div className="rounded-xl border border-stroke p-3.5 dark:border-dark-3">
                <span className="text-xs text-gray-500">Điểm đã dùng</span>
                <p className="mt-1 text-sm font-black text-gray-700 dark:text-gray-300">
                  {selectedMember.redeemed_points} điểm
                </p>
              </div>
              <div className="rounded-xl border border-stroke p-3.5 dark:border-dark-3">
                <span className="text-xs text-gray-500">Điểm khả dụng</span>
                <p className="mt-1 text-sm font-black text-emerald-600">
                  {selectedMember.available_points} điểm ({formatCurrency(selectedMember.max_redeemable_vnd)})
                </p>
              </div>
            </div>

            {/* Section 1: Manual Adjustments */}
            <div>
              <div className="mb-2.5 flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Lịch sử cộng / trừ điểm thủ công ({selectedMember.adjustments.length})
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    const m = selectedMember;
                    setSelectedMember(null);
                    openAdjustPointsForMember(m);
                  }}
                  className="text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  + Thêm điều chỉnh điểm
                </button>
              </div>

              {selectedMember.adjustments.length === 0 ? (
                <p className="rounded-xl border border-dashed border-stroke py-4 text-center text-xs text-gray-400 dark:border-dark-3">
                  Chưa có điều chỉnh điểm thủ công nào.
                </p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-stroke dark:border-dark-3">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 dark:bg-dark-2">
                      <tr>
                        <th className="px-3 py-2.5 font-semibold">Thời gian</th>
                        <th className="px-3 py-2.5 font-semibold">Số điểm</th>
                        <th className="px-3 py-2.5 font-semibold">Lý do</th>
                        <th className="px-3 py-2.5 text-right font-semibold">Hoàn tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedMember.adjustments.map((adj) => (
                        <tr key={adj.adjustment_id} className="border-t border-stroke dark:border-dark-3">
                          <td className="px-3 py-2.5 text-gray-500">
                            {dayjs(adj.created_at).format("DD/MM/YYYY HH:mm")}
                          </td>
                          <td className="px-3 py-2.5 font-bold">
                            {adj.points_delta > 0 ? (
                              <span className="text-emerald-600">+{adj.points_delta} điểm</span>
                            ) : (
                              <span className="text-red-500">{adj.points_delta} điểm</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-dark dark:text-white">{adj.reason}</td>
                          <td className="px-3 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteAdjustment(adj.adjustment_id)}
                              className="text-xs font-semibold text-red-500 hover:underline cursor-pointer"
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Section 2: Point Redemptions at Checkout */}
            <div>
              <h4 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-gray-500">
                Lịch sử đổi điểm giảm giá đơn hàng ({selectedMember.redemptions.length})
              </h4>
              {selectedMember.redemptions.length === 0 ? (
                <p className="rounded-xl border border-dashed border-stroke py-4 text-center text-xs text-gray-400 dark:border-dark-3">
                  Khách hàng chưa sử dụng điểm ở đơn hàng nào.
                </p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-stroke dark:border-dark-3">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 dark:bg-dark-2">
                      <tr>
                        <th className="px-3 py-2.5 font-semibold">Đơn hàng</th>
                        <th className="px-3 py-2.5 font-semibold">Thời gian</th>
                        <th className="px-3 py-2.5 font-semibold">Điểm đã dùng</th>
                        <th className="px-3 py-2.5 text-right font-semibold">Số tiền giảm</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedMember.redemptions.map((r, i) => (
                        <tr key={`${r.order_id}-${i}`} className="border-t border-stroke dark:border-dark-3">
                          <td className="px-3 py-2.5 font-bold text-dark dark:text-white">#{r.order_id}</td>
                          <td className="px-3 py-2.5 text-gray-500">
                            {dayjs(r.created_at).format("DD/MM/YYYY HH:mm")}
                          </td>
                          <td className="px-3 py-2.5 font-semibold text-amber-600">-{r.points_used} điểm</td>
                          <td className="px-3 py-2.5 text-right font-bold text-emerald-600">
                            -{formatCurrency(r.discount_amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Section 3: Points Earned from Completed Orders */}
            <div>
              <h4 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-gray-500">
                Đơn hàng hoàn thành tích điểm gần đây ({selectedMember.recent_orders.length})
              </h4>
              {selectedMember.recent_orders.length === 0 ? (
                <p className="rounded-xl border border-dashed border-stroke py-4 text-center text-xs text-gray-400 dark:border-dark-3">
                  Chưa có đơn hàng hoàn thành nào.
                </p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-stroke dark:border-dark-3">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 dark:bg-dark-2">
                      <tr>
                        <th className="px-3 py-2.5 font-semibold">Mã đơn</th>
                        <th className="px-3 py-2.5 font-semibold">Ngày đặt</th>
                        <th className="px-3 py-2.5 text-right font-semibold">Giá trị đơn</th>
                        <th className="px-3 py-2.5 text-right font-semibold">Điểm tích lũy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedMember.recent_orders.map((o) => (
                        <tr key={o.order_id} className="border-t border-stroke dark:border-dark-3">
                          <td className="px-3 py-2.5 font-bold text-dark dark:text-white">#{o.order_id}</td>
                          <td className="px-3 py-2.5 text-gray-500">
                            {dayjs(o.created_at).format("DD/MM/YYYY HH:mm")}
                          </td>
                          <td className="px-3 py-2.5 text-right font-medium text-dark dark:text-white">
                            {formatCurrency(o.total_order)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-emerald-600">
                            +{o.points_earned} điểm
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
