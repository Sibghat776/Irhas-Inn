"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { ShoppingCart, Trash2, XCircle, Minus, Plus } from "lucide-react";
import { RootState, AppDispatch } from "../Redux/store";
import { startLoading, stopLoading } from "../Redux/Features/uiSlice";
import useFetch, {
  baseUrl,
  getLocalCart,
  setLocalCart,
  showToast,
} from "../utils/commonFunctions";

interface CartItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  images?: Array<{ url: string }>;
  stock?: number;
  category?: string | null;
  selectedColor?: string;
  selectedSize?: string;
}

const normalizeCartItem = (item: any): CartItem => ({
  ...item,
  _id: item._id || item.id || item.productId || item.product?._id || "",
  selectedColor: item.selectedColor || item.color || item.variant?.color,
  selectedSize: item.selectedSize || item.size || item.variant?.size,
});

const getCartItemProductId = (item: any) =>
  item._id || item.id || item.productId || item.product?._id || "";

const CartPage = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  const {
    data: cartResponse,
    error: fetchError,
    reFetch,
  } = useFetch<any>(auth.username ? `${baseUrl}cart/` : "");

  // 1. Sync Logic and Guest Cart Handling
  useEffect(() => {
    const localCart = getLocalCart() as CartItem[];

    if (auth.username) {
      dispatch(startLoading("ZF Loading Cart"));
      const handleSyncCart = async () => {
        if (localCart.length === 0) {
          dispatch(stopLoading());
          return;
        }

        console.log(
          "[Cart Frontend]: Initiating cart sync for user",
          auth.username,
        );
        setLoading(true);
        try {
          const normalizedLocalCart = localCart
            .map(normalizeCartItem)
            .filter((item) => item._id);

          if (normalizedLocalCart.length > 0) {
            await axios.post(
              `${baseUrl}cart/sync`,
              {
                cartItems: normalizedLocalCart.map((item) => ({
                  productId: getCartItemProductId(item),
                  quantity: item.quantity,
                })),
              },
              {
                withCredentials : true,
              }
            );
            console.log(
              "[Cart Frontend]: Sync successful. Clearing local cart.",
            );
            setLocalCart([]);
          }
          await reFetch();
        } catch (err: any) {
          console.error("[Cart Frontend Error]: Sync failed", err);
          setSyncError(
            err?.response?.data?.message ||
              "Unable to sync cart with your account.",
          );
        } finally {
          setLoading(false);
          dispatch(stopLoading());
        }
      };
      handleSyncCart();
    } else {
      console.log(
        "[Cart Frontend]: User not logged in, loading local storage cart.",
      );
      const normalizedCart = localCart
        .map(normalizeCartItem)
        .filter((item) => item._id);
      setCartItems(normalizedCart);
      setIsEmpty(normalizedCart.length === 0);
    }
  }, [auth.username]); // Removed reFetch from dependency to prevent possible trigger loops

  // 2. Sync Backend State to Frontend State
  useEffect(() => {
    let backendItems: any[] = [];
    if (auth.username && cartResponse?.data) {
      console.log(
        "[Cart Frontend]: Processing backend data response",
        cartResponse.data,
      );
      backendItems = cartResponse.data
        .map((item: any) => {
          const product = item.product || {};
          const id = product._id || item._id || item.id || item.productId || "";
          const categoryId = product?.category?._id || product?.category || null;

          return {
            _id: id,
            name: product.name ?? item.name ?? "Unknown Product",
            description: product.description ?? item.description ?? "",
            price: product.price ?? item.price ?? 0,
            quantity: item.quantity ?? 1,
            images: product.images ?? item.images ?? [],
            stock: product.stock ?? item.stock ?? 0,
            category: categoryId,
            selectedColor: item.selectedColor ?? product.selectedColor ?? item.color ?? item.variant?.color,
            selectedSize: item.selectedSize ?? product.selectedSize ?? item.size ?? item.variant?.size,
          };
        })
        .filter((item: any) => item._id);

      setCartItems(backendItems);
      setIsEmpty(backendItems.length === 0);
    }
    // Fetch related products based on first cart item's category (preferred). If none, fallback to general products.
    const categoryId =
      backendItems.find((p) => p.category)?.category ??
      cartItems.find((p) => p.category)?.category ??
      null;
    const fetchRelated = async () => {
      try {
        setLoadingRelated(true);
        let res;
        if (categoryId) {
          res = await axios.get(
            `${baseUrl}product/getAllProducts?category=${encodeURIComponent(
              categoryId,
            )}&limit=12`,
            { withCredentials: true },
          );
        } else {
          res = await axios.get(`${baseUrl}product/getAllProducts?limit=12`, { withCredentials: true });
        }

        let products = res?.data?.data?.products ?? [];

        // If category returned no products, fallback to general products
        if ((!products || products.length === 0) && categoryId) {
          const fallback = await axios.get(`${baseUrl}product/getAllProducts?limit=12`, { withCredentials: true });
          products = fallback?.data?.data?.products ?? [];
        }

        const filtered = (products ?? [])
          .filter((p: any) => !backendItems.find((c) => c._id === (p._id || p.id)))
          .slice(0, 6);
        setRelatedProducts(filtered);
      } catch (err) {
        console.error("Related products fetch error", err);
        setRelatedProducts([]);
      } finally {
        setLoadingRelated(false);
      }
    };

    fetchRelated();
  }, [cartResponse, auth.username]);

  // Add to cart from related products
  const addSuggestedToCart = async (product: any) => {
    const productId = product._id || product.id;
    if (!productId) return;

    const stock = product.stock ?? product?.product?.stock ?? null;
    if (stock !== null && stock <= 0) {
      return showToast("Product is out of stock", "error");
    }

    if (auth.username) {
      try {
        await axios.post(
          `${baseUrl}cart/`,
          { productId, quantity: 1 },
          { withCredentials: true },
        );
        await reFetch();
        showToast("Added to cart", "success");
        window.dispatchEvent(new Event("cart-updated"));
      } catch (err: any) {
        console.error("Add suggested to cart error", err);
        showToast(
          err?.response?.data?.message || "Failed to add to cart",
          "error",
        );
      }
    } else {
      const local = getLocalCart();
      const exists = local.find((i: any) => (i._id || i.id) === productId);
      if (exists) {
        const newQty = (exists.quantity || 1) + 1;
        if (stock !== null && newQty > stock)
          return showToast(`Only ${stock} items available`, "error");
        exists.quantity = newQty;
      } else {
        if (stock !== null && 1 > stock)
          return showToast(`Only ${stock} items available`, "error");
        local.push({ ...product, _id: productId, quantity: 1 });
        setCartItems((prev) => [
          ...prev,
          { ...product, _id: productId, quantity: 1 },
        ]);
      }
      setLocalCart(local);
      showToast("Added to cart", "success");
    }
  };

  const buyNowSuggested = async (product: any) => {
    await addSuggestedToCart(product);
    router.push("/checkout");
  };

  // 3. Totals Calculation
  const totals = useMemo(() => {
    const itemsPrice = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    return {
      itemsPrice,
      shippingPrice: cartItems.length > 0 ? 200 : 0,
      totalPrice: itemsPrice + (cartItems.length > 0 ? 200 : 0),
    };
  }, [cartItems]);

  // 4. Update Cart Item Operation
  const updateCart = async (productId: string, quantity: number) => {
    console.log(
      `[Cart Action]: Updating product ${productId} to quantity ${quantity}`,
    );
    // client-side stock check
    const existing = cartItems.find((c) => c._id === productId);
    const available = existing?.stock ?? null;
    if (available !== null && quantity > available) {
      return showToast(`Only ${available} items available`, "error");
    }

    if (auth.username) {
      try {
        await axios.put(
          `${baseUrl}cart/${productId}`,
          { quantity },
          { withCredentials: true },
        );
        await reFetch();
        window.dispatchEvent(new Event("cart-updated"));
      } catch (err: any) {
        console.error("[Cart Update Error]:", err);
        showToast(
          err?.response?.data?.message || "Unable to update cart item",
          "error",
        );
      }
    } else {
      const updated = cartItems.map((item) =>
        item._id === productId ? { ...item, quantity } : item,
      );
      setCartItems(updated);
      setLocalCart(updated);
      window.dispatchEvent(new Event("cart-updated"));
    }
  };

  // 5. Remove Single Item Operation
  const removeItem = async (productId: string) => {
    console.log(`[Cart Action]: Removing product ${productId}`);
    if (auth.username) {
      try {
        await axios.delete(`${baseUrl}cart/${productId}`, {
          withCredentials: true,
        });
        await reFetch();
        window.dispatchEvent(new Event("cart-updated"));
      } catch (err: any) {
        console.error("[Cart Delete Error]:", err);
        showToast(
          err?.response?.data?.message || "Unable to remove cart item",
          "error",
        );
      }
    } else {
      const updated = cartItems.filter((item) => item._id !== productId);
      setCartItems(updated);
      setLocalCart(updated);
      setIsEmpty(updated.length === 0);
      window.dispatchEvent(new Event("cart-updated"));
    }
  };

  // 6. Clear Entire Cart Operation
  const clearCart = async () => {
    console.log("[Cart Action]: Clearing all items");
    if (auth.username) {
      try {
        await axios.delete(`${baseUrl}cart/`, { withCredentials: true });
        await reFetch();
        window.dispatchEvent(new Event("cart-updated"));
      } catch (err: any) {
        console.error("[Cart Clear Error]:", err);
        showToast(
          err?.response?.data?.message || "Unable to clear cart",
          "error",
        );
      }
    } else {
      setCartItems([]);
      setLocalCart([]);
      setIsEmpty(true);
      window.dispatchEvent(new Event("cart-updated"));
    }
  };

  const proceedToCheckout = () => {
    if (cartItems.length === 0) {
      showToast("Add at least one item before checkout", "error");
      return;
    }
    router.push("/checkout");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 py-24">
        <div className="max-w-6xl mx-auto px-6 text-center text-slate-700">
          Loading cart...
        </div>
      </main>
    );
  }

  if (isEmpty) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-400 via-white to-white py-24">
        <div className="max-w-6xl mx-auto px-6 text-center rounded-3xl border border-slate-200 bg-white p-16 shadow-sm">
          <XCircle className="mx-auto mb-5 h-16 w-16 text-slate-400" />
          <h1 className="text-3xl font-black text-slate-900">
            Your cart is empty
          </h1>
          <p className="mt-4 text-slate-600">
            Add products to your cart from the product page, and they will be
            saved for you.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-8 inline-flex items-center gap-2 rounded-3xl bg-[#0856DF] px-6 py-3 text-white transition hover:bg-[#0645c8]"
          >
            <ShoppingCart size={18} /> Shop now
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-400 via-white to-white py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
              Your Cart
            </p>
            <h1 className="text-4xl font-black text-[#041241]">
              Shopping Cart
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={clearCart}
              className="rounded-3xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 flex items-center gap-2"
            >
              <Trash2 size={18} /> Clear Cart
            </button>
            <button
              onClick={proceedToCheckout}
              className="rounded-3xl bg-[#0856DF] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0645c8]"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>

        {syncError && (
          <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-700">
            {syncError}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1.5fr_0.85fr]">
          <div className="space-y-5">
            {cartItems.map((item) => (
              <div
                key={item._id}
                className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-6 lg:flex-row">
                  <img
                    src={item.images?.[0]?.url ?? "/carousel/Pens.avif"}
                    alt={item.name}
                    className="h-36 w-full rounded-3xl object-cover lg:h-40 lg:w-48"
                  />
                  <div className="flex-1">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-[#041241]">
                          {item.name}
                        </h2>
                        <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                          {item.description ?? "High quality product"}
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
                      </div>
                      <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                        Rs {item.price.toLocaleString()}
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="inline-flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                        <button
                          type="button"
                          onClick={() =>
                            updateCart(item._id, Math.max(1, item.quantity - 1))
                          }
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#041241] shadow-sm transition hover:bg-slate-100"
                        >
                          <Minus size={18} />
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() =>
                            updateCart(item._id, item.quantity + 1)
                          }
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#041241] shadow-sm transition hover:bg-slate-100"
                        >
                          <Plus size={18} />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                        <span>Stock: {item.stock ?? 0}</span>
                        <button
                          onClick={() => removeItem(item._id)}
                          className="inline-flex items-center gap-2 rounded-3xl bg-red-50 px-4 py-2 text-red-700 transition hover:bg-red-100"
                        >
                          <XCircle size={16} /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {relatedProducts.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-4 text-lg font-semibold text-[#041241]">
                  You may also like
                </h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {relatedProducts.map((p) => (
                    <div
                      key={p._id}
                      className="rounded-xl border border-slate-200 bg-white p-3 flex flex-col items-start"
                    >
                      <img
                        src={p.images?.[0]?.url ?? "/carousel/Pens.avif"}
                        alt={p.name}
                        className="h-28 w-full object-cover rounded-md mb-3"
                      />
                      <div className="flex-1 w-full">
                        <h4 className="text-sm font-semibold text-[#041241] line-clamp-2">
                          {p.name}
                        </h4>
                        <div className="mt-2 flex items-center justify-between w-full">
                          <span className="text-sm font-black">
                            Rs {p.price?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 w-full flex gap-2">
                        <button
                          onClick={() => addSuggestedToCart(p)}
                          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => buyNowSuggested(p)}
                          className="flex-1 rounded-lg bg-[#0856DF] px-3 py-2 text-sm font-semibold text-white hover:bg-[#0645c8]"
                        >
                          Buy Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm h-fit">
            <div className="space-y-5">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                  Order summary
                </p>
                <h2 className="mt-2 text-3xl font-black text-[#041241]">
                  Payment details
                </h2>
              </div>

              <div className="space-y-4 rounded-3xl bg-slate-50 p-5 text-slate-700">
                <div className="flex justify-between text-sm">
                  <span>Items</span>
                  <span>Rs {totals.itemsPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>Rs {totals.shippingPrice.toLocaleString()}</span>
                </div>
                <div className="border-t border-slate-200 pt-4 text-lg font-black text-[#041241] flex justify-between">
                  <span>Total</span>
                  <span>Rs {totals.totalPrice.toLocaleString()}</span>
                </div>
              </div>

              <div className="rounded-3xl bg-[#F7F7FA] p-5 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">Cash on Delivery</p>
                <p className="mt-2">
                  Your items will be reserved now. Pay only when the delivery
                  arrives.
                </p>
              </div>

              <button
                onClick={proceedToCheckout}
                className="w-full rounded-3xl bg-[#0856DF] px-6 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white transition hover:bg-[#0645c8]"
              >
                Checkout now
              </button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default CartPage;
