// Sidebar menu data — các mục quản lý Pizza&PastaInn
import * as Icons from "../icons";

export const NAV_DATA = [
  {
    label: "OVERVIEW",
    items: [
      {
        title: "Dashboard",
        icon: Icons.HomeIcon,
        items: [
          {
            title: "Analytics",
            url: "/",
          },
        ],
      },
    ],
  },
  {
    label: "MANAGEMENT",
    items: [
      {
        title: "Orders",
        url: "/orders",
        icon: Icons.Table,
        items: [],
      },
      {
        title: "Menu",
        icon: Icons.Alphabet,
        items: [
          {
            title: "Categories",
            url: "/menu/categories",
          },
          {
            title: "Dishes",
            url: "/menu/dishes",
          },
          {
            title: "Combos",
            url: "/combos",
          },
          {
            title: "Sizes",
            url: "/menu/sizes",
          },
          {
            title: "Crusts",
            url: "/menu/crusts",
          },
          {
            title: "Toppings",
            url: "/menu/toppings",
          },
        ],
      },

      {
        title: "Branches",
        url: "/stores",
        icon: Icons.HomeIcon,
        items: [],
      },
      {
        title: "Customers",
        url: "/customers",
        icon: Icons.User,
        items: [],
      },
      {
        title: "Reviews",
        url: "/reviews",
        icon: Icons.StarIcon,
        items: [],
      },
    ],
  },
  {
    label: "SUPPORT",
    items: [
      {
        title: "Messages",
        url: "/messages",
        icon: Icons.ChatIcon,
        items: [],
      },
    ],
  },
  {
    label: "OTHERS",
    items: [
      {
        title: "Statistics",
        icon: Icons.PieChart,
        items: [
          {
            title: "Charts",
            url: "/charts/basic-chart",
          },
        ],
      },
      {
        title: "Settings",
        url: "/pages/settings",
        icon: Icons.Alphabet,
        items: [],
      },
    ],
  },
];
