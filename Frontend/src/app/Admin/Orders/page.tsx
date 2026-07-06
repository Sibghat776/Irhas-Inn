"use client";

import { Fragment, useEffect, useState } from "react";
import { Download, Eye, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import useFetch, { baseUrl, showToast } from "@/app/utils/commonFunctions";
import axios from "axios";

const paymentStatusOptions = [
  "pending",
  "paid",
  "failed",
  "refunded",
  "cancelled",
];

const orderStatusOptions = [
  "Pending",
  "Processing",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

const OrdersPage = () => {
  const {
    data: ordersRes,
    loading,
    reFetch,
  } = useFetch<any>(`${baseUrl}order/getAllOrders`);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedPaymentStatuses, setSelectedPaymentStatuses] = useState<
    Record<string, string>
  >({});
  const [selectedOrderStatuses, setSelectedOrderStatuses] = useState<
    Record<string, string>
  >({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});
  const [expandedOrderIds, setExpandedOrderIds] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    if (ordersRes?.data) {
      const ordersArray = Array.isArray(ordersRes.data) ? ordersRes.data : [];
      setOrders(ordersArray);
      const initialPaymentStatuses: Record<string, string> = {};
      const initialOrderStatuses: Record<string, string> = {};
      ordersArray.forEach((order: any) => {
        if (order?._id) {
          initialPaymentStatuses[order._id] = order.paymentStatus || "pending";
          initialOrderStatuses[order._id] = order.status || "Pending";
        }
      });
      setSelectedPaymentStatuses(initialPaymentStatuses);
      setSelectedOrderStatuses(initialOrderStatuses);
    }
  }, [ordersRes]);

  const handleDelete = async (orderId: string) => {
    if (!orderId) return;
    setIsDeleting(true);

    try {
      await axios.delete(`${baseUrl}order/deleteOrder/${orderId}`, { withCredentials: true });
      setOrders((prev) => prev.filter((order) => order._id !== orderId));
      showToast("Order deleted successfully", "success");
      reFetch();
    } catch (error: any) {
      showToast(
        error.response?.data?.message || "Failed to delete order",
        "error",
      );
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePaymentStatusChange = (orderId: string, value: string) => {
    setSelectedPaymentStatuses((prev) => ({ ...prev, [orderId]: value }));
  };

  const handleOrderStatusChange = (orderId: string, value: string) => {
    setSelectedOrderStatuses((prev) => ({ ...prev, [orderId]: value }));
  };

  const handleUpdatePaymentStatus = async (orderId: string) => {
    if (!orderId) return;
    const newStatus = selectedPaymentStatuses[orderId];
    if (!newStatus) return;

    setIsUpdating((prev) => ({ ...prev, [orderId]: true }));

    try {
      const { data } = await axios.put(
        `${baseUrl}order/updateOrder/${orderId}`,
        {
          paymentStatus: newStatus,
        },
        { withCredentials: true },
      );

      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId
            ? { ...order, paymentStatus: data.data.paymentStatus }
            : order,
        ),
      );
      showToast("Payment status updated", "success");
    } catch (error: any) {
      showToast(
        error.response?.data?.message || "Failed to update payment status",
        "error",
      );
      console.error(error);
    } finally {
      setIsUpdating((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handleUpdateOrderStatus = async (orderId: string) => {
    if (!orderId) return;
    const newStatus = selectedOrderStatuses[orderId];
    if (!newStatus) return;

    setIsUpdating((prev) => ({ ...prev, [orderId]: true }));

    try {
      const { data } = await axios.patch(
        `${baseUrl}order/${orderId}/status`,
        {
          status: newStatus,
        },
        { withCredentials: true },
      );

      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId
            ? { ...order, status: data.data.status }
            : order,
        ),
      );
      showToast("Order status updated", "success");
    } catch (error: any) {
      showToast(
        error.response?.data?.message || "Failed to update order status",
        "error",
      );
      console.error(error);
    } finally {
      setIsUpdating((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrderIds((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  return (
    <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
      <div className="flex justify-between items-center mb-8 pb-6 border-b-4 border-black">
        <h2 className="text-3xl font-black uppercase tracking-tight">
          Order Management
        </h2>
        <button className="flex items-center gap-2 border-2 border-black bg-zinc-100 hover:bg-zinc-200 text-black px-6 py-3 font-black uppercase tracking-widest text-xs transition-colors">
          <Download className="w-4 h-4 text-orange-500" /> Export CSV
        </button>
      </div>

      <table className="w-full text-left">
        <thead>
          <tr className="text-xs font-black uppercase tracking-[0.15em] text-zinc-500 border-b-4 border-black bg-zinc-50">
            <th className="p-4">Order ID</th>
            <th className="p-4">Customer</th>
            <th className="p-4">Total</th>
            <th className="p-4">Payment</th>
            <th className="p-4">Order Status</th>
            <th className="p-4">Created</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="text-sm font-bold uppercase">
          {loading ? (
            <tr>
              <td colSpan={6} className="p-8 text-center">
                <p className="text-black font-bold uppercase">
                  Loading orders...
                </p>
              </td>
            </tr>
          ) : orders.length > 0 ? (
            orders.map((order) => (
              <Fragment key={order._id}>
                <tr className="border-b-2 border-zinc-100 hover:bg-zinc-50 transition-colors">
                  <td className="p-4 text-black break-words">{order._id}</td>
                  <td className="p-4 text-black">
                    {order.user?.username || order.user?.email || "Unknown"}
                  </td>
                  <td className="p-4 text-black">
                    Rs {order.totalPrice?.toLocaleString() || 0}
                  </td>
                  <td className="p-4 text-zinc-700">
                    <div className="flex flex-col gap-2">
                      <select
                        value={
                          selectedPaymentStatuses[order._id] ||
                          order.paymentStatus ||
                          "pending"
                        }
                        onChange={(e) =>
                          handlePaymentStatusChange(order._id, e.target.value)
                        }
                        className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#0856DF] focus:ring-2 focus:ring-[#0856DF]/10"
                      >
                        {paymentStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </select>
                      {selectedPaymentStatuses[order._id] &&
                      selectedPaymentStatuses[order._id] !==
                        order.paymentStatus ? (
                        <button
                          type="button"
                          onClick={() => handleUpdatePaymentStatus(order._id)}
                          disabled={isUpdating[order._id]}
                          className="self-start rounded-2xl bg-[#0856DF] px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-white transition hover:bg-[#0645c8] disabled:opacity-60"
                        >
                          {isUpdating[order._id] ? "Updating..." : "Update"}
                        </button>
                      ) : null}
                    </div>
                  </td>
                  <td className="p-4 text-zinc-700">
                    <div className="flex flex-col gap-2">
                      <select
                        value={
                          selectedOrderStatuses[order._id] ||
                          order.status ||
                          "Pending"
                        }
                        onChange={(e) =>
                          handleOrderStatusChange(order._id, e.target.value)
                        }
                        className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#0856DF] focus:ring-2 focus:ring-[#0856DF]/10"
                      >
                        {orderStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      {selectedOrderStatuses[order._id] &&
                      selectedOrderStatuses[order._id] !== order.status ? (
                        <button
                          type="button"
                          onClick={() => handleUpdateOrderStatus(order._id)}
                          disabled={isUpdating[order._id]}
                          className="self-start rounded-2xl bg-[#0856DF] px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-white transition hover:bg-[#0645c8] disabled:opacity-60"
                        >
                          {isUpdating[order._id] ? "Updating..." : "Update"}
                        </button>
                      ) : null}
                    </div>
                  </td>
                  <td className="p-4 text-zinc-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => toggleOrderDetails(order._id)}
                      className="p-2 border-2 border-transparent hover:border-black transition-colors"
                      title="Toggle order details"
                    >
                      {expandedOrderIds[order._id] ? (
                        <ChevronUp className="w-5 h-5 text-black" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-black" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(order._id)}
                      disabled={isDeleting}
                      className="p-2 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-all border-2 border-red-600 font-bold"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
                {expandedOrderIds[order._id] ? (
                  <tr className="bg-slate-50">
                    <td
                      colSpan={7}
                      className="p-4 text-sm uppercase font-normal text-slate-700"
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-3">
                          <h3 className="font-bold text-slate-900">
                            Order Items
                          </h3>
                          {order.orderItems?.map((item: any, idx: number) => {
                            const product = item.product || {};
                            console.log("item:", item);
                            return (
                              <div
                                key={idx}
                                className="rounded-2xl flex items-center gap-2 border border-slate-200 bg-white p-3"
                              >
                                <div>
                                  <img
                                    src={
                                      product.images[0]?.url || item.images[0]
                                    }
                                    alt={product.name || "Product Image"}
                                    className="w-20 h-auto object-cover"
                                  />
                                </div>
                                <div className="ml-4">
                                  <p className="font-semibold text-slate-900">
                                    {product.name || item.name || "Product"}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    ID:{" "}
                                    {product._id?.toString().slice(-5) ||
                                      item.product?._id?.toString().slice(-5) ||
                                      "N/A"}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    Category:{" "}
                                    {typeof product.category === "string"
                                      ? product.category
                                      : product.category?.name || "Unknown"}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    Quantity: {item.quantity}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    Rs{" "}
                                    {product.price?.toLocaleString() ||
                                      item.price?.toLocaleString() ||
                                      "0"}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="space-y-3">
                          <h3 className="font-bold text-slate-900">
                            Shipping & Payment
                          </h3>
                          <div className="rounded-2xl border border-slate-200 bg-white p-3">
                            <p>
                              <span className="font-semibold">Name:</span>{" "}
                              {order.shippingAddress?.fullName}
                            </p>
                            <p>
                              <span className="font-semibold">Phone:</span>{" "}
                              {order.shippingAddress?.phoneNo}
                            </p>
                            <p>
                              <span className="font-semibold">Address:</span>{" "}
                              {order.shippingAddress?.address}
                            </p>
                            <p>
                              <span className="font-semibold">City:</span>{" "}
                              {order.shippingAddress?.city}
                            </p>
                            <p>
                              <span className="font-semibold">Country:</span>{" "}
                              {order.shippingAddress?.country}
                            </p>
                            <p>
                              <span className="font-semibold">
                                Payment Method:
                              </span>{" "}
                              {order.paymentMethod}
                            </p>
                            <p>
                              <span className="font-semibold">
                                Payment Status:
                              </span>{" "}
                              {order.paymentStatus}
                            </p>
                            <p>
                              <span className="font-semibold">
                                Order Status:
                              </span>{" "}
                              {order.status}
                            </p>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="p-8 text-center">
                <p className="text-black font-bold uppercase">
                  No orders found.
                </p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default OrdersPage;
