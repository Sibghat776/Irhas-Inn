"use client";

import { ChevronRight, MessageCircle, PackageSearch, ShoppingBag, TrendingUp, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import useFetch, { baseUrl } from "@/app/utils/commonFunctions";

const OverviewPage = () => {
  const router = useRouter();
  const { data: productsRes, loading: productsLoading } = useFetch<any>(
    `${baseUrl}product/getAllProducts`,
  );
  const { data: ordersRes, loading: ordersLoading } = useFetch<any>(
    `${baseUrl}order/getAllOrders`,
  );
  const { data: usersRes, loading: usersLoading } = useFetch<any>(
    `${baseUrl}auth/getUsers`,
  );

  const products = productsRes?.data || [];
  const orders = ordersRes?.data || [];
  const users = usersRes?.data || [];

  const lowStockCount = Array.isArray(products)
    ? products.filter((product: any) => product.stock <= 10).length
    : 0;

  const stats = [
    {
      title: "Total Revenue",
      value: `PKR ${orders
        .reduce((total: number, order: any) => total + (order.totalPrice || 0), 0)
        .toLocaleString()}`,
      trend: "+12.5%",
      icon: TrendingUp,
      color: "text-emerald-500",
    },
    {
      title: "Active Orders",
      value: `${orders.length}`,
      trend: "+5.2%",
      icon: ShoppingBag,
      color: "text-orange-500",
    },
    {
      title: "Total Customers",
      value: `${users.length}`,
      trend: "+18.1%",
      icon: Users,
      color: "text-green-500",
    },
    {
      title: "Low Stock Items",
      value: `${lowStockCount}`,
      trend: lowStockCount > 0 ? "-2.4%" : "+0.0%",
      icon: PackageSearch,
      color: "text-red-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {stat.title}
                </p>
                <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {stat.value}
                </h3>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50">
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
              <span
                className={`text-sm font-semibold ${stat.trend.startsWith("+") ? "text-emerald-600" : "text-red-600"}`}
              >
                {stat.trend}
              </span>
              <span className="text-xs text-slate-400">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h3 className="text-lg font-bold text-slate-900">Recent Orders</h3>
            <button
              onClick={() => router.push("/Admin/Orders")}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {(ordersLoading ? Array.from({ length: 3 }) : orders.slice(0, 5)).map((order: any, idx: number) => (
                  <tr key={order?._id ?? idx} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono text-slate-900">
                      {order?._id ? order._id.slice(-8) : "Loading..."}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {order?.user?.username || order?.user?.email || "—"}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      Rs {order?.totalPrice?.toLocaleString() || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {order?.paymentStatus || "pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-slate-900">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => router.push("/Admin/Products")}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-4 text-left transition hover:border-[#0856DF] hover:bg-[#0856DF]/5"
            >
              <div className="flex items-center gap-3">
                <PackageSearch className="h-5 w-5 text-[#0856DF]" />
                <span className="text-sm font-semibold text-slate-700">Add Product</span>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </button>
            <button
              onClick={() => router.push("/Admin/Categories")}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-4 text-left transition hover:border-[#0856DF] hover:bg-[#0856DF]/5"
            >
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-semibold text-slate-700">Update Categories</span>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;
