"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./components/Sidebar";
import TopNav from "./components/TopNav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = window.localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setIsAdmin(Boolean(parsedUser?.isAdmin));
        } catch {
          setIsAdmin(false);
        }
      }
      setReady(true);
    }
  }, []);

  const getPageTitle = () => {
    if (!pathname) return "Overview";

    const pathSegments = pathname.split("/");
    const activeRoute = pathSegments[pathSegments.length - 1];

    if (!activeRoute || activeRoute.toLowerCase() === "admin") {
      return "Overview";
    }

    return activeRoute.charAt(0).toUpperCase() + activeRoute.slice(1);
  };

  if (!ready) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-100 p-6">
        <div className="bg-white border-4 border-black p-10 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] text-center max-w-xl w-full">
          <h1 className="text-4xl font-black uppercase tracking-tight text-black">
            Access Denied
          </h1>
          <p className="mt-4 text-zinc-600 font-bold">
            Admin access is required to view this panel.
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="mt-8 px-8 py-3 bg-black text-white font-black uppercase tracking-widest border-4 border-black hover:bg-zinc-900 transition-colors"
          >
            Go to Store Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-black font-sans selection:bg-black selection:text-white">
      <Sidebar />
      <main className="ml-72 flex flex-col min-h-screen">
        <TopNav title={getPageTitle()} />
        <div className="flex-1 p-10 bg-zinc-50">{children}</div>
      </main>
    </div>
  );
}
