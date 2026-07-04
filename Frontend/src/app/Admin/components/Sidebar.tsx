"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ChevronRight,
  Home,
  LayoutDashboard,
  PackageSearch,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Tags,
  Users,
} from "lucide-react";

const sidebarLinks = [
  {
    name: "Overview",
    icon: LayoutDashboard,
    color: "text-purple-500",
    href: "/Admin/Overview",
  },
  {
    name: "Products",
    icon: PackageSearch,
    color: "text-blue-500",
    href: "/Admin/Products",
  },
  {
    name: "Categories",
    icon: Tags,
    color: "text-pink-500",
    href: "/Admin/Categories",
  },
  {
    name: "Orders",
    icon: ShoppingBag,
    color: "text-orange-500",
    href: "/Admin/Orders",
  },
  {
    name: "Carts",
    icon: ShoppingCart,
    color: "text-yellow-500",
    href: "/Admin/Carts",
  },
  { name: "Users", icon: Users, color: "text-green-500", href: "/Admin/Users" },
  {
    name: "Analytics",
    icon: BarChart3,
    color: "text-cyan-500",
    href: "/Admin/Analytics",
  },
  {
    name: "Settings",
    icon: Settings,
    color: "text-indigo-500",
    href: "/Admin/Settings",
  },
];

const Sidebar = () => {
  const pathname = usePathname();
  const [adminName, setAdminName] = useState("Super Admin");
  const [adminRole, setAdminRole] = useState("Admin");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = window.localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed?.username) {
            setAdminName(parsed.username);
          }
          setAdminRole(parsed?.isAdmin ? "Super Admin" : "Admin");
        } catch {
          setAdminName("Admin");
          setAdminRole("Admin");
        }
      }
    }
  }, []);

  return (
    <aside className="w-72 bg-black text-white flex flex-col h-screen fixed top-0 left-0 z-50">
      <div className="h-24 flex items-center justify-between px-6 border-b-2 border-zinc-800">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white text-black font-black flex items-center justify-center border-2 border-zinc-600 uppercase">
            ZF
          </div>
          <div>
            <p className="text-xl font-black tracking-tight uppercase">ZeeF</p>
            <p className="text-xs text-zinc-400 uppercase tracking-[0.2em]">Store Home</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-8 px-6 space-y-3">
        <p className="text-xs font-black text-zinc-600 uppercase tracking-[0.2em] mb-6">Menu</p>

        {sidebarLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");

          return (
            <Link
              key={link.name}
              href={link.href}
              className={`w-full flex items-center gap-4 px-4 py-3.5 transition-all duration-200 group border-2 ${
                isActive
                  ? "bg-white text-black border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]"
                  : "bg-black text-zinc-400 border-transparent hover:border-zinc-800 hover:bg-zinc-900"
              }`}
            >
              <Icon
                className={`w-5 h-5 ${link.color} transition-transform duration-300 ${
                  isActive ? "scale-110" : "group-hover:scale-110"
                }`}
              />
              <span className={`text-sm font-bold tracking-wide uppercase ${isActive ? "text-black" : "text-zinc-300"}`}>
                {link.name}
              </span>
              {isActive && <ChevronRight className="w-4 h-4 ml-auto text-black" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t-2 border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white flex items-center justify-center text-black font-black text-lg border-2 border-zinc-600 rounded-full">
            {adminName.charAt(0).toUpperCase()}
          </div>
          <div className="text-left">
            <p className="text-sm font-black text-white uppercase tracking-wider">{adminName}</p>
            <p className="text-xs text-zinc-500 font-bold tracking-widest">{adminRole}</p>
          </div>
        </div>
        <div className="mt-4 border-t border-zinc-800 pt-4">
          <Link
            href="/"
            className="block uppercase text-xs font-black tracking-[0.2em] text-zinc-300 hover:text-white"
          >
            Back to Store
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
