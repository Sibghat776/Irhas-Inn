"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/app/Redux/store";
import { startLoading, stopLoading } from "@/app/Redux/Features/uiSlice";
import { Package, ChevronRight, ArrowLeft, Clock } from "lucide-react";
import { baseUrl, showToast } from "@/app/utils/commonFunctions";

const statusColor: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Processing: "bg-blue-100 text-blue-800",
  Shipped: "bg-indigo-100 text-indigo-800",
  "Out for Delivery": "bg-purple-100 text-purple-800",
  Delivered: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
};

const MyOrdersPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.username) return;
    const fetchOrders = async () => {
      dispatch(startLoading("ZF Loading Orders"));
      setLoading(true);
      try {
        const res = await axios.get(`${baseUrl}order/myOrders`, { withCredentials: true });
        console.log("[MyOrders] Fetched orders:", res.data.data?.length || 0);
        setOrders(res.data.data || []);
      } catch (err: any) {
        showToast(err?.response?.data?.message || "Failed to load orders", "error");
      } finally {
        setLoading(false);
        dispatch(stopLoading());
      }
    };
    fetchOrders();
  }, [auth.username]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-400 via-white to-gray-100 px-4 pt-24 pb-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/profile" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#0856DF] transition-colors mb-4">
          <ArrowLeft size={16} /> Back to Profile
        </Link>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">My Orders</h1>
        <p className="text-gray-600 font-semibold mb-8">Track and manage your orders</p>

        {loading ? (
          <div className="text-center py-16">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-semibold">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-bold text-gray-700">No orders yet</p>
            <p className="text-sm text-gray-500 mt-1">Start shopping to see your orders here.</p>
            <Link href="/" className="inline-block mt-6 px-6 py-3 bg-[#0856DF] text-white rounded-xl font-semibold hover:bg-[#0645c8] transition-colors">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link key={order._id} href={`/profile/orders/${order._id}`}
                className="block bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                        #{order._id.slice(-8)}
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${statusColor[order.status] || "bg-gray-100 text-gray-700"}`}>
                        {order.status || "Pending"}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">Rs {order.totalPrice?.toLocaleString()}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Clock size={12} /> {new Date(order.createdAt).toLocaleDateString()}</span>
                      <span>{order.orderItems?.length || 0} item(s)</span>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrdersPage;
