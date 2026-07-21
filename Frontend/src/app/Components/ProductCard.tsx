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
import { ShoppingBag, ShoppingCart, Star } from "lucide-react";

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
  colors?: string[];
  sizes?: string[];
  addedBy?: string;
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
    <div className="relative h-72 overflow-hidden bg-[#FFFFFF] p-4">
      {normalizedImages.map((image, index) => (
        <img
          key={`${image.url}-${index}`}
          src={image.url}
          alt={`${label} ${index + 1}`}
          className={`absolute inset-0 h-full w-full object-contain p-4 transition duration-700 ease-out group-hover:scale-[1.015] ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute left-4 top-4 rounded-full border border-[#EEEEEE] bg-white/95 px-3 py-1 text-[11px] font-semibold text-[#222831] shadow-sm">
        {label}
      </div>
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {normalizedImages.map((_, dotIndex) => (
          <span
            key={dotIndex}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              dotIndex === currentIndex ? "w-5 bg-white" : "w-2 bg-white/55"
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
          {
            productId: product._id,
            quantity: 1,
          },
          { withCredentials: true },
        );
        showToast(`${product.name} added to cart`, "success");
        window.dispatchEvent(new Event("cart-updated"));
        return true;
      } catch (err: any) {
        showToast(
          err?.response?.data?.message || "Failed to add product to cart",
          "error",
        );
        return false;
      }
    }

    const currentCart = getLocalCart() as Array<ApiProduct & { quantity: number }>;
    const existing = currentCart.find((item) => item._id === product._id);

    if (existing) {
      existing.quantity += 1;
    } else {
      currentCart.push({
        ...product,
        quantity: 1,
      } as ApiProduct & { quantity: number });
    }

    setLocalCart(currentCart);
    showToast(`${product.name} added to cart`, "success");
    return true;
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const added = await handleAddToCart(e);
    if (added) router.push("/checkout");
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
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[24px] border border-[#EEEEEE] bg-white shadow-[0_14px_40px_rgba(34,40,49,0.06)] transition duration-300 hover:-translate-y-1 hover:border-[#00ADB5]/35 hover:shadow-[0_22px_60px_rgba(34,40,49,0.10)]"
    >
      <ProductCardImageCarousel images={product.images} label={categoryName} />

      <div className="flex-1 space-y-4 p-5 text-[#222831]">
        <div className="flex items-center justify-between gap-3 text-sm text-[#222831]">
          <span className="truncate text-[11px] font-bold uppercase tracking-[0.18em] text-[#222831]/70">
            {product.brand ?? "ZeeF"}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-[#EEEEEE] bg-[#FFFFFF] px-2.5 py-1 text-xs font-semibold text-[#222831]">
            <Star size={13} className="fill-[#00ADB5] text-[#00ADB5]" />
            {product.averageRating?.toFixed(1) ?? "4.8"}
          </span>
        </div>
        <div className="space-y-2.5">
          <h3 className="line-clamp-2 min-h-[3.25rem] text-xl font-black leading-tight text-[#222831]">
            {product.name}
          </h3>
          <p className="line-clamp-2 min-h-[3rem] whitespace-pre-wrap break-words text-sm leading-6 text-[#222831]/70">
            {product.description}
          </p>
        </div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#222831]/45">
              Price
            </p>
            <div className="flex items-end gap-2">
              <p className="text-2xl font-black text-[#222831]">
                Rs {product.price.toLocaleString()}
              </p>
              {(product.originalPrice ?? Math.round(product.price * 1.4)) >
                product.price && (
                <p className="pb-1 text-sm font-medium text-[#222831]/35 line-through">
                  Rs{" "}
                  {(
                    product.originalPrice ?? Math.round(product.price * 1.4)
                  ).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <div className="rounded-full border border-[#EEEEEE] px-3 py-1 text-right text-xs font-semibold text-[#222831]/70">
            {product.stock && product.stock > 0 ? "In stock" : "Out of stock"}
          </div>
        </div>
      </div>

      <div className="grid gap-3 border-t border-[#EEEEEE] bg-[#FFFFFF] p-5">
        <button
          type="button"
          onClick={handleBuyNow}
          className="inline-flex min-h-[46px] items-center justify-center rounded-2xl bg-[#00ADB5] px-4 text-sm font-bold text-white transition hover:bg-[#0099a1]"
        >
          <ShoppingBag size={18} />
          <span className="ml-2">Buy Now</span>
        </button>
        <button
          type="button"
          onClick={handleAddToCart}
          className="inline-flex min-h-[46px] items-center justify-center rounded-2xl border border-[#EEEEEE] bg-white px-4 text-sm font-semibold text-[#222831] transition hover:border-[#00ADB5] hover:text-[#00ADB5]"
        >
          <ShoppingCart size={18} />
          <span className="ml-2">Add to Cart</span>
        </button>
      </div>
    </div>
  );
}
