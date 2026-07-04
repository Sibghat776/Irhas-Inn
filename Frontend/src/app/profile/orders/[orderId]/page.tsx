"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/app/Redux/store";
import { startLoading, stopLoading } from "@/app/Redux/Features/uiSlice";
import { ArrowLeft, Package, MapPin, CreditCard, CheckCircle, Clock } from "lucide-react";
import { baseUrl, showToast } from "@/app/utils/commonFunctions";

const STEPS = ["Pending", "Processing", "Shipped", "Out for Delivery", "Delivered"];

const statusColor: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Processing: "bg-blue-100 text-blue-800 border-blue-300",
  Shipped: "bg-indigo-100 text-indigo-800 border-indigo-300",
  "Out for Delivery": "bg-purple-100 text-purple-800 border-purple-300",
  Delivered: "bg-green-100 text-green-800 border-green-300",
  Cancelled: "bg-red-100 text-red-800 border-red-300",
};

const OrderTrackingPage = () => {
  const { orderId } = useParams();
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId || !auth.username) return;
    const fetchOrder = async () => {
      dispatch(startLoading("ZF Loading Order Details"));
      setLoading(true);
      try {
        const res = await axios.get(`${baseUrl}order/getOrder/${orderId}`, { withCredentials: true });
        console.log("[OrderTracking] Fetched order:", res.data.data?._id);
        setOrder(res.data.data);
      } catch (err: any) {
        showToast(err?.response?.data?.message || "Failed to load order", "error");
      } finally {
        setLoading(false);
        dispatch(stopLoading());
      }
    };
    fetchOrder();
  }, [orderId, auth.username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-400 via-white to-gray-100 px-4 pt-24 pb-6">
        <div className="max-w-3xl mx-auto text-center py-16">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-semibold">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-400 via-white to-gray-100 px-4 pt-24 pb-6">
        <div className="max-w-3xl mx-auto text-center py-16">
          <p className="text-lg font-bold text-gray-700">Order not found</p>
          <Link href="/profile/orders" className="inline-block mt-4 text-[#0856DF] font-semibold hover:underline">Go back to orders</Link>
        </div>
      </div>
    );
  }

  const currentStepIndex = STEPS.indexOf(order.status);
  const isCancelled = order.status === "Cancelled";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-400 via-white to-gray-100 px-4 pt-24 pb-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/profile/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#0856DF] transition-colors mb-4">
          <ArrowLeft size={16} /> Back to Orders
        </Link>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-2xl font-black text-gray-900">Order Tracking</h1>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${statusColor[order.status] || "bg-gray-100 text-gray-700"}`}>
                {order.status}
              </span>
            </div>
            <p className="text-sm font-mono text-gray-400">#{order._id}</p>
          </div>

          {/* Tracking Stepper */}
          <div className="p-6">
            {isCancelled ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <Package size={28} className="text-red-600" />
                </div>
                <p className="text-lg font-bold text-red-700">Order Cancelled</p>
                <p className="text-sm text-gray-500 mt-1">This order has been cancelled.</p>
              </div>
            ) : (
              <div className="relative">
                {STEPS.map((step, idx) => {
                  const isCompleted = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  return (
                    <div key={step} className="flex items-start mb-0 last:mb-0">
                      <div className="flex flex-col items-center mr-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                          isCompleted
                            ? "bg-[#0856DF] border-[#0856DF] text-white"
                            : "bg-white border-gray-300 text-gray-400"
                        }`}>
                          {isCompleted ? <CheckCircle size={16} /> : idx + 1}
                        </div>
                        {idx < STEPS.length - 1 && (
                          <div className={`w-0.5 h-10 ${isCompleted ? "bg-[#0856DF]" : "bg-gray-200"}`} />
                        )}
                      </div>
                      <div className={`pb-8 ${isCurrent ? "font-bold text-[#0856DF]" : isCompleted ? "text-gray-700" : "text-gray-400"}`}>
                        <p className="text-sm font-semibold">{step}</p>
                        {isCurrent && order.trackingHistory?.length > 0 && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(order.trackingHistory[currentStepIndex]?.timestamp).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Order Items</h2>
          </div>
          <div className="p-6 space-y-4">
            {order.orderItems?.map((item: any, idx: number) => {
              const product = item.product || {};
              const productId = product._id || product.id || item.productId || "";
              return (
                <div key={idx} className="flex flex-col gap-3 rounded-3xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={product.images?.[0]?.url || "/carousel/Pens.avif"}
                      alt={product.name}
                      className="w-20 h-20 rounded-2xl object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{product.name || "Product"}</p>
                      <p className="text-xs text-gray-500">#{productId.slice(-5)}</p>
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {product.description || "No description available."}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">Rs {product.price?.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Category: {product.category?.name || product.category || "General"}</span>
                    {item.selectedColor && <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Color: {item.selectedColor}</span>}
                    {item.selectedSize && <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Size: {item.selectedSize}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shipping + Payment Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-2">
              <MapPin size={16} className="text-[#0856DF]" />
              <h2 className="text-sm font-bold text-gray-900">Shipping Address</h2>
            </div>
            <div className="p-6 text-sm text-gray-700 space-y-1">
              <p className="font-semibold">{order.shippingAddress?.fullName}</p>
              <p>{order.shippingAddress?.phoneNo}</p>
              <p>{order.shippingAddress?.address}</p>
              <p>{order.shippingAddress?.city}, {order.shippingAddress?.country}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-2">
              <CreditCard size={16} className="text-[#0856DF]" />
              <h2 className="text-sm font-bold text-gray-900">Payment</h2>
            </div>
            <div className="p-6 text-sm text-gray-700 space-y-2">
              <div className="flex justify-between">
                <span>Items</span>
                <span>Rs {order.itemsPrice?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>Rs {order.shippingPrice?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2">
                <span>Total</span>
                <span>Rs {order.totalPrice?.toLocaleString()}</span>
              </div>
              <div className="pt-2">
                <span className="text-xs text-gray-500">Method: {order.paymentMethod}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tracking History */}
        {order.trackingHistory?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mt-6">
            <div className="p-6 border-b border-gray-100 flex items-center gap-2">
              <Clock size={16} className="text-[#0856DF]" />
              <h2 className="text-sm font-bold text-gray-900">Tracking History</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {[...order.trackingHistory].reverse().map((entry: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 text-sm">
                    <div className={`w-2 h-2 rounded-full ${entry.status === order.status ? "bg-[#0856DF]" : "bg-gray-300"}`} />
                    <span className="font-semibold text-gray-700">{entry.status}</span>
                    <span className="text-gray-400 ml-auto">{new Date(entry.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTrackingPage;
