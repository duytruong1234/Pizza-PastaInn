'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import HeaderClient from '@/components/HeaderClient';
import Footer from '@/components/Footer';
import Image from 'next/image';
import { shouldBypassNextImageOptimization } from '@/lib/image';
import {
  User,
  Phone,
  Mail,
  Lock,
  Trash2,
  Package,
  Calendar,
  Clock,
  CreditCard,
  MapPin,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Edit3,
  PlusCircle,
  Ticket,
  LogOut,
  Search,
  X,
  RotateCcw,
  Ban,
  Heart,
  Printer,
  Award,
  Copy,
  ShoppingBag,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { printOrderReceipt } from '@/lib/printReceipt';
import { formatPrice } from '@/lib/utils';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/apiError';
import { useUI } from '@/components/UIProvider';
import { useDialog } from '@/components/ui/dialog-provider';
import { BACKEND_URL } from '@/lib/config';
import PizzaTracker, { isActiveOrderStatus } from '@/components/PizzaTracker';
import { reorderOrderItems } from '@/lib/reorder';

const hcmcDistricts: Record<string, string[]> = {
  "Quận 1": [
    "Phường Bến Nghé",
    "Phường Bến Thành",
    "Phường Cầu Kho",
    "Phường Cầu Ông Lãnh",
    "Phường Cô Giang",
    "Phường Đa Kao",
    "Phường Nguyễn Cư Trinh",
    "Phường Nguyễn Thái Bình",
    "Phường Phạm Ngũ Lão",
    "Phường Tân Định"
  ],
  "Quận 3": [
    "Phường 1",
    "Phường 2",
    "Phường 3",
    "Phường 4",
    "Phường 5",
    "Phường Võ Thị Sáu"
  ],
  "Quận 4": [
    "Phường 1",
    "Phường 2",
    "Phường 3",
    "Phường 4",
    "Phường 6",
    "Phường 8",
    "Phường 9",
    "Phường 10",
    "Phường 13",
    "Phường 14",
    "Phường 15",
    "Phường 16",
    "Phường 18"
  ],
  "Quận 5": [
    "Phường 1",
    "Phường 2",
    "Phường 3",
    "Phường 4",
    "Phường 5",
    "Phường 6",
    "Phường 7",
    "Phường 8",
    "Phường 9",
    "Phường 10",
    "Phường 11",
    "Phường 12",
    "Phường 13",
    "Phường 14"
  ],
  "Quận 6": [
    "Phường 1",
    "Phường 2",
    "Phường 3",
    "Phường 4",
    "Phường 5",
    "Phường 6",
    "Phường 7",
    "Phường 8",
    "Phường 9",
    "Phường 10",
    "Phường 11",
    "Phường 12",
    "Phường 13",
    "Phường 14"
  ],
  "Quận 7": [
    "Phường Bình Thuận",
    "Phường Phú Mỹ",
    "Phường Phú Thuận",
    "Phường Tân Hưng",
    "Phường Tân Kiểng",
    "Phường Tân Phong",
    "Phường Tân Phú",
    "Phường Tân Quy",
    "Phường Tân Thuận Đông",
    "Phường Tân Thuận Tây"
  ],
  "Quận 8": [
    "Phường 1",
    "Phường 2",
    "Phường 3",
    "Phường 4",
    "Phường 5",
    "Phường 6",
    "Phường 7",
    "Phường 8",
    "Phường 9",
    "Phường 10",
    "Phường 11",
    "Phường 12",
    "Phường 13",
    "Phường 14",
    "Phường 15",
    "Phường 16"
  ],
  "Quận 10": [
    "Phường 1",
    "Phường 2",
    "Phường 4",
    "Phường 5",
    "Phường 6",
    "Phường 7",
    "Phường 8",
    "Phường 9",
    "Phường 10",
    "Phường 11",
    "Phường 12",
    "Phường 13",
    "Phường 14",
    "Phường 15"
  ],
  "Quận 11": [
    "Phường 1",
    "Phường 2",
    "Phường 3",
    "Phường 4",
    "Phường 5",
    "Phường 6",
    "Phường 7",
    "Phường 8",
    "Phường 9",
    "Phường 10",
    "Phường 11",
    "Phường 12",
    "Phường 13",
    "Phường 14",
    "Phường 15",
    "Phường 16"
  ],
  "Quận 12": [
    "Phường An Phú Đông",
    "Phường Đông Hưng Thuận",
    "Phường Hiệp Thành",
    "Phường Tân Chánh Hiệp",
    "Phường Tân Hưng Thuận",
    "Phường Tân Thới Hiệp",
    "Phường Tân Thới Nhất",
    "Phường Thạnh Lộc",
    "Phường Thạnh Xuân",
    "Phường Thới An",
    "Phường Trung Mỹ Tây"
  ],
  "Thành phố Thủ Đức": [
    "Phường An Khánh",
    "Phường An Lợi Đông",
    "Phường An Phú",
    "Phường Bình Khánh",
    "Phường Bình Chiểu",
    "Phường Cát Lái",
    "Phường Hiệp Bình Chánh",
    "Phường Hiệp Bình Phước",
    "Phường Hiệp Phú",
    "Phường Linh Chiểu",
    "Phường Linh Đông",
    "Phường Linh Tây",
    "Phường Linh Trung",
    "Phường Linh Xuân",
    "Phường Long Bình",
    "Phường Long Phước",
    "Phường Long Trường",
    "Phường Long Thạnh Mỹ",
    "Phường Phú Hữu",
    "Phường Phước Bình",
    "Phường Phước Long A",
    "Phường Phước Long B",
    "Phường Tam Bình",
    "Phường Tam Phú",
    "Phường Tăng Nhơn Phú A",
    "Phường Tăng Nhơn Phú B",
    "Phường Thạnh Mĩ Lợi",
    "Phường Thảo Điền",
    "Phường Thủ Thiêm",
    "Phường Trường Thọ",
    "Phường Trường Thạnh"
  ],
  "Quận Bình Thạnh": [
    "Phường 1",
    "Phường 2",
    "Phường 3",
    "Phường 5",
    "Phường 6",
    "Phường 7",
    "Phường 11",
    "Phường 12",
    "Phường 13",
    "Phường 14",
    "Phường 15",
    "Phường 17",
    "Phường 19",
    "Phường 21",
    "Phường 22",
    "Phường 24",
    "Phường 25",
    "Phường 26",
    "Phường 27",
    "Phường 28"
  ],
  "Quận Gò Vấp": [
    "Phường 1",
    "Phường 3",
    "Phường 4",
    "Phường 5",
    "Phường 6",
    "Phường 7",
    "Phường 8",
    "Phường 9",
    "Phường 10",
    "Phường 11",
    "Phường 12",
    "Phường 13",
    "Phường 14",
    "Phường 15",
    "Phường 16",
    "Phường 17"
  ],
  "Quận Phú Nhuận": [
    "Phường 1",
    "Phường 2",
    "Phường 3",
    "Phường 4",
    "Phường 5",
    "Phường 7",
    "Phường 8",
    "Phường 9",
    "Phường 10",
    "Phường 11",
    "Phường 13",
    "Phường 15",
    "Phường 17"
  ],
  "Quận Tân Bình": [
    "Phường 1",
    "Phường 2",
    "Phường 3",
    "Phường 4",
    "Phường 5",
    "Phường 6",
    "Phường 7",
    "Phường 8",
    "Phường 9",
    "Phường 10",
    "Phường 11",
    "Phường 12",
    "Phường 13",
    "Phường 14",
    "Phường 15"
  ],
  "Quận Tân Phú": [
    "Phường Hiệp Tân",
    "Phường Hòa Thạnh",
    "Phường Phú Thạnh",
    "Phường Phú Thọ Hòa",
    "Phường Phú Trung",
    "Phường Sơn Kỳ",
    "Phường Tân Quý",
    "Phường Tân Sơn Nhì",
    "Phường Tân Thành",
    "Phường Tân Thới Hòa",
    "Phường Tây Thạnh"
  ],
  "Quận Bình Tân": [
    "Phường An Lạc",
    "Phường An Lạc A",
    "Phường Bình Hưng Hòa",
    "Phường Bình Hưng Hòa A",
    "Phường Bình Hưng Hòa B",
    "Phường Bình Trị Đông",
    "Phường Bình Trị Đông A",
    "Phường Bình Trị Đông B",
    "Phường Tân Tạo",
    "Phường Tân Tạo A"
  ]
};

const hcmcWardsList = Object.entries(hcmcDistricts).flatMap(([district, wards]) =>
  wards.map((ward) => ({
    label: `${ward}, ${district}`,
    ward: ward,
    district: district
  }))
).sort((a, b) => a.label.localeCompare(b.label, 'vi'));

const parseAddressDetail = (detail: string) => {
  let houseNumber = '';
  let streetName = '';
  let ward = '';
  let district = '';
  let province = 'Thành phố Hồ Chí Minh';
  let email = '';

  if (!detail) {
    return { houseNumber, streetName, ward, district, province, email };
  }

  const parts = detail.split(',').map((p) => p.trim());

  parts.forEach((part) => {
    const partLower = part.toLowerCase();
    if (partLower.includes('thành phố hồ chí minh') || partLower.includes('tp.hcm') || partLower.includes('hồ chí minh')) {
      province = 'Thành phố Hồ Chí Minh';
    } else if (partLower.startsWith('email:')) {
      email = part.replace(/^email:\s*/i, '');
    } else if (
      partLower.startsWith('quận') ||
      partLower.startsWith('huyện') ||
      partLower.startsWith('thành phố thủ đức') ||
      partLower.startsWith('tp thủ đức')
    ) {
      district = part;
    } else if (partLower.startsWith('phường') || partLower.startsWith('xã')) {
      ward = part;
    } else if (partLower.startsWith('đường') || partLower.startsWith('phố')) {
      streetName = part.replace(/^đường\s+/i, '').replace(/^phố\s+/i, '');
    } else if (partLower.startsWith('số')) {
      houseNumber = part.replace(/^số\s+/i, '');
    } else {
      if (!streetName) {
        streetName = part;
      } else {
        houseNumber = part;
      }
    }
  });

  return { houseNumber, streetName, ward, district, province, email };
};

interface Topping {
  topping_id: number;
  topping_name: string;
}

interface OrderItemTopping {
  topping_price: number;
  quantity: number;
  topping?: Topping;
}

interface Dish {
  dish_name: string;
  image: string;
}

interface Size {
  size_name: string;
}

interface Crust {
  crust_name: string;
}

interface DishPrice {
  dish?: Dish;
  size?: Size;
  crust?: Crust;
}

interface Combo {
  combo_name: string;
  image_combo: string;
}

interface OrderItemHalf {
  dish?: Dish;
  order_item_toppings?: OrderItemTopping[];
}

interface OrderItemCombo {
  dish_price?: DishPrice;
  is_half_half: boolean;
  toppings?: OrderItemTopping[];
  halves?: OrderItemHalf[];
}

interface OrderItem {
  order_item_id: number;
  type: string;
  quantity: number;
  order_price: number;
  order_item_note: string | null;
  combo_id?: number | null;
  is_half_half?: boolean | null;
  dish_price?: DishPrice;
  combo?: Combo;
  toppings?: OrderItemTopping[];
  combos?: OrderItemCombo[];
  halves?: OrderItemHalf[];
}

interface Order {
  order_id: number;
  payment_method: string;
  payment_status: string;
  total_price_dish: number;
  shipping_fee: number;
  discount_amount: number;
  total_order: number;
  order_note: string | null;
  created_at: string;
  order_status: string;
  order_type: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  pickup_time: string | null;
  estimated_delivery_time?: string | null;
  confirmed_at?: string | null;
  preparing_at?: string | null;
  shipped_at?: string | null;
  arrived_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  user_address?: {
    address_line: string;
  };
  items: OrderItem[];
  store?: {
    store_name: string;
    address: string;
    hotline?: string;
  };
}

interface SavedAddress {
  user_address_id: number;
  user_id: number;
  is_default: boolean;
  recipient_name: string;
  recipient_phone: string;
  address_detail: string;
  latitude?: number | null;
  longitude?: number | null;
}

type TabType = 'general' | 'addresses' | 'orders' | 'password' | 'vouchers' | 'wishlist';

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, setAuth, clearAuth } = useAuthStore();
  const { items: wishlistItems, removeWishlist } = useWishlistStore();
  const backendUrl = BACKEND_URL;
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('general');

  const { theme, openCart, lang, td, ti } = useUI();
  const { showDanger, showAlert } = useDialog();
  const isDark = theme === 'dark';
  const [reorderingId, setReorderingId] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [refreshingOrders, setRefreshingOrders] = useState(false);

  // Vouchers & Loyalty states
  const [vouchersList, setVouchersList] = useState<any[]>([]);
  const [loyaltySummary, setLoyaltySummary] = useState<any | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Profile Edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password Change states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Saved Addresses states
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [addressIdToDelete, setAddressIdToDelete] = useState<number | null>(null);

  // Detailed address inputs
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [province] = useState('Thành phố Hồ Chí Minh');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [streetName, setStreetName] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [receiverEmail, setReceiverEmail] = useState('');

  // Orders states
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>({});

  // Avatar upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const deleteBackdropRef = useRef<HTMLDivElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (addressFormOpen || deleteConfirmOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [addressFormOpen, deleteConfirmOpen]);

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  useEffect(() => {
    if (isMounted && !user) {
      router.push('/login');
    }
  }, [isMounted, user, router]);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    if (user && token) {
      if (activeTab === 'general' || activeTab === 'orders') {
        fetchUserOrders();
      }
      if (activeTab === 'general' || activeTab === 'addresses') {
        fetchSavedAddresses();
      }
      if (activeTab === 'general' || activeTab === 'vouchers') {
        fetchVouchersAndLoyalty();
      }
    }
  }, [activeTab, user, token]);

  const fetchVouchersAndLoyalty = async () => {
    try {
      const [voucherRes, loyaltyRes] = await Promise.all([
        api.get('/vouchers'),
        api.get('/vouchers/loyalty'),
      ]);
      if (voucherRes.data?.success && Array.isArray(voucherRes.data.data)) {
        setVouchersList(voucherRes.data.data);
      }
      if (loyaltyRes.data?.success && loyaltyRes.data.data) {
        setLoyaltySummary(loyaltyRes.data.data);
      }
    } catch {
      // Ignore errors silently
    }
  };

  const fetchUserOrders = async () => {
    if (!user) return;
    setOrdersLoading(true);
    setOrdersError('');
    try {
      const res = await api.get(`/orders/user/${user.user_id}`);
      const json = res.data;
      if (json.success && json.data) {
        const sorted = [...json.data].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setOrders(sorted);
        setFilteredOrders(sorted);
        if (sorted.length > 0) {
          setExpandedOrders((prev) =>
            Object.keys(prev).length > 0 ? prev : { [sorted[0].order_id]: true }
          );
        }
      } else {
        setOrdersError(json.message || 'Không thể tải lịch sử đơn hàng');
      }
    } catch (err) {
      console.warn('Fetch orders error:', getApiErrorMessage(err));
      setOrdersError('Lỗi kết nối mạng, vui lòng thử lại sau');
    } finally {
      setOrdersLoading(false);
    }
  };

  const silentRefreshOrders = async () => {
    if (!user) return;
    setRefreshingOrders(true);
    try {
      const res = await api.get(`/orders/user/${user.user_id}`);
      const json = res.data;
      if (json.success && Array.isArray(json.data)) {
        const sorted = [...json.data].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setOrders(sorted);
        const query = searchQuery.trim().toLowerCase();
        if (!query) {
          setFilteredOrders(sorted);
        } else {
          setFilteredOrders(
            sorted.filter((o) => {
              const matchId = o.order_id.toString().includes(query);
              const matchPhone = o.customer_phone.includes(query);
              const matchProducts = getProductString(o).toLowerCase().includes(query);
              return matchId || matchPhone || matchProducts;
            })
          );
        }
      }
    } catch {
      // Bỏ qua lỗi khi tự động làm mới nền
    } finally {
      setRefreshingOrders(false);
    }
  };

  // Tự động làm mới đơn hàng mỗi 12 giây nếu có đơn đang xử lý
  const hasActiveUserOrder = orders.some((o) => isActiveOrderStatus(o.order_status));
  useEffect(() => {
    if (!hasActiveUserOrder || !user) return;
    const timer = setInterval(() => {
      silentRefreshOrders();
    }, 12000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasActiveUserOrder, user]);

  const handleReorder = async (order: Order) => {
    if (!order.items || order.items.length === 0) return;
    setReorderingId(order.order_id);
    try {
      const count = await reorderOrderItems(order.items);
      if (count > 0) {
        openCart();
        router.push('/');
      }
    } catch (err) {
      console.warn('Reorder error:', err);
    } finally {
      setReorderingId(null);
    }
  };

  const handleCancelOrder = async (order: Order) => {
    const ok = await showDanger(
      'Đơn hàng đang chờ xác nhận sẽ được hủy ngay lập tức.',
      `Hủy đơn hàng #${order.order_id}?`
    );
    if (!ok) return;

    setCancellingId(order.order_id);
    try {
      const res = await api.post(`/orders/${order.order_id}/cancel`);
      if (res.data?.success) {
        const updateFn = (list: Order[]) =>
          list.map((o) =>
            o.order_id === order.order_id
              ? { ...o, order_status: 'cancelled', cancelled_at: new Date().toISOString() }
              : o
          );
        setOrders(updateFn);
        setFilteredOrders(updateFn);
      } else {
        await showAlert(
          res.data?.message || 'Đơn hàng đã chuyển trạng thái xử lý, vui lòng liên hệ hotline.',
          'Không thể hủy đơn'
        );
      }
    } catch (err) {
      await showAlert(
        getApiErrorMessage(err) || 'Không thể hủy đơn lúc này, vui lòng thử lại.',
        'Không thể hủy đơn'
      );
    } finally {
      setCancellingId(null);
    }
  };

  const fetchSavedAddresses = async () => {
    setAddressesLoading(true);
    try {
      const res = await api.get('/addresses');
      if (res.data.success) {
        setAddresses(res.data.data);
      }
    } catch (err) {
      console.warn('Fetch addresses error:', getApiErrorMessage(err));
    } finally {
      setAddressesLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token) return;

    setProfileLoading(true);
    setProfileMessage(null);

    try {
      const res = await api.put('/auth/profile', { username, email, phone });
      const json = res.data;

      if (json.success) {
        setProfileMessage({ type: 'success', text: 'Cập nhật thông tin tài khoản thành công!' });
        setAuth(
          {
            ...user,
            username: json.data.username,
            email: json.data.email,
            phone: json.data.phone,
            avatar: json.data.avatar,
          },
          token
        );
        setIsEditingProfile(false);
      } else {
        setProfileMessage({ type: 'error', text: json.message || 'Không thể cập nhật thông tin tài khoản' });
      }
    } catch (err) {
      console.warn('Update profile error:', getApiErrorMessage(err));
      setProfileMessage({ type: 'error', text: 'Lỗi kết nối máy chủ, vui lòng thử lại sau' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token) return;

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Mật khẩu mới và xác nhận mật khẩu không khớp' });
      return;
    }

    setPasswordLoading(true);
    setPasswordMessage(null);

    try {
      const res = await api.put('/auth/profile/password', { oldPassword, newPassword });
      const json = res.data;

      if (json.success) {
        setPasswordMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMessage({ type: 'error', text: json.message || 'Không thể đổi mật khẩu' });
      }
    } catch (err) {
      console.warn('Change password error:', getApiErrorMessage(err));
      setPasswordMessage({ type: 'error', text: 'Lỗi kết nối máy chủ, vui lòng thử lại sau' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !token) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn một tệp hình ảnh hợp lệ');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Dung lượng ảnh tối đa là 2MB');
      return;
    }

    setAvatarUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await api.post('/auth/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const json = res.data;

      if (json.success) {
        setAuth(
          {
            ...user,
            avatar: json.data.avatar,
          },
          token
        );
        setProfileMessage({ type: 'success', text: 'Cập nhật ảnh đại diện thành công!' });
      } else {
        alert(json.message || 'Lỗi khi tải ảnh đại diện');
      }
    } catch (err) {
      console.warn('Upload avatar error:', getApiErrorMessage(err));
      alert('Lỗi kết nối máy chủ');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !receiverName.trim() ||
      !receiverPhone.trim() ||
      !streetName.trim() ||
      !houseNumber.trim() ||
      !selectedDistrict ||
      !selectedWard ||
      !receiverEmail.trim()
    ) {
      alert('Vui lòng điền đầy đủ thông tin địa chỉ nhận hàng');
      return;
    }

    const finalAddressDetail = `Số ${houseNumber.trim()}, Đường ${streetName.trim()}, ${selectedWard}, ${selectedDistrict}, Thành phố Hồ Chí Minh, Email: ${receiverEmail.trim()}`;

    setAddressesLoading(true);
    try {
      if (editingAddressId) {
        const currentAddr = addresses.find((a) => a.user_address_id === editingAddressId);
        const res = await api.put(`/addresses/${editingAddressId}`, {
          recipient_name: receiverName.trim(),
          recipient_phone: receiverPhone.trim(),
          address_detail: finalAddressDetail,
          is_default: currentAddr ? currentAddr.is_default : false,
        });
        if (res.data.success) {
          setEditingAddressId(null);
          resetAddressInputs();
          setAddressFormOpen(false);
          fetchSavedAddresses();
        }
      } else {
        const res = await api.post('/addresses', {
          recipient_name: receiverName.trim(),
          recipient_phone: receiverPhone.trim(),
          address_detail: finalAddressDetail,
          is_default: addresses.length === 0,
        });
        if (res.data.success) {
          resetAddressInputs();
          setAddressFormOpen(false);
          fetchSavedAddresses();
        }
      }
    } catch (err) {
      console.warn('Submit address error:', getApiErrorMessage(err));
      alert('Không thể lưu địa chỉ. Vui lòng kiểm tra kết nối mạng.');
    } finally {
      setAddressesLoading(false);
    }
  };

  const resetAddressInputs = () => {
    setReceiverName('');
    setReceiverPhone('');
    setHouseNumber('');
    setStreetName('');
    setSelectedDistrict('');
    setSelectedWard('');
    setReceiverEmail(user?.email || '');
  };

  const handleEditAddressClick = (addr: SavedAddress) => {
    setEditingAddressId(addr.user_address_id);
    setReceiverName(addr.recipient_name || '');
    setReceiverPhone(addr.recipient_phone || '');

    const parsed = parseAddressDetail(addr.address_detail);
    setHouseNumber(parsed.houseNumber);
    setStreetName(parsed.streetName);
    setSelectedDistrict(parsed.district);
    setSelectedWard(parsed.ward);
    setReceiverEmail(parsed.email || user?.email || '');

    setAddressFormOpen(true);
  };

  const confirmDeleteAddress = (id: number) => {
    setAddressIdToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteAddress = async () => {
    if (addressIdToDelete === null) return;
    setAddressesLoading(true);
    try {
      const res = await api.delete(`/addresses/${addressIdToDelete}`);
      if (res.data.success) {
        setDeleteConfirmOpen(false);
        setAddressIdToDelete(null);
        fetchSavedAddresses();
      }
    } catch (err) {
      console.warn('Delete address error:', getApiErrorMessage(err));
    } finally {
      setAddressesLoading(false);
    }
  };

  const handleSearchLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setFilteredOrders(orders);
      return;
    }

    const filtered = orders.filter((order) => {
      const matchId = order.order_id.toString().includes(query);
      const matchPhone = order.customer_phone.includes(query);
      const matchProducts = getProductString(order).toLowerCase().includes(query);
      return matchId || matchPhone || matchProducts;
    });

    setFilteredOrders(filtered);
  };

  const toggleExpand = (orderId: number) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'pending':
        return (
          <span className="inline-block px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-500 text-[11px] font-extrabold uppercase tracking-wider">
            {lang === 'en' ? 'Pending' : 'Chờ xác nhận'}
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[11px] font-extrabold uppercase tracking-wider">
            {lang === 'en' ? 'Confirmed' : 'Đã xác nhận'}
          </span>
        );
      case 'preparing':
      case 'processing':
        return (
          <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[11px] font-extrabold uppercase tracking-wider">
            {lang === 'en' ? 'Preparing' : 'Đang chuẩn bị'}
          </span>
        );
      case 'shipped':
      case 'delivering':
        return (
          <span className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-500 text-[11px] font-extrabold uppercase tracking-wider">
            {lang === 'en' ? 'Delivering' : 'Đang giao hàng'}
          </span>
        );
      case 'arrived':
      case 'completed':
        return (
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[11px] font-extrabold uppercase tracking-wider">
            {lang === 'en' ? 'Completed' : 'Hoàn thành'}
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-block px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 text-[11px] font-extrabold uppercase tracking-wider">
            {lang === 'en' ? 'Cancelled' : 'Đã hủy'}
          </span>
        );
      default:
        return (
          <span className="inline-block px-3 py-1 rounded-full bg-zinc-500/10 border border-zinc-500/30 text-zinc-400 text-[11px] font-extrabold uppercase tracking-wider">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes} - ${day}/${month}/${year}`;
  };

  const getProductString = (order: Order) => {
    if (!order.items || order.items.length === 0) return '';
    return order.items
      .map((item) => {
        if (item.combo_id) return item.combo?.combo_name;
        if (item.is_half_half) return 'Pizza Half & Half';
        return td(item.dish_price?.dish?.dish_name || '');
      })
      .join(', ');
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'general':
        return lang === 'en' ? 'My Profile' : 'Hồ sơ của tôi';
      case 'addresses':
        return lang === 'en' ? 'Address Book' : 'Sổ địa chỉ';
      case 'orders':
        return lang === 'en' ? 'Order History' : 'Lịch sử đơn hàng';
      case 'password':
        return lang === 'en' ? 'Change Password' : 'Đổi mật khẩu';
      case 'vouchers':
        return lang === 'en' ? 'Rewards & Vouchers' : 'Kho ưu đãi & Tích điểm';
      case 'wishlist':
        return lang === 'en' ? 'Saved Favorites' : 'Món yêu thích đã lưu';
      default:
        return lang === 'en' ? 'My Profile' : 'Hồ sơ của tôi';
    }
  };

  if (!isMounted || !user) {
    return (
      <div
        className={`min-h-screen flex flex-col justify-center items-center ${
          isDark ? 'bg-[#0e0c0a] text-white' : 'bg-[#f6f6f7] text-zinc-800'
        }`}
      >
        <Loader2 className="animate-spin text-[#007a3f] w-10 h-10 mb-4" />
        <p className="text-zinc-500 text-sm font-bold uppercase tracking-wider">
          {lang === 'en' ? 'Loading profile...' : 'Đang tải hồ sơ...'}
        </p>
      </div>
    );
  }

  const latestOrder = orders.length > 0 ? orders[0] : null;

  return (
    <div
      className={`min-h-screen font-sans flex flex-col transition-colors duration-300 ${
        isDark ? 'bg-[#0e0c0a] text-white' : 'bg-[#f6f6f7] text-zinc-900'
      }`}
    >
      <HeaderClient storeName="Pizza&PastaInn" />

      <main className="flex-1 max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* Left Panel: Sidebar Navigation */}
          <aside className="lg:col-span-3">
            <div
              className={`border transition-all duration-300 rounded-3xl overflow-hidden ${
                isDark
                  ? 'bg-[#151210] border-white/[0.08] shadow-xl'
                  : 'bg-white border-zinc-200/90 shadow-sm'
              }`}
            >
              {/* Header: Tài khoản của USER */}
              <div
                className={`p-5 border-b transition-colors duration-300 flex items-center gap-3.5 ${
                  isDark
                    ? 'bg-white/[0.02] border-white/[0.07]'
                    : 'bg-zinc-50/80 border-zinc-200/70'
                }`}
              >
                <div
                  className={`relative w-12 h-12 rounded-full overflow-hidden border shrink-0 shadow-sm ${
                    isDark ? 'border-white/10' : 'border-zinc-200'
                  }`}
                >
                  {avatarUploading && (
                    <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center">
                      <Loader2 className="animate-spin text-white w-4 h-4" />
                    </div>
                  )}
                  {user.avatar ? (
                    <img
                      src={`${backendUrl}${user.avatar}`}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#007a3f] text-white flex items-center justify-center font-black text-lg">
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/60 text-white opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center z-10 text-[10px] font-bold cursor-pointer"
                  >
                    {lang === 'en' ? 'Change' : 'Đổi ảnh'}
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <h3
                    className={`font-extrabold text-[15px] leading-snug break-words line-clamp-2 ${
                      isDark ? 'text-white' : 'text-zinc-900'
                    }`}
                    title={user.username}
                  >
                    {user.username}
                  </h3>
                  {loyaltySummary && (
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          isDark
                            ? 'bg-[#f5c043]/15 text-[#f5c043] border border-[#f5c043]/30'
                            : 'bg-[#007a3f]/10 text-[#007a3f] border border-[#007a3f]/25'
                        }`}
                      >
                        <Award size={11} />
                        {loyaltySummary.tier_name}
                      </span>
                      <span className="text-[11px] font-bold text-zinc-500">
                        {loyaltySummary.available_points} {lang === 'en' ? 'pts' : 'điểm'}
                      </span>
                    </div>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Vertical tabs on desktop, 2-col compact grid on mobile/tablet */}
              <div className="grid grid-cols-2 lg:flex lg:flex-col p-3 gap-1.5 lg:gap-1">
                {[
                  { id: 'general' as TabType, label: lang === 'en' ? 'My Profile' : 'Hồ sơ của tôi', icon: User },
                  { id: 'orders' as TabType, label: lang === 'en' ? 'Order History' : 'Lịch sử đơn hàng', icon: Package },
                  { id: 'vouchers' as TabType, label: lang === 'en' ? 'Rewards & Vouchers' : 'Kho ưu đãi & Điểm', icon: Ticket },
                  {
                    id: 'wishlist' as TabType,
                    label: lang === 'en' ? `Saved Favorites (${wishlistItems.length})` : `Món yêu thích (${wishlistItems.length})`,
                    icon: Heart,
                  },
                  { id: 'password' as TabType, label: lang === 'en' ? 'Change Password' : 'Đổi mật khẩu', icon: Lock },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full py-2.5 lg:py-3 px-3 lg:px-4 rounded-2xl text-xs sm:text-[13.5px] font-bold text-left transition-all flex items-center gap-2.5 lg:gap-3 cursor-pointer ${
                        isActive
                          ? isDark
                            ? 'bg-[#f5c043]/15 text-[#f5c043]'
                            : 'bg-[#007a3f]/10 text-[#007a3f]'
                          : isDark
                          ? 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                          : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80'
                      }`}
                    >
                      <Icon size={17} className="shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}

                <hr className={`col-span-2 my-1 lg:my-1.5 ${isDark ? 'border-white/[0.07]' : 'border-zinc-200/80'}`} />

                <button
                  onClick={handleLogout}
                  className="col-span-2 w-full py-2.5 lg:py-3 px-3 lg:px-4 rounded-2xl text-xs sm:text-[13.5px] font-bold text-left text-red-500 hover:bg-red-500/10 transition-all flex items-center justify-center lg:justify-start gap-2.5 lg:gap-3 cursor-pointer"
                >
                  <LogOut size={17} className="shrink-0" />
                  <span>{lang === 'en' ? 'Sign Out' : 'Đăng xuất'}</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Right Panel: Content Panel */}
          <div className="lg:col-span-9">
            {/* Top Tab Title Bar */}
            <div
              className={`border-b pb-3.5 flex justify-between items-center transition-colors duration-300 mb-6 ${
                isDark ? 'border-white/[0.08]' : 'border-zinc-200'
              }`}
            >
              <h1
                className={`text-2xl font-extrabold tracking-tight transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-zinc-900'
                }`}
              >
                {getTabTitle()}
              </h1>
            </div>

            {activeTab === 'general' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Card 1: THÔNG TIN TÀI KHOẢN */}
                <div
                  className={`border transition-all duration-300 rounded-3xl p-6 md:p-7 relative overflow-hidden ${
                    isDark
                      ? 'bg-[#151210] border-white/[0.08] shadow-xl'
                      : 'bg-white border-zinc-200/90 shadow-sm'
                  }`}
                >
                  <div className="relative z-10 space-y-5">
                    <div
                      className={`flex justify-between items-center border-b pb-3.5 transition-colors duration-300 ${
                        isDark ? 'border-white/[0.07]' : 'border-zinc-100'
                      }`}
                    >
                      <h2
                        className={`text-base font-bold ${
                          isDark ? 'text-white' : 'text-zinc-900'
                        }`}
                      >
                        {lang === 'en' ? 'Account Information' : 'Thông tin tài khoản'}
                      </h2>
                      {!isEditingProfile ? (
                        <button
                          onClick={() => {
                            setIsEditingProfile(true);
                            setProfileMessage(null);
                          }}
                          className={`text-[13px] font-bold hover:underline flex items-center gap-1.5 transition-all cursor-pointer ${
                            isDark ? 'text-[#f5c043]' : 'text-[#007a3f]'
                          }`}
                        >
                          <Edit3 size={14} />
                          <span>{lang === 'en' ? 'Edit' : 'Chỉnh sửa'}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setIsEditingProfile(false)}
                          className={`text-[13px] font-bold transition-colors duration-300 cursor-pointer ${
                            isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-800'
                          }`}
                        >
                          {lang === 'en' ? 'Cancel' : 'Hủy'}
                        </button>
                      )}
                    </div>

                    {profileMessage && (
                      <div
                        className={`p-4 rounded-2xl flex items-start gap-3 border text-sm font-semibold ${
                          profileMessage.type === 'success'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                            : 'bg-red-500/10 border-red-500/20 text-red-500'
                        }`}
                      >
                        {profileMessage.type === 'success' ? (
                          <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        )}
                        <span>{profileMessage.text}</span>
                      </div>
                    )}

                    {!isEditingProfile ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6 text-sm">
                        <div className="lg:col-span-4 space-y-1">
                          <span
                            className={`text-xs font-bold uppercase tracking-wider block ${
                              isDark ? 'text-zinc-400' : 'text-zinc-500'
                            }`}
                          >
                            {lang === 'en' ? 'Full Name' : 'Họ và tên'}
                          </span>
                          <strong
                            className={`text-[15px] font-extrabold block break-words ${
                              isDark ? 'text-white' : 'text-zinc-900'
                            }`}
                          >
                            {user.username || (lang === 'en' ? 'Not set' : 'Chưa cập nhật')}
                          </strong>
                        </div>

                        <div className="lg:col-span-3 space-y-1">
                          <span
                            className={`text-xs font-bold uppercase tracking-wider block ${
                              isDark ? 'text-zinc-400' : 'text-zinc-500'
                            }`}
                          >
                            {lang === 'en' ? 'Phone Number' : 'Số điện thoại'}
                          </span>
                          <strong
                            className={`text-[15px] font-extrabold block ${
                              user.phone
                                ? isDark
                                  ? 'text-white'
                                  : 'text-zinc-900'
                                : isDark
                                ? 'text-zinc-500 font-semibold italic'
                                : 'text-zinc-400 font-semibold italic'
                            }`}
                          >
                            {user.phone || (lang === 'en' ? 'Not set' : 'Chưa cập nhật')}
                          </strong>
                        </div>

                        <div className="sm:col-span-2 lg:col-span-5 space-y-1">
                          <span
                            className={`text-xs font-bold uppercase tracking-wider block ${
                              isDark ? 'text-zinc-400' : 'text-zinc-500'
                            }`}
                          >
                            Email
                          </span>
                          <strong
                            className={`text-[15px] font-extrabold block break-all ${
                              isDark ? 'text-white' : 'text-zinc-900'
                            }`}
                          >
                            {user.email || (lang === 'en' ? 'Not set' : 'Chưa cập nhật')}
                          </strong>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <label
                            className={`text-xs font-bold uppercase tracking-wider ${
                              isDark ? 'text-zinc-400' : 'text-zinc-600'
                            }`}
                          >
                            {lang === 'en' ? 'Full Name' : 'Họ và tên'}
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                              <User size={16} />
                            </span>
                            <input
                              type="text"
                              required
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              className={`w-full border rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none transition-colors ${
                                isDark
                                  ? 'bg-[#0e0c0a] border-white/10 focus:border-[#f5c043] text-white'
                                  : 'bg-white border-zinc-300 focus:border-[#007a3f] focus:ring-1 focus:ring-[#007a3f] text-zinc-900'
                              }`}
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label
                            className={`text-xs font-bold uppercase tracking-wider ${
                              isDark ? 'text-zinc-400' : 'text-zinc-600'
                            }`}
                          >
                            {lang === 'en' ? 'Phone Number' : 'Số điện thoại'}
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                              <Phone size={16} />
                            </span>
                            <input
                              type="tel"
                              required
                              placeholder={lang === 'en' ? 'Enter phone number' : 'Nhập số điện thoại'}
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className={`w-full border rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none transition-colors ${
                                isDark
                                  ? 'bg-[#0e0c0a] border-white/10 focus:border-[#f5c043] text-white'
                                  : 'bg-white border-zinc-300 focus:border-[#007a3f] focus:ring-1 focus:ring-[#007a3f] text-zinc-900'
                              }`}
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                          <label
                            className={`text-xs font-bold uppercase tracking-wider ${
                              isDark ? 'text-zinc-400' : 'text-zinc-600'
                            }`}
                          >
                            {lang === 'en' ? 'Email Address' : 'Địa chỉ Email'}
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                              <Mail size={16} />
                            </span>
                            <input
                              type="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className={`w-full border rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none transition-colors ${
                                isDark
                                  ? 'bg-[#0e0c0a] border-white/10 focus:border-[#f5c043] text-white'
                                  : 'bg-white border-zinc-300 focus:border-[#007a3f] focus:ring-1 focus:ring-[#007a3f] text-zinc-900'
                              }`}
                            />
                          </div>
                        </div>

                        <div className="md:col-span-2 pt-1 flex gap-3">
                          <button
                            type="submit"
                            disabled={profileLoading}
                            className="bg-[#007a3f] hover:bg-[#006030] text-white font-bold text-xs tracking-wider uppercase px-6 py-3 rounded-xl shadow active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-55 cursor-pointer"
                          >
                            {profileLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                            {lang === 'en' ? 'Save Changes' : 'Lưu thay đổi'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsEditingProfile(false)}
                            className={`font-bold text-xs tracking-wider uppercase px-6 py-3 rounded-xl transition-all border cursor-pointer ${
                              isDark
                                ? 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-300'
                            }`}
                          >
                            {lang === 'en' ? 'Cancel' : 'Hủy'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>

                {/* Card 2: ĐƠN HÀNG GẦN NHẤT */}
                <div
                  className={`border transition-all duration-300 rounded-3xl p-6 md:p-7 ${
                    isDark
                      ? 'bg-[#151210] border-white/[0.08] shadow-xl'
                      : 'bg-white border-zinc-200/90 shadow-sm'
                  }`}
                >
                  <div
                    className={`flex justify-between items-center border-b pb-3.5 mb-4 transition-colors duration-300 ${
                      isDark ? 'border-white/[0.07]' : 'border-zinc-100'
                    }`}
                  >
                    <h2
                      className={`text-base font-bold ${
                        isDark ? 'text-white' : 'text-zinc-900'
                      }`}
                    >
                      {lang === 'en' ? 'Recent Order' : 'Đơn hàng gần nhất'}
                    </h2>
                    {orders.length > 0 && (
                      <button
                        onClick={() => setActiveTab('orders')}
                        className={`text-xs font-bold hover:underline cursor-pointer ${
                          isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'
                        }`}
                      >
                        {lang === 'en' ? `View All (${orders.length})` : `Xem tất cả (${orders.length})`}
                      </button>
                    )}
                  </div>

                  {ordersLoading ? (
                    <div className="text-center py-8 flex flex-col items-center gap-2">
                      <Loader2 className="animate-spin text-[#007a3f] w-6 h-6" />
                      <p className="text-zinc-500 text-xs">{lang === 'en' ? 'Loading order history...' : 'Đang tải thông tin đơn hàng...'}</p>
                    </div>
                  ) : !latestOrder ? (
                    <div className="text-center py-8 text-zinc-500 text-sm font-medium">
                      {lang === 'en' ? 'You have not placed any orders yet' : 'Bạn chưa có đơn hàng nào'}
                    </div>
                  ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full min-w-[560px] text-sm text-left">
                        <thead>
                          <tr
                            className={`font-bold uppercase text-[11px] tracking-wider border-b transition-colors duration-300 whitespace-nowrap ${
                              isDark
                                ? 'text-zinc-400 border-white/[0.08]'
                                : 'text-zinc-500 border-zinc-200'
                            }`}
                          >
                            <th className="py-3 pr-4">{lang === 'en' ? 'Order ID' : 'Mã đơn'}</th>
                            <th className="py-3 px-4">{lang === 'en' ? 'Items' : 'Sản phẩm'}</th>
                            <th className="py-3 px-4">{lang === 'en' ? 'Date' : 'Ngày đặt'}</th>
                            <th className="py-3 px-4">{lang === 'en' ? 'Total' : 'Tổng tiền'}</th>
                            <th className="py-3 pl-4 text-right">{lang === 'en' ? 'Status' : 'Trạng thái'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="font-semibold">
                            <td className="py-4 pr-4 font-extrabold whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setActiveTab('orders');
                                  setExpandedOrders({ [latestOrder.order_id]: true });
                                }}
                                className={`hover:underline cursor-pointer ${
                                  isDark ? 'text-[#f5c043]' : 'text-[#007a3f]'
                                }`}
                              >
                                #{latestOrder.order_id}
                              </button>
                            </td>
                            <td
                              className={`py-4 px-4 max-w-[240px] truncate ${
                                isDark ? 'text-zinc-200' : 'text-zinc-800'
                              }`}
                              title={getProductString(latestOrder)}
                            >
                              {getProductString(latestOrder)}
                            </td>
                            <td className={`py-4 px-4 whitespace-nowrap ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                              {formatDate(latestOrder.created_at)}
                            </td>
                            <td
                              className={`py-4 px-4 font-extrabold whitespace-nowrap ${
                                isDark ? 'text-white' : 'text-zinc-900'
                              }`}
                            >
                              {formatPrice(latestOrder.total_order)}
                            </td>
                            <td className="py-4 pl-4 text-right whitespace-nowrap">
                              {getStatusBadge(latestOrder.order_status)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Card 3: SỔ ĐỊA CHỈ */}
                <div
                  className={`border transition-all duration-300 rounded-3xl p-6 md:p-7 ${
                    isDark
                      ? 'bg-[#151210] border-white/[0.08] shadow-xl'
                      : 'bg-white border-zinc-200/90 shadow-sm'
                  }`}
                >
                  <div
                    className={`flex justify-between items-center border-b pb-3.5 mb-5 transition-colors duration-300 ${
                      isDark ? 'border-white/[0.07]' : 'border-zinc-100'
                    }`}
                  >
                    <h2
                      className={`text-base font-bold ${
                        isDark ? 'text-white' : 'text-zinc-900'
                      }`}
                    >
                      {lang === 'en' ? 'Delivery Address Book' : 'Sổ địa chỉ giao hàng'}
                    </h2>
                    <button
                      onClick={() => {
                        setEditingAddressId(null);
                        resetAddressInputs();
                        setAddressFormOpen(true);
                      }}
                      className="bg-[#007a3f] hover:bg-[#006030] text-white font-bold text-xs tracking-wider uppercase px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer"
                    >
                      <PlusCircle size={14} />
                      <span>{lang === 'en' ? 'Add Address' : 'Thêm địa chỉ'}</span>
                    </button>
                  </div>

                  {addressesLoading ? (
                    <div className="text-center py-10 flex flex-col items-center gap-2">
                      <Loader2 className="animate-spin text-[#007a3f] w-7 h-7" />
                      <p className="text-zinc-500 text-xs font-medium">
                        {lang === 'en' ? 'Loading addresses...' : 'Đang tải danh sách địa chỉ...'}
                      </p>
                    </div>
                  ) : addresses.length === 0 ? (
                    <div
                      className={`border border-dashed rounded-2xl py-10 px-6 text-center space-y-2 ${
                        isDark ? 'border-white/10' : 'border-zinc-200'
                      }`}
                    >
                      <MapPin size={22} className="mx-auto text-zinc-400" />
                      <p className="text-zinc-500 text-sm font-medium">
                        {lang === 'en' ? 'You have not saved any delivery addresses yet' : 'Bạn chưa lưu địa chỉ giao hàng nào'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                      {addresses.map((addr) => {
                        const parsed = parseAddressDetail(addr.address_detail);
                        const cleanAddress = addr.address_detail.split(', Email:')[0];
                        return (
                          <div
                            key={addr.user_address_id}
                            className={`border p-5 rounded-2xl flex flex-col justify-between transition-all duration-200 ${
                              isDark
                                ? 'bg-[#0e0c0a] border-white/[0.07] hover:border-white/15'
                                : 'bg-zinc-50/60 border-zinc-200/90 hover:border-zinc-300'
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <MapPin size={16} className="text-[#007a3f] shrink-0" />
                                  <span
                                    className={`font-extrabold text-sm truncate ${
                                      isDark ? 'text-white' : 'text-zinc-900'
                                    }`}
                                  >
                                    {addr.recipient_name || (lang === 'en' ? 'Delivery Address' : 'Địa chỉ giao hàng')}
                                  </span>
                                </div>
                                {addr.is_default && (
                                  <span className="bg-[#007a3f]/10 text-[#007a3f] border border-[#007a3f]/25 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0">
                                    {lang === 'en' ? 'Default' : 'Mặc định'}
                                  </span>
                                )}
                              </div>

                              <p
                                className={`text-xs leading-relaxed font-medium ${
                                  isDark ? 'text-zinc-300' : 'text-zinc-600'
                                }`}
                              >
                                {cleanAddress}
                              </p>

                              <div
                                className={`pt-1 space-y-0.5 text-xs ${
                                  isDark ? 'text-zinc-400' : 'text-zinc-500'
                                }`}
                              >
                                {addr.recipient_phone && <p>{lang === 'en' ? 'Phone: ' : 'SĐT: '}{addr.recipient_phone}</p>}
                                <p className="break-all">Email: {parsed.email || user.email}</p>
                              </div>
                            </div>

                            <div
                              className={`mt-4 pt-3 border-t flex gap-4 text-xs font-bold transition-colors duration-300 ${
                                isDark ? 'border-white/[0.06]' : 'border-zinc-200/80'
                              }`}
                            >
                              <button
                                onClick={() => handleEditAddressClick(addr)}
                                className={`hover:underline flex items-center gap-1 cursor-pointer ${
                                  isDark ? 'text-[#f5c043]' : 'text-[#007a3f]'
                                }`}
                              >
                                <Edit3 size={13} />
                                <span>{lang === 'en' ? 'Edit' : 'Chỉnh sửa'}</span>
                              </button>
                              <button
                                onClick={() => confirmDeleteAddress(addr.user_address_id)}
                                className="text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 size={13} />
                                <span>{lang === 'en' ? 'Delete' : 'Xóa'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Lịch sử đơn hàng */}
            {activeTab === 'orders' && (
              <div className="space-y-6 animate-fadeIn">
                <div
                  className={`border p-6 rounded-3xl space-y-4 transition-colors duration-300 ${
                    isDark
                      ? 'bg-[#151210] border-white/[0.08] shadow-xl'
                      : 'bg-white border-zinc-200/90 shadow-sm'
                  }`}
                >
                  <form onSubmit={handleSearchLookup} className="space-y-3">
                    <label
                      className={`text-xs font-bold uppercase tracking-wider block ${
                        isDark ? 'text-zinc-400' : 'text-zinc-600'
                      }`}
                    >
                      {lang === 'en' ? 'Search Orders' : 'Tìm kiếm đơn hàng'}
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                          <Search size={16} />
                        </span>
                        <input
                          type="text"
                          placeholder={
                            lang === 'en'
                              ? 'Enter order ID, phone number, or dish name...'
                              : 'Nhập mã đơn hàng, số điện thoại hoặc tên món ăn...'
                          }
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className={`w-full border rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none transition-colors ${
                            isDark
                              ? 'bg-[#0e0c0a] border-white/10 focus:border-[#f5c043] text-white'
                              : 'bg-white border-zinc-300 focus:border-[#007a3f] focus:ring-1 focus:ring-[#007a3f] text-zinc-900'
                          }`}
                        />
                      </div>
                      <button
                        type="submit"
                        className="bg-[#007a3f] hover:bg-[#006030] text-white font-bold text-xs tracking-wider uppercase px-6 py-3 rounded-xl transition-all shadow-sm active:scale-95 whitespace-nowrap cursor-pointer"
                      >
                        {lang === 'en' ? 'Search' : 'Tìm kiếm'}
                      </button>
                    </div>
                  </form>
                </div>

                {ordersLoading && (
                  <div className="text-center py-20 flex flex-col items-center gap-3">
                    <Loader2 className="w-9 h-9 text-[#007a3f] animate-spin" />
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">
                      {lang === 'en' ? 'Loading order history...' : 'Đang tải dữ liệu đơn hàng...'}
                    </p>
                  </div>
                )}

                {ordersError && (
                  <div
                    className={`border p-6 rounded-3xl text-center flex flex-col items-center gap-3 ${
                      isDark
                        ? 'bg-[#151210] border-red-500/20 text-red-400'
                        : 'bg-white border-red-200 text-red-500'
                    }`}
                  >
                    <AlertCircle size={28} />
                    <p className="font-semibold text-sm">{ordersError}</p>
                    <button
                      onClick={fetchUserOrders}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        isDark
                          ? 'bg-white/5 border-white/10 hover:bg-white/10 text-zinc-300'
                          : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-700'
                      }`}
                    >
                      {lang === 'en' ? 'Retry' : 'Thử lại'}
                    </button>
                  </div>
                )}

                {!ordersLoading && !ordersError && filteredOrders.length === 0 && (
                  <div
                    className={`border border-dashed rounded-3xl py-16 px-6 text-center space-y-3 ${
                      isDark ? 'bg-[#151210]/50 border-white/10' : 'bg-white border-zinc-200'
                    }`}
                  >
                    <div className="w-14 h-14 bg-zinc-500/10 rounded-full flex items-center justify-center mx-auto text-zinc-500">
                      <Package size={26} />
                    </div>
                    <div className="space-y-1">
                      <h4
                        className={`text-base font-extrabold uppercase ${
                          isDark ? 'text-white' : 'text-zinc-800'
                        }`}
                      >
                        {lang === 'en' ? 'No orders found' : 'Không tìm thấy đơn hàng nào'}
                      </h4>
                      <p className="text-zinc-500 text-xs font-medium max-w-sm mx-auto leading-relaxed">
                        {lang === 'en'
                          ? 'Please check your search keyword or place a new order from the menu.'
                          : 'Vui lòng kiểm tra lại từ khóa tìm kiếm hoặc đặt món ngay tại thực đơn.'}
                      </p>
                    </div>
                  </div>
                )}

                {!ordersLoading && !ordersError && filteredOrders.length > 0 && (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => {
                      const isExpanded = !!expandedOrders[order.order_id];
                      return (
                        <div
                          key={order.order_id}
                          className={`border transition-all duration-300 rounded-3xl overflow-hidden ${
                            isExpanded
                              ? isDark
                                ? 'border-white/15 bg-[#151210] shadow-xl'
                                : 'border-zinc-300 bg-white shadow-md'
                              : isDark
                              ? 'border-white/[0.07] bg-[#151210] hover:border-white/15'
                              : 'border-zinc-200/90 bg-white hover:border-zinc-300 shadow-sm'
                          }`}
                        >
                          {/* Row Header */}
                          <div
                            onClick={() => toggleExpand(order.order_id)}
                            className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                                  isDark
                                    ? 'bg-white/[0.04] border border-white/[0.08] text-[#f5c043]'
                                    : 'bg-[#007a3f]/10 text-[#007a3f]'
                                }`}
                              >
                                <Package size={20} />
                              </div>
                              <div>
                                <div className="flex items-center gap-3 flex-wrap">
                                  <h4
                                    className={`text-base font-extrabold uppercase tracking-wide ${
                                      isDark ? 'text-white' : 'text-zinc-900'
                                    }`}
                                  >
                                    {lang === 'en' ? 'Order' : 'Đơn hàng'} #{order.order_id}
                                  </h4>
                                  {getStatusBadge(order.order_status)}
                                </div>
                                <p className="text-zinc-500 text-xs font-medium mt-1">
                                  {lang === 'en' ? 'Placed on:' : 'Ngày đặt:'} {formatDateTime(order.created_at)}
                                </p>
                              </div>
                            </div>

                            <div
                              className={`flex items-center justify-between md:justify-end gap-5 border-t md:border-t-0 pt-3 md:pt-0 ${
                                isDark ? 'border-white/[0.07]' : 'border-zinc-100'
                              }`}
                            >
                              <div className="text-left md:text-right">
                                <span className="text-[10px] text-zinc-500 font-bold tracking-wider uppercase block">
                                  {lang === 'en' ? 'Total Payment' : 'Tổng thanh toán'}
                                </span>
                                <span
                                  className={`text-lg font-black ${
                                    isDark ? 'text-[#f5c043]' : 'text-[#007a3f]'
                                  }`}
                                >
                                  {formatPrice(order.total_order)}
                                </span>
                              </div>

                              <span
                                className={`w-8 h-8 rounded-full border flex items-center justify-center ${
                                  isDark
                                    ? 'bg-white/[0.04] border-white/[0.08] text-zinc-400'
                                    : 'bg-zinc-50 border-zinc-200 text-zinc-600'
                                }`}
                              >
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </span>
                            </div>
                          </div>

                          {/* Collapsible Details */}
                          {isExpanded && (
                            <div
                              className={`border-t p-6 md:p-7 space-y-7 animate-fadeIn transition-colors duration-300 ${
                                isDark
                                  ? 'border-white/[0.07] bg-[#0e0c0a]/60 text-zinc-300'
                                  : 'border-zinc-100 bg-zinc-50/50 text-zinc-700'
                              }`}
                            >
                              <PizzaTracker
                                order={order}
                                isDark={isDark}
                                onRefresh={silentRefreshOrders}
                                refreshing={refreshingOrders}
                              />

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                <div className="space-y-3.5">
                                  <h5
                                    className={`text-xs font-black uppercase tracking-wider block border-b pb-2 ${
                                      isDark
                                        ? 'text-[#f5c043] border-white/[0.07]'
                                        : 'text-[#007a3f] border-zinc-200'
                                    }`}
                                  >
                                    {lang === 'en' ? 'RECIPIENT INFORMATION' : 'THÔNG TIN NHẬN HÀNG'}
                                  </h5>
                                  <div className="space-y-2.5 font-medium">
                                    <div className="flex items-start gap-2.5">
                                      <User size={15} className="text-zinc-500 mt-0.5 shrink-0" />
                                      <span>
                                        {lang === 'en' ? 'Recipient:' : 'Người nhận:'}{' '}
                                        <strong className={isDark ? 'text-white' : 'text-zinc-900'}>
                                          {order.customer_name}
                                        </strong>
                                      </span>
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                      <Phone size={15} className="text-zinc-500 mt-0.5 shrink-0" />
                                      <span>
                                        {lang === 'en' ? 'Phone:' : 'Số điện thoại:'}{' '}
                                        <strong className={isDark ? 'text-white' : 'text-zinc-900'}>
                                          {order.customer_phone}
                                        </strong>
                                      </span>
                                    </div>
                                    {order.customer_email && (
                                      <div className="flex items-start gap-2.5">
                                        <Mail size={15} className="text-zinc-500 mt-0.5 shrink-0" />
                                        <span className="break-all">
                                          Email: <span className="text-zinc-500">{order.customer_email}</span>
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex items-start gap-2.5">
                                      <MapPin size={15} className="text-zinc-500 mt-0.5 shrink-0" />
                                      <span>
                                        {order.order_type === 'delivery' ? (
                                          <>
                                            {lang === 'en' ? 'Address:' : 'Địa chỉ:'}{' '}
                                            <strong className={isDark ? 'text-white' : 'text-zinc-900'}>
                                              {order.user_address?.address_line ||
                                                (lang === 'en' ? 'Home Delivery' : 'Giao hàng tận nơi')}
                                            </strong>
                                          </>
                                        ) : (
                                          <>
                                            {lang === 'en' ? 'Method:' : 'Hình thức:'}{' '}
                                            <strong className={isDark ? 'text-white' : 'text-zinc-900'}>
                                              {lang === 'en' ? 'Store Pickup' : 'Nhận tại cửa hàng'}
                                            </strong>
                                            {order.store?.address && (
                                              <span
                                                className={`block mt-1 text-xs ${
                                                  isDark ? 'text-zinc-400' : 'text-zinc-500'
                                                }`}
                                              >
                                                {lang === 'en' ? 'Branch:' : 'Chi nhánh:'} {order.store.store_name} –{' '}
                                                {order.store.address}
                                              </span>
                                            )}
                                          </>
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-3.5">
                                  <h5
                                    className={`text-xs font-black uppercase tracking-wider block border-b pb-2 ${
                                      isDark
                                        ? 'text-[#f5c043] border-white/[0.07]'
                                        : 'text-[#007a3f] border-zinc-200'
                                    }`}
                                  >
                                    {lang === 'en' ? 'PAYMENT & SCHEDULE' : 'THANH TOÁN & THỜI GIAN'}
                                  </h5>
                                  <div className="space-y-2.5 font-medium">
                                    <div className="flex items-start gap-2.5">
                                      <CreditCard size={15} className="text-zinc-500 mt-0.5 shrink-0" />
                                      <span>
                                        {lang === 'en' ? 'Method:' : 'Phương thức:'}{' '}
                                        <strong className={isDark ? 'text-white' : 'text-zinc-900'}>
                                          {order.payment_method === 'vietqr'
                                            ? lang === 'en'
                                              ? 'VietQR Bank Transfer'
                                              : 'Chuyển khoản VietQR'
                                            : lang === 'en'
                                            ? 'Cash on Delivery (COD)'
                                            : 'Thanh toán khi nhận hàng (COD)'}
                                        </strong>
                                      </span>
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                      <Clock size={15} className="text-zinc-500 mt-0.5 shrink-0" />
                                      <span>
                                        {lang === 'en' ? 'Payment status:' : 'Trạng thái thanh toán:'}{' '}
                                        <strong
                                          className={
                                            order.payment_status === 'paid'
                                              ? 'text-emerald-500 font-bold'
                                              : 'text-amber-500 font-bold'
                                          }
                                        >
                                          {order.payment_status === 'paid'
                                            ? lang === 'en'
                                              ? 'Paid'
                                              : 'Đã thanh toán'
                                            : lang === 'en'
                                            ? 'Unpaid'
                                            : 'Chưa thanh toán'}
                                        </strong>
                                      </span>
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                      <Calendar size={15} className="text-zinc-500 mt-0.5 shrink-0" />
                                      <span>
                                        {order.pickup_time ? (
                                          <>
                                            {lang === 'en' ? 'Scheduled pickup:' : 'Giờ hẹn nhận bánh:'}{' '}
                                            <strong className={isDark ? 'text-white' : 'text-zinc-900'}>
                                              {formatDateTime(order.pickup_time)}
                                            </strong>
                                          </>
                                        ) : order.estimated_delivery_time ? (
                                          <>
                                            {lang === 'en' ? 'Estimated delivery:' : 'Dự kiến giao:'}{' '}
                                            <strong className={isDark ? 'text-white' : 'text-zinc-900'}>
                                              {formatDateTime(order.estimated_delivery_time)}
                                            </strong>
                                          </>
                                        ) : (
                                          <>
                                            {lang === 'en' ? 'Delivery time:' : 'Thời gian giao:'}{' '}
                                            <strong className={isDark ? 'text-white' : 'text-zinc-900'}>
                                              {lang === 'en'
                                                ? 'Standard Delivery (30 – 45 mins)'
                                                : 'Giao hàng tiêu chuẩn (30 – 45 phút)'}
                                            </strong>
                                          </>
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {order.order_note && (
                                <div
                                  className={`p-4 rounded-2xl flex items-start gap-3 border ${
                                    isDark
                                      ? 'bg-[#151210] border-white/[0.06]'
                                      : 'bg-white border-zinc-200'
                                  }`}
                                >
                                  <FileText size={16} className="text-zinc-500 mt-0.5 shrink-0" />
                                  <div className="text-xs font-medium text-left">
                                    <span
                                      className={`block uppercase tracking-wider font-bold mb-1 ${
                                        isDark ? 'text-zinc-400' : 'text-zinc-500'
                                      }`}
                                    >
                                      {lang === 'en' ? 'Order Note:' : 'Ghi chú đơn hàng:'}
                                    </span>
                                    <p className={`leading-relaxed italic ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                                      &ldquo;{order.order_note}&rdquo;
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Order Items & Totals Section */}
                              <div
                                className={`grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t ${
                                  isDark ? 'border-white/[0.07]' : 'border-zinc-200'
                                }`}
                              >
                                {/* Left: Dishes List */}
                                <div className="lg:col-span-7 space-y-3.5">
                                  <h5
                                    className={`text-xs font-black uppercase tracking-wider block border-b pb-2 ${
                                      isDark
                                        ? 'text-[#f5c043] border-white/[0.07]'
                                        : 'text-[#007a3f] border-zinc-200'
                                    }`}
                                  >
                                    {lang === 'en' ? 'ORDERED ITEMS' : 'DANH SÁCH MÓN ĐÃ ĐẶT'}
                                  </h5>

                                  <div
                                    className={`divide-y border p-5 rounded-2xl ${
                                      isDark
                                        ? 'divide-white/[0.06] bg-[#151210] border-white/[0.06]'
                                        : 'divide-zinc-200/80 bg-white border-zinc-200'
                                    }`}
                                  >
                                    {order.items.map((item) => {
                                      let dishName = '';
                                      let imageSrc =
                                        'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=100&auto=format&fit=crop';
                                      let itemSpec = '';

                                      const isCombo = !!item.combo_id;
                                      const isHalfHalf = !!item.is_half_half;

                                      if (isCombo) {
                                        dishName = item.combo?.combo_name || `Combo #${item.combo_id}`;
                                        const comboImg = item.combo?.image_combo;
                                        imageSrc = comboImg
                                          ? comboImg.startsWith('http')
                                            ? comboImg
                                            : `${backendUrl}${comboImg}`
                                          : 'https://images.unsplash.com/photo-1579751626657-72bc17010498?q=80&w=100&auto=format&fit=crop';
                                      } else if (isHalfHalf) {
                                        dishName = 'Pizza Half & Half';
                                        imageSrc =
                                          'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?q=80&w=100&auto=format&fit=crop';
                                        const size = item.dish_price?.size?.size_name;
                                        const crust = item.dish_price?.crust?.crust_name;
                                        itemSpec = `${size ? `${lang === 'en' ? 'Size' : 'Cỡ'}: ${td(size)}` : ''}${
                                          crust && crust.toLowerCase() !== 'none'
                                            ? ` • ${lang === 'en' ? 'Crust' : 'Đế'}: ${td(crust)}`
                                            : ''
                                        }`;
                                      } else {
                                        dishName = td(
                                          item.dish_price?.dish?.dish_name || (lang === 'en' ? 'Dish' : 'Món ăn')
                                        );
                                        const dishImg = item.dish_price?.dish?.image;
                                        imageSrc = dishImg
                                          ? dishImg.startsWith('http')
                                            ? dishImg
                                            : `${backendUrl}${dishImg}`
                                          : imageSrc;
                                        const isPizza = dishName.toLowerCase().includes('pizza');
                                        if (isPizza) {
                                          const size = item.dish_price?.size?.size_name;
                                          const crust = item.dish_price?.crust?.crust_name;
                                          itemSpec = `${size ? `${lang === 'en' ? 'Size' : 'Cỡ'}: ${td(size)}` : ''}${
                                            crust && crust.toLowerCase() !== 'none'
                                              ? ` • ${lang === 'en' ? 'Crust' : 'Đế'}: ${td(crust)}`
                                              : ''
                                          }`;
                                        }
                                      }

                                      return (
                                        <div key={item.order_item_id} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                                          <div
                                            className={`relative w-14 h-14 rounded-full overflow-hidden border shrink-0 shadow-sm ${
                                              isDark ? 'border-white/10' : 'border-zinc-200'
                                            }`}
                                          >
                                            <Image
                                              src={imageSrc}
                                              alt={dishName}
                                              fill
                                              className="object-cover"
                                              unoptimized={shouldBypassNextImageOptimization(imageSrc)}
                                            />
                                          </div>

                                          <div className="flex-1 flex flex-col justify-start text-left">
                                            <div className="space-y-0.5">
                                              <h4
                                                className={`font-extrabold text-sm md:text-[15px] leading-snug ${
                                                  isDark ? 'text-white' : 'text-zinc-900'
                                                }`}
                                              >
                                                {dishName}
                                              </h4>
                                              <div
                                                className={`text-xs font-semibold ${
                                                  isDark ? 'text-zinc-400' : 'text-zinc-500'
                                                }`}
                                              >
                                                {lang === 'en' ? 'Quantity:' : 'Số lượng:'} x{item.quantity}
                                              </div>

                                              {itemSpec && (
                                                <p
                                                  className={`text-xs font-medium ${
                                                    isDark ? 'text-zinc-400' : 'text-zinc-500'
                                                  }`}
                                                >
                                                  {itemSpec}
                                                </p>
                                              )}

                                              {isCombo && item.combos && item.combos.length > 0 && (
                                                <div
                                                  className={`mt-2 pl-3 border-l-2 text-xs space-y-1.5 ${
                                                    isDark
                                                      ? 'border-[#f5c043]/30 text-zinc-400'
                                                      : 'border-[#007a3f]/30 text-zinc-600'
                                                  }`}
                                                >
                                                  {item.combos.map((combItem, cIdx) => {
                                                    const cName = td(
                                                      combItem.dish_price?.dish?.dish_name ||
                                                        (lang === 'en' ? 'Dish' : 'Món ăn')
                                                    );
                                                    const cSize = combItem.dish_price?.size?.size_name;
                                                    const cCrust = combItem.dish_price?.crust?.crust_name;
                                                    const cIsPizza = cName.toLowerCase().includes('pizza');
                                                    const cSpec =
                                                      cIsPizza && (cSize || cCrust)
                                                        ? `${cSize ? `${lang === 'en' ? 'Size' : 'Cỡ'}: ${td(cSize)}` : ''}${
                                                            cCrust && cCrust.toLowerCase() !== 'none'
                                                              ? ` • ${lang === 'en' ? 'Crust' : 'Đế'}: ${td(cCrust)}`
                                                              : ''
                                                          }`
                                                        : '';
                                                    return (
                                                      <div key={cIdx} className="space-y-0.5">
                                                        <p
                                                          className={`font-bold ${
                                                            isDark ? 'text-zinc-200' : 'text-zinc-800'
                                                          }`}
                                                        >
                                                          {cIdx + 1}.{' '}
                                                          {combItem.is_half_half ? 'Pizza Half & Half' : cName}
                                                        </p>

                                                        <div className="pl-3 text-[11px] text-zinc-500 space-y-0.5">
                                                          {cSpec && <p>{cSpec}</p>}

                                                          {combItem.is_half_half && combItem.halves && (
                                                            <div className="pl-2 border-l border-zinc-400/30 py-0.5 space-y-1">
                                                              {combItem.halves.map((ch, chIdx) => (
                                                                <div key={chIdx}>
                                                                  <span className="text-zinc-500">
                                                                    {lang === 'en' ? 'Half' : 'Nửa'} {chIdx + 1}:{' '}
                                                                  </span>
                                                                  <span
                                                                    className={`font-semibold ${
                                                                      isDark ? 'text-zinc-300' : 'text-zinc-700'
                                                                    }`}
                                                                  >
                                                                    {td(ch.dish?.dish_name || '')}
                                                                  </span>
                                                                  {ch.order_item_toppings &&
                                                                    ch.order_item_toppings.length > 0 && (
                                                                      <span className="block pl-3 text-[10px] text-zinc-500 italic">
                                                                        + Topping:{' '}
                                                                        {ch.order_item_toppings
                                                                          .map(
                                                                            (t) =>
                                                                              `${td(t.topping?.topping_name || '')} (+${formatPrice(
                                                                                t.topping_price
                                                                              )})`
                                                                          )
                                                                          .join(', ')}
                                                                      </span>
                                                                    )}
                                                                </div>
                                                              ))}
                                                            </div>
                                                          )}

                                                          {combItem.toppings && combItem.toppings.length > 0 && (
                                                            <p className="text-zinc-500 italic">
                                                              + Topping:{' '}
                                                              {combItem.toppings
                                                                .map(
                                                                  (t) =>
                                                                    `${td(t.topping?.topping_name || '')} (+${formatPrice(
                                                                      t.topping_price
                                                                    )})`
                                                                )
                                                                .join(', ')}
                                                            </p>
                                                          )}
                                                        </div>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              )}

                                              {!isCombo && isHalfHalf && item.halves && item.halves.length > 0 && (
                                                <div
                                                  className={`mt-2 pl-3 border-l-2 text-xs space-y-1.5 ${
                                                    isDark
                                                      ? 'border-[#f5c043]/30 text-zinc-400'
                                                      : 'border-[#007a3f]/30 text-zinc-600'
                                                  }`}
                                                >
                                                  {item.halves.map((half, hIdx) => (
                                                    <div key={hIdx}>
                                                      <span>
                                                        {lang === 'en' ? 'Half' : 'Nửa'} {hIdx + 1}:{' '}
                                                      </span>
                                                      <span
                                                        className={`font-bold ${
                                                          isDark ? 'text-white' : 'text-zinc-900'
                                                        }`}
                                                      >
                                                        {td(half.dish?.dish_name || '')}
                                                      </span>
                                                      {half.order_item_toppings &&
                                                        half.order_item_toppings.length > 0 && (
                                                          <span className="text-zinc-500 block ml-3 italic">
                                                            + Topping:{' '}
                                                            {half.order_item_toppings
                                                              .map(
                                                                (t) =>
                                                                  `${td(t.topping?.topping_name || '')} (+${formatPrice(
                                                                    t.topping_price
                                                                  )})`
                                                              )
                                                              .join(', ')}
                                                          </span>
                                                        )}
                                                    </div>
                                                  ))}
                                                </div>
                                              )}

                                              {!isCombo && item.toppings && item.toppings.length > 0 && (
                                                <p className="text-xs text-zinc-500 font-medium pt-1">
                                                  + Topping:{' '}
                                                  {item.toppings
                                                    .map(
                                                      (t) =>
                                                        `${td(t.topping?.topping_name || '')} (+${formatPrice(
                                                          t.topping_price
                                                        )})`
                                                    )
                                                    .join(', ')}
                                                </p>
                                              )}

                                              {item.order_item_note && (
                                                <p
                                                  className={`text-xs border px-2.5 py-1 mt-1.5 rounded-lg inline-block font-medium ${
                                                    isDark
                                                      ? 'bg-red-500/10 text-red-300 border-red-500/20'
                                                      : 'bg-red-50 text-red-600 border-red-200'
                                                  }`}
                                                >
                                                  {lang === 'en' ? 'Item note:' : 'Ghi chú món:'} {item.order_item_note}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Right: Order Summary */}
                                <div className="lg:col-span-5 flex flex-col justify-start space-y-3.5">
                                  <h5
                                    className={`text-xs font-black uppercase tracking-wider block border-b pb-2 ${
                                      isDark
                                        ? 'text-[#f5c043] border-white/[0.07]'
                                        : 'text-[#007a3f] border-zinc-200'
                                    }`}
                                  >
                                    {lang === 'en' ? 'ORDER SUMMARY' : 'TỔNG KẾT ĐƠN HÀNG'}
                                  </h5>

                                  <div
                                    className={`border p-5 rounded-2xl space-y-3 text-sm font-semibold ${
                                      isDark
                                        ? 'bg-[#151210] border-white/[0.07] text-zinc-300'
                                        : 'bg-white border-zinc-200 text-zinc-700'
                                    }`}
                                  >
                                    <div className="flex justify-between items-center text-zinc-500 gap-4">
                                      <span>{lang === 'en' ? 'Subtotal:' : 'Tạm tính:'}</span>
                                      <span className={isDark ? 'text-white' : 'text-zinc-900'}>
                                        {formatPrice(order.total_price_dish)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-zinc-500 gap-4">
                                      <span>{lang === 'en' ? 'Delivery fee:' : 'Phí giao hàng:'}</span>
                                      {order.shipping_fee > 0 ? (
                                        <span className={isDark ? 'text-white' : 'text-zinc-900'}>
                                          {formatPrice(order.shipping_fee)}
                                        </span>
                                      ) : (
                                        <span className="text-emerald-500 font-bold">
                                          {lang === 'en' ? 'Free' : 'Miễn phí'}
                                        </span>
                                      )}
                                    </div>
                                    {order.discount_amount > 0 && (
                                      <div className="flex justify-between items-center text-red-500 gap-4">
                                        <span>{lang === 'en' ? 'Discount:' : 'Giảm giá:'}</span>
                                        <span>-{formatPrice(order.discount_amount)}</span>
                                      </div>
                                    )}
                                    <div
                                      className={`flex justify-between items-center text-base font-black pt-3 border-t gap-4 ${
                                        isDark ? 'border-white/[0.07]' : 'border-zinc-200'
                                      }`}
                                    >
                                      <span className={isDark ? 'text-[#f5c043]' : 'text-[#007a3f]'}>
                                        {lang === 'en' ? 'TOTAL PAYMENT:' : 'TỔNG THANH TOÁN:'}
                                      </span>
                                      <span
                                        className={`text-lg ${
                                          isDark ? 'text-[#f5c043]' : 'text-[#007a3f]'
                                        }`}
                                      >
                                        {formatPrice(order.total_order)}
                                      </span>
                                    </div>
                                  </div>

                                  {order.payment_method === 'vietqr' &&
                                    order.payment_status !== 'paid' &&
                                    order.order_status.toLowerCase() !== 'cancelled' && (
                                      <div
                                        className={`p-4 rounded-2xl border flex flex-col items-center text-center gap-2.5 ${
                                          isDark
                                            ? 'bg-[#1a1408] border-[#f5c043]/25 text-zinc-200'
                                            : 'bg-amber-50/70 border-amber-200 text-zinc-800'
                                        }`}
                                      >
                                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-500">
                                          {lang === 'en'
                                            ? 'Scan VietQR to pay now'
                                            : 'Quét mã VietQR để thanh toán ngay'}
                                        </span>
                                        <div className="w-44 h-44 bg-white p-2 rounded-xl border border-zinc-200 shadow-sm">
                                          <img
                                            src={`https://qr.sepay.vn/img?acc=0944368230&bank=MB&amount=${order.total_order}&des=PIZZA_INN_${order.order_id}`}
                                            alt={`VietQR #${order.order_id}`}
                                            className="w-full h-full object-contain"
                                          />
                                        </div>
                                        <div className="text-[11px] leading-relaxed">
                                          <p className="font-bold">MB Bank • 0944368230 • PIZZA&amp;PASTA INN</p>
                                          <p>
                                            {lang === 'en' ? 'Transfer note:' : 'Nội dung CK:'}{' '}
                                            <strong className="font-mono">PIZZA_INN_{order.order_id}</strong>
                                          </p>
                                        </div>
                                      </div>
                                    )}

                                  <div className="space-y-2.5 pt-1">
                                    <button
                                      type="button"
                                      disabled={reorderingId === order.order_id}
                                      onClick={() => handleReorder(order)}
                                      className="w-full bg-[#ee2828] hover:bg-[#d82020] text-white font-extrabold text-xs tracking-wider uppercase py-3.5 rounded-2xl shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                                    >
                                      <RotateCcw size={15} className={reorderingId === order.order_id ? 'animate-spin' : ''} />
                                      <span>
                                        {reorderingId === order.order_id
                                          ? lang === 'en'
                                            ? 'Adding to cart...'
                                            : 'Đang thêm vào giỏ...'
                                          : lang === 'en'
                                          ? 'Reorder This Order'
                                          : 'Đặt lại đơn này'}
                                      </span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        printOrderReceipt({
                                          order_id: order.order_id,
                                          created_at: order.created_at,
                                          order_type: order.order_type,
                                          payment_method: order.payment_method,
                                          payment_status: order.payment_status,
                                          order_status: order.order_status,
                                          customer_name: order.customer_name,
                                          customer_phone: order.customer_phone,
                                          customer_email: order.customer_email,
                                          customer_address: order.user_address?.address_line,
                                          store_name: order.store?.store_name,
                                          order_note: order.order_note,
                                          subtotal: order.total_price_dish,
                                          shipping_fee: order.shipping_fee,
                                          discount_amount: order.discount_amount,
                                          total_order: order.total_order,
                                          items: (order.items || []).map((it) => {
                                            const unitPrice = Number(it.order_price || 0);
                                            const qty = Number(it.quantity || 1);
                                            const title = it.combo_id
                                              ? it.combo?.combo_name || 'Combo'
                                              : it.is_half_half
                                              ? 'Pizza Half & Half'
                                              : it.dish_price?.dish?.dish_name || 'Món ăn';
                                            return {
                                              name: title,
                                              quantity: qty,
                                              totalPrice: unitPrice * qty,
                                              note: it.order_item_note,
                                            };
                                          }),
                                        })
                                      }
                                      className={`w-full font-bold text-xs tracking-wider uppercase py-3 rounded-2xl border transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer ${
                                        isDark
                                          ? 'bg-white/5 hover:bg-white/10 border-white/15 text-zinc-200'
                                          : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-700'
                                      }`}
                                    >
                                      <Printer size={14} />
                                      <span>{lang === 'en' ? 'Print / Save Receipt (PDF)' : 'In / Lưu biên lai (PDF)'}</span>
                                    </button>

                                    {(order.order_status.toLowerCase() === 'completed' ||
                                      order.order_status.toLowerCase() === 'arrived') && (
                                      <button
                                        type="button"
                                        onClick={() => router.push(`/reviews?order_id=${order.order_id}`)}
                                        className={`w-full font-bold text-xs tracking-wider uppercase py-3.5 rounded-2xl shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer ${
                                          isDark
                                            ? 'bg-[#f5c043] hover:bg-[#e5b33c] text-zinc-950'
                                            : 'bg-[#007a3f] hover:bg-[#006030] text-white'
                                        }`}
                                      >
                                        <span>{lang === 'en' ? 'Rate This Order' : 'Đánh giá đơn hàng'}</span>
                                      </button>
                                    )}

                                    {order.order_status.toLowerCase() === 'pending' && (
                                      <button
                                        type="button"
                                        disabled={cancellingId === order.order_id}
                                        onClick={() => handleCancelOrder(order)}
                                        className={`w-full font-bold text-xs tracking-wider uppercase py-3 rounded-2xl border transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 ${
                                          isDark
                                            ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-400'
                                            : 'bg-red-50 hover:bg-red-100 border-red-200 text-red-600'
                                        }`}
                                      >
                                        <Ban size={14} />
                                        <span>
                                          {cancellingId === order.order_id
                                            ? lang === 'en'
                                              ? 'Cancelling...'
                                              : 'Đang hủy đơn...'
                                            : lang === 'en'
                                            ? 'Cancel Order'
                                            : 'Hủy đơn hàng'}
                                        </span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Đổi mật khẩu */}
            {activeTab === 'password' && (
              <div className="space-y-6 animate-fadeIn">
                <div
                  className={`border transition-all duration-300 rounded-3xl p-6 md:p-8 relative overflow-hidden ${
                    isDark
                      ? 'bg-[#151210] border-white/[0.08] shadow-xl'
                      : 'bg-white border-zinc-200/90 shadow-sm'
                  }`}
                >
                  <div className="relative z-10 space-y-6 max-w-xl">
                    <h2
                      className={`text-base font-bold border-b pb-3.5 ${
                        isDark
                          ? 'text-white border-white/[0.07]'
                          : 'text-zinc-900 border-zinc-100'
                      }`}
                    >
                      {lang === 'en' ? 'Change Password' : 'Đổi mật khẩu bảo mật'}
                    </h2>

                    {passwordMessage && (
                      <div
                        className={`p-4 rounded-2xl flex items-start gap-3 border text-sm font-semibold ${
                          passwordMessage.type === 'success'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                            : 'bg-red-500/10 border-red-500/20 text-red-500'
                        }`}
                      >
                        {passwordMessage.type === 'success' ? (
                          <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        )}
                        <span>{passwordMessage.text}</span>
                      </div>
                    )}

                    <form onSubmit={handleChangePassword} className="space-y-5">
                      <div className="space-y-1.5">
                        <label
                          className={`text-xs font-bold uppercase tracking-wider block ${
                            isDark ? 'text-zinc-300' : 'text-zinc-700'
                          }`}
                        >
                          {lang === 'en' ? 'Current Password' : 'Mật khẩu hiện tại'}{' '}
                          <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                            <Lock size={16} />
                          </span>
                          <input
                            type="password"
                            required
                            placeholder={lang === 'en' ? 'Enter current password' : 'Nhập mật khẩu hiện tại'}
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            className={`w-full border rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:outline-none transition-colors ${
                              isDark
                                ? 'bg-[#0e0c0a] border-white/10 focus:border-[#f5c043] text-white placeholder-zinc-600'
                                : 'bg-white border-zinc-300 focus:border-[#007a3f] focus:ring-1 focus:ring-[#007a3f] text-zinc-900 placeholder-zinc-400'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label
                          className={`text-xs font-bold uppercase tracking-wider block ${
                            isDark ? 'text-zinc-300' : 'text-zinc-700'
                          }`}
                        >
                          {lang === 'en' ? 'New Password' : 'Mật khẩu mới'}{' '}
                          <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                            <Lock size={16} />
                          </span>
                          <input
                            type="password"
                            required
                            placeholder={lang === 'en' ? 'At least 6 characters' : 'Tối thiểu 6 ký tự'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className={`w-full border rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:outline-none transition-colors ${
                              isDark
                                ? 'bg-[#0e0c0a] border-white/10 focus:border-[#f5c043] text-white placeholder-zinc-600'
                                : 'bg-white border-zinc-300 focus:border-[#007a3f] focus:ring-1 focus:ring-[#007a3f] text-zinc-900 placeholder-zinc-400'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label
                          className={`text-xs font-bold uppercase tracking-wider block ${
                            isDark ? 'text-zinc-300' : 'text-zinc-700'
                          }`}
                        >
                          {lang === 'en' ? 'Confirm New Password' : 'Xác nhận mật khẩu mới'}{' '}
                          <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                            <Lock size={16} />
                          </span>
                          <input
                            type="password"
                            required
                            placeholder={lang === 'en' ? 'Re-enter new password' : 'Nhập lại mật khẩu mới'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`w-full border rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:outline-none transition-colors ${
                              isDark
                                ? 'bg-[#0e0c0a] border-white/10 focus:border-[#f5c043] text-white placeholder-zinc-600'
                                : 'bg-white border-zinc-300 focus:border-[#007a3f] focus:ring-1 focus:ring-[#007a3f] text-zinc-900 placeholder-zinc-400'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={passwordLoading}
                          className="bg-[#007a3f] hover:bg-[#006030] text-white font-bold text-xs tracking-wider uppercase px-6 py-3.5 rounded-xl shadow active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-55 cursor-pointer"
                        >
                          {passwordLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                          {lang === 'en' ? 'Update Password' : 'Cập nhật mật khẩu'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Kho ưu đãi & Tích điểm */}
            {activeTab === 'vouchers' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Thẻ Thành Viên & Điểm Tích Lũy */}
                {loyaltySummary && (
                  <div
                    className={`rounded-3xl p-6 md:p-7 border relative overflow-hidden ${
                      isDark
                        ? 'bg-gradient-to-br from-[#1f1911] via-[#151210] to-[#0e0c0a] border-[#f5c043]/30'
                        : 'bg-gradient-to-br from-[#007a3f] to-[#00582d] text-white border-[#007a3f]'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-extrabold uppercase tracking-wider">
                          <Award size={15} className={isDark ? 'text-[#f5c043]' : 'text-[#ffd166]'} />
                          <span>{loyaltySummary.tier_name}</span>
                        </div>
                        <h3 className={`text-2xl md:text-3xl font-black ${isDark ? 'text-white' : 'text-white'}`}>
                          {loyaltySummary.available_points}{' '}
                          {lang === 'en' ? 'available points' : 'điểm khả dụng'}
                        </h3>
                        <p className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-white/85'}`}>
                          {lang === 'en' ? 'Direct discount at checkout:' : 'Quy đổi trực tiếp khi thanh toán:'}{' '}
                          <strong className={isDark ? 'text-[#f5c043]' : 'text-[#ffd166]'}>
                            {formatPrice(
                              loyaltySummary.max_redeemable_vnd ??
                                loyaltySummary.available_points * (loyaltySummary.point_value_vnd || 1000)
                            )}
                          </strong>{' '}
                          {lang === 'en'
                            ? `(${formatPrice(loyaltySummary.spend_per_point || 10000)} spent = 1 pt • 1 pt = ${formatPrice(
                                loyaltySummary.point_value_vnd || 1000
                              )})`
                            : `(${formatPrice(loyaltySummary.spend_per_point || 10000)} chi tiêu = 1 điểm • 1 điểm = ${formatPrice(
                                loyaltySummary.point_value_vnd || 1000
                              )})`}
                        </p>
                      </div>

                      <div
                        className={`rounded-2xl p-4 min-w-[240px] border ${
                          isDark
                            ? 'bg-black/40 border-white/10 text-zinc-200'
                            : 'bg-white/10 border-white/20 text-white'
                        }`}
                      >
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="opacity-80">
                            {lang === 'en' ? 'Total accumulated spend:' : 'Tổng chi tiêu tích lũy:'}
                          </span>
                          <span className="font-extrabold">{formatPrice(loyaltySummary.total_spent)}</span>
                        </div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="opacity-80">
                            {lang === 'en' ? 'Total points earned:' : 'Tổng điểm đã tích:'}
                          </span>
                          <span className="font-bold">
                            {loyaltySummary.earned_points} {lang === 'en' ? 'pts' : 'điểm'}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="opacity-80">
                            {lang === 'en' ? 'Points redeemed:' : 'Điểm đã sử dụng:'}
                          </span>
                          <span className="font-bold">
                            {loyaltySummary.redeemed_points} {lang === 'en' ? 'pts' : 'điểm'}
                          </span>
                        </div>
                        {loyaltySummary.next_tier_name && (
                          <div className="mt-3 pt-2.5 border-t border-white/15 text-[11px]">
                            {lang === 'en' ? 'Spend an extra' : 'Cần chi tiêu thêm'}{' '}
                            <strong className={isDark ? 'text-[#f5c043]' : 'text-[#ffd166]'}>
                              {formatPrice(loyaltySummary.amount_to_next_tier)}
                            </strong>{' '}
                            {lang === 'en' ? 'to reach' : 'để thăng hạng'}{' '}
                            <strong>{loyaltySummary.next_tier_name}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Danh sách Voucher đang hoạt động */}
                <div>
                  <h3
                    className={`text-base font-bold mb-3.5 ${
                      isDark ? 'text-white' : 'text-zinc-900'
                    }`}
                  >
                    {lang === 'en'
                      ? `Available Vouchers (${vouchersList.length})`
                      : `Mã giảm giá dành cho bạn (${vouchersList.length})`}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vouchersList.map((v, idx) => {
                      const isRed = idx % 2 === 0;
                      const badgeTitle =
                        v.discount_type === 'percent'
                          ? lang === 'en'
                            ? `${v.discount_value}% OFF`
                            : `GIẢM ${v.discount_value}%`
                          : lang === 'en'
                          ? `${Math.round(v.discount_value / 1000)}K OFF`
                          : `GIẢM ${Math.round(v.discount_value / 1000)}K`;
                      return (
                        <div
                          key={v.code}
                          className={`border rounded-2xl overflow-hidden shadow-sm flex transition-colors duration-300 ${
                            isDark ? 'bg-[#151210] border-white/[0.08]' : 'bg-white border-zinc-200'
                          }`}
                        >
                          <div
                            className={`${
                              isRed ? 'bg-[#ee2828]' : 'bg-[#007a3f]'
                            } w-1/3 flex flex-col justify-center items-center p-4 text-white relative border-r-2 border-dashed border-white/20 text-center`}
                          >
                            <div
                              className={`absolute -top-3 -right-3 w-6 h-6 rounded-full transition-colors duration-300 ${
                                isDark ? 'bg-[#0e0c0a]' : 'bg-[#f6f6f7]'
                              }`}
                            />
                            <div
                              className={`absolute -bottom-3 -right-3 w-6 h-6 rounded-full transition-colors duration-300 ${
                                isDark ? 'bg-[#0e0c0a]' : 'bg-[#f6f6f7]'
                              }`}
                            />
                            <Ticket size={26} className="mb-1.5" />
                            <span className="font-extrabold text-sm leading-tight">{badgeTitle}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-white/85 mt-0.5">
                              {lang === 'en' ? 'MIN ORDER' : 'ĐƠN TỪ'}{' '}
                              {Math.round((v.min_order_value || 0) / 1000)}K
                            </span>
                          </div>
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div className="space-y-1">
                              <h4
                                className={`font-extrabold text-sm uppercase ${
                                  isDark ? 'text-white' : 'text-zinc-900'
                                }`}
                              >
                                {v.title}
                              </h4>
                              <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                                {v.description}
                              </p>
                            </div>
                            <div
                              className={`pt-3 mt-3 border-t flex justify-between items-center text-[11px] font-bold text-zinc-500 ${
                                isDark ? 'border-white/[0.07]' : 'border-zinc-100'
                              }`}
                            >
                              <span className="font-mono font-extrabold text-xs text-[#ee2828]">
                                {v.code}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard?.writeText(v.code);
                                  setCopiedCode(v.code);
                                  setTimeout(() => setCopiedCode(null), 2000);
                                }}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer ${
                                  copiedCode === v.code
                                    ? 'bg-emerald-500 text-white'
                                    : isDark
                                    ? 'bg-[#f5c043]/15 text-[#f5c043] hover:bg-[#f5c043]/25'
                                    : 'bg-[#007a3f]/10 text-[#007a3f] hover:bg-[#007a3f]/20'
                                }`}
                              >
                                <Copy size={12} />
                                {copiedCode === v.code
                                  ? lang === 'en'
                                    ? 'Copied'
                                    : 'Đã chép mã'
                                  : lang === 'en'
                                  ? 'Copy Code'
                                  : 'Sao chép mã'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Món yêu thích */}
            {activeTab === 'wishlist' && (
              <div className="space-y-6 animate-fadeIn">
                {wishlistItems.length === 0 ? (
                  <div
                    className={`border rounded-3xl p-10 text-center space-y-4 ${
                      isDark ? 'bg-[#151210] border-white/[0.08]' : 'bg-white border-zinc-200'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-full bg-red-500/10 text-[#ee2828] flex items-center justify-center mx-auto">
                      <Heart size={30} />
                    </div>
                    <div className="space-y-1">
                      <h3 className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                        {lang === 'en' ? 'No favorite dishes yet' : 'Chưa có món ăn yêu thích nào'}
                      </h3>
                      <p className="text-xs text-zinc-500 max-w-md mx-auto">
                        {lang === 'en'
                          ? 'Tap the heart icon on any Pizza, Pasta, or Appetizer on the Menu to save your favorite dishes for next time.'
                          : 'Hãy nhấn vào biểu tượng trái tim trên các món Pizza, Mì Ý hoặc Khai vị tại Thực đơn để lưu lại món tủ của bạn cho những lần đặt sau.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push('/')}
                      className="inline-flex items-center gap-2 bg-[#007a3f] hover:bg-[#006030] text-white font-extrabold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition cursor-pointer"
                    >
                      <ShoppingBag size={15} />
                      <span>{lang === 'en' ? 'Explore Menu Now' : 'Khám phá thực đơn ngay'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {wishlistItems.map((dish) => (
                      <div
                        key={dish.dish_id}
                        className={`border rounded-3xl overflow-hidden flex flex-col justify-between transition-all ${
                          isDark
                            ? 'bg-[#151210] border-white/[0.08] hover:border-[#f5c043]/40'
                            : 'bg-white border-zinc-200 hover:shadow-md'
                        }`}
                      >
                        <div>
                          <div className="relative h-44 w-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                            <img
                              src={
                                dish.image?.startsWith('http')
                                  ? dish.image
                                  : dish.image
                                  ? `${backendUrl}${dish.image}`
                                  : 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=600&auto=format&fit=crop'
                              }
                              alt={td(dish.dish_name)}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeWishlist(dish.dish_id)}
                              title={lang === 'en' ? 'Remove from favorites' : 'Bỏ khỏi danh sách yêu thích'}
                              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#ee2828] text-white flex items-center justify-center shadow-md hover:bg-[#d82020] transition cursor-pointer"
                            >
                              <Heart size={15} className="fill-current" />
                            </button>
                          </div>
                          <div className="p-4 space-y-1.5">
                            <h4
                              className={`font-extrabold text-base line-clamp-1 ${
                                isDark ? 'text-white' : 'text-zinc-900'
                              }`}
                            >
                              {td(dish.dish_name)}
                            </h4>
                            {dish.ingredient && (
                              <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                                {ti(dish.ingredient)}
                              </p>
                            )}
                          </div>
                        </div>

                        <div
                          className={`px-4 pb-4 pt-2 flex items-center justify-between border-t ${
                            isDark ? 'border-white/[0.06]' : 'border-zinc-100'
                          }`}
                        >
                          <div>
                            <span className="text-[10px] text-zinc-400 block">
                              {lang === 'en' ? 'Price from' : 'Giá từ'}
                            </span>
                            <span className="text-sm font-black text-[#ee2828]">
                              {formatPrice(dish.min_price || 0)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => router.push(`/?search=${encodeURIComponent(dish.dish_name)}`)}
                            className="bg-[#007a3f] hover:bg-[#006030] text-white text-xs font-extrabold px-4 py-2 rounded-xl transition cursor-pointer"
                          >
                            {lang === 'en' ? 'Order Now' : 'Đặt món'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal Thêm / Cập nhật địa chỉ */}
      {addressFormOpen && (
        <div
          ref={backdropRef}
          onMouseDown={(e) => {
            if (e.target === backdropRef.current) {
              setAddressFormOpen(false);
              resetAddressInputs();
            }
          }}
          className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-2xl border transition-all duration-300 p-6 md:p-8 rounded-3xl space-y-6 shadow-2xl relative cursor-default ${
              isDark ? 'bg-[#151210] border-white/10' : 'bg-white border-zinc-200'
            }`}
          >
            <div
              className={`flex justify-between items-center border-b pb-3.5 ${
                isDark ? 'border-white/10' : 'border-zinc-200'
              }`}
            >
              <h3
                className={`text-sm font-black tracking-wider uppercase ${
                  isDark ? 'text-[#f5c043]' : 'text-[#007a3f]'
                }`}
              >
                {editingAddressId
                  ? lang === 'en'
                    ? 'Update Delivery Address'
                    : 'Cập nhật địa chỉ giao hàng'
                  : lang === 'en'
                  ? 'Add New Delivery Address'
                  : 'Thêm địa chỉ giao hàng mới'}
              </h3>
              <button
                onClick={() => {
                  setAddressFormOpen(false);
                  resetAddressInputs();
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900'
                }`}
                aria-label={lang === 'en' ? 'Close' : 'Đóng'}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddressSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label
                    className={`text-xs font-bold uppercase tracking-wider block ${
                      isDark ? 'text-zinc-300' : 'text-zinc-700'
                    }`}
                  >
                    {lang === 'en' ? 'Recipient Full Name' : 'Họ và tên người nhận'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={lang === 'en' ? 'Enter recipient full name' : 'Nhập họ và tên người nhận'}
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    className={`w-full border rounded-xl py-3 px-4 text-sm focus:outline-none transition-colors ${
                      isDark
                        ? 'bg-[#0e0c0a] border-white/10 focus:border-[#f5c043] text-white'
                        : 'bg-white border-zinc-300 focus:border-[#007a3f] focus:ring-1 focus:ring-[#007a3f] text-zinc-900'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    className={`text-xs font-bold uppercase tracking-wider block ${
                      isDark ? 'text-zinc-300' : 'text-zinc-700'
                    }`}
                  >
                    {lang === 'en' ? 'Phone Number' : 'Số điện thoại'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder={lang === 'en' ? 'Enter contact phone number' : 'Nhập số điện thoại liên hệ'}
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value)}
                    className={`w-full border rounded-xl py-3 px-4 text-sm focus:outline-none transition-colors ${
                      isDark
                        ? 'bg-[#0e0c0a] border-white/10 focus:border-[#f5c043] text-white'
                        : 'bg-white border-zinc-300 focus:border-[#007a3f] focus:ring-1 focus:ring-[#007a3f] text-zinc-900'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    className={`text-xs font-bold uppercase tracking-wider block ${
                      isDark ? 'text-zinc-300' : 'text-zinc-700'
                    }`}
                  >
                    {lang === 'en' ? 'Email Address' : 'Địa chỉ Email'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder={lang === 'en' ? 'Enter notification email' : 'Nhập email nhận thông báo'}
                    value={receiverEmail}
                    onChange={(e) => setReceiverEmail(e.target.value)}
                    className={`w-full border rounded-xl py-3 px-4 text-sm focus:outline-none transition-colors ${
                      isDark
                        ? 'bg-[#0e0c0a] border-white/10 focus:border-[#f5c043] text-white'
                        : 'bg-white border-zinc-300 focus:border-[#007a3f] focus:ring-1 focus:ring-[#007a3f] text-zinc-900'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    className={`text-xs font-bold uppercase tracking-wider block ${
                      isDark ? 'text-zinc-300' : 'text-zinc-700'
                    }`}
                  >
                    {lang === 'en' ? 'House Number' : 'Số nhà'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={lang === 'en' ? 'E.g. 21' : 'Ví dụ: 21'}
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    className={`w-full border rounded-xl py-3 px-4 text-sm focus:outline-none transition-colors ${
                      isDark
                        ? 'bg-[#0e0c0a] border-white/10 focus:border-[#f5c043] text-white'
                        : 'bg-white border-zinc-300 focus:border-[#007a3f] focus:ring-1 focus:ring-[#007a3f] text-zinc-900'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    className={`text-xs font-bold uppercase tracking-wider block ${
                      isDark ? 'text-zinc-300' : 'text-zinc-700'
                    }`}
                  >
                    {lang === 'en' ? 'Street Name' : 'Tên đường'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={lang === 'en' ? 'E.g. Dao Tan' : 'Ví dụ: Đào Tấn'}
                    value={streetName}
                    onChange={(e) => setStreetName(e.target.value)}
                    className={`w-full border rounded-xl py-3 px-4 text-sm focus:outline-none transition-colors ${
                      isDark
                        ? 'bg-[#0e0c0a] border-white/10 focus:border-[#f5c043] text-white'
                        : 'bg-white border-zinc-300 focus:border-[#007a3f] focus:ring-1 focus:ring-[#007a3f] text-zinc-900'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    className={`text-xs font-bold uppercase tracking-wider block ${
                      isDark ? 'text-zinc-300' : 'text-zinc-700'
                    }`}
                  >
                    {lang === 'en' ? 'Ward / District' : 'Phường / Xã, Quận / Huyện'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={selectedWard && selectedDistrict ? `${selectedWard}, ${selectedDistrict}` : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          const [ward, district] = val.split(', ');
                          setSelectedWard(ward);
                          setSelectedDistrict(district);
                        } else {
                          setSelectedWard('');
                          setSelectedDistrict('');
                        }
                      }}
                      className={`w-full border rounded-xl py-3 pl-4 pr-10 text-sm focus:outline-none transition-colors appearance-none cursor-pointer ${
                        isDark
                          ? 'bg-[#0e0c0a] border-white/10 focus:border-[#f5c043] text-white'
                          : 'bg-white border-zinc-300 focus:border-[#007a3f] focus:ring-1 focus:ring-[#007a3f] text-zinc-900'
                      }`}
                    >
                      <option value="" className={isDark ? 'bg-[#151210]' : 'bg-white'}>
                        {lang === 'en' ? 'Select Ward, District' : 'Chọn Phường/Xã, Quận/Huyện'}
                      </option>
                      {hcmcWardsList.map((item) => (
                        <option
                          key={item.label}
                          value={item.label}
                          className={isDark ? 'bg-[#151210]' : 'bg-white'}
                        >
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                      <ChevronDown size={16} />
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    className={`text-xs font-bold uppercase tracking-wider block ${
                      isDark ? 'text-zinc-300' : 'text-zinc-700'
                    }`}
                  >
                    {lang === 'en' ? 'Province / City' : 'Tỉnh / Thành phố'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled
                    value={province}
                    className={`w-full border rounded-xl py-3 px-4 text-sm focus:outline-none transition-colors ${
                      isDark
                        ? 'bg-white/[0.03] border-white/10 text-zinc-500'
                        : 'bg-zinc-100 border-zinc-300 text-zinc-500'
                    }`}
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  className="bg-[#007a3f] hover:bg-[#006030] text-white font-bold text-xs tracking-wider uppercase px-6 py-3.5 rounded-xl transition-all shadow cursor-pointer"
                >
                  {lang === 'en' ? 'Save Address' : 'Lưu địa chỉ'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddressFormOpen(false);
                    resetAddressInputs();
                  }}
                  className={`font-bold text-xs tracking-wider uppercase px-6 py-3.5 rounded-xl transition-all border cursor-pointer ${
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-300'
                  }`}
                >
                  {lang === 'en' ? 'Cancel' : 'Hủy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác nhận xóa địa chỉ */}
      {deleteConfirmOpen && (
        <div
          ref={deleteBackdropRef}
          onMouseDown={(e) => {
            if (e.target === deleteBackdropRef.current) {
              setDeleteConfirmOpen(false);
              setAddressIdToDelete(null);
            }
          }}
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md border transition-all duration-300 p-6 md:p-8 rounded-3xl space-y-6 shadow-2xl relative cursor-default animate-fadeIn ${
              isDark ? 'bg-[#151210] border-white/10' : 'bg-white border-zinc-200'
            }`}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                <AlertCircle size={28} />
              </div>
              <div className="space-y-1.5">
                <h3
                  className={`text-base font-extrabold uppercase tracking-wide ${
                    isDark ? 'text-white' : 'text-zinc-900'
                  }`}
                >
                  {lang === 'en' ? 'Confirm Delete Address' : 'Xác nhận xóa địa chỉ'}
                </h3>
                <p
                  className={`text-xs font-medium leading-relaxed ${
                    isDark ? 'text-zinc-400' : 'text-zinc-500'
                  }`}
                >
                  {lang === 'en'
                    ? 'Are you sure you want to delete this delivery address? This action cannot be undone.'
                    : 'Bạn có chắc chắn muốn xóa địa chỉ giao hàng này không? Hành động này không thể hoàn tác.'}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setAddressIdToDelete(null);
                }}
                className={`flex-1 font-bold text-xs tracking-wider uppercase px-6 py-3.5 rounded-xl transition-all border cursor-pointer ${
                  isDark
                    ? 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-300'
                }`}
              >
                {lang === 'en' ? 'Cancel' : 'Hủy'}
              </button>
              <button
                type="button"
                onClick={handleDeleteAddress}
                className="flex-1 bg-[#ee2828] hover:bg-[#c02020] text-white font-bold text-xs tracking-wider uppercase px-6 py-3.5 rounded-xl transition-all shadow active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {addressesLoading ? (
                  <Loader2 className="animate-spin w-4 h-4" />
                ) : (
                  <span>{lang === 'en' ? 'Delete Address' : 'Xóa địa chỉ'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
