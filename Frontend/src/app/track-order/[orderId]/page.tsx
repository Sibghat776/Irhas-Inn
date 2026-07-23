"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import useFetch, { baseUrl } from "@/app/utils/commonFunctions";

const TrackOrderPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    const fetchOrder = async () => {
      try {
        const { data } = await axios.get(`${baseUrl}order/track/${orderId}`);
        setOrder(data?.data || null);
      } catch (err: any) {
        setError(
          err.response?.data?.message || "Unable to fetch order details.",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFFFF]">
        <p className="text-[#222831]">Loading order details…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFFFF] p-6">
        <div className="w-full max-w-md rounded-2xl border border-[#EEEEEE] bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-[#222831]">Order Not Found</h1>
          <p className="mt-2 text-sm text-[#222831]">
            {error || "We couldn't find an order with this ID."}
          </p>
        </div>
      </div>
    );
  }

  const statusSteps = [
    "Pending",
    "Processing",
    "Shipped",
    "Out for Delivery",
    "Delivered",
  ];
  const currentStep = statusSteps.indexOf(order.status);

  return (
    <div className="min-h-screen bg-[#FFFFFF] p-4 sm:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-2xl border border-[#EEEEEE] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#222831]">
                Track Your Order
              </h1>
              <p className="mt-1 text-xs text-[#222831]">
                Order #{order.serialNumber || order._id.slice(-8)}
              </p>
            </div>
            <span className="rounded-full bg-[#C8A84E]/10 px-3 py-1 text-sm font-semibold text-[#222831]">
              {order.status}
            </span>
          </div>

          {/* Progress steps */}
          <div className="mt-6 flex items-center">
            {statusSteps.map((step, idx) => (
              <div key={step} className="flex flex-1 items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      idx <= currentStep
                        ? "bg-[#C8A84E] text-white"
                        : "bg-[#FFFFFF] text-[#222831]"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span className="mt-1 text-[10px] text-[#222831]">{step}</span>
                </div>
                {idx < statusSteps.length - 1 && (
                  <div
                    className={`h-1 flex-1 ${
                      idx < currentStep ? "bg-[#C8A84E]" : "bg-[#FFFFFF]"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#EEEEEE] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#222831]">
            Items
          </h2>
          <div className="space-y-3">
            {(order.orderItems || []).map((item: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3">
                {item.product?.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="h-12 w-12 rounded-lg border border-[#EEEEEE] object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-[#FFFFFF]" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#222831]">
                    {item.product?.name || "Product"}
                  </p>
                  <p className="text-xs text-[#222831]">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-[#222831]">
                  Rs {((item.product?.price || 0) * item.quantity).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[#EEEEEE] pt-4">
            <span className="text-sm font-semibold text-[#222831]">Total</span>
            <span className="text-lg font-bold text-[#222831]">
              Rs {order.totalPrice?.toLocaleString() || 0}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-[#EEEEEE] bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#222831]">
            Shipping Address
          </h2>
          <p className="text-sm text-[#222831]">
            {order.shippingAddress?.fullName}
            <br />
            {order.shippingAddress?.address}
            <br />
            {order.shippingAddress?.city}, {order.shippingAddress?.country}
            <br />
            {order.shippingAddress?.phoneNo}
          </p>
          <div className="mt-3 flex gap-4 text-xs text-[#222831]">
            <span>Payment: {order.paymentStatus}</span>
            <span>Method: {order.paymentMethod}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackOrderPage;
