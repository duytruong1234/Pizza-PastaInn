// Sidebar menu data — các mục quản lý Pizza&PastaInn
import * as Icons from "../icons";

export const NAV_DATA = [
  {
    label: "TỔNG QUAN",
    items: [
      {
        title: "Bảng điều khiển",
        icon: Icons.HomeIcon,
        items: [
          {
            title: "Phân tích",
            url: "/",
          },
        ],
      },
    ],
  },
  {
    label: "QUẢN LÝ",
    items: [
      {
        title: "Đơn hàng",
        url: "/orders",
        icon: Icons.Table,
        items: [],
      },
      {
        title: "Thực đơn",
        icon: Icons.Alphabet,
        items: [
          {
            title: "Danh mục",
            url: "/menu/categories",
          },
          {
            title: "Món ăn",
            url: "/menu/dishes",
          },
          {
            title: "Combo",
            url: "/combos",
          },
          {
            title: "Kích thước",
            url: "/menu/sizes",
          },
          {
            title: "Đế bánh",
            url: "/menu/crusts",
          },
          {
            title: "Topping",
            url: "/menu/toppings",
          },
        ],
      },

      {
        title: "Chi nhánh",
        url: "/stores",
        icon: Icons.HomeIcon,
        items: [],
      },
      {
        title: "Khách hàng",
        url: "/customers",
        icon: Icons.User,
        items: [],
      },
      {
        title: "Đánh giá",
        url: "/reviews",
        icon: Icons.StarIcon,
        items: [],
      },
    ],
  },
  {
    label: "HỖ TRỢ",
    items: [
      {
        title: "Tin nhắn",
        url: "/messages",
        icon: Icons.ChatIcon,
        items: [],
      },
    ],
  },
  {
    label: "TRÍ TUỆ NHÂN TẠO",
    items: [
      {
        title: "AI Chatbot",
        url: "/ai-chatbot",
        icon: Icons.BotIcon,
        items: [],
      },
      {
        title: "Gợi ý thông minh",
        url: "/recommendations",
        icon: Icons.SparklesIcon,
        items: [],
      },
    ],
  },
  {
    label: "KHÁC",
    items: [
      {
        title: "Chính sách",
        url: "/policies",
        icon: Icons.Alphabet,
        items: [],
      },
      {
        title: "Cài đặt",
        url: "/pages/settings",
        icon: Icons.Alphabet,
        items: [],
      },
    ],
  },
];
