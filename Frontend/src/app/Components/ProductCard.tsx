"use client";

import axios from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  baseUrl,
  getLocalCart,
  setLocalCart,
  showToast,
} from "../utils/commonFunctions";
import { RootState } from "../Redux/store";
import { ShoppingBag, ShoppingCart, Star, Truck } from "lucide-react";

interface ApiProduct {
  _id: string;
  name: string;
  description?: string;
  price: number;
  brand?: string;
  stock?: number;
  category?: { name: string } | string;
  images?: Array<{ url: string }>;
  averageRating?: number;
  originalPrice?: number;
}

const ProductCardImageCarousel: React.FC<{
  images: ApiProduct["images"];
  label: string;
}> = ({ images, label }) => {
  const normalizedImages = useMemo(
    () => (images && images.length > 0 ? images : [{ url: "/carousel/Pens.avif" }]),
    [images],
  );

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [normalizedImages]);

  useEffect(() => {
    if (normalizedImages.length <= 1) return;
    const interval = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % normalizedImages.length);
    }, 3500);
    return () => window.clearInterval(interval);
  }, [normalizedImages.length]);

  return (
    <div className="relative h-72 overflow-hidden bg-slate-100">
      {normalizedImages.map((image, index) => (
        <img
          key={`${image.url}-${index}`}
          src={image.url}
          alt={`${label} ${index + 1}`}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#041241] shadow-sm">
        {label}
      </div>
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {normalizedImages.map((_, dotIndex) => (
          <span
            key={dotIndex}
            className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
              dotIndex === currentIndex ? "bg-white" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default function ProductCard({ product }: { product: ApiProduct }) {
  const router = useRouter();
  const auth = useSelector((state: RootState) => state.auth);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const categoryName =
    typeof product.category === "string"
      ? product.category
      : product.category?.name ?? "Best Seller";

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window === "undefined") return;

    if (auth.username) {
      try {
        await axios.post(
          `${baseUrl}cart`,
          { productId: product._id, quantity: 1 },
          { withCredentials: true },
        );
        showToast(`${product.name} added to cart`, "success");
        window.dispatchEvent(new Event("cart-updated"));
        return;
      } catch (err: any) {
        showToast(
          err?.response?.data?.message || "Failed to add product to cart",
          "error",
        );
        return;
      }
    }

    const currentCart = getLocalCart() as Array<ApiProduct & { quantity: number }>;
    const existing = currentCart.find((item) => item._id === product._id);

    if (existing) {
      existing.quantity += 1;
    } else {
      currentCart.push({ ...product, quantity: 1 });
    }

    setLocalCart(currentCart);
    showToast(`${product.name} added to cart`, "success");
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await handleAddToCart(e);
    router.push("/checkout");
  };

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/product/${product._id}`)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          router.push(`/product/${product._id}`);
        }
      }}
      className="flex h-full cursor-pointer flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(6,18,75,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_90px_rgba(6,18,75,0.16)]"
    >
      <ProductCardImageCarousel images={product.images} label={categoryName} />

      <div className="flex-1 space-y-4 p-5 text-[#041241]">
        <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#0856DF]/20 bg-[#0856DF]/10 px-3 py-1 font-semibold text-[#0856DF]">
            {product.brand ?? "ZeeF"}
          </span>
          <span className="inline-flex items-center gap-1 text-amber-500">
            <Star size={14} />
            {product.averageRating?.toFixed(1) ?? "4.8"}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
            <Truck size={12} />
            Free Shipping
          </span>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black leading-tight">{product.name}</h3>
          <p className="text-sm leading-6 text-slate-600 line-clamp-3 whitespace-pre-wrap break-words">
            {product.description}
          </p>
        </div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Price
            </p>
            <div className="flex items-end gap-2">
              <p className="text-2xl font-black text-[#041241]">
                Rs {product.price.toLocaleString()}
              </p>
              {(product.originalPrice ?? Math.round(product.price * 1.4)) >
                product.price && (
                <p className="pb-1 text-sm font-medium text-slate-400 line-through">
                  Rs{" "}
                  {(
                    product.originalPrice ?? Math.round(product.price * 1.4)
                  ).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p>{product.stock ?? 0} in stock</p>
            <p>{product.stock && product.stock > 0 ? "Ready to ship" : "Out of stock"}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 border-t border-slate-200/70 bg-[#F7F7FA] p-5">
        <button
          type="button"
          onClick={handleBuyNow}
          className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-[#0856DF] px-4 text-sm font-semibold text-white transition hover:bg-[#0645c8]"
        >
          <ShoppingBag size={18} />
          <span className="ml-2">Buy Now</span>
        </button>
        <button
          type="button"
          onClick={handleAddToCart}
          className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#041241] transition hover:border-[#0856DF] hover:bg-[#f3f8ff]"
        >
          <ShoppingCart size={18} />
          <span className="ml-2">Add to Cart</span>
        </button>
      </div>
    </div>
  );
}
