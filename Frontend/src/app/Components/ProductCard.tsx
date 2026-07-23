"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  baseUrl,
  getLocalCart,
  setLocalCart,
  showToast,
} from "../utils/commonFunctions";
import { RootState } from "../Redux/store";
import { ShoppingBag, ShoppingCart, Star, Eye } from "lucide-react";

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

export default function ProductCard({ product }: { product: ApiProduct }) {
  const router = useRouter();
  const auth = useSelector((state: RootState) => state.auth);

  const categoryName =
    typeof product.category === "string"
      ? product.category
      : product.category?.name ?? "Best Seller";

  const imageUrl = product.images?.[0]?.url || "/carousel/Clothes.jpg";
  const originalPrice = product.originalPrice || Math.round(product.price * 1.4);
  const discountPct = Math.round(((originalPrice - product.price) / originalPrice) * 100);
  const inStock = !!product.stock && product.stock > 0;

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
    if (existing) existing.quantity += 1;
    else currentCart.push({ ...product, quantity: 1 } as ApiProduct & { quantity: number });
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
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/product/${product._id}`)}
      onKeyDown={(event) => {
        if (event.key === "Enter") router.push(`/product/${product._id}`);
      }}
      className="group flex flex-col cursor-pointer rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden"
    >
      {/* Image Container */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        <img
          src={imageUrl}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-700"
        />

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/0 via-transparent to-transparent group-hover:from-black/10 transition-all duration-500" />

        {/* Quick view overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="bg-white/90 backdrop-blur-sm text-[#222831] text-[10px] font-bold px-3 py-2 rounded-full shadow-md flex items-center gap-1.5 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <Eye size={12} />
            Quick View
          </span>
        </div>

        {/* Sale Ribbon */}
        {discountPct > 0 && (
          <div className="absolute top-0 left-0 z-10">
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white text-[9px] font-bold px-2.5 py-1 rounded-br-lg shadow-sm">
              -{discountPct}% SALE
            </div>
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-2 right-2 z-10 opacity-90 group-hover:opacity-100 transition-opacity">
          <span className="bg-white/90 backdrop-blur-sm text-[9px] font-bold text-[#222831] px-2 py-0.5 rounded-full shadow-sm">
            {categoryName}
          </span>
        </div>

        {/* Out of Stock Overlay */}
        {!inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <span className="bg-white text-[10px] font-bold px-4 py-2 rounded-full shadow-lg">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-3.5 flex flex-col gap-1.5 flex-1">
        <h3 className="text-sm font-bold text-[#222831] line-clamp-1 leading-tight group-hover:text-[#C8A84E] transition-colors">
          {product.name}
        </h3>

        {/* Star Rating */}
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={11}
              className={
                star <= Math.round(product.averageRating || 4)
                  ? "fill-amber-400 text-amber-400"
                  : "text-gray-200"
              }
            />
          ))}
          <span className="text-[10px] text-gray-400 ml-1">
            ({product.averageRating?.toFixed(1) || "4.8"})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-end gap-1.5 mt-auto">
          <p className="text-base font-black text-[#222831]">
            Rs {product.price.toLocaleString()}
          </p>
          {discountPct > 0 && (
            <p className="text-[11px] text-gray-400 line-through mb-0.5">
              Rs {originalPrice.toLocaleString()}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-1.5 mt-2">
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={!inStock}
            className="flex items-center justify-center gap-1 bg-[#C8A84E] hover:bg-[#B8943F] active:bg-[#A8882E] text-white text-[10px] font-bold py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]"
          >
            <ShoppingBag size={12} />
            Buy
          </button>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!inStock}
            className="flex items-center justify-center gap-1 border border-gray-200 text-[#222831] text-[10px] font-bold py-2 rounded-lg hover:border-[#C8A84E] hover:text-[#C8A84E] hover:bg-[#C8A84E]/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]"
          >
            <ShoppingCart size={12} />
            Cart
          </button>
        </div>
      </div>
    </div>
  );
}
