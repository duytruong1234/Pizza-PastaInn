"use client";

import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { 
  MessageSquare, 
  Search, 
  Trash2, 
  Bot, 
  User, 
  Eye, 
  RotateCw,
  Activity,
  Cpu,
  Clock,
  Settings,
  Database
} from "lucide-react";

interface BotStats {
  totalSessions: number;
  todaySessions: number;
  totalMessages: number;
  avgMessagesPerSession: string | number;
  intentStats: Array<{
    intent: string | null;
    _count: { intent: number };
  }>;
}

interface ChatSession {
  session_id: number;
  user_id: number | null;
  guest_id: string | null;
  user?: { username: string; email: string } | null;
  total_messages: number;
  last_intent: string | null;
  started_at: string;
  is_active: boolean;
  first_message?: { content: string } | null;
  last_message?: { content: string } | null;
}

interface ChatMessage {
  message_id: number;
  role: "user" | "bot";
  content: string;
  intent: string | null;
  created_at: string;
}

export default function AiChatbotPage() {
  const [activeTab, setActiveTab] = useState<"stats" | "history" | "config">("stats");
  
  // Data states
  const [stats, setStats] = useState<BotStats | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Detail Modal states
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionMessages, setSessionMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "stats") {
      fetchStats();
    } else if (activeTab === "history") {
      fetchSessions();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/chatbot/stats");
      if (res.data.success && res.data.data) {
        setStats(res.data.data);
      }
    } catch (error) {
      toast.error("Lỗi khi tải thống kê Chatbot");
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/chatbot/sessions?page=1&limit=50&search=${searchQuery}`);
      if (res.data.success && res.data.data) {
        setSessions(res.data.data.sessions || []);
      }
    } catch (error) {
      toast.error("Lỗi khi tải lịch sử hội thoại");
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionDetail = async (id: string) => {
    setSelectedSessionId(id);
    setMessagesLoading(true);
    setSessionMessages([]);
    try {
      const res = await api.get(`/api/admin/chatbot/sessions/${id}`);
      if (res.data.success && res.data.data) {
        setSessionMessages(res.data.data.messages || []);
      }
    } catch (error) {
      toast.error("Lỗi khi tải chi tiết tin nhắn");
      setSelectedSessionId(null);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa phiên chat này không?")) return;
    
    try {
      const res = await api.delete(`/api/admin/chatbot/sessions/${id}`);
      if (res.data.success) {
        toast.success("Đã xóa phiên chat thành công");
        setSessions(prev => prev.filter(s => String(s.session_id) !== id));
      }
    } catch (error) {
      toast.error("Lỗi khi xóa phiên chat");
    }
  };

  const getIntentLabel = (intent: string) => {
    switch (intent) {
      case "recommend": return "Gợi ý sở thích";
      case "popular": return "Món bán chạy";
      case "top_rated": return "Đánh giá cao";
      case "general": return "Câu hỏi chung";
      default: return intent || "Không xác định";
    }
  };

  const getIntentBadgeClass = (intent: string) => {
    switch (intent) {
      case "recommend": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "popular": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      case "top_rated": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "general": return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wide text-dark dark:text-white">
            QUẢN LÝ AI CHATBOT
          </h1>
          <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400">
            Theo dõi, quản lý hội thoại và hiệu suất của trợ lý AI.
          </p>
        </div>
        <button 
          onClick={() => activeTab === 'stats' ? fetchStats() : fetchSessions()}
          className="rounded-xl border border-stroke bg-white p-2.5 text-gray-500 hover:bg-gray-100 hover:text-primary dark:border-dark-3 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-dark-2 transition-all cursor-pointer inline-flex items-center justify-center shadow-sm"
        >
          <RotateCw size={16} className={`${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-stroke dark:border-dark-3">
        <button
          onClick={() => setActiveTab("stats")}
          className={`pb-3 text-sm font-bold uppercase transition-all ${
            activeTab === "stats" 
              ? "border-b-2 border-primary text-primary" 
              : "text-gray-500 hover:text-dark dark:text-gray-400 dark:hover:text-white"
          }`}
        >
          Thống kê
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`pb-3 text-sm font-bold uppercase transition-all ${
            activeTab === "history" 
              ? "border-b-2 border-primary text-primary" 
              : "text-gray-500 hover:text-dark dark:text-gray-400 dark:hover:text-white"
          }`}
        >
          Lịch sử hội thoại
        </button>
        <button
          onClick={() => setActiveTab("config")}
          className={`pb-3 text-sm font-bold uppercase transition-all ${
            activeTab === "config" 
              ? "border-b-2 border-primary text-primary" 
              : "text-gray-500 hover:text-dark dark:text-gray-400 dark:hover:text-white"
          }`}
        >
          Cấu hình
        </button>
      </div>

      {/* Tab 1: Stats */}
      {activeTab === "stats" && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-[24px] border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
              <div className="text-gray-500 dark:text-zinc-400 text-xs font-bold uppercase mb-2">Tổng phiên chat</div>
              <div className="text-3xl font-black text-dark dark:text-white">{stats.totalSessions}</div>
            </div>
            <div className="rounded-[24px] border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
              <div className="text-gray-500 dark:text-zinc-400 text-xs font-bold uppercase mb-2">Phiên hôm nay</div>
              <div className="text-3xl font-black text-primary">{stats.todaySessions}</div>
            </div>
            <div className="rounded-[24px] border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
              <div className="text-gray-500 dark:text-zinc-400 text-xs font-bold uppercase mb-2">Tổng tin nhắn</div>
              <div className="text-3xl font-black text-dark dark:text-white">{stats.totalMessages}</div>
            </div>
            <div className="rounded-[24px] border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
              <div className="text-gray-500 dark:text-zinc-400 text-xs font-bold uppercase mb-2">TB tin nhắn/phiên</div>
              <div className="text-3xl font-black text-dark dark:text-white">{Number(stats.avgMessagesPerSession || 0).toFixed(1)}</div>
            </div>
          </div>

          <div className="rounded-[24px] border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
            <h3 className="text-sm font-black uppercase mb-4 text-dark dark:text-white">Phân bố chủ đề (Intents)</h3>
            <div className="space-y-4">
              {(stats.intentStats || []).map((item) => {
                const total = stats.intentStats.reduce((a, b) => a + b._count.intent, 0);
                const count = item._count.intent;
                const pct = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={item.intent || 'unknown'} className="flex items-center gap-4">
                    <div className="w-32 text-xs font-bold text-gray-600 dark:text-zinc-300">
                      {getIntentLabel(item.intent || '')}
                    </div>
                    <div className="flex-1 h-2.5 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                    </div>
                    <div className="w-16 text-right text-xs font-bold text-gray-500">{count} ({pct.toFixed(1)}%)</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: History */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Search size={16} />
              </span>
              <input 
                type="text" 
                placeholder="Tìm kiếm theo IP hoặc Username..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchSessions()}
                className="w-full rounded-xl border border-stroke bg-white py-2.5 pl-10 pr-4 text-xs font-semibold text-dark outline-none focus:border-primary dark:border-dark-3 dark:bg-gray-dark dark:text-white"
              />
            </div>
            <button 
              onClick={fetchSessions}
              className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl"
            >
              Tìm kiếm
            </button>
          </div>

          <div className="rounded-[24px] border border-stroke bg-white shadow-sm dark:border-dark-3 dark:bg-gray-dark overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-zinc-800 border-b border-stroke dark:border-dark-3 text-xs uppercase font-bold text-gray-500 dark:text-zinc-400">
                <tr>
                  <th className="px-6 py-4">Khách hàng</th>
                  <th className="px-6 py-4">Thời gian</th>
                  <th className="px-6 py-4">Số tin nhắn</th>
                  <th className="px-6 py-4">Loại câu hỏi</th>
                  <th className="px-6 py-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke dark:divide-dark-3">
                {sessions.map(s => (
                  <tr key={s.session_id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-dark dark:text-white">
                      {s.user?.username ? s.user.username : <span className="text-gray-400">Khách {s.guest_id ? `(${s.guest_id.slice(0, 10)}...)` : ''}</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs font-medium">
                      {dayjs(s.started_at).format('DD/MM/YYYY HH:mm')}
                    </td>
                    <td className="px-6 py-4 font-bold text-dark dark:text-white">
                      {s.total_messages}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${getIntentBadgeClass(s.last_intent || '')}`}>
                        {getIntentLabel(s.last_intent || '')}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex items-center justify-center gap-2">
                      <button 
                        onClick={() => fetchSessionDetail(String(s.session_id))}
                        className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20"
                        title="Xem chi tiết"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteSession(String(s.session_id))}
                        className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20"
                        title="Xóa phiên"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {sessions.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500 font-medium">
                      Không có dữ liệu hội thoại.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Config */}
      {activeTab === "config" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-[24px] border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark flex items-start gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl dark:bg-emerald-900/30 dark:text-emerald-400">
              <Activity size={24} />
            </div>
            <div>
              <div className="text-sm font-black uppercase text-dark dark:text-white">Trạng thái</div>
              <div className="mt-1 text-xs font-semibold text-emerald-500">Đang hoạt động</div>
              <p className="mt-2 text-xs text-gray-500">AI Chatbot đang trực tuyến và sẵn sàng phản hồi khách hàng.</p>
            </div>
          </div>
          
          <div className="rounded-[24px] border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark flex items-start gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl dark:bg-blue-900/30 dark:text-blue-400">
              <Cpu size={24} />
            </div>
            <div>
              <div className="text-sm font-black uppercase text-dark dark:text-white">Model AI</div>
              <div className="mt-1 text-xs font-bold text-gray-700 dark:text-gray-300">Qwen 3.8-27B (Groq Cloud)</div>
              <p className="mt-2 text-xs text-gray-500">Mô hình ngôn ngữ lớn tối ưu cho tốc độ và tiếng Việt.</p>
            </div>
          </div>

          <div className="rounded-[24px] border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark flex items-start gap-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-xl dark:bg-orange-900/30 dark:text-orange-400">
              <Settings size={24} />
            </div>
            <div>
              <div className="text-sm font-black uppercase text-dark dark:text-white">Rate limit</div>
              <div className="mt-1 text-xs font-bold text-gray-700 dark:text-gray-300">10 tin nhắn/phút/IP</div>
              <p className="mt-2 text-xs text-gray-500">Giới hạn số lượng yêu cầu để tránh spam hệ thống.</p>
            </div>
          </div>

          <div className="rounded-[24px] border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark flex items-start gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-xl dark:bg-purple-900/30 dark:text-purple-400">
              <Database size={24} />
            </div>
            <div>
              <div className="text-sm font-black uppercase text-dark dark:text-white">Cache Menu & Context</div>
              <div className="mt-1 text-xs font-bold text-gray-700 dark:text-gray-300">5 phút TTL - 4 tin nhắn ngữ cảnh</div>
              <p className="mt-2 text-xs text-gray-500">Lưu trữ bộ nhớ đệm cho menu và duy trì ngữ cảnh trò chuyện ngắn.</p>
            </div>
          </div>
        </div>
      )}

      {/* Chat Session Detail Modal */}
      <Modal
        isOpen={!!selectedSessionId}
        setIsOpen={(open) => { if (!open) setSelectedSessionId(null); }}
        title="Chi tiết hội thoại"
        className="max-w-2xl"
      >
        <div className="p-4 bg-gray-50 dark:bg-zinc-900 rounded-xl space-y-4 max-h-[60vh] overflow-y-auto">
          {messagesLoading ? (
            <div className="py-10 text-center text-gray-500">Đang tải tin nhắn...</div>
          ) : sessionMessages.length === 0 ? (
            <div className="py-10 text-center text-gray-500">Không có tin nhắn nào.</div>
          ) : (
            sessionMessages.map((msg) => (
              <div key={msg.message_id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'bot' && (
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                    <Bot size={16} />
                  </div>
                )}
                
                <div className={`max-w-[75%] rounded-2xl p-3 text-sm ${
                  msg.role === 'user' 
                    ? 'bg-primary text-white rounded-br-none' 
                    : 'bg-white border border-stroke dark:bg-gray-dark dark:border-dark-3 dark:text-white rounded-bl-none'
                }`}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  <div className={`text-[10px] mt-1.5 flex justify-between items-center gap-4 ${
                    msg.role === 'user' ? 'text-primary-light' : 'text-gray-400'
                  }`}>
                    <span>{dayjs(msg.created_at).format('HH:mm DD/MM')}</span>
                    {msg.intent && (
                      <span className="font-bold opacity-70">
                        [{getIntentLabel(msg.intent)}]
                      </span>
                    )}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 dark:bg-zinc-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
                    <User size={16} />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Modal>

    </div>
  );
}
