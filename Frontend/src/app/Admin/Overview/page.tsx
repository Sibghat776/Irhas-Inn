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
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">
                  {stat.title}
                </p>
                <h3 className="text-4xl font-black text-black mt-2">{stat.value}</h3>
              </div>
              <div className="p-3 border-2 border-black bg-zinc-50">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-4 border-t-2 border-zinc-100">
              <span
                className={`text-sm font-black ${stat.trend.startsWith("+") ? "text-emerald-500" : "text-red-500"}`}
              >
                {stat.trend}
              </span>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                vs last month
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex justify-between items-center mb-8 pb-4 border-b-4 border-black">
            <h3 className="text-2xl font-black uppercase tracking-tight">Recent Orders</h3>
            <button
              onClick={() => router.push("/Admin/Orders")}
              className="text-sm font-black text-black hover:text-white hover:bg-black border-2 border-black px-4 py-2 uppercase tracking-widest transition-colors"
            >
              View All
            </button>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-black uppercase tracking-widest text-zinc-400 border-b-2 border-black">
                <th className="pb-4">ID</th>
                <th className="pb-4">Customer</th>
                <th className="pb-4">Amount</th>
                <th className="pb-4">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm font-bold uppercase">
              {(ordersLoading ? Array.from({ length: 3 }) : orders.slice(0, 5)).map((order: any, idx: number) => (
                <tr
                  key={order?._id ?? idx}
                  className="border-b border-zinc-200 hover:bg-zinc-50 transition-colors"
                >
                  <td className="py-5 text-black">{order?._id ? order._id.slice(-8) : "Loading..."}</td>
                  <td className="py-5">{order?.user?.username || order?.user?.email || "—"}</td>
                  <td className="py-5">Rs {order?.totalPrice?.toLocaleString() || "—"}</td>
                  <td className="py-5">
                    <span className="px-3 py-1 border-2 border-black text-xs font-black bg-zinc-100">
                      {order?.paymentStatus || "pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-black text-white p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(200,200,200,1)]">
          <h3 className="text-2xl font-black uppercase tracking-tight mb-8 pb-4 border-b-4 border-zinc-800">Quick Actions</h3>
          <div className="space-y-4">
            <button
              onClick={() => router.push("/Admin/Products")}
              className="w-full flex items-center justify-between p-4 bg-zinc-900 border-2 border-zinc-800 hover:border-white hover:bg-white hover:text-black transition-all group"
            >
              <div className="flex items-center gap-4">
                <PackageSearch className="w-6 h-6 text-blue-500" />
                <span className="font-black uppercase tracking-wider text-sm">Add Product</span>
              </div>
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => router.push("/Admin/Categories")}
              className="w-full flex items-center justify-between p-4 bg-zinc-900 border-2 border-zinc-800 hover:border-white hover:bg-white hover:text-black transition-all group"
            >
              <div className="flex items-center gap-4">
                <MessageCircle className="w-6 h-6 text-green-500" />
                <span className="font-black uppercase tracking-wider text-sm">Update Categories</span>
              </div>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;
