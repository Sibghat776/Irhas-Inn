"use client";

import { Fragment, useEffect, useState } from "react";
import { Download, Eye, Trash2, ChevronDown, ChevronUp, Printer } from "lucide-react";
import useFetch, { baseUrl, showToast } from "@/app/utils/commonFunctions";
import axios from "axios";
import QRCode from "qrcode";

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

// Lightweight inline SVG placeholder used when a product image is missing
// (e.g., the referenced product was deleted after the order was placed).
const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23e2e8f0'/%3E%3Cpath d='M0 64 L28 36 L44 52 L60 32 L80 56' stroke='%2394a3b8' stroke-width='3' fill='none'/%3E%3Ccircle cx='26' cy='24' r='8' fill='%2394a3b8'/%3E%3C/svg%3E";

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
  const [printOrders, setPrintOrders] = useState<any[]>([]);
  const [printQr, setPrintQr] = useState<Record<string, string>>({});
  const [isGeneratingPrint, setIsGeneratingPrint] = useState(false);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const visibleOrders =
    statusFilter === "all"
      ? orders
      : orders.filter((o: any) => (o.status || "Pending") === statusFilter);

  const FRONTEND_URL =
    process.env.NEXT_PUBLIC_FRONTEND_URL ||
    process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ||
    "https://irhasinn.vercel.app";

  const generateQr = async (orderId: string) => {
    const url = `${FRONTEND_URL}/track-order/${orderId}`;
    try {
      return await QRCode.toDataURL(url, { width: 160, margin: 1 });
    } catch {
      return "";
    }
  };

  const buildPrintView = async (ordersToPrint: any[]) => {
    setIsGeneratingPrint(true);
    const qrMap: Record<string, string> = {};
    for (const o of ordersToPrint) {
      qrMap[o._id] = await generateQr(o._id);
    }
    setPrintOrders(ordersToPrint);
    setPrintQr(qrMap);
    setIsGeneratingPrint(false);
    // Allow React to render the hidden print section before opening dialog
    setTimeout(() => window.print(), 300);
  };

  const handlePrintOne = (order: any) => buildPrintView([order]);
  const handlePrintAll = () => buildPrintView(orders);

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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Order Management
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Track and update customer orders
          </p>
        </div>
        <button className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
          <Download className="h-4 w-4 text-orange-500" /> Export CSV
        </button>
        <button
          onClick={handlePrintAll}
          disabled={isGeneratingPrint || orders.length === 0}
          className="inline-flex items-center gap-2 self-start rounded-xl bg-[#0856DF] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0645c8] disabled:opacity-50"
        >
          <Printer className="h-4 w-4" />
          {isGeneratingPrint ? "Preparing..." : "Print All"}
        </button>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="self-start rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#0856DF] focus:ring-2 focus:ring-[#0856DF]/15"
        >
          <option value="all">All</option>
          <option value="Pending">Pending</option>
          <option value="Processing">Processing</option>
          <option value="Shipped">Shipped</option>
          <option value="Out for Delivery">Out for Delivery</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[920px] text-left">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="p-4">#</th>
              <th className="p-4">Order ID</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Total</th>
              <th className="p-4">Payment</th>
              <th className="p-4">Order Status</th>
              <th className="p-4">Created</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-10 text-center">
                  <p className="font-medium text-slate-500">Loading orders...</p>
                </td>
              </tr>
            ) : orders.length > 0 ? (
              visibleOrders.map((order) => (
                <Fragment key={order._id}>
                  <tr className="border-b border-slate-100 transition-colors hover:bg-slate-50">
                    <td className="p-4 font-mono font-semibold text-orange-500">
                      {order.serialNumber || "—"}
                    </td>
                    <td className="max-w-[180px] p-4 font-mono text-xs text-slate-600">
                      {order._id}
                    </td>
                    <td className="p-4 font-medium text-slate-800">
                      {order.user?.username || order.user?.email || "Unknown"}
                    </td>
                    <td className="p-4 font-semibold text-slate-900">
                      Rs {order.totalPrice?.toLocaleString() || 0}
                    </td>
                    <td className="p-4">
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
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#0856DF] focus:ring-2 focus:ring-[#0856DF]/10"
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
                            className="self-start rounded-xl bg-[#0856DF] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-[#0645c8] disabled:opacity-60"
                          >
                            {isUpdating[order._id] ? "Updating..." : "Update"}
                          </button>
                        ) : null}
                      </div>
                    </td>
                    <td className="p-4">
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
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#0856DF] focus:ring-2 focus:ring-[#0856DF]/10"
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
                            className="self-start rounded-xl bg-[#0856DF] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-[#0645c8] disabled:opacity-60"
                          >
                            {isUpdating[order._id] ? "Updating..." : "Update"}
                          </button>
                        ) : null}
                      </div>
                    </td>
                    <td className="p-4 text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => toggleOrderDetails(order._id)}
                        className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                        title="Toggle order details"
                      >
                        {expandedOrderIds[order._id] ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePrintOne(order)}
                        disabled={isGeneratingPrint}
                        className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                        title="Print report"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(order._id)}
                        disabled={isDeleting}
                        className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-50"
                        aria-label="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                  </tr>
                  {expandedOrderIds[order._id] ? (
                    <tr className="bg-slate-50/70">
                      <td
                        colSpan={8}
                        className="p-4 text-sm text-slate-700"
                      >
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-3">
                            <h3 className="font-semibold text-slate-900">
                              Order Items
                            </h3>
                            {order.orderItems?.map((item: any, idx: number) => {
                              const product = item.product || {};
                              return (
                                <div
                                  key={idx}
                                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"
                                >
                                  <img
                                    src={
                                      product?.images?.[0]?.url ||
                                      item?.images?.[0] ||
                                      PLACEHOLDER_IMG
                                    }
                                    alt={product?.name || "Product Image"}
                                    className="h-20 w-20 rounded-lg object-cover"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).src =
                                        PLACEHOLDER_IMG;
                                    }}
                                  />
                                  <div className="min-w-0">
                                    <p className="truncate font-semibold text-slate-900">
                                      {product?.name || item?.name || "Product"}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      ID:{" "}
                                      {product?._id?.toString().slice(-5) ||
                                        item?.product?._id?.toString().slice(-5) ||
                                        "N/A"}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      Category:{" "}
                                      {typeof product?.category === "string"
                                        ? product.category
                                        : product?.category?.name || "Unknown"}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      Brand: {product?.brand || "Unknown"}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      Quantity: {item.quantity}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      Rs{" "}
                                      {product?.price?.toLocaleString() ||
                                        item?.price?.toLocaleString() ||
                                        "0"}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="space-y-3">
                            <h3 className="font-semibold text-slate-900">
                              Shipping & Payment
                            </h3>
                            <div className="space-y-1.5 rounded-2xl border border-slate-200 bg-white p-4 text-sm">
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
                <td colSpan={8} className="p-10 text-center">
                  <p className="font-medium text-slate-500">No orders found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Hidden printable order reports (3 per A4 page) */}
      <div className="print-reports">
        {printOrders.map((order) => (
          <div key={order._id} className="order-report-block">
            {/* Header: logo + store name + receipt label + QR */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                borderBottom: "2px solid #0f172a",
                paddingBottom: "5px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/Logo.png"
                  alt="Irhas'Inn"
                  style={{ width: 30, height: 30, objectFit: "contain" }}
                />
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 800,
                      color: "#0f172a",
                      lineHeight: 1.1,
                    }}
                  >
                    Irhas'Inn
                  </div>
                  <div
                    style={{
                      fontSize: "8px",
                      fontWeight: 600,
                      letterSpacing: "1px",
                      color: "#0856DF",
                      textTransform: "uppercase",
                    }}
                  >
                    Order Receipt
                  </div>
                </div>
              </div>
              {printQr[order._id] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={printQr[order._id]}
                  alt="Track order QR"
                  style={{ width: 56, height: 56 }}
                />
              ) : null}
            </div>

            {/* Meta strip */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "2px 16px",
                fontSize: "9px",
                color: "#334155",
                padding: "4px 0",
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <span>
                <strong style={{ color: "#0f172a" }}>Order ID:</strong>{" "}
                <span style={{ fontFamily: "monospace" }}>{order._id}</span>
              </span>
              {order.serialNumber ? (
                <span>
                  <strong style={{ color: "#0f172a" }}>Serial #:</strong>{" "}
                  {order.serialNumber}
                </span>
              ) : null}
              <span>
                <strong style={{ color: "#0f172a" }}>Date:</strong>{" "}
                {new Date(order.createdAt).toLocaleDateString()}
              </span>
              <span>
                <strong style={{ color: "#0f172a" }}>Customer:</strong>{" "}
                {order.user?.username || order.user?.email || "—"}
              </span>
            </div>

            {/* Itemized table */}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "9px",
                color: "#0f172a",
                marginTop: "4px",
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid #cbd5e1" }}>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "2px 4px",
                      fontWeight: 700,
                      color: "#475569",
                    }}
                  >
                    Item
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "2px 4px",
                      fontWeight: 700,
                      color: "#475569",
                    }}
                  >
                    Qty
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "2px 4px",
                      fontWeight: 700,
                      color: "#475569",
                    }}
                  >
                    Price
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "2px 4px",
                      fontWeight: 700,
                      color: "#475569",
                    }}
                  >
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {(order.orderItems || []).map((item: any, idx: number) => {
                  const unit = item.product?.price || item.price || 0;
                  const qty = item.quantity || 1;
                  return (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: "1px solid #eef2f7",
                        background: idx % 2 === 1 ? "#f8fafc" : "transparent",
                      }}
                    >
                      <td
                        style={{
                          padding: "2px 4px",
                          maxWidth: "90px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.product?.name || item.name || "Product"}
                      </td>
                      <td style={{ padding: "2px 4px", textAlign: "right" }}>
                        {qty}
                      </td>
                      <td style={{ padding: "2px 4px", textAlign: "right" }}>
                        Rs {unit.toLocaleString()}
                      </td>
                      <td style={{ padding: "2px 4px", textAlign: "right" }}>
                        Rs {(unit * qty).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Total row (light accent, print-safe) */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "4px",
                padding: "4px 6px",
                background: "#eef4ff",
                border: "1px solid #c7dbff",
                borderRadius: "3px",
                fontSize: "11px",
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              <span>TOTAL</span>
              <span>Rs {order.totalPrice?.toLocaleString() || 0}</span>
            </div>

            {/* Footer: status + shipping + scan label */}
            <div
              style={{
                fontSize: "8px",
                color: "#475569",
                marginTop: "4px",
                borderTop: "1px dashed #cbd5e1",
                paddingTop: "3px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>
                  Status: <strong>{order.status}</strong>
                </span>
                <span>
                  Payment: <strong>{order.paymentStatus}</strong> (
                  {order.paymentMethod})
                </span>
              </div>
              <div style={{ marginTop: "2px" }}>
                <strong>Ship to:</strong> {order.shippingAddress?.fullName},{" "}
                {order.shippingAddress?.address}, {order.shippingAddress?.city},{" "}
                {order.shippingAddress?.country} ({order.shippingAddress?.phoneNo})
              </div>
              <div style={{ marginTop: "2px", color: "#64748b" }}>
                Scan QR to track your order: {FRONTEND_URL}/track-order/{order._id}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersPage;
