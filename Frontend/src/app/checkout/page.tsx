"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowLeft, CheckCircle, CreditCard, MapPin,
  ShoppingCart, Truck, XCircle, Package, Shield, ChevronRight,
} from "lucide-react";
import { RootState, AppDispatch } from "../Redux/store";
import useFetch, {
  baseUrl,
  getLocalCart,
  setLocalCart,
  showToast,
} from "../utils/commonFunctions";
import { openLogin } from "../Redux/Features/modalSlice";
import { loginSuccess } from "../Redux/Features/authSlice";

interface CartItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  images?: Array<{ url: string }>;
  selectedColor?: string;
  selectedSize?: string;
  colors?: string[];
  sizes?: string[];
}

interface UserData {
  username: string;
  email: string;
  phoneNo?: number | string;
  address?: string;
  profilePic?: string;
}

interface UserApiResponse {
  status: number;
  message: string;
  data: UserData;
}

const normalizeCartItem = (item: any): CartItem => ({
  ...item,
  _id: item._id || item.id || item.productId || item.product?._id || "",
  selectedColor: item.selectedColor || item.color || item.variant?.color,
  selectedSize: item.selectedSize || item.size || item.variant?.size,
  colors: item.colors || item.product?.colors || [],
  sizes: item.sizes || item.product?.sizes || [],
});

// ── Step indicator ────────────────────────────────────────────────────────────
const steps = ["Shipping", "Review", "Done"];
const StepBar: React.FC<{ current: number }> = ({ current }) => (
  <div className="flex items-center gap-0 mb-10">
    {steps.map((label, i) => {
      const done = i < current;
      const active = i === current;
      return (
        <div key={label} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${done
                ? "bg-emerald-500 text-white"
                : active
                  ? "bg-[#0856DF] text-white scale-110"
                  : "bg-slate-100 text-slate-400"
                }`}
            >
              {done ? <CheckCircle size={16} /> : i + 1}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${active ? "text-[#0856DF]" : done ? "text-emerald-500" : "text-slate-400"}`}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 mx-3 mb-5">
              <div className="h-0.5 w-full rounded-full overflow-hidden bg-slate-100">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: done ? "100%" : "0%", background: "#22c55e" }}
                />
              </div>
            </div>
          )}
        </div>
      );
    })}
  </div>
);

// ── Main Checkout ─────────────────────────────────────────────────────────────
const CheckoutPage = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [form, setForm] = useState({
    fullName: "",
    phoneNo: "",
    address: "",
    city: "Karachi",
    country: "Pakistan",
  });
  const [useSavedAddress, setUseSavedAddress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const { data: userResponse } = useFetch<UserApiResponse>(
    auth.username ? `${baseUrl}auth/getUser/${auth.username}` : "",
  );

  const currentStep = orderPlaced ? 2 : 0;

  useEffect(() => {
    const loadLocal = () => {
      const stored = getLocalCart();
      setCartItems((stored || []).map(normalizeCartItem).filter((i: any) => i._id));
    };
    const loadBackend = async () => {
      try {
        const localCart = getLocalCart();
        if (localCart.length > 0) {
          await axios.post(
            `${baseUrl}cart/sync`,
            { cartItems: localCart.map((i: any) => ({ productId: i._id || i.id || i.productId || i.product?._id, quantity: i.quantity })) },
            { withCredentials: true },
          );
          setLocalCart([]);
        }
        const res = await axios.get(`${baseUrl}cart/`, { withCredentials: true });
        const items = res.data.data.map((item: any) =>
          normalizeCartItem({
            _id: item.product._id,
            name: item.product.name,
            description: item.product.description,
            price: item.product.price,
            quantity: item.quantity,
            images: item.product.images,
            stock: item.product.stock,
            colors: item.product.colors,
            sizes: item.product.sizes,
            selectedColor: item.selectedColor || item.color,
            selectedSize: item.selectedSize || item.size,
          }),
        );
        setCartItems(items.filter((i: any) => i._id));
      } catch { loadLocal(); }
    };
    if (auth.username) loadBackend(); else loadLocal();
  }, [auth.username]);

  useEffect(() => {
    if (!auth.username) return;
    setForm((prev) => ({
      ...prev,
      fullName: prev.fullName || userResponse?.data?.username || auth.username || "",
      phoneNo: prev.phoneNo || (userResponse?.data?.phoneNo ? userResponse.data.phoneNo.toString() : auth.phoneNo ? auth.phoneNo.toString() : ""),
      address: prev.address || userResponse?.data?.address || "",
    }));
  }, [auth.username, auth.phoneNo, userResponse?.data]);

  useEffect(() => {
    if (!auth.username && typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      if (stored) { try { dispatch(loginSuccess(JSON.parse(stored) as any)); } catch { } }
    }
  }, [auth.username, dispatch]);

  useEffect(() => {
    if (useSavedAddress && userResponse?.data) {
      setForm((prev) => ({
        ...prev,
        fullName: userResponse.data.username || prev.fullName,
        phoneNo: userResponse.data.phoneNo ? userResponse.data.phoneNo.toString() : prev.phoneNo,
        address: userResponse.data.address || prev.address,
      }));
    }
  }, [useSavedAddress, userResponse]);

  const totals = useMemo(() => {
    const itemsPrice = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
    return { itemsPrice, shippingPrice: 0, totalPrice: itemsPrice };
  }, [cartItems]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleVariantChange = (itemId: string, field: "selectedColor" | "selectedSize", value: string) => {
    setCartItems((prev) => prev.map((item) => item._id === itemId ? { ...item, [field]: value } : item));
  };

  const saveAddressToProfileIfMissing = async () => {
    if (!auth.username) return;
    if (userResponse?.data?.address?.trim() || !form.address.trim()) return;
    try {
      await axios.put(`${baseUrl}auth/updateUser/${auth.username}`, { address: form.address, phoneNo: form.phoneNo }, { withCredentials: true });
    } catch (err) { console.error("Could not save address:", err); }
  };

  const handlePlaceOrder = async (event: FormEvent) => {
    event.preventDefault();
    if (!auth.username) { dispatch(openLogin()); showToast("Please login before placing an order.", "error"); return; }
    const validItems = cartItems.filter((i) => i._id);
    if (validItems.length === 0) { showToast("Your cart is empty.", "error"); return; }
    if (!form.fullName.trim() || !form.phoneNo.trim() || !form.address.trim()) {
      showToast("Please complete all shipping fields.", "error"); return;
    }
    setLoading(true);
    try {
      await axios.post(
        `${baseUrl}order/createOrder`,
        {
          orderItems: validItems.map((i) => ({ product: i._id, quantity: i.quantity, selectedColor: i.selectedColor, selectedSize: i.selectedSize })),
          shippingAddress: form,
          paymentMethod: "Cash on Delivery",
          paymentStatus: "pending",
          itemsPrice: totals.itemsPrice,
          shippingPrice: totals.shippingPrice,
          totalPrice: totals.totalPrice,
        },
        { withCredentials: true },
      );
      await saveAddressToProfileIfMissing();
      if (typeof window !== "undefined") localStorage.removeItem("zeef_store_cart");
      setCartItems([]);
      setOrderPlaced(true);
      showToast("Order placed successfully!", "success", "light");
      setTimeout(() => router.push("/"), 3000);
    } catch (error: any) {
      showToast(error?.response?.data?.message || error?.message || "Unable to place order.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen py-12 sm:py-20 bg-gradient-to-b from-gray-400 via-white to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#0856DF] mb-1">Secure Checkout</p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#041241]">
              Cash on Delivery
            </h1>
          </div>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-[#0856DF]/30 hover:bg-slate-50"
          >
            <ArrowLeft size={16} /> Back
          </button>
        </div>

        <StepBar current={currentStep} />

        {/* Order confirmed */}
        {orderPlaced ? (
          <div className="rounded-3xl overflow-hidden" style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", border: "1px solid #bbf7d0" }}>
            <div className="p-10 sm:p-16 text-center">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 mb-6 shadow-lg shadow-emerald-200">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-emerald-900">Order Confirmed!</h2>
              <p className="mt-3 text-slate-600 text-base">
                Your order is placed. We'll dispatch it shortly — payment on delivery.
              </p>
              <p className="mt-2 text-sm text-slate-400">Redirecting to homepage…</p>
              <div className="mt-6 h-1 w-40 mx-auto rounded-full bg-emerald-100 overflow-hidden">
                <div className="h-full bg-emerald-400 animate-[progress_3s_linear_forwards]" />
              </div>
            </div>
          </div>
        ) : cartItems.length === 0 ? (
          // Empty cart
          <div className="rounded-3xl bg-white border border-slate-100 p-12 text-center shadow-sm">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 mb-5">
              <XCircle className="h-8 w-8 text-slate-300" />
            </div>
            <h2 className="text-2xl font-black text-[#041241]">Your cart is empty</h2>
            <p className="mt-2 text-slate-500 text-sm">Browse our products and add something you love.</p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-[#0856DF] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#0645c8]"
            >
              <ShoppingCart size={16} /> Browse products
            </button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">

            {/* ── LEFT: Shipping form ── */}
            <div className="space-y-5">
              <div className="rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden">
                {/* Card header */}
                <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-slate-50">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#0856DF]">Step 1</p>
                    <h2 className="text-xl font-black text-[#041241] mt-0.5">Delivery Details</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!auth.username) { dispatch(openLogin()); showToast("Login required.", "info"); return; }
                      setUseSavedAddress((p) => !p);
                    }}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${useSavedAddress ? "bg-[#041241] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                  >
                    <MapPin size={14} />
                    {useSavedAddress ? "Saved address ✓" : "Use saved address"}
                  </button>
                </div>

                <form onSubmit={handlePlaceOrder} className="p-7 space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Full Name</span>
                      <input
                        name="fullName"
                        value={form.fullName}
                        onChange={handleInputChange}
                        placeholder="Recipient name"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-[#041241] placeholder:text-slate-300 outline-none transition focus:border-[#0856DF] focus:bg-white focus:ring-3 focus:ring-[#0856DF]/10"
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Phone Number</span>
                      <input
                        name="phoneNo"
                        value={form.phoneNo}
                        onChange={handleInputChange}
                        placeholder="03XX-XXXXXXX"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-[#041241] placeholder:text-slate-300 outline-none transition focus:border-[#0856DF] focus:bg-white focus:ring-3 focus:ring-[#0856DF]/10"
                      />
                    </label>
                  </div>

                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Full Address</span>
                    <textarea
                      name="address"
                      value={form.address}
                      onChange={handleInputChange}
                      placeholder="Street, building, area"
                      rows={3}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-[#041241] placeholder:text-slate-300 outline-none transition focus:border-[#0856DF] focus:bg-white focus:ring-3 focus:ring-[#0856DF]/10 resize-none"
                    />
                    {auth.username && !userResponse?.data?.address?.trim() && (
                      <span className="text-[11px] text-slate-400">
                        💾 This address will be saved to your profile.
                      </span>
                    )}
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">City</span>
                      <input name="city" value={form.city} onChange={handleInputChange}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-[#041241] outline-none transition focus:border-[#0856DF] focus:bg-white focus:ring-3 focus:ring-[#0856DF]/10" />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Country</span>
                      <input name="country" value={form.country} onChange={handleInputChange}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-[#041241] outline-none transition focus:border-[#0856DF] focus:bg-white focus:ring-3 focus:ring-[#0856DF]/10" />
                    </label>
                  </div>

                  {/* COD badge */}
                  <div className="flex items-center gap-4 rounded-2xl p-4" style={{ background: "rgba(8,86,223,0.05)", border: "1px solid rgba(8,86,223,0.12)" }}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0856DF]">
                      <CreditCard size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#041241]">Cash on Delivery</p>
                      <p className="text-xs text-slate-500">Pay in cash when your package arrives.</p>
                    </div>
                    <div className="ml-auto">
                      <Shield size={18} className="text-[#0856DF]" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="relative w-full overflow-hidden rounded-2xl bg-[#0856DF] py-4 text-sm font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-[#0856DF]/25 transition-all hover:bg-[#0645c8] hover:shadow-xl hover:shadow-[#0856DF]/30 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:translate-y-0"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20" />
                        </svg>
                        Placing order…
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Place Order <ChevronRight size={16} />
                      </span>
                    )}
                  </button>
                </form>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Shield, label: "Secure", sub: "100% safe" },
                  { icon: Truck, label: "Free shipping", sub: "All orders" }
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="rounded-2xl bg-white border border-slate-100 p-3.5 text-center">
                    <Icon size={18} className="mx-auto mb-1.5 text-[#0856DF]" />
                    <p className="text-xs font-bold text-[#041241]">{label}</p>
                    <p className="text-[10px] text-slate-400">{sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── RIGHT: Order summary ── */}
            <aside className="space-y-5">
              <div className="rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 pt-6 pb-4 border-b border-slate-50">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#0856DF]">Order Summary</p>
                  <h2 className="text-xl font-black text-[#041241] mt-0.5">
                    {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
                  </h2>
                </div>

                <div className="p-4 space-y-3 max-h-[420px] overflow-y-auto">
                  {cartItems.map((item) => (
                    <div
                      key={item._id}
                      className="rounded-2xl p-3.5 transition hover:bg-slate-50"
                      style={{ border: "1px solid #f1f5f9" }}
                    >
                      <div className="flex gap-3">
                        <img
                          src={item.images?.[0]?.url ?? "/carousel/Pens.avif"}
                          alt={item.name}
                          className="h-16 w-16 rounded-xl object-cover ring-1 ring-slate-100 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-black text-[#041241] truncate">{item.name}</h3>
                          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{item.description ?? "Premium item"}</p>

                          {/* Variant selectors */}
                          {(Boolean(item.colors?.length) || Boolean(item.sizes?.length)) ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {Boolean(item.colors?.length) && (
                                <select
                                  value={item.selectedColor || ""}
                                  onChange={(e) => handleVariantChange(item._id, "selectedColor", e.target.value)}
                                  className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 outline-none focus:border-[#0856DF]"
                                >
                                  <option value="" disabled>Color</option>
                                  {item.colors?.map((c) => <option key={c} value={c}>{c}</option>)}
                                </select>
                              )}
                              {Boolean(item.sizes?.length) && (
                                <select
                                  value={item.selectedSize || ""}
                                  onChange={(e) => handleVariantChange(item._id, "selectedSize", e.target.value)}
                                  className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 outline-none focus:border-[#0856DF]"
                                >
                                  <option value="" disabled>Size</option>
                                  {item.sizes?.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                              )}
                            </div>
                          ) : (
                            (item.selectedColor || item.selectedSize) && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {item.selectedColor && (
                                  <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 capitalize">
                                    {item.selectedColor}
                                  </span>
                                )}
                                {item.selectedSize && (
                                  <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                    {item.selectedSize}
                                  </span>
                                )}
                              </div>
                            )
                          )}

                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-[11px] text-slate-400">Qty {item.quantity}</span>
                            <span className="text-xs font-black text-[#041241]">
                              Rs {(item.price * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-slate-50 p-5 space-y-2.5">
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-700">Rs {totals.itemsPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Shipping</span>
                    <span className="font-bold text-emerald-500">Free</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                    <span className="text-base font-black text-[#041241]">Total</span>
                    <span className="text-xl font-black text-[#0856DF]">
                      Rs {totals.totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl p-4 text-sm" style={{ background: "rgba(8,86,223,0.04)", border: "1px solid rgba(8,86,223,0.10)" }}>
                <p className="font-bold text-[#041241] text-xs mb-1">Need help?</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Contact support to update your address before the order is dispatched.
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes progress {
          from { width: 0% }
          to { width: 100% }
        }
      `}</style>
    </main>
  );
};

export default CheckoutPage;