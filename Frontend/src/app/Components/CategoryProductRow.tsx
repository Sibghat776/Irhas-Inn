"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import axios from "axios";
import { ChevronLeft, ChevronRight, ShoppingBag, ShoppingCart, Star } from "lucide-react";
import { RootState } from "../Redux/store";
import useFetch, { baseUrl, getLocalCart, setLocalCart, showToast } from "../utils/commonFunctions";

interface ApiProduct {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock?: number;
  images?: Array<{ url: string }>;
  averageRating?: number;
  originalPrice?: number;
}

interface CategoryRowProps {
  categoryName: string;
  categorySlug: string;
  categoryImage: string;
  productCount?: number;
}

interface ProductsApiResponse {
  status: number;
  message: string;
  data: { products: ApiProduct[] };
}

const CategoryProductRow: React.FC<CategoryRowProps> = ({
  categoryName,
  categorySlug,
  categoryImage,
  productCount,
}) => {
  const router = useRouter();
  const auth = useSelector((state: RootState) => state.auth);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch all categories to find the real MongoDB ID
  const { data: catRes } = useFetch<any>(`${baseUrl}category/getAllCategories`);
  const [categoryId, setCategoryId] = useState<string | null>(null);

  useEffect(() => {
    if (catRes?.data) {
      const cats = Array.isArray(catRes.data) ? catRes.data : [];
      // Match by the categorySlug (e.g. "clothes" matches "Clothes")
      const matched = cats.find(
        (cat: any) => cat.name?.toLowerCase() === categorySlug.toLowerCase()
      );
      if (matched?._id) {
        setCategoryId(matched._id);
      }
    }
  }, [catRes, categorySlug]);

  // Only fetch products when we have a real category ID
  const { data } = useFetch<ProductsApiResponse>(
    categoryId ? `${baseUrl}product/getAllProducts?limit=8&category=${categoryId}` : ""
  );

  const products = useMemo(() => data?.data?.products ?? [], [data]);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.6;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  const doAddToCart = async (product: ApiProduct) => {
    if (auth.username) {
      try {
        await axios.post(
          `${baseUrl}cart`,
          { productId: product._id, quantity: 1 },
          { withCredentials: true }
        );
        showToast(`${product.name} added to cart`, "success");
        window.dispatchEvent(new Event("cart-updated"));
      } catch {
        showToast("Failed to add to cart", "error");
      }
      return;
    }
    const currentCart = getLocalCart() as Array<ApiProduct & { quantity: number }>;
    const existing = currentCart.find((i) => i._id === product._id);
    if (existing) existing.quantity += 1;
    else currentCart.push({ ...product, quantity: 1 });
    setLocalCart(currentCart);
    showToast(`${product.name} added to cart`, "success");
  };

  if (products.length === 0) return null;

  const viewAllLink = categoryId
    ? `/productsPage?category=${categoryId}`
    : `/productsPage`;

  return (
    <section className="py-10 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-[#C8A84E] rounded-full"></div>
            <h2 className="text-lg md:text-2xl font-black text-[#222831]">
              {categoryName}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-[#C8A84E] hover:text-[#C8A84E] transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-[#C8A84E] hover:text-[#C8A84E] transition-all"
            >
              <ChevronRight size={16} />
            </button>
            <Link
              href={viewAllLink}
              className="ml-2 text-xs font-bold text-[#C8A84E] hover:underline"
            >
              View All →
            </Link>
          </div>
        </div>

        <div className="flex gap-4">
          {/* Category Tile */}
          <Link
            href={viewAllLink}
            className="relative shrink-0 w-36 md:w-48 rounded-xl overflow-hidden group"
          >
            <img
              src={categoryImage || "/carousel/Clothes.jpg"}
              alt={categoryName}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="text-white text-xs font-bold uppercase tracking-wider mb-1">
                {productCount || products.length} Items
              </p>
              <h3 className="text-white font-black text-sm md:text-base leading-tight">
                {categoryName}
              </h3>
            </div>
          </Link>

          {/* Product Scroll */}
          <div
            ref={scrollRef}
            className="flex-1 flex gap-3 overflow-x-auto hide-scrollbar snap-x snap-mandatory pb-2"
          >
            {products.map((product) => {
              const origPrice = product.originalPrice || Math.round(product.price * 1.35);
              const discountPct = Math.round(((origPrice - product.price) / origPrice) * 100);
              const img = product.images?.[0]?.url || "/carousel/Clothes.jpg";

              return (
                <div
                  key={product._id}
                  onClick={() => router.push(`/product/${product._id}`)}
                  className="group/card relative w-36 md:w-44 shrink-0 snap-start cursor-pointer rounded-xl border border-gray-100 bg-white hover:shadow-md transition-all overflow-hidden"
                >
                  {/* Image */}
                  <div className="aspect-square bg-gray-50 relative overflow-hidden">
                    <img
                      src={img}
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-contain p-3 group-hover/card:scale-105 transition-transform duration-500"
                    />
                    {discountPct > 0 && (
                      <span className="absolute top-1 left-1 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                        -{discountPct}%
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-2.5">
                    <h4 className="text-xs font-bold text-[#222831] line-clamp-1 leading-tight">
                      {product.name}
                    </h4>
                    <div className="flex items-center gap-0.5 mt-1">
                      <Star size={10} className="fill-amber-400 text-amber-400" />
                      <span className="text-[9px] text-gray-500">
                        {product.averageRating?.toFixed(1) || "4.8"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1.5">
                      <p className="text-xs font-black text-[#222831]">
                        Rs {product.price.toLocaleString()}
                      </p>
                      {discountPct > 0 && (
                        <p className="text-[9px] text-gray-400 line-through">
                          Rs {origPrice.toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-1 mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          doAddToCart(product);
                        }}
                        className="flex items-center justify-center gap-1 bg-[#C8A84E] text-white text-[9px] font-bold py-1.5 rounded-md hover:bg-[#B8943F] transition-colors"
                      >
                        <ShoppingCart size={10} />
                        Cart
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          doAddToCart(product).then(() => router.push("/checkout"));
                        }}
                        className="flex items-center justify-center gap-1 border border-gray-200 text-[#222831] text-[9px] font-bold py-1.5 rounded-md hover:border-[#C8A84E] hover:text-[#C8A84E] transition-colors"
                      >
                        <ShoppingBag size={10} />
                        Buy
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategoryProductRow;
