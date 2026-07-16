"use client";

import { Bell, Menu, Search } from "lucide-react";

const TopNav = ({
  title,
  onMenuClick,
}: {
  title: string;
  onMenuClick?: () => void;
}) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/80 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search…"
            className="w-56 rounded-xl border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0856DF] focus:bg-white focus:ring-2 focus:ring-[#0856DF]/15 lg:w-72"
          />
        </div>

        <button className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-100">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">
          </span>
        </button>
      </div>
    </header>
  );
};

export default TopNav;
