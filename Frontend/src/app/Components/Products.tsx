"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import useFetch, { baseUrl } from "../utils/commonFunctions";
import ProductCard from "./ProductCard";

interface ApiProduct {
  _id: string;
  name: string;
  description: string;
  price: number;
  brand?: string;
  stock?: number;
  category?: { name: string };
  images?: Array<{ url: string }>;
  averageRating?: number;
  originalPrice?: number;
  colors?: string[];
  sizes?: string[];
  addedBy?: string;
}

interface ProductsApiResponse {
  status: number;
  message: string;
  data: { products: ApiProduct[] };
}

const Products: React.FC = () => {
  const router = useRouter();
  const { data, loading, error } = useFetch<ProductsApiResponse>(
    `${baseUrl}product/getAllProducts?limit=10`,
  );

  const products = useMemo(() => data?.data?.products ?? [], [data]);

  if (error) {
    return (
      <section id="featured-products" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center text-sm text-gray-500">
            Unable to load products. Please refresh the page.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="featured-products" className="py-10 md:py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-2">
          <span className="h-px w-6 bg-[#00ADB5]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#00ADB5]">
            Featured Product
          </span>
          <span className="h-px flex-1 bg-gray-100" />
        </div>
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-black text-[#222831]">
            Our Featured <span className="text-[#00ADB5]">Products</span>
          </h2>
          <button
            onClick={() => router.push("/productsPage")}
            className="hidden md:flex items-center gap-1 text-xs font-bold text-[#00ADB5] hover:underline"
          >
            View All →
          </button>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-100 bg-white animate-pulse">
                <div className="aspect-square bg-gray-100 rounded-t-xl" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-5 bg-gray-100 rounded w-1/3" />
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="h-8 bg-gray-100 rounded-lg" />
                    <div className="h-8 bg-gray-100 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {products.slice(0, 10).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-sm text-gray-400">
            No featured products available at the moment.
          </div>
        )}

        {/* Mobile View All */}
        <div className="mt-6 text-center md:hidden">
          <button
            onClick={() => router.push("/productsPage")}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#00ADB5] hover:underline"
          >
            View All Products →
          </button>
        </div>
      </div>
    </section>
  );
};

export default Products;
