"use client";

import { api, API_URL } from "@/lib/api";
import { useEffect, useState, useRef, useMemo } from "react";
import {
  Search, Send, Paperclip, MoreVertical, X, Check,
  MessageSquare, User, Phone, MapPin, RefreshCw, AlertTriangle, Trash2
} from "lucide-react";
import { toast } from "sonner";

interface MessageImage {
  image_id: number;
  message_id: number;
  image_url: string;
  uploaded_at: string;
}

interface DBMessage {
  message_id: number;
  room_id: number;
  sender_type: "customer" | "admin";
  sender_id: number | null;
  message_text: string;
  is_read: boolean;
  created_at: string;
  images: MessageImage[];
  sender?: {
    user_id: number;
    username: string;
    avatar?: string;
  } | null;
}

interface ChatRoom {
  room_id: number;
  customer_id: number | null;
  guest_session_id: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  guest_address: string | null;
  room_status: "pending" | "active" | "closed";
  created_at: string;
  updated_at: string;
  unreadCount: number;
  customer?: {
    user_id: number;
    username: string;
    email: string;
    phone: string;
    avatar?: string;
    addresses?: Array<{
      address_line: string | null;
      is_default: boolean | null;
    }>;
  } | null;
  messages: DBMessage[];
}

export default function MessagesPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [messages, setMessages] = useState<DBMessage[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Chat input
  const [inputText, setInputText] = useState("");
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all chat rooms
  const fetchRooms = async (silent = false) => {
    if (!silent) setLoadingRooms(true);
    try {
      const res = await api.get("/api/admin/chat/rooms");
      if (res.data?.success) {
        setRooms(res.data.data);

        // Auto-select first room by default if none is selected
        if (!activeRoomId && res.data.data.length > 0 && !silent) {
          const firstRoom = res.data.data[0];
          handleSelectRoom(firstRoom.room_id);
        }
      }
    } catch (err) {
      console.error("Error loading chat room list:", err);
      if (!silent) toast.error("Tải danh sách phòng chat thất bại");
    } finally {
      if (!silent) setLoadingRooms(false);
    }
  };

  // Fetch messages for selected room
  const fetchMessages = async (roomId: number, silent = false) => {
    if (!silent) setLoadingMessages(true);
    try {
      const res = await api.get(`/api/admin/chat/rooms/${roomId}/messages`);
      if (res.data?.success) {
        setMessages(res.data.data);
      }
    } catch (err) {
      console.error("Error loading messages:", err);
      if (!silent) toast.error("Tải lịch sử tin nhắn thất bại");
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  // Initial rooms load
  useEffect(() => {
    fetchRooms();
  }, []);

  // Polling rooms list and active room messages every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRooms(true);
      if (activeRoomId) {
        fetchMessages(activeRoomId, true);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeRoomId]);

  // Handle active room change
  const handleSelectRoom = async (roomId: number) => {
    setActiveRoomId(roomId);
    setShowOptionsDropdown(false);
    await fetchMessages(roomId);

    // Mark room as read
    try {
      await api.patch(`/api/admin/chat/rooms/${roomId}/read`);
      setRooms((prev) =>
        prev.map((r) => r.room_id === roomId ? { ...r, unreadCount: 0 } : r)
      );
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  // Scroll to bottom when messages or active room changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeRoomId]);

  // Filter and search rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      if (searchTerm.trim() !== "") {
        const term = searchTerm.toLowerCase();
        const guestName = room.guest_name?.toLowerCase() || "";
        const guestPhone = room.guest_phone || "";
        const customerName = room.customer?.username?.toLowerCase() || "";
        const customerPhone = room.customer?.phone || "";
        return guestName.includes(term) || guestPhone.includes(term) || customerName.includes(term) || customerPhone.includes(term);
      }
      return true;
    });
  }, [rooms, searchTerm]);

  // Active chat room details
  const activeRoom = useMemo(() => {
    return rooms.find((r) => r.room_id === activeRoomId) || null;
  }, [rooms, activeRoomId]);

  // Calculate dynamic online/offline status based on last customer message
  const isOnline = useMemo(() => {
    if (!activeRoom || !messages || messages.length === 0) return false;
    // Find last message sent by customer
    const lastCustomerMsg = [...messages].reverse().find(m => m.sender_type === "customer");
    if (!lastCustomerMsg) return false;
    const lastMsgTime = new Date(lastCustomerMsg.created_at).getTime();
    const diffMinutes = (Date.now() - lastMsgTime) / 60000;
    return diffMinutes < 5; // online if last message was within 5 minutes
  }, [activeRoom, messages]);

  // Action: Delete conversation
  const handleDeleteConversation = async (roomId: number) => {
    if (!window.confirm("Cảnh báo: Hành động này sẽ xóa vĩnh viễn cuộc hội thoại này và tất cả tin nhắn bên trong. Bạn có chắc chắn muốn xóa?")) return;

    try {
      const res = await api.delete(`/api/admin/chat/rooms/${roomId}`);
      if (res.data?.success) {
        toast.success("Xóa cuộc hội thoại thành công");
        setActiveRoomId(null);
        setMessages([]);
        setShowOptionsDropdown(false);
        fetchRooms(true);
      } else {
        toast.error("Xóa cuộc hội thoại thất bại");
      }
    } catch (err) {
      console.error("Error deleting conversation:", err);
      toast.error("Lỗi kết nối đến máy chủ");
    }
  };

  // Send Admin Reply
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed && previewImages.length === 0) return;
    if (!activeRoomId) return;

    try {
      const payload = {
        message_text: trimmed,
        image_urls: previewImages
      };

      setInputText("");
      setPreviewImages([]);

      const res = await api.post(`/api/admin/chat/rooms/${activeRoomId}/messages`, payload);
      if (res.data?.success) {
        const newMsg = res.data.data;
        setMessages((prev) => [...prev, newMsg]);
        fetchRooms(true);
      }
    } catch (err) {
      console.error("Error sending response:", err);
      toast.error("Gửi tin nhắn thất bại");
    }
  };

  // Upload attachment image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await api.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data?.success) {
        const fullUrl = res.data.data.url.startsWith("http")
          ? res.data.data.url
          : `${API_URL}${res.data.data.url}`;
        setPreviewImages((prev) => [...prev, fullUrl]);
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      toast.error("Tải ảnh lên thất bại");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Toggle Room Status
  const handleUpdateRoomStatus = async (status: "pending" | "active" | "closed") => {
    if (!activeRoomId) return;
    try {
      const res = await api.patch(`/api/admin/chat/rooms/${activeRoomId}/status`, {
        room_status: status
      });
      if (res.data?.success) {
        toast.success(`Thay đổi trạng thái phòng chat thành công`);
        setShowOptionsDropdown(false);
        fetchRooms(true);
      }
    } catch (err) {
      console.error("Error updating room status:", err);
      toast.error("Thay đổi trạng thái phòng chat thất bại");
    }
  };

  // Format timestamp (e.g. 1:55pm)
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return "";
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-110px)] overflow-hidden">

      {/* ── BREADCRUMB & HEADER ROW ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5 select-none shrink-0">
        <h1 className="text-[26px] font-extrabold text-[#1c2434] dark:text-white tracking-tight">
          Tin nhắn hỗ trợ
        </h1>
      </div>

      {/* Main chat window box container */}
      <div className="flex flex-1 overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-sm dark:border-dark-3 dark:bg-gray-dark">

        {/* ── CỘT TRÁI (DANH SÁCH CUỘC HỘI THOẠI - MATCHING MOCKUP 100%) ───────── */}
        <div className="flex w-[320px] flex-col border-r border-[#cbd5e1] dark:border-dark-3 shrink-0">

          {/* Header danh sách: "Active Conversations" */}
          <div className="p-5 pb-3 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <h2 className="text-[17px] font-extrabold text-[#1c2434] dark:text-white tracking-wide">
                Hội thoại đang hoạt động
              </h2>
              {rooms.filter(r => r.room_status !== 'closed').length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#5c54e5] text-[10px] font-black text-white shadow-sm">
                  {rooms.filter(r => r.room_status !== 'closed').length}
                </span>
              )}
            </div>
            <button
              onClick={() => fetchRooms()}
              className="text-gray-400 hover:text-[#5c54e5] transition-colors duration-200"
              title="Làm mới danh sách"
            >
              <RefreshCw size={15} className={loadingRooms ? "animate-spin text-[#5c54e5]" : ""} />
            </button>
          </div>

          {/* Ô tìm kiếm ngay dưới tiêu đề (Mockup exactly!) */}
          <div className="px-5 pb-4">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border border-[#e2e8f0] bg-[#f8fafc] py-2.5 pl-4 pr-10 text-xs font-semibold outline-none focus:bg-white focus:border-[#5c54e5] dark:border-dark-3 placeholder-gray-400 text-[#1c2434] dark:text-white dark:bg-transparent"
              />
              <Search className="absolute right-3.5 text-gray-400 select-none pointer-events-none" size={16} />
            </div>
          </div>

          {/* Danh sách phòng chat */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#e2e8f0] dark:divide-dark-3 scrollbar-thin">
            {loadingRooms ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#5c54e5] border-t-transparent mb-2" />
                <span className="text-xs font-bold">Đang tải hội thoại...</span>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="text-center py-16 text-gray-400 font-bold text-xs">
                Không tìm thấy cuộc hội thoại nào
              </div>
            ) : (
              filteredRooms.map((room) => {
                const isSelected = room.room_id === activeRoomId;
                const isGuest = !room.customer_id;
                const displayName = isGuest ? room.guest_name : room.customer?.username;
                const displayPhone = isGuest ? room.guest_phone : room.customer?.phone;
                const initials = displayName ? displayName.substring(0, 2).toUpperCase() : "K";

                const lastMsg = room.messages?.[0];
                const lastMsgText = lastMsg
                  ? lastMsg.message_text || "[Hình ảnh]"
                  : "Chưa có tin nhắn";

                const statusColor = room.room_status === 'pending'
                  ? 'bg-amber-400'
                  : room.room_status === 'active'
                    ? 'bg-[#10b981]'
                    : 'bg-zinc-400';

                return (
                  <div
                    key={room.room_id}
                    onClick={() => handleSelectRoom(room.room_id)}
                    className={`flex items-center gap-3 px-5 py-4.5 cursor-pointer transition-all duration-150 border-l-[3px] ${isSelected
                      ? "bg-[#f8fafc] border-l-[#5c54e5] dark:bg-[#1a202c]"
                      : "border-l-transparent hover:bg-zinc-50 dark:hover:bg-dark-2"
                      }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0 select-none">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f1f5f9] text-[#1c2434] font-black text-[13px] border border-[#e2e8f0]">
                        {initials}
                      </div>
                      <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${statusColor}`} />
                    </div>

                    {/* Chi tiết tin nhắn */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="truncate text-sm font-extrabold text-[#1c2434] dark:text-white leading-snug">
                          {displayName || "Khách vãng lai"}
                        </h4>

                        {/* Last message time + Unread badge */}
                        <div className="flex items-center gap-1.5 shrink-0 select-none">
                          {lastMsg && (
                            <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">
                              {formatTime(lastMsg.created_at)}
                            </span>
                          )}
                          {room.unreadCount > 0 && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-sm leading-none animate-bounce">
                              {room.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="truncate text-[12px] font-medium text-gray-500 mt-1 leading-snug">
                        {lastMsgText}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── CỘT PHẢI (HỘI THOẠI CHI TIẾT - MATCHING MOCKUP 100%) ───────────────── */}
        <div className="flex-1 flex flex-col bg-white dark:bg-[#1a202c]">
          {activeRoom ? (
            <>
              {/* Header chi tiết hội thoại */}
              <div className="bg-white border-b border-[#cbd5e1] px-6 py-4 flex items-center justify-between dark:bg-gray-dark dark:border-dark-3 shrink-0 select-none">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#f1f5f9] text-[#1c2434] font-black text-[12px] flex items-center justify-center border border-[#e2e8f0]">
                    {(activeRoom.guest_name || activeRoom.customer?.username || "K").substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#1c2434] dark:text-white leading-snug">
                      {activeRoom.guest_name || activeRoom.customer?.username || "Khách vãng lai"}
                    </h3>
                    {isOnline ? (
                      <span className="text-[11px] font-bold text-emerald-500 leading-none mt-1.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Trực tuyến
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-gray-400 leading-none mt-1.5 block">
                        Ngoại tuyến
                      </span>
                    )}
                  </div>
                </div>

                {/* Tác vụ đổi trạng thái phòng */}
                <div className="relative">
                  <button
                    onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
                    className="rounded-lg p-1.5 hover:bg-[#f1f5f9] dark:hover:bg-dark-2 text-gray-400 transition-all cursor-pointer"
                  >
                    <MoreVertical size={19} />
                  </button>

                  {showOptionsDropdown && (
                    <div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-white p-2 shadow-[0_10px_25px_rgba(0,0,0,0.06)] border border-[#e2e8f0] dark:bg-gray-dark dark:border-dark-3 z-50">
                      <div className="px-3 py-1.5 text-[9px] font-black text-gray-400 tracking-wider uppercase border-b border-[#f1f5f9] dark:border-dark-3 mb-1">
                        Cập nhật trạng thái
                      </div>
                      <button
                        onClick={() => handleUpdateRoomStatus("active")}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all cursor-pointer"
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                        <span>Hoạt động</span>
                      </button>
                      <button
                        onClick={() => handleUpdateRoomStatus("closed")}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
                      >
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                        <span>Đóng cuộc hội thoại</span>
                      </button>
                      <div className="border-t border-[#f1f5f9] dark:border-dark-3 my-1"></div>
                      <button
                        onClick={() => handleDeleteConversation(activeRoom.room_id)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
                      >
                        <Trash2 size={13} className="text-rose-500 shrink-0" />
                        <span>Xóa cuộc hội thoại</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Chi tiết thông tin liên hệ (Thành viên hoặc Khách vãng lai) */}
              {(activeRoom.customer_id ? (activeRoom.customer?.phone || (activeRoom.customer?.addresses && activeRoom.customer.addresses.length > 0)) : (activeRoom.guest_phone || activeRoom.guest_address)) && (
                <div className="bg-amber-50/70 border-b border-amber-100/50 px-6 py-2 flex flex-wrap gap-4 text-[11px] font-bold text-amber-800 dark:bg-zinc-800/40 dark:border-dark-3 dark:text-zinc-300 shrink-0">
                  {activeRoom.customer_id ? (
                    <>
                      {activeRoom.customer?.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone size={12} className="text-[#5c54e5] dark:text-indigo-400" />
                          <span>SĐT: <span className="font-extrabold text-[#1c2434] dark:text-zinc-100">{activeRoom.customer.phone}</span></span>
                        </div>
                      )}
                      {(activeRoom.customer?.addresses && activeRoom.customer.addresses.length > 0) && (
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <MapPin size={12} className="text-[#5c54e5] dark:text-indigo-400 shrink-0" />
                          <span className="truncate">
                            Địa chỉ: <span className="font-extrabold text-[#1c2434] dark:text-zinc-100">
                              {(() => {
                                const addr = activeRoom.customer.addresses.find(addr => addr.is_default)?.address_line 
                                             || activeRoom.customer.addresses[0]?.address_line;
                                if (!addr) return "";
                                if (addr.trim().startsWith("{")) {
                                  try {
                                    const parsed = JSON.parse(addr);
                                    return parsed.address || parsed.address_line || addr;
                                  } catch (e) {
                                    return addr;
                                  }
                                }
                                return addr;
                              })()}
                            </span>
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {activeRoom.guest_phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone size={12} className="text-amber-600" />
                          <span>SĐT: <span className="font-extrabold">{activeRoom.guest_phone}</span></span>
                        </div>
                      )}
                      {activeRoom.guest_address && (
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <MapPin size={12} className="text-amber-600 shrink-0" />
                          <span className="truncate">Địa chỉ: <span className="font-extrabold">{activeRoom.guest_address}</span></span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Khung chứa các bong bóng tin nhắn (Mockup 100% exact!) */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
                {loadingMessages ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#5c54e5] border-t-transparent mb-2" />
                    <span className="text-xs font-bold">Đang tải tin nhắn...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400 select-none">
                    <MessageSquare className="w-12 h-12 mb-3 opacity-30 text-indigo-500 animate-pulse" />
                    <p className="text-sm font-bold">Chưa có tin nhắn nào</p>
                    <p className="text-xs text-gray-400 mt-1">Bắt đầu trò chuyện với khách hàng.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isAdmin = msg.sender_type === "admin";
                    const senderName = activeRoom.guest_name || activeRoom.customer?.username || "Khách hàng";

                    return (
                      <div
                        key={msg.message_id}
                        className={`flex flex-col max-w-[80%] ${isAdmin ? "ml-auto items-end" : "items-start"}`}
                      >
                        {/* Name header above customer bubble ONLY (Mockup 100% exact!) */}
                        {!isAdmin && (
                          <span className="text-[11px] font-black text-gray-500 mb-1 px-1.5 select-none leading-none">
                            {senderName}
                          </span>
                        )}

                        {/* Message Bubble */}
                        <div className={`rounded-xl px-4.5 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.05)] text-[13px] font-semibold leading-relaxed ${isAdmin
                          ? "bg-[#e8eefc] text-[#2c3e50] rounded-tr-none"
                          : "bg-[#e0f2fe] text-[#1c2d3d] rounded-tl-none"
                          }`}>
                          {msg.message_text && <p className="whitespace-pre-wrap">{msg.message_text}</p>}

                          {/* Đính kèm hình ảnh */}
                          {msg.images && msg.images.length > 0 && (
                            <div className={`grid gap-2 mt-2 ${msg.images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                              {msg.images.map((img) => (
                                <a
                                  key={img.image_id}
                                  href={img.image_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block rounded-lg overflow-hidden border border-black/5 hover:opacity-90 active:scale-95 transition-all shadow-inner"
                                >
                                  <img
                                    src={img.image_url}
                                    alt="Hình đính kèm"
                                    className="max-h-[160px] w-full object-cover"
                                  />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Timestamp below message bubble (Mockup exactly!) */}
                        <span className="text-[9px] font-black text-gray-400 mt-1 px-1.5 select-none leading-none">
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Trạng thái closed thông báo chặn */}
              {activeRoom.room_status === 'closed' && (
                <div className="bg-zinc-50 border-t border-b border-[#cbd5e1] p-3 flex items-center justify-center gap-2 text-xs font-bold text-zinc-500 shrink-0 select-none">
                  <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                  <span>Cuộc hội thoại đã đóng. Tin nhắn phản hồi tiếp theo sẽ kích hoạt lại phòng chat.</span>
                </div>
              )}

              {/* Khung soạn thảo tin nhắn (Mockup Exactly: Inline clip & smile, circular send button) */}
              <form
                onSubmit={handleSendMessage}
                className="bg-white border-t border-[#cbd5e1] p-4.5 dark:bg-gray-dark dark:border-dark-3 shrink-0"
              >
                {/* Upload preview images */}
                {previewImages.length > 0 && (
                  <div className="flex gap-2.5 pb-4 pt-1 px-1 shrink-0 select-none">
                    {previewImages.map((url, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-stroke shrink-0 shadow-sm">
                        <img src={url} alt="Xem trước ảnh" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setPreviewImages(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 bg-black/75 hover:bg-black/90 text-white rounded-full p-0.5 transition-colors cursor-pointer"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3 w-full">

                  {/* Inline wrapper for input & icons inside it */}
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={isUploading ? "Đang tải ảnh lên..." : "Nhập nội dung tin nhắn..."}
                      disabled={isUploading}
                      className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl py-3.5 pl-5 pr-20 text-xs font-semibold outline-none focus:bg-white focus:border-[#5c54e5] dark:bg-dark-2 dark:border-dark-3 dark:focus:bg-transparent dark:text-zinc-100 placeholder-gray-400"
                    />

                    {/* Clip action inside the input box on the right */}
                    <div className="absolute right-4.5 top-1/2 -translate-y-1/2 flex items-center gap-3.5 text-gray-400">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="hover:text-[#5c54e5] transition-colors cursor-pointer"
                        title="Đính kèm ảnh"
                      >
                        <Paperclip size={19} />
                      </button>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  {/* Send button: Circular purple button outside the input (Mockup exactly!) */}
                  <button
                    type="submit"
                    disabled={isUploading || (!inputText.trim() && previewImages.length === 0)}
                    className="bg-[#5c54e5] text-white rounded-xl h-12 w-12 flex items-center justify-center shadow-[0_4px_10px_rgba(92,84,229,0.25)] hover:bg-[#4f46e5] active:scale-95 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                    title="Gửi"
                  >
                    <Send size={18} className="transform rotate-45 -translate-x-[2px] -translate-y-[1px]" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            /* Chưa chọn hội thoại (Mockup empty state) */
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 select-none">
              <MessageSquare className="w-16 h-16 mb-3 text-gray-300 dark:text-zinc-700 animate-bounce" />
              <h3 className="text-sm font-extrabold text-dark dark:text-white leading-snug">
                Hỗ trợ trực tuyến
              </h3>
              <p className="text-[12px] text-gray-400 mt-1 max-w-[280px] text-center font-semibold leading-relaxed">
                Vui lòng chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu nhắn tin với khách hàng.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
