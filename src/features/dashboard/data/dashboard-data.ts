import {
  Users,
  Bell,
  Calendar,
  Settings,
  CreditCard,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Package,
  Route,
  ShoppingCart,
  Truck,
  Wallet,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  link: string;
  icon: LucideIcon;
  badge?: string;
  isActive?: boolean;
  children?: { label: string; isActive?: boolean }[];
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const navigation: NavSection[] = [
  {
    title: "",
    items: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        link: "/dashboard",
        isActive: true,
      },
      {
        label: "Setting",
        icon: Settings,
        link: "/setting",
      },
    ],
  },
//   {
//     title: "Apps & Pages",
//     items: [
//       {
//         label: "Email",
//         icon: Mail,
//       },
//       {
//         label: "Chat",
//         icon: MessageSquare,
//       },
//       {
//         label: "Calendar",
//         icon: Calendar,
//       },
//       {
//         label: "Kanban",
//         icon: Package,
//       },
//       {
//         label: "eCommerce",
//         icon: ShoppingCart,
//       },
//       {
//         label: "Academy",
//         icon: GraduationCap,
//       },
//     ],
//   },
//   {
//     title: "Logistics",
//     items: [
//       {
//         label: "Logistics",
//         icon: Truck,
//         isActive: true,
//         children: [
//           {
//             label: "Dashboard",
//             isActive: true,
//           },
//           {
//             label: "Fleet",
//           },
//           {
//             label: "Invoice",
//           },
//         ],
//       },
//       {
//         label: "Invoice",
//         icon: CreditCard,
//       },
//     ],
//   },
//   {
//     title: "Settings",
//     items: [
//       {
//         label: "Users",
//         icon: Users,
//       },
//       {
//         label: "Roles & Permissions",
//         icon: Wallet,
//       },
//       {
//         label: "Pages",
//         icon: FileText,
//       },
//       {
//         label: "Authentications",
//         icon: Bell,
//       },
//       {
//         label: "Wizard Examples",
//         icon: Settings,
//       },
//     ],
//   },
];

export const overviewStats = [
  {
    label: "On route vehicles",
    value: "42",
    change: "+18.2%",
    changeLabel: "than last week",
    icon: Truck,
    accent: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
    border: "bg-sky-400/50 group-hover:bg-sky-400",
  },
  {
    label: "Vehicles with errors",
    value: "8",
    change: "-8.7%",
    changeLabel: "than last week",
    icon: Bell,
    accent: "bg-amber-400/20 text-amber-600 dark:text-amber-300",
    border: "bg-amber-400/50 group-hover:bg-amber-400",
  },
  {
    label: "Deviated from route",
    value: "27",
    change: "+4.3%",
    changeLabel: "than last week",
    icon: Route,
    accent: "bg-rose-400/20 text-rose-600 dark:text-rose-300",
    border: "bg-rose-400/50 group-hover:bg-rose-400",
  },
  {
    label: "Late vehicles",
    value: "13",
    change: "-2.5%",
    changeLabel: "than last week",
    icon: Bell,
    accent: "bg-cyan-400/20 text-cyan-600 dark:text-cyan-300",
    border: "bg-cyan-400/50 group-hover:bg-cyan-400",
  },
];

export const vehicleStatus = [
  {
    label: "On the way",
    percent: 39.7,
    duration: "2hr 10min",
    color: "bg-indigo-500",
  },
  {
    label: "Unloading",
    percent: 28.3,
    duration: "3hr 15min",
    color: "bg-violet-500",
  },
  {
    label: "Loading",
    percent: 17.4,
    duration: "1hr 24min",
    color: "bg-cyan-500",
  },
  {
    label: "Waiting",
    percent: 14.6,
    duration: "5hr 19min",
    color: "bg-slate-700 dark:bg-slate-300",
  },
];

export const shipmentSeries = [
  { day: "1 Jan", shipment: 38, delivery: 22 },
  { day: "2 Jan", shipment: 46, delivery: 28 },
  { day: "3 Jan", shipment: 31, delivery: 24 },
  { day: "4 Jan", shipment: 36, delivery: 29 },
  { day: "5 Jan", shipment: 42, delivery: 27 },
  { day: "6 Jan", shipment: 49, delivery: 35 },
  { day: "7 Jan", shipment: 45, delivery: 30 },
  { day: "8 Jan", shipment: 40, delivery: 33 },
  { day: "9 Jan", shipment: 44, delivery: 26 },
  { day: "10 Jan", shipment: 41, delivery: 31 },
];

export const deliveryPerformance = [
  {
    label: "Packages in transit",
    value: "10k",
    change: "+25.8%",
    progress: 78,
    color: "bg-indigo-500",
  },
  {
    label: "Packages out for delivery",
    value: "5k",
    change: "+4.3%",
    progress: 52,
    color: "bg-cyan-500",
  },
  {
    label: "Packages delivered",
    value: "15k",
    change: "+12.6%",
    progress: 86,
    color: "bg-emerald-500",
  },
];

export const exceptionReasons = [
  {
    label: "Weather conditions",
    value: 42,
    color: "var(--chart-4)",
  },
  {
    label: "Re-routed",
    value: 28,
    color: "var(--chart-2)",
  },
  {
    label: "Delayed loading",
    value: 30,
    color: "var(--chart-1)",
  },
];

export const ordersByStatus = {
  new: [
    {
      sender: "Myrtle Ullrich",
      status: "In progress",
      country: "Spain",
    },
    {
      sender: "Vaughn Weber",
      status: "Awaiting pickup",
      country: "Norway",
    },
    {
      sender: "Irene Wilson",
      status: "In progress",
      country: "Poland",
    },
  ],
  preparing: [
    {
      sender: "Ronald Hope",
      status: "Preparing",
      country: "Singapore",
    },
    {
      sender: "Holly Morton",
      status: "Preparing",
      country: "Denmark",
    },
    {
      sender: "Isabel Ng",
      status: "Preparing",
      country: "France",
    },
  ],
  shipping: [
    {
      sender: "Albert Peters",
      status: "Shipping",
      country: "United States",
    },
    {
      sender: "Glenna Monroe",
      status: "Shipping",
      country: "Canada",
    },
    {
      sender: "Jesse Pena",
      status: "Shipping",
      country: "Japan",
    },
  ],
};
