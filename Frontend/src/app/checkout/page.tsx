"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, CheckCircle, CreditCard, MapPin, ShoppingCart, Truck, XCircle } from "lucide-react";
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
  _id:
    item._id ||
    item.id ||
    item.productId ||
    item.product?._id ||
    "",
  selectedColor: item.selectedColor || item.color || item.variant?.color,
  selectedSize: item.selectedSize || item.size || item.variant?.size,
});

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

  useEffect(() => {
    const loadCartFromLocal = () => {
      const storedCart = getLocalCart();
      const normalizedCart = (storedCart || [])
        .map(normalizeCartItem)
        .filter((item : any) => item._id);
      setCartItems(normalizedCart);
    };

    const loadCartFromBackend = async () => {
      try {
        const localCart = getLocalCart();
        if (localCart.length > 0) {
          await axios.post(
            `${baseUrl}cart/sync`,
            {
              cartItems: localCart.map((item: any) => ({
                productId: item._id || item.id || item.productId || item.product?._id,
                quantity: item.quantity,
              })),
            },
          );
          setLocalCart([]);
        }

        const res = await axios.get(`${baseUrl}cart/`, {
          withCredentials: true,
        });

        const backendItems = res.data.data.map((item: any) =>
          normalizeCartItem({
            _id: item.product._id,
            name: item.product.name,
            description: item.product.description,
            price: item.product.price,
            quantity: item.quantity,
            images: item.product.images,
            stock: item.product.stock,
          }),
        );

        setCartItems(backendItems.filter((item: any) => item._id));
      } catch (err) {
        loadCartFromLocal();
      }
    };

    if (auth.username) {
      loadCartFromBackend();
    } else {
      loadCartFromLocal();
    }
  }, [auth.username]);

  // Make logged-in user's profile data fill the checkout form automatically
  useEffect(() => {
    if (!auth.username) return;

    setForm((prev) => ({
      ...prev,
      fullName:
        prev.fullName || userResponse?.data?.username || auth.username || "",
      phoneNo:
        prev.phoneNo ||
        (userResponse?.data?.phoneNo
          ? userResponse.data.phoneNo.toString()
          : auth.phoneNo
          ? auth.phoneNo.toString()
          : ""),
      address: prev.address || userResponse?.data?.address || "",
    }));
  }, [auth.username, auth.phoneNo, userResponse?.data]);

  useEffect(() => {
    if (!auth.username && typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          dispatch(loginSuccess(JSON.parse(storedUser) as any));
        } catch {
          // ignore invalid stored user
        }
      }
    }
  }, [auth.username, dispatch]);

  useEffect(() => {
    if (useSavedAddress && userResponse?.data) {
      setForm((prev) => ({
        ...prev,
        fullName: userResponse.data.username || prev.fullName,
        phoneNo: userResponse.data.phoneNo
          ? userResponse.data.phoneNo.toString()
          : prev.phoneNo,
        address: userResponse.data.address || prev.address,
      }));
    }
  }, [useSavedAddress, userResponse]);

  const totals = useMemo(() => {
    const itemsPrice = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const shippingPrice = cartItems.length > 0 ? 200 : 0;
    return {
      itemsPrice,
      shippingPrice,
      totalPrice: itemsPrice + shippingPrice,
    };
  }, [cartItems]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (event: FormEvent) => {
    event.preventDefault();

    if (!auth.username) {
      dispatch(openLogin());
      showToast("Please login before placing an order.", "error");
      return;
    }

    const validCartItems = cartItems.filter((item) => item._id);
    if (validCartItems.length !== cartItems.length) {
      showToast(
        "Please remove invalid items from your cart before placing an order.",
        "error",
      );
      return;
    }

    if (validCartItems.length === 0) {
      showToast("Your cart is empty. Add a product first.", "error");
      return;
    }

    if (!form.fullName.trim() || !form.phoneNo.trim() || !form.address.trim()) {
      showToast("Please complete all required shipping fields.", "error");
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${baseUrl}order/createOrder`,
        {
          orderItems: validCartItems.map((item) => ({
            product: item._id,
            quantity: item.quantity,
          })),
          shippingAddress: form,
          paymentMethod: "Cash on Delivery",
          paymentStatus: "pending",
          itemsPrice: totals.itemsPrice,
          shippingPrice: totals.shippingPrice,
          totalPrice: totals.totalPrice,
        },
        { withCredentials: true },
      );

      if (typeof window !== "undefined") {
        localStorage.removeItem("zeef_store_cart");
      }
      setCartItems([]);
      setOrderPlaced(true);
      showToast("Order placed successfully!", "success", "light");

      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to place order. Please try again.";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckoutBack = () => {
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-400 via-white to-slate-100 text-slate-900 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
              Secure Checkout
            </p>
            <h1 className="text-4xl font-black tracking-tight text-[#041241]">
              Review your order and place it with COD
            </h1>
          </div>
          <button
            type="button"
            onClick={handleCheckoutBack}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft size={18} /> Continue shopping
          </button>
        </div>

        {orderPlaced ? (
          <div className="rounded-[32px] border border-green-200 bg-green-50 p-10 text-center text-green-900 shadow-sm">
            <CheckCircle className="mx-auto mb-4 h-14 w-14" />
            <h2 className="text-3xl font-bold">Order Confirmed</h2>
            <p className="mt-4 text-slate-700">
              Your purchase is confirmed. We will dispatch it shortly.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              You will be redirected to the homepage in a few seconds.
            </p>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="rounded-[32px] border border-slate-300 bg-white p-10 text-center shadow-sm">
            <XCircle className="mx-auto mb-4 h-14 w-14 text-slate-400" />
            <h2 className="text-3xl font-bold">Your cart is empty</h2>
            <p className="mt-4 text-slate-600">
              Add products to the cart from the product page and return here to checkout.
            </p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-[#0856DF] px-6 py-3 text-white transition hover:bg-[#0645c8]"
            >
              <ShoppingCart size={18} /> Browse products
            </button>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
            <section className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                    Shipping Address
                  </p>
                  <h2 className="text-2xl font-black text-[#041241]">
                    Complete Delivery Details
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!auth.username) {
                      dispatch(openLogin());
                      showToast("Login is required to use saved address.", "info");
                      return;
                    }
                    setUseSavedAddress((prev) => !prev);
                  }}
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    useSavedAddress
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <MapPin size={18} />
                  {useSavedAddress ? "Using saved address" : "Use saved profile address"}
                </button>
              </div>

              <form onSubmit={handlePlaceOrder} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Full Name</span>
                    <input
                      name="fullName"
                      value={form.fullName}
                      onChange={handleInputChange}
                      placeholder="Recipient name"
                      className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm outline-none focus:border-[#0856DF] focus:ring-2 focus:ring-[#0856DF]/10"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Phone Number</span>
                    <input
                      name="phoneNo"
                      value={form.phoneNo}
                      onChange={handleInputChange}
                      placeholder="03XX-XXXXXXX"
                      className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm outline-none focus:border-[#0856DF] focus:ring-2 focus:ring-[#0856DF]/10"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Full Address</span>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleInputChange}
                    placeholder="Street, building, area"
                    rows={4}
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm outline-none focus:border-[#0856DF] focus:ring-2 focus:ring-[#0856DF]/10 resize-none"
                  />
                </label>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">City</span>
                    <input
                      name="city"
                      value={form.city}
                      onChange={handleInputChange}
                      className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm outline-none focus:border-[#0856DF] focus:ring-2 focus:ring-[#0856DF]/10"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Country</span>
                    <input
                      name="country"
                      value={form.country}
                      onChange={handleInputChange}
                      className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm outline-none focus:border-[#0856DF] focus:ring-2 focus:ring-[#0856DF]/10"
                    />
                  </label>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                  <div className="flex items-center gap-3 font-semibold text-slate-900">
                    <CreditCard size={18} /> Cash on Delivery
                  </div>
                  <p className="mt-3 text-slate-600">
                    Pay when you receive the package. No online payment is required.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-3xl bg-[#0856DF] px-6 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-lg transition hover:bg-[#0645c8] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Placing order..." : "Place Order"}
                </button>
              </form>
            </section>

            <aside className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3 text-slate-700">
                <Truck size={20} />
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                    Order summary
                  </p>
                  <h2 className="text-2xl font-black text-[#041241]">
                    {cartItems.length} items ready to ship
                  </h2>
                </div>
              </div>

              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item._id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={item.images?.[0]?.url ?? "/carousel/Pens.avif"}
                        alt={item.name}
                        className="h-20 w-20 rounded-3xl object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{item.name}</h3>
                        <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                          {item.description ?? "Premium item"}
                        </p>
                        {(item.selectedColor || item.selectedSize) && (
                          <div className="mt-3 flex flex-wrap gap-2 text-sm">
                            {item.selectedColor && (
                              <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-slate-700">
                                Color: {item.selectedColor}
                              </span>
                            )}
                            {item.selectedSize && (
                              <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-slate-700">
                                Size: {item.selectedSize}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                          <span>Qty: {item.quantity}</span>
                          <span>Rs {item.price.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Items</span>
                  <span>Rs {totals.itemsPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping</span>
                  <span>Rs {totals.shippingPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-4 font-black text-[#041241]">
                  <span>Total</span>
                  <span>Rs {totals.totalPrice.toLocaleString()}</span>
                </div>
              </div>

              <div className="rounded-3xl bg-[#F7F7FA] p-5 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">Need help?</p>
                <p className="mt-2">
                  Contact our support team if you want to update your shipping address before order placement.
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
};

export default CheckoutPage;
