"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/app/Redux/store";
import { startLoading, stopLoading } from "@/app/Redux/Features/uiSlice";
import { ArrowLeft, Package, MapPin, CreditCard, CheckCircle, Clock, Star } from "lucide-react";
import { baseUrl, showToast } from "@/app/utils/commonFunctions";

const RatingForm = ({ productId, productName }: { productId: string; productName: string }) => {
  const [star, setStar] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!star) return showToast("Please select a star rating", "error");
    setLoading(true);
    try {
      await axios.put(`${baseUrl}product/productRatings/${productId}`, { star, comment }, { withCredentials: true });
      showToast("Rating submitted!", "success");
      setSubmitted(true);
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to submit rating", "error");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) return (
    <div className="mt-3 text-sm text-[#222831] font-semibold flex items-center gap-1">
      <CheckCircle size={14} /> Rating submitted for {productName}
    </div>
  );

  return (
    <div className="mt-3 border-t border-[#EEEEEE] pt-3">
      <p className="text-xs font-bold text-[#222831] mb-2">Rate this product</p>
      <div className="flex gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} type="button"
            onClick={() => setStar(s)}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
          >
            <Star size={22} className={`transition-colors ${s <= (hover || star) ? "fill-[#C8A84E] text-[#222831]" : "text-[#222831]"}`} />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Write a comment (optional)"
        rows={2}
        className="w-full text-sm border border-[#EEEEEE] rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-[#C8A84E] mb-2"
      />
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="px-4 py-2 bg-[#C8A84E] text-white text-sm font-semibold rounded-xl hover:bg-[#C8A84E] disabled:opacity-60 transition"
      >
        {loading ? "Submitting..." : "Submit Rating"}
      </button>
    </div>
  );
};

const STEPS = ["Pending", "Processing", "Shipped", "Out for Delivery", "Delivered"];

const statusColor: Record<string, string> = {
  Pending: "bg-[#FFFFFF] text-[#222831] border-[#EEEEEE]",
  Processing: "bg-[#FFFFFF] text-[#222831] border-[#EEEEEE]",
  Shipped: "bg-[#FFFFFF] text-[#222831] border-[#EEEEEE]",
  "Out for Delivery": "bg-[#FFFFFF] text-[#222831] border-[#EEEEEE]",
  Delivered: "bg-[#FFFFFF] text-[#222831] border-[#EEEEEE]",
  Cancelled: "bg-[#FFFFFF] text-[#222831] border-[#EEEEEE]",
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
      <div className="min-h-screen bg-gradient-to-b from-[#FFFFFF] via-white to-[#FFFFFF] px-4 pt-24 pb-6">
        <div className="max-w-3xl mx-auto text-center py-16">
          <Package size={48} className="mx-auto text-[#222831] mb-4" />
          <p className="text-[#222831] font-semibold">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FFFFFF] via-white to-[#FFFFFF] px-4 pt-24 pb-6">
        <div className="max-w-3xl mx-auto text-center py-16">
          <p className="text-lg font-bold text-[#222831]">Order not found</p>
          <Link href="/profile/orders" className="inline-block mt-4 text-[#222831] font-semibold hover:underline">Go back to orders</Link>
        </div>
      </div>
    );
  }

  const currentStepIndex = STEPS.indexOf(order.status);
  const isCancelled = order.status === "Cancelled";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFFFF] via-white to-[#FFFFFF] px-4 pt-24 pb-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/profile/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-[#222831] hover:text-[#C8A84E] transition-colors mb-4">
          <ArrowLeft size={16} /> Back to Orders
        </Link>

        <div className="bg-white rounded-2xl border border-[#EEEEEE] shadow-sm overflow-hidden mb-6">
          <div className="p-6 border-b border-[#EEEEEE]">
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-2xl font-black text-[#222831]">Order Tracking</h1>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${statusColor[order.status] || "bg-[#FFFFFF] text-[#222831]"}`}>
                {order.status}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {order.serialNumber && (
                <span className="text-sm font-mono font-bold text-[#222831] bg-[#FFFFFF] px-2 py-0.5 rounded">
                  #{order.serialNumber}
                </span>
              )}
              <p className="text-sm font-mono text-[#222831]">{order._id}</p>
            </div>
          </div>

          {/* Tracking Stepper */}
          <div className="p-6">
            {isCancelled ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-[#FFFFFF] flex items-center justify-center mx-auto mb-4">
                  <Package size={28} className="text-[#222831]" />
                </div>
                <p className="text-lg font-bold text-[#222831]">Order Cancelled</p>
                <p className="text-sm text-[#222831] mt-1">This order has been cancelled.</p>
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
                            ? "bg-[#C8A84E] border-[#C8A84E] text-white"
                            : "bg-white border-[#EEEEEE] text-[#222831]"
                        }`}>
                          {isCompleted ? <CheckCircle size={16} /> : idx + 1}
                        </div>
                        {idx < STEPS.length - 1 && (
                          <div className={`w-0.5 h-10 ${isCompleted ? "bg-[#C8A84E]" : "bg-[#FFFFFF]"}`} />
                        )}
                      </div>
                      <div className={`pb-8 ${isCurrent ? "font-bold text-[#222831]" : isCompleted ? "text-[#222831]" : "text-[#222831]"}`}>
                        <p className="text-sm font-semibold">{step}</p>
                        {isCurrent && order.trackingHistory?.length > 0 && (
                          <p className="text-xs text-[#222831] mt-0.5">
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
        <div className="bg-white rounded-2xl border border-[#EEEEEE] shadow-sm overflow-hidden mb-6">
          <div className="p-6 border-b border-[#EEEEEE]">
            <h2 className="text-lg font-bold text-[#222831]">Order Items</h2>
          </div>
          <div className="p-6 space-y-4">
            {order.orderItems?.map((item: any, idx: number) => {
              const product = item.product || {};
              const productId = product._id || product.id || item.productId || "";
              return (
                <div key={idx} className="flex flex-col gap-3 rounded-3xl border border-[#EEEEEE] bg-[#FFFFFF] p-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={product.images?.[0]?.url || "/carousel/Clothes.jpg"}
                      alt={product.name}
                      className="w-20 h-20 rounded-2xl object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#222831]">{product.name || "Product"}</p>
                      <p className="text-xs text-[#222831]">#{productId.slice(-5)}</p>
                      <p className="mt-2 text-sm text-[#222831] line-clamp-2">
                        {product.description || "No description available."}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#222831]">Rs {product.price?.toLocaleString()}</p>
                      <p className="text-xs text-[#222831]">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-[#222831]">
                    <span className="rounded-full border border-[#EEEEEE] bg-white px-3 py-1">Category: {product.category?.name || product.category || "General"}</span>
                    {item.selectedColor && <span className="rounded-full border border-[#EEEEEE] bg-white px-3 py-1">Color: {item.selectedColor}</span>}
                    {item.selectedSize && <span className="rounded-full border border-[#EEEEEE] bg-white px-3 py-1">Size: {item.selectedSize}</span>}
                  </div>
                  {order.status === "Delivered" && productId && (
                    <RatingForm productId={productId} productName={product.name || "Product"} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Shipping + Payment Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-[#EEEEEE] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#EEEEEE] flex items-center gap-2">
              <MapPin size={16} className="text-[#222831]" />
              <h2 className="text-sm font-bold text-[#222831]">Shipping Address</h2>
            </div>
            <div className="p-6 text-sm text-[#222831] space-y-1">
              <p className="font-semibold">{order.shippingAddress?.fullName}</p>
              <p>{order.shippingAddress?.phoneNo}</p>
              <p>{order.shippingAddress?.address}</p>
              <p>{order.shippingAddress?.city}, {order.shippingAddress?.country}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#EEEEEE] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#EEEEEE] flex items-center gap-2">
              <CreditCard size={16} className="text-[#222831]" />
              <h2 className="text-sm font-bold text-[#222831]">Payment</h2>
            </div>
            <div className="p-6 text-sm text-[#222831] space-y-2">
              <div className="flex justify-between">
                <span>Items</span>
                <span>Rs {order.itemsPrice?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>Rs {order.shippingPrice?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-[#222831] border-t border-[#EEEEEE] pt-2">
                <span>Total</span>
                <span>Rs {order.totalPrice?.toLocaleString()}</span>
              </div>
              <div className="pt-2">
                <span className="text-xs text-[#222831]">Method: {order.paymentMethod}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tracking History */}
        {order.trackingHistory?.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#EEEEEE] shadow-sm overflow-hidden mt-6">
            <div className="p-6 border-b border-[#EEEEEE] flex items-center gap-2">
              <Clock size={16} className="text-[#222831]" />
              <h2 className="text-sm font-bold text-[#222831]">Tracking History</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {[...order.trackingHistory].reverse().map((entry: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 text-sm">
                    <div className={`w-2 h-2 rounded-full ${entry.status === order.status ? "bg-[#C8A84E]" : "bg-[#FFFFFF]"}`} />
                    <span className="font-semibold text-[#222831]">{entry.status}</span>
                    <span className="text-[#222831] ml-auto">{new Date(entry.timestamp).toLocaleString()}</span>
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
