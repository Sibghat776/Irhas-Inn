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
  Pending: "bg-[#FFFFFF] text-[#222831]",
  Processing: "bg-[#FFFFFF] text-[#222831]",
  Shipped: "bg-[#FFFFFF] text-[#222831]",
  "Out for Delivery": "bg-[#FFFFFF] text-[#222831]",
  Delivered: "bg-[#FFFFFF] text-[#222831]",
  Cancelled: "bg-[#FFFFFF] text-[#222831]",
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
    <div className="min-h-screen bg-gradient-to-b from-[#FFFFFF] via-white to-[#FFFFFF] px-4 pt-24 pb-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/profile" className="inline-flex items-center gap-2 text-sm font-semibold text-[#222831] hover:text-[#C8A84E] transition-colors mb-4">
          <ArrowLeft size={16} /> Back to Profile
        </Link>
        <h1 className="text-4xl font-black text-[#222831] tracking-tight mb-2">My Orders</h1>
        <p className="text-[#222831] font-semibold mb-8">Track and manage your orders</p>

        {loading ? (
          <div className="text-center py-16">
            <Package size={48} className="mx-auto text-[#222831] mb-4" />
            <p className="text-[#222831] font-semibold">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#EEEEEE] shadow-sm">
            <Package size={48} className="mx-auto text-[#222831] mb-4" />
            <p className="text-lg font-bold text-[#222831]">No orders yet</p>
            <p className="text-sm text-[#222831] mt-1">Start shopping to see your orders here.</p>
            <Link href="/" className="inline-block mt-6 px-6 py-3 bg-[#C8A84E] text-white rounded-xl font-semibold hover:bg-[#C8A84E] transition-colors">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link key={order._id} href={`/profile/orders/${order._id}`}
                className="block bg-white rounded-2xl border border-[#EEEEEE] p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-mono text-[#222831] bg-[#FFFFFF] px-2 py-1 rounded-md">
                        #{order.serialNumber || order._id.slice(-8)}
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${statusColor[order.status] || "bg-[#FFFFFF] text-[#222831]"}`}>
                        {order.status || "Pending"}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-[#222831]">Rs {order.totalPrice?.toLocaleString()}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-[#222831]">
                      <span className="flex items-center gap-1"><Clock size={12} /> {new Date(order.createdAt).toLocaleDateString()}</span>
                      <span>{order.orderItems?.length || 0} item(s)</span>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-[#222831]" />
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
