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
            title: "Danh mục",
            url: "/menu/categories",
          },
          {
            title: "Món ăn",
            url: "/menu/dishes",
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
          {
            title: "Combo",
            url: "/combos",
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
        icon: Icons.Calendar,
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
