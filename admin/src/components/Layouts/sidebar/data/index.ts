// Sidebar menu data — các mục quản lý Pizza&PastaInn
import * as Icons from "../icons";

export const NAV_DATA = [
  {
    label: "TỔNG QUAN",
    items: [
      {
        title: "Dashboard",
        icon: Icons.HomeIcon,
        items: [
          {
            title: "Tổng quan",
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
            title: "Loại món ăn",
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
    label: "KHÁC",
    items: [
      {
        title: "Thống kê",
        icon: Icons.PieChart,
        items: [
          {
            title: "Biểu đồ",
            url: "/charts/basic-chart",
          },
        ],
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
