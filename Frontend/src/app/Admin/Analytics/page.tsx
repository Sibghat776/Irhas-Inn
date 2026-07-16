"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  DollarSign,
  ShoppingBag,
  Users,
  Package,
} from "lucide-react";
import useFetch, { baseUrl } from "@/app/utils/commonFunctions";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  Pending: "#f59e0b",
  Processing: "#3b82f6",
  Shipped: "#8b5cf6",
  "Out for Delivery": "#06b6d4",
  Delivered: "#10b981",
  Cancelled: "#ef4444",
};

const AnalyticsPage = () => {
  const { data, loading } = useFetch<any>(`${baseUrl}analytics/summary`);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    if (data?.data) setSummary(data.data);
  }, [data]);

  const revenueData =
    summary?.revenueOverTime?.map((d: any) => ({
      date: d._id?.slice(5) || d._id,
      revenue: d.revenue || 0,
    })) || [];

  const statusData = summary?.byStatus
    ? Object.entries(summary.byStatus).map(([name, value]) => ({
        name,
        value: value as number,
      }))
    : [];

  const statCards = [
    {
      label: "Total Revenue",
      value: `Rs ${summary?.totalRevenue?.toLocaleString() || 0}`,
      icon: DollarSign,
      tint: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Total Orders",
      value: summary?.totalOrders?.toLocaleString() || 0,
      icon: ShoppingBag,
      tint: "text-[#0856DF] bg-blue-50",
    },
    {
      label: "Customers",
      value: summary?.totalCustomers?.toLocaleString() || 0,
      icon: Users,
      tint: "text-violet-600 bg-violet-50",
    },
    {
      label: "Products",
      value: summary?.totalProducts?.toLocaleString() || 0,
      icon: Package,
      tint: "text-amber-600 bg-amber-50",
    },
  ];

  if (loading && !summary) {
    return (
      <div className="flex h-96 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
        <p className="text-sm font-medium text-slate-500">Loading analytics…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Analytics
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Store performance at a glance
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {stat.label}
                </p>
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.tint}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue over time */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="mb-4 text-lg font-bold text-slate-900">
            Revenue (last 30 days)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueData} margin={{ left: -20, right: 10, top: 10 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0856DF" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#0856DF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip
                formatter={(v: any) => [`Rs ${Number(v).toLocaleString()}`, "Revenue"]}
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#0856DF"
                strokeWidth={2}
                fill="url(#rev)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Orders by status */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-slate-900">
            Orders by Status
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={statusData} margin={{ left: -20, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "#64748b" }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "#f1f5f9" }}
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {statusData.map((entry: any) => (
                  <Cell
                    key={entry.name}
                    fill={STATUS_COLORS[entry.name] || "#0856DF"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top selling products */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-slate-900">
          Top Selling Products
        </h3>
        {summary?.topProducts?.length ? (
          <div className="space-y-3">
            {summary.topProducts.map((p: any, idx: number) => (
              <div
                key={p._id || idx}
                className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"
              >
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-10 w-10 rounded-lg border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-slate-100" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {p.name || "Product"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {p.unitsSold} units sold
                  </p>
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  Rs {p.revenue?.toLocaleString() || 0}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No sales data yet.</p>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
