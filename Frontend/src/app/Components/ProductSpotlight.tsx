"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star, ShoppingBag } from "lucide-react";
import useFetch, { baseUrl } from "../utils/commonFunctions";

interface ApiProduct {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  stock?: number;
  images?: Array<{ url: string }>;
  averageRating?: number;
  category?: { name: string };
}

interface ProductsApiResponse {
  status: number;
  message: string;
  data: { products: ApiProduct[] };
}

const ProductSpotlight: React.FC = () => {
  const { data, loading } = useFetch<ProductsApiResponse>(
    `${baseUrl}product/getAllProducts?limit=10&sort=rating`
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  const products = useMemo(() => data?.data?.products ?? [], [data]);

  // Pick top-rated products with high discounts
  const spotlightProducts = useMemo(() => {
    return products
      .filter((p) => p.stock && p.stock > 0)
      .slice(0, 5);
  }, [products]);

  const product = spotlightProducts[currentIndex];
  const hasMultiple = spotlightProducts.length > 1;

  const goNext = () => {
    if (currentIndex < spotlightProducts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(spotlightProducts.length - 1);
    }
  };

  if (loading) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse h-96 rounded-2xl bg-gray-100" />
        </div>
      </section>
    );
  }

  if (!product) return null;

  const originalPrice = product.originalPrice || Math.round(product.price * 1.35);
  const discountPct = Math.round(((originalPrice - product.price) / originalPrice) * 100);
  const imageUrl = product.images?.[0]?.url || "/carousel/Clothes.jpg";
  const shortDesc = product.description
    ? product.description.split(".").slice(0, 2).join(".") + "."
    : "";

  const features = [
    "Premium quality fabric",
    "Custom design available",
    "Free shipping on orders over Rs. 2000",
    "Easy 7-day return policy",
  ];

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Label */}
        <div className="flex items-center gap-3 mb-8">
          <span className="h-px w-8 bg-[#C8A84E]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C8A84E]">
            Featured Spotlight
          </span>
          <span className="h-px flex-1 bg-gray-100" />
        </div>

        <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Navigation Arrows */}
          {hasMultiple && (
            <>
              <button
                onClick={goPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 shadow-md flex items-center justify-center text-[#222831] hover:bg-[#C8A84E] hover:text-white transition-all"
                aria-label="Previous"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={goNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 shadow-md flex items-center justify-center text-[#222831] hover:bg-[#C8A84E] hover:text-white transition-all"
                aria-label="Next"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Left - Image */}
            <div className="relative aspect-square md:aspect-auto md:h-full min-h-[300px] bg-gray-50">
              <img
                src={imageUrl}
                alt={product.name}
                className="absolute inset-0 w-full h-full object-contain p-8"
              />
              {discountPct > 0 && (
                <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                  -{discountPct}% OFF
                </span>
              )}
              {/* Dots */}
              {hasMultiple && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {spotlightProducts.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === currentIndex ? "bg-[#C8A84E] w-5" : "bg-gray-300"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right - Details */}
            <div className="p-6 md:p-10 flex flex-col justify-center">
              <p className="text-xs font-bold uppercase tracking-wider text-[#C8A84E] mb-2">
                {product.category?.name || "Featured Product"}
              </p>
              <h2 className="text-2xl md:text-3xl font-black text-[#222831] leading-tight mb-3">
                {product.name}
              </h2>
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    className={
                      star <= Math.round(product.averageRating || 4)
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-300"
                    }
                  />
                ))}
                <span className="text-xs text-gray-500 ml-1">
                  ({product.averageRating?.toFixed(1) || "4.8"})
                </span>
              </div>

              {/* Features */}
              <ul className="space-y-2 mb-5">
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8A84E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              {/* Price */}
              <div className="flex items-end gap-3 mb-6">
                <p className="text-3xl font-black text-[#222831]">
                  Rs {product.price.toLocaleString()}
                </p>
                {discountPct > 0 && (
                  <p className="text-lg text-gray-400 line-through mb-0.5">
                    Rs {originalPrice.toLocaleString()}
                  </p>
                )}
                {discountPct > 0 && (
                  <span className="text-sm font-bold text-red-500 mb-0.5">
                    Save {discountPct}%
                  </span>
                )}
              </div>

              <Link
                href={`/product/${product._id}`}
                className="inline-flex items-center justify-center gap-2 bg-[#C8A84E] hover:bg-[#B8943F] text-white font-bold px-8 py-3.5 rounded-xl transition-all active:scale-[0.98] w-full md:w-auto"
              >
                <ShoppingBag size={18} />
                Buy Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductSpotlight;
