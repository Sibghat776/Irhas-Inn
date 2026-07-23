"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ChevronRight,
  LayoutDashboard,
  PackageSearch,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Tags,
  Users,
  X,
} from "lucide-react";

const sidebarLinks = [
  { name: "Overview", icon: LayoutDashboard, href: "/Admin/Overview" },
  { name: "Products", icon: PackageSearch, href: "/Admin/Products" },
  { name: "Categories", icon: Tags, href: "/Admin/Categories" },
  { name: "Orders", icon: ShoppingBag, href: "/Admin/Orders" },
  { name: "Carts", icon: ShoppingCart, href: "/Admin/Carts" },
  { name: "Users", icon: Users, href: "/Admin/Users" },
  { name: "Analytics", icon: BarChart3, href: "/Admin/Analytics" },
  { name: "Settings", icon: Settings, href: "/Admin/Settings" },
];

const Sidebar = ({ onNavigate }: { onNavigate?: () => void }) => {
  const pathname = usePathname();
  const [adminName, setAdminName] = useState("Admin");
  const [adminRole, setAdminRole] = useState<string>("admin");
  const [profilePic, setProfilePic] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = window.localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed?.username) setAdminName(parsed.username);
          setAdminRole(parsed?.role ?? (parsed?.isAdmin ? "superadmin" : "user"));
          if (parsed?.profilePic) setProfilePic(parsed.profilePic);
        } catch {
          setAdminName("Admin");
          setAdminRole("admin");
        }
      }
    }
  }, []);

  const roleLabel = adminRole === "superadmin" ? "Super Admin" : "Admin";

  return (
    <aside className="flex h-full w-72 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
        <Link href="/" className="flex items-center gap-3" onClick={onNavigate}>
          <div className="flex h-10 w-full items-center justify-center overflow-hidden rounded-xl bg-[#0856DF]">
            <img src={"/Irha Studio-12.jpg"} alt="logo" className="h-full w-full object-contain" />
          </div>
        </Link>
        {onNavigate && (
          <button
            onClick={onNavigate}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Menu
        </p>
        {sidebarLinks.map((link) => {
          const Icon = link.icon;
          const isActive =
            pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.name}
              href={link.href}
              onClick={onNavigate}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#0856DF] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon
                className={`h-5 w-5 transition-transform ${isActive ? "scale-110" : "group-hover:scale-110"}`}
              />
              <span className="flex-1">{link.name}</span>
              {isActive && <ChevronRight className="h-4 w-4" />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#0856DF]/10 text-sm font-bold text-[#0856DF]">
            {profilePic ? (
              <img src={profilePic} alt="" className="h-full w-full object-cover" />
            ) : (
              <span>{adminName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{adminName}</p>
            <p className="text-xs text-slate-400">{roleLabel}</p>
          </div>
        </div>
        <Link
          href="/"
          onClick={onNavigate}
          className="mt-3 block rounded-lg px-3 py-2 text-center text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          ← Back to Store
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
