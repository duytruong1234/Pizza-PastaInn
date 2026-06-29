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
  Camera,
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
  Sun,
  Moon
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { formatPrice } from '@/lib/utils';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/apiError';
import { useUI } from '@/components/UIProvider';
import { BACKEND_URL } from '@/lib/config';

// Complete HCMC District and Wards data
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

// Complete HCMC Wards List combined with District name
const hcmcWardsList = Object.entries(hcmcDistricts).flatMap(([district, wards]) =>
  wards.map((ward) => ({
    label: `${ward}, ${district}`,
    ward: ward,
    district: district
  }))
).sort((a, b) => a.label.localeCompare(b.label, 'vi'));

// Robust parser function to decode standard concatenated addresses
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
      // Fallback
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
  completed_at?: string | null;
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

type TabType = 'general' | 'addresses' | 'orders' | 'password' | 'vouchers';

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, setAuth, clearAuth } = useAuthStore();
  const backendUrl = BACKEND_URL;
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('general');

  // Dark/Light Theme mode toggle state from UIProvider
  const { theme, toggleTheme } = useUI();

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

  // Detailed address inputs matching screenshot
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [province, setProvince] = useState('Thành phố Hồ Chí Minh');
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

  // Lock background scroll when address form popup or delete confirm popup is open
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

  // Redirect if not logged in
  useEffect(() => {
    if (isMounted && !user) {
      router.push('/login');
    }
  }, [isMounted, user, router]);

  // Load user data into form
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  // Fetch data depending on active tab
  useEffect(() => {
    if (user && token) {
      if (activeTab === 'general' || activeTab === 'orders') {
        fetchUserOrders();
      }
      if (activeTab === 'general' || activeTab === 'addresses') {
        fetchSavedAddresses();
      }
    }
  }, [activeTab, user, token]);

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
          setExpandedOrders({ [sorted[0].order_id]: true });
        }
      } else {
        setOrdersError(json.message || 'Failed to load order history');
      }
    } catch (err) {
      console.warn('Fetch orders error:', getApiErrorMessage(err));
      setOrdersError('Network connection error, please try again later');
    } finally {
      setOrdersLoading(false);
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
        setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
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
        setProfileMessage({ type: 'error', text: json.message || 'Error updating profile information' });
      }
    } catch (err) {
      console.warn('Update profile error:', getApiErrorMessage(err));
      setProfileMessage({ type: 'error', text: 'Server connection error' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token) return;

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New password and confirmation password do not match' });
      return;
    }

    setPasswordLoading(true);
    setPasswordMessage(null);

    try {
      const res = await api.put('/auth/profile/password', { oldPassword, newPassword });
      const json = res.data;

      if (json.success) {
        setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMessage({ type: 'error', text: json.message || 'Error changing password' });
      }
    } catch (err) {
      console.warn('Change password error:', getApiErrorMessage(err));
      setPasswordMessage({ type: 'error', text: 'Server connection error' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !token) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Maximum image size is 2MB');
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
        setProfileMessage({ type: 'success', text: 'Avatar updated successfully!' });
      } else {
        alert(json.message || 'Error uploading avatar');
      }
    } catch (err) {
      console.warn('Upload avatar error:', getApiErrorMessage(err));
      alert('Server connection error');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAvatar = async () => {
    if (!user || !token) return;
    if (!confirm('Are you sure you want to delete your current avatar?')) return;

    setAvatarUploading(true);

    try {
      const res = await api.delete('/auth/profile/avatar');
      const json = res.data;

      if (json.success) {
        setAuth(
          {
            ...user,
            avatar: undefined,
          },
          token
        );
        setProfileMessage({ type: 'success', text: 'Avatar deleted successfully' });
      } else {
        alert(json.message || 'Error deleting avatar');
      }
    } catch (err) {
      console.warn('Delete avatar error:', getApiErrorMessage(err));
      alert('Server connection error');
    } finally {
      setAvatarUploading(false);
    }
  };

  // Process Administrative address details into backend single address string
  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverName.trim() || !receiverPhone.trim() || !streetName.trim() || !houseNumber.trim() || !selectedDistrict || !selectedWard || !receiverEmail.trim()) {
      alert('Please fill in all address information fields');
      return;
    }

    const finalAddressDetail = `Số ${houseNumber.trim()}, Đường ${streetName.trim()}, ${selectedWard}, ${selectedDistrict}, Thành phố Hồ Chí Minh, Email: ${receiverEmail.trim()}`;

    setAddressesLoading(true);
    try {
      if (editingAddressId) {
        // Edit Address
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
        // Add Address
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
      alert('Unable to save address. Please check your connection.');
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

    // Parse the compound address line
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
          <span className="inline-block px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-500 text-[11px] font-black uppercase tracking-wider shadow-[0_0_15px_rgba(249,115,22,0.08)]">
            Pending
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-block px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-[11px] font-black uppercase tracking-wider shadow-[0_0_15px_rgba(234,179,8,0.08)]">
            Confirmed
          </span>
        );
      case 'preparing':
      case 'processing':
        return (
          <span className="inline-block px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-[11px] font-black uppercase tracking-wider shadow-[0_0_15px_rgba(234,179,8,0.08)]">
            Preparing
          </span>
        );
      case 'shipped':
      case 'delivering':
        return (
          <span className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-500 text-[11px] font-black uppercase tracking-wider shadow-[0_0_15px_rgba(59,130,246,0.08)]">
            Delivering
          </span>
        );
      case 'arrived':
      case 'completed':
        return (
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-black uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.08)]">
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-block px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 text-[11px] font-black uppercase tracking-wider shadow-[0_0_15px_rgba(239,68,68,0.08)]">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-block px-3 py-1 rounded-full bg-zinc-500/10 border border-zinc-500/30 text-zinc-400 text-[11px] font-black uppercase tracking-wider">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
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
        return item.dish_price?.dish?.dish_name;
      })
      .join(', ');
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'general':
        return 'My Profile';
      case 'addresses':
        return 'Address Book';
      case 'orders':
        return 'Order History';
      case 'password':
        return 'Change Password';
      case 'vouchers':
        return 'My Vouchers';
      default:
        return 'My Profile';
    }
  };

  if (!isMounted || !user) {
    return (
      <div className={`min-h-screen flex flex-col justify-center items-center ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-gray-50 text-gray-800'}`}>
        <Loader2 className="animate-spin text-[#007a3f] w-10 h-10 mb-4" />
        <p className="text-zinc-500 text-sm font-bold uppercase tracking-wider">LOADING PROFILE...</p>
      </div>
    );
  }

  const latestOrder = orders.length > 0 ? orders[0] : null;

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-gray-50 text-gray-800'
      }`}>
      <header className="bg-[#121424]/95 backdrop-blur-md text-white sticky top-0 z-50 border-b border-white/[0.1] shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all duration-300">
        <HeaderClient storeName="Pizza&PastaInn" />
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-4 md:px-6 py-10 w-full">
        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Panel: Sidebar Navigation (Dynamic styles depending on active theme) */}
          <div className="lg:col-span-1 space-y-6">
            <div className={`border transition-all duration-300 rounded-[28px] overflow-hidden shadow-sm ${theme === 'dark' ? 'bg-[#121212] border-white/[0.06] shadow-2xl' : 'bg-white border-gray-200'
              }`}>
              {/* Header: Account of USER */}
              <div className={`px-6 py-6 border-b transition-colors duration-300 flex items-center gap-4 ${theme === 'dark' ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-gray-100/60 border-gray-200/60'
                }`}>
                <div className={`relative w-12 h-12 rounded-full overflow-hidden border shrink-0 shadow-sm ${theme === 'dark' ? 'border-white/[0.08]' : 'border-gray-200'
                  }`}>
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
                    <div className="w-full h-full bg-[#007a3f] text-white flex items-center justify-center font-black text-xl">
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/60 text-white opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center z-10 text-[9px] font-bold"
                  >
                    Đổi
                  </button>
                </div>
                <div className="overflow-hidden">
                  <span className={`text-[10px] font-bold uppercase tracking-wider block leading-none ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-400'
                    }`}>
                    Account of
                  </span>
                  <h3 className={`font-extrabold text-base tracking-wide uppercase truncate mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-800'
                    }`}>
                    {user.username}
                  </h3>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Vertical tabs menu navigation */}
              <div className="flex flex-col p-4 gap-1">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`w-full py-3.5 px-4 rounded-xl text-[13px] font-black tracking-wide text-left transition-all flex items-center gap-3 border-l-[3px] shadow-sm ${activeTab === 'general'
                    ? theme === 'dark'
                      ? 'bg-white/[0.03] text-[#007a3f] border-[#007a3f]'
                      : 'bg-gray-100 text-[#007a3f] border-[#007a3f]'
                    : theme === 'dark'
                      ? 'bg-transparent text-zinc-400 hover:text-white border-transparent hover:bg-white/[0.02]'
                      : 'bg-transparent text-gray-500 hover:text-gray-800 border-transparent hover:bg-gray-100/50'
                    }`}
                >
                  <User size={16} />
                  <span>My Profile</span>
                </button>

                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full py-3.5 px-4 rounded-xl text-[13px] font-black tracking-wide text-left transition-all flex items-center gap-3 border-l-[3px] shadow-sm ${activeTab === 'orders'
                    ? theme === 'dark'
                      ? 'bg-white/[0.03] text-[#007a3f] border-[#007a3f]'
                      : 'bg-gray-100 text-[#007a3f] border-[#007a3f]'
                    : theme === 'dark'
                      ? 'bg-transparent text-zinc-400 hover:text-white border-transparent hover:bg-white/[0.02]'
                      : 'bg-transparent text-gray-500 hover:text-gray-800 border-transparent hover:bg-gray-100/50'
                    }`}
                >
                  <Package size={16} />
                  <span>Order History</span>
                </button>

                <button
                  onClick={() => setActiveTab('password')}
                  className={`w-full py-3.5 px-4 rounded-xl text-[13px] font-black tracking-wide text-left transition-all flex items-center gap-3 border-l-[3px] shadow-sm ${activeTab === 'password'
                    ? theme === 'dark'
                      ? 'bg-white/[0.03] text-[#007a3f] border-[#007a3f]'
                      : 'bg-gray-100 text-[#007a3f] border-[#007a3f]'
                    : theme === 'dark'
                      ? 'bg-transparent text-zinc-400 hover:text-white border-transparent hover:bg-white/[0.02]'
                      : 'bg-transparent text-gray-500 hover:text-gray-800 border-transparent hover:bg-gray-100/50'
                    }`}
                >
                  <Lock size={16} />
                  <span>Change Password</span>
                </button>

                <button
                  onClick={() => setActiveTab('vouchers')}
                  className={`w-full py-3.5 px-4 rounded-xl text-[13px] font-black tracking-wide text-left transition-all flex items-center gap-3 border-l-[3px] shadow-sm ${activeTab === 'vouchers'
                    ? theme === 'dark'
                      ? 'bg-white/[0.03] text-[#007a3f] border-[#007a3f]'
                      : 'bg-gray-100 text-[#007a3f] border-[#007a3f]'
                    : theme === 'dark'
                      ? 'bg-transparent text-zinc-400 hover:text-white border-transparent hover:bg-white/[0.02]'
                      : 'bg-transparent text-gray-500 hover:text-gray-800 border-transparent hover:bg-gray-100/50'
                    }`}
                >
                  <Ticket size={16} />
                  <span>My Vouchers</span>
                </button>

                <hr className={`my-2 ${theme === 'dark' ? 'border-white/[0.06]' : 'border-gray-200'}`} />

                <button
                  onClick={handleLogout}
                  className="w-full py-3 px-4 rounded-xl text-[13px] font-black text-left text-red-500 hover:bg-red-500/10 transition-all flex items-center gap-3"
                >
                  <LogOut size={16} />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: Content Panel */}
          <div className="lg:col-span-3">
            {/* Top Tab Title Bar */}
            <div className={`border-b pb-3 flex justify-between items-center transition-colors duration-300 mb-6 ${theme === 'dark' ? 'border-white/[0.06]' : 'border-gray-200'
              }`}>
              <h2 className={`text-2xl font-extrabold tracking-wide transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-800'
                }`}>
                {getTabTitle()}
              </h2>
            </div>
            {activeTab === 'general' && (
              <div className="space-y-8 animate-fadeIn">
                {/* Card 1: ACCOUNT INFORMATION */}
                <div className={`border transition-all duration-300 rounded-[28px] p-6 md:p-8 shadow-sm relative overflow-hidden ${theme === 'dark' ? 'bg-[#121212] border-white/[0.06] shadow-2xl' : 'bg-white border-gray-200'
                  }`}>
                  <div className="relative z-10 space-y-6">
                    <div className={`flex justify-between items-center border-b pb-3 transition-colors duration-300 ${theme === 'dark' ? 'border-white/[0.06]' : 'border-gray-100'
                      }`}>
                      <h3 className={`text-xs font-black tracking-widest uppercase ${theme === 'dark' ? 'text-pizza-gold' : 'text-[#007a3f]'
                        }`}>
                        ACCOUNT INFORMATION
                      </h3>
                      {!isEditingProfile ? (
                        <button
                          onClick={() => {
                            setIsEditingProfile(true);
                            setProfileMessage(null);
                          }}
                          className="text-[13px] font-black text-[#007a3f] hover:underline flex items-center gap-1.5 transition-all"
                        >
                          <Edit3 size={14} className="stroke-[3px]" />
                          Edit
                        </button>
                      ) : (
                        <button
                          onClick={() => setIsEditingProfile(false)}
                          className={`text-[13px] font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                          Cancel
                        </button>
                      )}
                    </div>

                    {profileMessage && (
                      <div
                        className={`p-4 rounded-2xl flex items-start gap-3 border text-sm font-semibold ${profileMessage.type === 'success'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/10 border-red-500/20 text-red-450'
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
                      /* Display Read-Only Details */
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                        <div className="space-y-1">
                          <span className={`text-xs font-bold uppercase tracking-wider block ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-400'
                            }`}>
                            Full Name
                          </span>
                          <strong className={`text-base font-extrabold block ${theme === 'dark' ? 'text-white' : 'text-gray-800'
                            }`}>
                            {user.username || 'Not updated'}
                          </strong>
                        </div>
                        <div className="space-y-1">
                          <span className={`text-xs font-bold uppercase tracking-wider block ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-400'
                            }`}>
                            Phone Number
                          </span>
                          <strong className={`text-base font-extrabold block ${theme === 'dark' ? 'text-white' : 'text-gray-800'
                            }`}>
                            {user.phone || 'Not updated'}
                          </strong>
                        </div>
                        <div className="space-y-1">
                          <span className={`text-xs font-bold uppercase tracking-wider block ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-400'
                            }`}>
                            Email
                          </span>
                          <strong className={`text-base font-extrabold block truncate ${theme === 'dark' ? 'text-white' : 'text-gray-800'
                            }`}>
                            {user.email || 'Not updated'}
                          </strong>
                        </div>
                      </div>
                    ) : (
                      /* Edit Profile Form */
                      <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className={`text-xs font-black uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'
                            }`}>Full Name</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                              <User size={16} />
                            </span>
                            <input
                              type="text"
                              required
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              className={`w-full border rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none transition-colors ${theme === 'dark'
                                ? 'bg-[#0d0d0d] border-white/[0.06] focus:border-[#007a3f]/40 text-zinc-200'
                                : 'bg-white border-gray-300 focus:border-[#007a3f] focus:ring-1 focus:ring-[#007a3f] text-gray-850'
                                }`}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className={`text-xs font-black uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'
                            }`}>Phone Number</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                              <Phone size={16} />
                            </span>
                            <input
                              type="tel"
                              required
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className={`w-full border rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none transition-colors ${theme === 'dark'
                                ? 'bg-[#0d0d0d] border-white/[0.06] focus:border-[#007a3f]/40 text-zinc-200'
                                : 'bg-white border-gray-300 focus:border-[#007a3f] focus:ring-1 focus:ring-[#007a3f] text-gray-850'
                                }`}
                            />
                          </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <label className={`text-xs font-black uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'
                            }`}>Email Address</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                              <Mail size={16} />
                            </span>
                            <input
                              type="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className={`w-full border rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none transition-colors ${theme === 'dark'
                                ? 'bg-[#0d0d0d] border-white/[0.06] focus:border-[#007a3f]/40 text-zinc-200'
                                : 'bg-white border-gray-300 focus:border-[#007a3f] focus:ring-1 focus:ring-[#007a3f] text-gray-850'
                                }`}
                            />
                          </div>
                        </div>

                        <div className="md:col-span-2 pt-2 flex gap-3">
                          <button
                            type="submit"
                            disabled={profileLoading}
                            className="bg-[#007a3f] hover:bg-[#006030] text-white font-black text-xs tracking-widest uppercase px-6 py-3.5 rounded-xl shadow active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-55"
                          >
                            {profileLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                            SAVE CHANGES
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsEditingProfile(false)}
                            className={`font-black text-xs tracking-widest uppercase px-6 py-3.5 rounded-xl transition-all border ${theme === 'dark'
                              ? 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
                              }`}
                          >
                            CANCEL
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>

                {/* Card 2: MOST RECENT ORDER */}
                <div className={`border transition-all duration-300 rounded-[28px] p-6 shadow-sm ${theme === 'dark' ? 'bg-[#121212] border-white/[0.06] shadow-2xl' : 'bg-white border-gray-200'
                  }`}>
                  <h3 className={`text-xs font-black tracking-widest uppercase border-b pb-3 mb-4 transition-colors duration-300 ${theme === 'dark' ? 'text-pizza-green border-white/[0.06]' : 'text-[#007a3f] border-gray-100'
                    }`}>
                    MOST RECENT ORDER
                  </h3>

                  {ordersLoading ? (
                    <div className="text-center py-10 flex flex-col items-center gap-2">
                      <Loader2 className="animate-spin text-[#007a3f] w-6 h-6" />
                      <p className="text-zinc-500 text-xs">Loading order information...</p>
                    </div>
                  ) : !latestOrder ? (
                    <div className="text-center py-8 text-zinc-500 text-sm font-semibold uppercase">
                      You do not have any orders yet
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead>
                          <tr className={`font-extrabold uppercase text-xs border transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0d0d0d] text-zinc-400 border-white/[0.06]' : 'bg-gray-50 text-gray-500 border-gray-200'
                            }`}>
                            <th className="px-5 py-4">Order ID</th>
                            <th className="px-5 py-4">Products</th>
                            <th className="px-5 py-4">Date</th>
                            <th className="px-5 py-4">Total</th>
                            <th className="px-5 py-4">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className={`border transition-colors duration-300 hover:bg-white/[0.01] font-semibold ${theme === 'dark' ? 'border-white/[0.06]' : 'border-gray-100'
                            }`}>
                            <td className="px-5 py-4 text-pizza-gold font-bold">
                              <button
                                onClick={() => {
                                  setActiveTab('orders');
                                  setExpandedOrders({ [latestOrder.order_id]: true });
                                }}
                                className="hover:underline"
                              >
                                #{latestOrder.order_id}
                              </button>
                            </td>
                            <td className="px-5 py-4 max-w-[200px] truncate" title={getProductString(latestOrder)}>
                              {getProductString(latestOrder)}
                            </td>
                            <td className={`px-5 py-4 ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>{formatDate(latestOrder.created_at)}</td>
                            <td className={`px-5 py-4 font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                              {formatPrice(latestOrder.total_order)}
                            </td>
                            <td className="px-5 py-4">{getStatusBadge(latestOrder.order_status)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Card 3: DANH SÁCH ĐỊA CHỈ GIAO HÀNG */}
                <div className={`border transition-all duration-300 rounded-[28px] p-6 shadow-sm ${theme === 'dark' ? 'bg-[#121212] border-white/[0.06] shadow-2xl' : 'bg-white border-gray-200'
                  }`}>
                  {/* Section Title with Add button */}
                  <div className="flex justify-between items-center border-b pb-3 mb-4 transition-colors duration-300 border-gray-100">
                    <h3 className={`text-xs font-black tracking-widest uppercase ${theme === 'dark' ? 'text-pizza-green' : 'text-[#007a3f]'
                      }`}>
                      Address Book
                    </h3>
                    <button
                      onClick={() => {
                        setEditingAddressId(null);
                        resetAddressInputs();
                        setAddressFormOpen(true);
                      }}
                      className="bg-[#007a3f] hover:bg-[#006030] text-white font-extrabold text-xs tracking-wider uppercase px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow cursor-pointer"
                    >
                      <PlusCircle size={14} />
                      Add Address
                    </button>
                  </div>

                  {/* Saved addresses list grid inside Thông tin chung */}
                  {addressesLoading ? (
                    <div className="text-center py-10 flex flex-col items-center gap-2">
                      <Loader2 className="animate-spin text-[#007a3f] w-8 h-8" />
                      <p className="text-zinc-550 text-xs font-bold uppercase tracking-wider">
                        Loading address list...
                      </p>
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="border border-dashed rounded-[28px] py-12 px-6 text-center space-y-3 border-gray-200">
                      <MapPin size={24} className="mx-auto text-zinc-500" />
                      <p className="text-zinc-550 text-sm font-semibold uppercase">
                        You do not have any saved shipping addresses
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
                            className={`border p-5 rounded-2xl relative shadow-md flex flex-col justify-between transition-all duration-300 ${theme === 'dark' ? 'bg-[#121212]/80 border-white/[0.04] shadow-2xl' : 'bg-white border-gray-200'
                              }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[#007a3f]">
                                  <MapPin size={16} />
                                </span>
                                <span className={`font-extrabold text-sm truncate max-w-[220px] ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                                  {addr.recipient_name ? `Recipient: ${addr.recipient_name}` : 'Shipping Address'}
                                </span>
                                {addr.is_default && (
                                  <span className="bg-[#007a3f]/10 text-pizza-green border border-[#007a3f]/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className={`text-xs leading-relaxed font-semibold ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-600'}`}>
                                {cleanAddress}
                              </p>
                              {addr.recipient_phone && (
                                <p className={`text-[11px] font-bold ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`}>
                                  Phone: {addr.recipient_phone}
                                </p>
                              )}
                              <p className={`text-[11px] font-bold ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`}>
                                Email: {parsed.email || user.email}
                              </p>
                            </div>
                            <div className={`mt-4 pt-3 border-t flex gap-3 text-xs font-bold transition-colors duration-300 ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'
                              }`}>
                              <button
                                onClick={() => handleEditAddressClick(addr)}
                                className="text-pizza-gold hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Edit3 size={12} />
                                Edit
                              </button>
                              <button
                                onClick={() => confirmDeleteAddress(addr.user_address_id)}
                                className="text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 size={12} />
                                Delete
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

            {/* Tab: Lịch sử mua hàng */}
            {activeTab === 'orders' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Header Track Order Form */}
                <div className={`border p-6 md:p-8 rounded-[28px] shadow-sm space-y-4 transition-colors duration-300 ${theme === 'dark' ? 'bg-[#121212] border-white/[0.06] shadow-2xl' : 'bg-white border-gray-200'
                  }`}>
                  <h2 className={`text-lg font-black tracking-wide border-b pb-3 ${theme === 'dark' ? 'text-white border-white/[0.06]' : 'text-gray-800 border-gray-100'
                    }`}>
                    Track Order
                  </h2>
                  <form onSubmit={handleSearchLookup} className="space-y-3">
                    <label className={`text-sm font-extrabold block ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-800'}`}>
                      Enter phone number or order ID
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                          <Search size={16} />
                        </span>
                        <input
                          type="text"
                          placeholder="Enter phone number or order ID"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className={`w-full border rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none transition-colors ${theme === 'dark'
                            ? 'bg-[#0d0d0d] border-white/[0.06] focus:border-[#007a3f]/40 text-zinc-200'
                            : 'bg-white border-gray-300 focus:border-[#007a3f] focus:ring-1 focus:ring-[#007a3f] text-gray-850'
                            }`}
                        />
                      </div>
                      <button
                        type="submit"
                        className="bg-[#007a3f] hover:bg-[#006030] text-white font-black text-sm tracking-wider uppercase px-6 py-3 rounded-xl transition-all shadow-md active:scale-95 whitespace-nowrap cursor-pointer"
                      >
                        Track
                      </button>
                    </div>
                  </form>
                </div>

                <div className={`border-b pb-2 ${theme === 'dark' ? 'border-white/[0.06]' : 'border-gray-200'}`}>
                  <h3 className={`text-base font-extrabold tracking-wide ${theme === 'dark' ? 'text-white' : 'text-gray-805'}`}>Order History</h3>
                </div>

                {ordersLoading && (
                  <div className="text-center py-20 flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 text-[#007a3f] animate-spin" />
                    <p className="text-zinc-550 text-xs font-bold uppercase tracking-wider">
                      Fetching order data...
                    </p>
                  </div>
                )}

                {ordersError && (
                  <div className={`border p-6 rounded-[28px] text-center flex flex-col items-center gap-3 shadow-md ${theme === 'dark' ? 'bg-[#121212] border-red-500/20 text-red-400' : 'bg-white border-red-200 text-red-500'
                    }`}>
                    <AlertCircle size={28} />
                    <p className="font-semibold text-sm">{ordersError}</p>
                    <button
                      onClick={fetchUserOrders}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${theme === 'dark'
                        ? 'bg-white/5 border-white/10 hover:bg-white/10 text-zinc-300'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600'
                        }`}
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {/* If filtered orders is empty */}
                {!ordersLoading && !ordersError && filteredOrders.length === 0 && (
                  <div className={`border border-dashed rounded-[28px] py-16 px-6 text-center space-y-4 ${theme === 'dark' ? 'bg-[#121212]/50 border-white/10' : 'bg-white border-gray-200'
                    }`}>
                    <div className="w-16 h-16 bg-white/[0.02] border border-white/[0.04] rounded-full flex items-center justify-center mx-auto text-zinc-500 shadow">
                      <Package size={28} />
                    </div>
                    <div className="space-y-1">
                      <h4 className={`text-lg font-bold uppercase ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>NO ORDERS FOUND</h4>
                      <p className="text-zinc-500 text-xs font-medium max-w-sm mx-auto leading-relaxed">
                        Please try adjusting your phone number or order ID to search again.
                      </p>
                    </div>
                  </div>
                )}

                {/* Collapsible orders list inside Premium Theme */}
                {!ordersLoading && !ordersError && filteredOrders.length > 0 && (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => {
                      const isExpanded = !!expandedOrders[order.order_id];
                      return (
                        <div
                          key={order.order_id}
                          className={`border transition-all duration-300 rounded-[28px] overflow-hidden ${isExpanded
                            ? theme === 'dark' ? 'border-white/[0.12] bg-[#121212]/90 shadow-2xl' : 'border-gray-300 bg-white shadow-md'
                            : theme === 'dark' ? 'border-white/[0.04] bg-[#121212]/90 hover:border-white/[0.08] shadow-md' : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm'
                            }`}
                        >
                          {/* Row Header */}
                          <div
                            onClick={() => toggleExpand(order.order_id)}
                            className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.01] transition-colors select-none"
                          >
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                              <div className="w-12 h-12 bg-white/[0.03] border border-white/[0.06] rounded-2xl flex items-center justify-center text-[#007a3f]">
                                <Package size={22} />
                              </div>
                              <div>
                                <div className="flex items-center gap-3 flex-wrap">
                                  <h4 className="text-base font-black text-[#007a3f] uppercase tracking-wide">
                                    ORDER: #{order.order_id}
                                  </h4>
                                  {getStatusBadge(order.order_status)}
                                </div>
                                <p className="text-zinc-500 text-xs font-medium mt-1">
                                  Order Date: {formatDate(order.created_at)}
                                </p>
                              </div>
                            </div>

                            <div className={`flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 ${theme === 'dark' ? 'border-white/[0.06]' : 'border-gray-100'
                              }`}>
                              <div className="text-left md:text-right">
                                <span className="text-[10px] text-zinc-500 font-extrabold tracking-wider uppercase block">
                                  TOTAL PRICE
                                </span>
                                <span className={`text-lg font-black tracking-wide ${theme === 'dark' ? 'text-pizza-gold' : 'text-[#007a3f]'}`}>
                                  {formatPrice(order.total_order)}
                                </span>
                              </div>

                              <button className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] flex items-center justify-center text-zinc-400">
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            </div>
                          </div>

                          {/* Collapsible Details */}
                          {isExpanded && (
                            <div className={`border-t p-6 md:p-8 space-y-8 animate-fadeIn transition-colors duration-300 ${theme === 'dark' ? 'border-white/[0.06] bg-[#0d0d0d]/40 text-zinc-300' : 'border-gray-100 bg-gray-50/50 text-gray-700'
                              }`}>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                <div className="space-y-4">
                                  <h5 className={`text-[11px] font-black uppercase tracking-widest block border-b pb-2 ${theme === 'dark' ? 'text-pizza-gold border-white/5' : 'text-[#007a3f] border-gray-200'
                                    }`}>
                                    CUSTOMER & DELIVERY INFORMATION
                                  </h5>
                                  <div className="space-y-3 font-semibold">
                                    <div className="flex items-start gap-3">
                                      <span className="text-zinc-500 mt-0.5">
                                        <User size={15} />
                                      </span>
                                      <span>
                                        Recipient: <strong className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>{order.customer_name}</strong>
                                      </span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                      <span className="text-zinc-500 mt-0.5">
                                        <Phone size={15} />
                                      </span>
                                      <span>
                                        Phone Number:{' '}
                                        <strong className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>{order.customer_phone}</strong>
                                      </span>
                                    </div>
                                    {order.customer_email && (
                                      <div className="flex items-start gap-3">
                                        <span className="text-zinc-500 mt-0.5">
                                          <Mail size={15} />
                                        </span>
                                        <span>
                                          Email: <span className="text-zinc-500">{order.customer_email}</span>
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex items-start gap-3">
                                      <span className="text-zinc-500 mt-0.5">
                                        <MapPin size={15} />
                                      </span>
                                      <span>
                                        {order.order_type === 'delivery' ? (
                                          <>
                                            Địa chỉ:{' '}
                                            <strong className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>
                                              {order.user_address?.address_line || 'Địa chỉ giao hàng'}
                                            </strong>
                                          </>
                                        ) : (
                                          <>
                                            Hình thức:{' '}
                                            <strong className={theme === 'dark' ? 'text-white font-bold' : 'text-gray-800 font-bold'}>Store Pickup</strong>
                                            {order.store?.address && (
                                              <span className={`block mt-1 text-xs ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                                                Store: {order.store.store_name} - {order.store.address}
                                              </span>
                                            )}
                                          </>
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <h5 className={`text-[11px] font-black uppercase tracking-widest block border-b pb-2 ${theme === 'dark' ? 'text-pizza-gold border-white/5' : 'text-[#007a3f] border-gray-200'
                                    }`}>
                                    PAYMENT & TIMING
                                  </h5>
                                  <div className="space-y-3 font-semibold">
                                    <div className="flex items-start gap-3">
                                      <span className="text-zinc-500 mt-0.5">
                                        <CreditCard size={15} />
                                      </span>
                                      <span>
                                        Phương thức:{' '}
                                        <strong className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>
                                          {order.payment_method === 'vietqr'
                                            ? 'VietQR Bank Transfer'
                                            : 'Cash on Delivery (COD)'}
                                        </strong>
                                      </span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                      <span className="text-zinc-500 mt-0.5">
                                        <Clock size={15} />
                                      </span>
                                      <span>
                                        Trạng thái thanh toán:{' '}
                                        <strong
                                          className={
                                            order.payment_status === 'paid'
                                              ? 'text-emerald-500 font-bold'
                                              : 'text-amber-500 font-bold'
                                          }
                                        >
                                          {order.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                                        </strong>
                                      </span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                      <span className="text-zinc-500 mt-0.5">
                                        <Calendar size={15} />
                                      </span>
                                      <span>
                                        {order.pickup_time ? (
                                          <>
                                            Giờ hẹn nhận bánh:{' '}
                                            <strong className={theme === 'dark' ? 'text-white font-bold' : 'text-gray-800 font-bold'}>
                                              {formatDateTime(order.pickup_time)}
                                            </strong>
                                          </>
                                        ) : order.estimated_delivery_time ? (
                                          <>
                                            Thời gian giao hàng dự kiến:{' '}
                                            <strong className={theme === 'dark' ? 'text-white font-bold' : 'text-gray-800 font-bold'}>
                                              {formatDateTime(order.estimated_delivery_time)}
                                            </strong>
                                          </>
                                        ) : (
                                          <>
                                            Thời gian giao:{' '}
                                            <strong className={theme === 'dark' ? 'text-white font-bold' : 'text-gray-800 font-bold'}>
                                              Standard Delivery (30-45 mins)
                                            </strong>
                                          </>
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {order.order_note && (
                                <div className={`p-4 rounded-2xl flex items-start gap-3 border ${
                                  theme === 'dark' ? 'bg-[#121212]/40 border-white/[0.04]' : 'bg-gray-100/50 border-gray-200'
                                }`}>
                                  <span className="text-zinc-500 mt-0.5"><FileText size={16} /></span>
                                  <div className="text-xs font-medium text-left">
                                    <span className={`block uppercase tracking-wider font-extrabold mb-1 ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`}>ORDER NOTE:</span>
                                    <p className={`leading-relaxed italic ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-705'}`}>&ldquo;{order.order_note}&rdquo;</p>
                                  </div>
                                </div>
                              )}

                              {/* Order Items & Totals Section */}
                              <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t ${theme === 'dark' ? 'border-white/5' : 'border-gray-150'}`}>
                                
                                {/* Left: Dishes List */}
                                <div className="lg:col-span-7 space-y-4">
                                  <h5 className={`text-[11px] font-black uppercase tracking-widest block border-b pb-2 ${
                                    theme === 'dark' ? 'text-pizza-gold border-white/5' : 'text-[#007a3f] border-gray-200'
                                  }`}>
                                    ORDERED DISHES
                                  </h5>

                                  <div className={`divide-y border p-5 rounded-2xl ${
                                    theme === 'dark' 
                                      ? 'divide-white/5 bg-[#121212]/30 border-white/[0.04]' 
                                      : 'divide-gray-150 bg-white border-gray-200'
                                  }`}>
                                    {order.items.map((item) => {
                                      let dishName = '';
                                      let imageSrc = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=100&auto=format&fit=crop';
                                      let itemSpec = '';

                                      const isCombo = !!item.combo_id;
                                      const isHalfHalf = !!item.is_half_half;

                                      if (isCombo) {
                                        dishName = item.combo?.combo_name || `Combo #${item.combo_id}`;
                                        imageSrc = item.combo?.image_combo || 'https://images.unsplash.com/photo-1579751626657-72bc17010498?q=80&w=100&auto=format&fit=crop';
                                      } else if (isHalfHalf) {
                                        dishName = 'PIZZA HALF & HALF';
                                        imageSrc = 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?q=80&w=100&auto=format&fit=crop';
                                        const size = item.dish_price?.size?.size_name;
                                        const crust = item.dish_price?.crust?.crust_name;
                                        itemSpec = `${size ? `SIZE: ${size.toUpperCase()}` : ''}${crust && crust.toLowerCase() !== 'none' ? ` - CRUST: ${crust.toUpperCase()}` : ''}`;
                                      } else {
                                        dishName = item.dish_price?.dish?.dish_name || 'Dish';
                                        imageSrc = item.dish_price?.dish?.image || imageSrc;
                                        const isPizza = dishName.toLowerCase().includes('pizza');
                                        if (isPizza) {
                                          const size = item.dish_price?.size?.size_name;
                                          const crust = item.dish_price?.crust?.crust_name;
                                          itemSpec = `${size ? `SIZE: ${size.toUpperCase()}` : ''}${crust && crust.toLowerCase() !== 'none' ? ` - CRUST: ${crust.toUpperCase()}` : ''}`;
                                        }
                                      }

                                      return (
                                        <div key={item.order_item_id} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                                          <div className={`relative w-16 h-16 rounded-full overflow-hidden border shrink-0 shadow-md ${
                                            theme === 'dark' ? 'border-white/[0.06]' : 'border-gray-200'
                                          }`}>
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
                                              <h4 className={`font-extrabold text-sm md:text-base tracking-wide leading-snug ${
                                                theme === 'dark' ? 'text-white' : 'text-gray-800'
                                              }`}>
                                                {dishName}
                                              </h4>
                                              <div className={`text-[11px] font-bold tracking-wider ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                                                Quantity: x{item.quantity}
                                              </div>
                                              
                                              {itemSpec && (
                                                <p className={`text-[11px] font-bold uppercase tracking-wide ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`}>
                                                  {itemSpec}
                                                </p>
                                              )}

                                              {/* Render combo details */}
                                              {isCombo && item.combos && item.combos.length > 0 && (
                                                <div className={`mt-2 pl-3 border-l-2 text-xs space-y-2 ${
                                                  theme === 'dark' ? 'border-[#f5c043]/30 text-zinc-400' : 'border-[#007a3f]/30 text-gray-500'
                                                }`}>
                                                  {item.combos.map((combItem, cIdx) => {
                                                    const cName = combItem.dish_price?.dish?.dish_name || 'Dish';
                                                    const cSize = combItem.dish_price?.size?.size_name;
                                                    const cCrust = combItem.dish_price?.crust?.crust_name;
                                                    const cIsPizza = cName.toLowerCase().includes('pizza');
                                                    const cSpec = cIsPizza && (cSize || cCrust)
                                                      ? `${cSize ? `SIZE: ${cSize.toUpperCase()}` : ''}${cCrust && cCrust.toLowerCase() !== 'none' ? ` - CRUST: ${cCrust.toUpperCase()}` : ''}`
                                                      : '';
                                                    return (
                                                      <div key={cIdx} className="space-y-0.5">
                                                        <p className={`font-bold ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                                                          {cIdx + 1}. {combItem.is_half_half ? 'Pizza Half & Half' : cName}
                                                        </p>
                                                        
                                                        <div className="pl-3 text-[10px] text-zinc-500 space-y-0.5">
                                                          {cSpec && (
                                                            <p className="font-bold uppercase tracking-wider text-zinc-500">
                                                              {cSpec}
                                                            </p>
                                                          )}

                                                          {combItem.is_half_half && combItem.halves && (
                                                            <div className="pl-2 border-l border-blue-400/30 py-0.5 space-y-1">
                                                              {combItem.halves.map((ch, chIdx) => (
                                                                <div key={chIdx} className="text-[11px]">
                                                                  <span className="text-zinc-500 font-medium">Half {chIdx + 1}: </span>
                                                                  <span className={`font-bold ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-700'}`}>{ch.dish?.dish_name}</span>
                                                                  {ch.order_item_toppings && ch.order_item_toppings.length > 0 && (
                                                                    <span className="block pl-3 text-[10px] text-zinc-500 italic">
                                                                      + Toppings: {ch.order_item_toppings.map(t => `${t.topping?.topping_name} (+${formatPrice(t.topping_price)})`).join(', ')}
                                                                    </span>
                                                                  )}
                                                                </div>
                                                              ))}
                                                            </div>
                                                          )}

                                                          {combItem.toppings && combItem.toppings.length > 0 && (
                                                            <p className="text-zinc-500 italic">
                                                              - Toppings: {combItem.toppings.map(t => `${t.topping?.topping_name} (+${formatPrice(t.topping_price)})`).join(', ')}
                                                            </p>
                                                          )}
                                                        </div>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              )}

                                              {/* Render half-half details */}
                                              {isCombo ? null : (isHalfHalf && item.halves && item.halves.length > 0 && (
                                                <div className={`mt-2 pl-3 border-l-2 text-xs space-y-2 ${theme === 'dark' ? 'border-blue-500/30 text-zinc-400' : 'border-blue-400/30 text-gray-500'}`}>
                                                  {item.halves.map((half, hIdx) => (
                                                    <div key={hIdx} className="text-xs">
                                                      <span className={`font-semibold ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>• Half {hIdx + 1}: </span>
                                                      <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{half.dish?.dish_name}</span>
                                                      {half.order_item_toppings && half.order_item_toppings.length > 0 && (
                                                        <span className="text-zinc-500 block ml-3 italic">
                                                          + Custom Toppings: {half.order_item_toppings.map(t => `${t.topping?.topping_name} (+${formatPrice(t.topping_price)})`).join(', ')}
                                                        </span>
                                                      )}
                                                    </div>
                                                  ))}
                                                </div>
                                              ))}

                                              {/* Render regular toppings */}
                                              {!isCombo && !isHalfHalf && item.toppings && item.toppings.length > 0 && (
                                                <p className="text-[11px] text-zinc-500 font-medium pt-1">
                                                  + Toppings: {item.toppings.map((t) => `${t.topping?.topping_name} (+${formatPrice(t.topping_price)})`).join(', ')}
                                                </p>
                                              )}
                                              {isHalfHalf && item.toppings && item.toppings.length > 0 && (
                                                <p className="text-[11px] text-zinc-500 font-medium pt-1">
                                                  + Toppings: {item.toppings.map((t) => `${t.topping?.topping_name} (+${formatPrice(t.topping_price)})`).join(', ')}
                                                </p>
                                              )}

                                              {item.order_item_note && (
                                                <p className={`text-[10px] border px-2 py-0.5 mt-2 rounded inline-block font-medium ${
                                                  theme === 'dark' 
                                                    ? 'bg-[#9f280a]/20 text-[#ff8b70] border-[#9f280a]/30' 
                                                    : 'bg-red-50 text-red-600 border-red-200'
                                                }`}>
                                                  Special Request: {item.order_item_note}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                <div className="lg:col-span-5 flex flex-col justify-start space-y-4">
                                  <h5 className={`text-[11px] font-black uppercase tracking-widest block border-b pb-2 ${theme === 'dark' ? 'text-pizza-gold border-white/5' : 'text-[#007a3f] border-gray-200'
                                    }`}>
                                    ORDER SUMMARY
                                  </h5>

                                  <div className={`border p-5 rounded-2xl space-y-3.5 text-xs md:text-sm font-semibold shadow-sm transition-all duration-300 ${theme === 'dark' ? 'bg-[#121212] border-white/[0.06] text-zinc-300' : 'bg-white border-gray-200 text-gray-700'
                                    }`}>
                                    <div className="flex justify-between items-center text-zinc-500 gap-4">
                                      <span className="whitespace-nowrap">Subtotal:</span>
                                      <span className={`whitespace-nowrap ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                                        {formatPrice(order.total_price_dish)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-zinc-500 gap-4">
                                      <span className="whitespace-nowrap">Shipping Fee:</span>
                                      {order.order_status.toLowerCase() === 'pending' && order.order_type === 'delivery' ? (
                                        <span className="text-amber-500 font-bold whitespace-nowrap">Pending</span>
                                      ) : order.shipping_fee > 0 ? (
                                        <span className={`whitespace-nowrap ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                                          {formatPrice(order.shipping_fee)}
                                        </span>
                                      ) : (
                                        <span className="text-emerald-500 font-bold whitespace-nowrap">Free</span>
                                      )}
                                    </div>
                                    {order.discount_amount > 0 && (
                                      <div className="flex justify-between items-center text-red-400 gap-4">
                                        <span className="whitespace-nowrap">Discount:</span>
                                        <span className="whitespace-nowrap">-{formatPrice(order.discount_amount)}</span>
                                      </div>
                                    )}
                                    <div className={`flex justify-between items-center text-base font-black pt-2.5 border-t gap-4 ${theme === 'dark' ? 'border-white/5' : 'border-gray-150'
                                      }`}>
                                      <span className={`whitespace-nowrap ${theme === 'dark' ? 'text-pizza-gold' : 'text-[#007a3f]'}`}>GRAND TOTAL:</span>
                                      <span className={`tracking-wide text-lg whitespace-nowrap ${theme === 'dark' ? 'text-pizza-gold' : 'text-[#007a3f]'}`}>
                                        {formatPrice(order.total_order)}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Review Button for completed orders */}
                                  {(order.order_status.toLowerCase() === 'completed' || order.order_status.toLowerCase() === 'arrived') && (
                                    <button
                                      onClick={() => router.push(`/reviews?order_id=${order.order_id}`)}
                                      className={`w-full font-black text-xs tracking-widest uppercase py-3.5 rounded-2xl shadow-md transition-all active:scale-[0.98] mt-3 flex items-center justify-center gap-2 cursor-pointer ${
                                        theme === 'dark'
                                          ? 'bg-[#f5c043] hover:bg-[#e5b33c] text-black hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                                          : 'bg-[#007a3f] hover:bg-[#006030] text-white hover:shadow-[0_0_15px_rgba(0,122,63,0.2)]'
                                      }`}
                                    >
                                      <span>Rate Order</span>
                                    </button>
                                  )}
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
                <div className={`border transition-all duration-300 rounded-[28px] p-6 md:p-8 shadow-sm relative overflow-hidden ${theme === 'dark' ? 'bg-[#121212] border-white/[0.06] shadow-2xl' : 'bg-white border-gray-200'
                  }`}>
                  <div className="relative z-10 space-y-6">
                    <h3 className="text-xs font-black text-pizza-gold tracking-widest uppercase border-b pb-3 border-white/[0.06]">
                      CHANGE SECURITY PASSWORD
                    </h3>

                    {passwordMessage && (
                      <div
                        className={`p-4 rounded-2xl flex items-start gap-3 border text-sm font-semibold ${passwordMessage.type === 'success'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/10 border-red-500/20 text-red-450'
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
                      {/* Old Password: * */}
                      <div className="space-y-1.5">
                        <label className={`text-sm font-extrabold block ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-800'}`}>
                          Old Password: <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                            <Lock size={16} />
                          </span>
                          <input
                            type="password"
                            required
                            placeholder="Enter your old password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            className={`w-full border rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none transition-colors ${theme === 'dark'
                              ? 'bg-[#0d0d0d] border-white/[0.06] focus:border-[#007a3f]/40 text-zinc-200 placeholder-zinc-650'
                              : 'bg-white border-gray-300 focus:border-[#007a3f] focus:ring-1 focus:ring-[#007a3f] text-gray-850 placeholder-gray-400'
                              }`}
                          />
                        </div>
                      </div>

                      {/* New Password: * */}
                      <div className="space-y-1.5">
                        <label className={`text-sm font-extrabold block ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-800'}`}>
                          New Password: <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                            <Lock size={16} />
                          </span>
                          <input
                            type="password"
                            required
                            placeholder="Minimum 6 characters"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className={`w-full border rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none transition-colors ${theme === 'dark'
                              ? 'bg-[#0d0d0d] border-white/[0.06] focus:border-[#007a3f]/40 text-zinc-200 placeholder-zinc-650'
                              : 'bg-white border-gray-300 focus:border-[#007a3f] focus:ring-1 focus:ring-[#007a3f] text-gray-850 placeholder-gray-400'
                              }`}
                          />
                        </div>
                      </div>

                      {/* Confirm Password: * */}
                      <div className="space-y-1.5">
                        <label className={`text-sm font-extrabold block ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-800'}`}>
                          Confirm Password: <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                            <Lock size={16} />
                          </span>
                          <input
                            type="password"
                            required
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`w-full border rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none transition-colors ${theme === 'dark'
                              ? 'bg-[#0d0d0d] border-white/[0.06] focus:border-[#007a3f]/40 text-zinc-200 placeholder-zinc-650'
                              : 'bg-white border-gray-300 focus:border-[#007a3f] focus:ring-1 focus:ring-[#007a3f] text-gray-850 placeholder-gray-400'
                              }`}
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={passwordLoading}
                          className="bg-[#007a3f] hover:bg-[#006030] text-white font-black text-xs tracking-widest uppercase px-6 py-4 rounded-xl shadow active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-55 cursor-pointer"
                        >
                          {passwordLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                          CHANGE PASSWORD
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Voucher của tôi */}
            {activeTab === 'vouchers' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Voucher 1 */}
                  <div className={`border rounded-2xl overflow-hidden shadow-sm flex transition-colors duration-300 ${theme === 'dark' ? 'bg-[#121212] border-white/[0.06]' : 'bg-white border-gray-200'
                    }`}>
                    <div className="bg-[#ee2828] w-1/3 flex flex-col justify-center items-center p-4 text-white relative border-r-2 border-dashed border-white/[0.06]">
                      {/* Notch half circles for coupon ticket effect */}
                      <div className={`absolute -top-3 -right-3 w-6 h-6 rounded-full transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-50'
                        }`}></div>
                      <div className={`absolute -bottom-3 -right-3 w-6 h-6 rounded-full transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-50'
                        }`}></div>
                      <Ticket size={28} className="mb-2" />
                      <span className="font-extrabold text-lg">FREE</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">SHIPPING</span>
                    </div>
                    <div className={`p-4 flex-1 flex flex-col justify-between text-zinc-300 transition-colors duration-300 ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'
                      }`}>
                      <div className="space-y-1">
                        <h4 className={`font-black text-sm uppercase ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Free giao hàng</h4>
                        <p className="text-[11px] text-zinc-500 font-semibold leading-relaxed">
                          Applicable for all orders with a payment value of 200,000đ or more.
                        </p>
                      </div>
                      <div className={`pt-3 border-t flex justify-between items-center text-[10px] font-bold text-zinc-500 transition-colors duration-300 ${theme === 'dark' ? 'border-white/[0.06]' : 'border-gray-100'
                        }`}>
                        <span>Expiry: 12/31/2026</span>
                        <span className="text-[#007a3f] uppercase tracking-wider font-extrabold">PIZZAFREESHIP</span>
                      </div>
                    </div>
                  </div>

                  {/* Voucher 2 */}
                  <div className={`border rounded-2xl overflow-hidden shadow-sm flex transition-colors duration-300 ${theme === 'dark' ? 'bg-[#121212] border-white/[0.06]' : 'bg-white border-gray-200'
                    }`}>
                    <div className="bg-[#007a3f] w-1/3 flex flex-col justify-center items-center p-4 text-white relative border-r-2 border-dashed border-white/[0.06]">
                      <div className={`absolute -top-3 -right-3 w-6 h-6 rounded-full transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-50'
                        }`}></div>
                      <div className={`absolute -bottom-3 -right-3 w-6 h-6 rounded-full transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-50'
                        }`}></div>
                      <Ticket size={28} className="mb-2" />
                      <span className="font-extrabold text-lg">10% OFF</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">DISCOUNT</span>
                    </div>
                    <div className={`p-4 flex-1 flex flex-col justify-between text-zinc-300 transition-colors duration-300 ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'
                      }`}>
                      <div className="space-y-1">
                        <h4 className={`font-black text-sm uppercase ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>New Customer Welcome</h4>
                        <p className="text-[11px] text-zinc-500 font-semibold leading-relaxed">
                          Get 10% off the total price of food on your first order.
                        </p>
                      </div>
                      <div className={`pt-3 border-t flex justify-between items-center text-[10px] font-bold text-zinc-500 transition-colors duration-300 ${theme === 'dark' ? 'border-white/[0.06]' : 'border-gray-100'
                        }`}>
                        <span>Expiry: 12/31/2026</span>
                        <span className="text-[#ee2828] uppercase tracking-wider font-extrabold">WELCOMEINN</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Form to Add / Edit Address as a Premium Popup Modal overlay */}
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
          <div className={`w-full max-w-2xl border transition-all duration-300 p-6 md:p-8 rounded-[28px] space-y-6 shadow-2xl relative cursor-default ${theme === 'dark' ? 'bg-[#121212] border-white/[0.06]' : 'bg-white border-gray-200'
            }`}>
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b pb-3 border-zinc-200/20">
              <h3 className="text-xs font-black text-pizza-gold tracking-widest uppercase">
                {editingAddressId ? 'UPDATE ADDRESS' : 'ADD NEW SHIPPING ADDRESS'}
              </h3>
              <button
                onClick={() => {
                  setAddressFormOpen(false);
                  resetAddressInputs();
                }}
                className="bg-[#ee2828] hover:bg-[#c02020] text-white font-extrabold text-xs tracking-wider uppercase px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow cursor-pointer"
              >
                CLOSE FORM
              </button>
            </div>

            <form onSubmit={handleAddressSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name: * */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className={`text-sm font-extrabold block ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-800'}`}>
                    Full Name: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter recipient's full name"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    className={`w-full border rounded-xl py-3 px-4 text-sm focus:outline-none transition-colors ${theme === 'dark'
                      ? 'bg-[#0d0d0d] border-white/[0.06] focus:border-[#007a3f]/40 text-zinc-200'
                      : 'bg-white border-gray-300 focus:border-[#007a3f] focus:ring-1 focus:ring-[#007a3f] text-gray-850'
                      }`}
                  />
                </div>

                {/* Phone Number: * */}
                <div className="space-y-1.5">
                  <label className={`text-sm font-extrabold block ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-800'}`}>
                    Phone Number: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Enter recipient's phone number"
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value)}
                    className={`w-full border rounded-xl py-3 px-4 text-sm focus:outline-none transition-colors ${theme === 'dark'
                      ? 'bg-[#0d0d0d] border-white/[0.06] focus:border-[#007a3f]/40 text-zinc-200'
                      : 'bg-white border-gray-300 focus:border-[#007a3f] focus:ring-1 focus:ring-[#007a3f] text-gray-850'
                      }`}
                  />
                </div>

                {/* Email Address: * */}
                <div className="space-y-1.5">
                  <label className={`text-sm font-extrabold block ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-800'}`}>
                    Email Address: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Enter contact email"
                    value={receiverEmail}
                    onChange={(e) => setReceiverEmail(e.target.value)}
                    className={`w-full border rounded-xl py-3 px-4 text-sm focus:outline-none transition-colors ${theme === 'dark'
                      ? 'bg-[#0d0d0d] border-white/[0.06] focus:border-[#007a3f]/40 text-zinc-200'
                      : 'bg-white border-gray-300 focus:border-[#007a3f] focus:ring-1 focus:ring-[#007a3f] text-gray-850'
                      }`}
                  />
                </div>

                {/* House Number: * */}
                <div className="space-y-1.5">
                  <label className={`text-sm font-extrabold block ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-800'}`}>
                    House Number: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter house number"
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    className={`w-full border rounded-xl py-3 px-4 text-sm focus:outline-none transition-colors ${theme === 'dark'
                      ? 'bg-[#0d0d0d] border-white/[0.06] focus:border-[#007a3f]/40 text-zinc-200'
                      : 'bg-white border-gray-300 focus:border-[#007a3f] focus:ring-1 focus:ring-[#007a3f] text-gray-850'
                      }`}
                  />
                </div>

                {/* Street Name: * */}
                <div className="space-y-1.5">
                  <label className={`text-sm font-extrabold block ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-800'}`}>
                    Street Name: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter street name"
                    value={streetName}
                    onChange={(e) => setStreetName(e.target.value)}
                    className={`w-full border rounded-xl py-3 px-4 text-sm focus:outline-none transition-colors ${theme === 'dark'
                      ? 'bg-[#0d0d0d] border-white/[0.06] focus:border-[#007a3f]/40 text-zinc-200'
                      : 'bg-white border-gray-300 focus:border-[#007a3f] focus:ring-1 focus:ring-[#007a3f] text-gray-850'
                      }`}
                  />
                </div>

                {/* Ward, District: * */}
                <div className="space-y-1.5">
                  <label className={`text-sm font-extrabold block ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-800'}`}>
                    Ward, District: <span className="text-red-500">*</span>
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
                      className={`w-full border rounded-xl py-3 pl-4 pr-10 text-sm focus:outline-none transition-colors appearance-none cursor-pointer ${theme === 'dark'
                        ? 'bg-[#0d0d0d] border-white/[0.06] focus:border-[#007a3f]/40 text-zinc-200'
                        : 'bg-white border-gray-300 focus:border-[#007a3f] focus:ring-1 focus:ring-[#007a3f] text-gray-850'
                        }`}
                    >
                      <option value="" className={theme === 'dark' ? 'bg-[#121212]' : 'bg-white'}>Select Ward, District</option>
                      {hcmcWardsList.map((item) => (
                        <option key={item.label} value={item.label} className={theme === 'dark' ? 'bg-[#121212]' : 'bg-white'}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                      <ChevronDown size={16} />
                    </span>
                  </div>
                </div>

                {/* Province/City: * */}
                <div className="space-y-1.5">
                  <label className={`text-sm font-extrabold block ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-800'}`}>
                    Province/City: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled
                    value={province}
                    className={`w-full border rounded-xl py-3 px-4 text-sm focus:outline-none transition-colors ${theme === 'dark'
                      ? 'bg-white/[0.02] border-white/[0.06] text-zinc-500'
                      : 'bg-gray-100 border-gray-300 text-gray-500'
                      }`}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  className="bg-[#007a3f] hover:bg-[#006030] text-white font-black text-xs tracking-widest uppercase px-6 py-3.5 rounded-xl transition-all shadow-lg cursor-pointer"
                >
                  SAVE ADDRESS
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddressFormOpen(false);
                    resetAddressInputs();
                  }}
                  className={`font-black text-xs tracking-widest uppercase px-6 py-3.5 rounded-xl transition-all border cursor-pointer ${theme === 'dark'
                    ? 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
                    }`}
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom delete confirmation modal with premium backdrop-blur and animations */}
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
            className={`w-full max-w-md border transition-all duration-300 p-6 md:p-8 rounded-[28px] space-y-6 shadow-2xl relative cursor-default animate-fadeIn ${theme === 'dark' ? 'bg-[#121212] border-white/[0.06] shadow-red-950/10' : 'bg-white border-gray-200 shadow-gray-200/50'
              }`}
          >
            {/* Header / Warning Icon */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-md">
                <AlertCircle size={28} />
              </div>
              <div className="space-y-1.5">
                <h3 className={`text-base font-black uppercase tracking-wide ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                  Confirm Address Deletion
                </h3>
                <p className={`text-xs font-semibold leading-relaxed ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                  Are you sure you want to delete this shipping address? This action cannot be undone, and the address will be permanently removed from your account.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setAddressIdToDelete(null);
                }}
                className={`flex-1 font-black text-xs tracking-widest uppercase px-6 py-3.5 rounded-xl transition-all border cursor-pointer ${theme === 'dark'
                    ? 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
                  }`}
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleDeleteAddress}
                className="flex-1 bg-[#ee2828] hover:bg-[#c02020] text-white font-black text-xs tracking-widest uppercase px-6 py-3.5 rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {addressesLoading ? (
                  <Loader2 className="animate-spin w-4 h-4" />
                ) : (
                  <span>DELETE ADDRESS</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-6 bg-[#0a0a0a]">
        <Footer />
      </div>
    </div>
  );
}
