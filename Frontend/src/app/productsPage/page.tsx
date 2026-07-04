"use client";

import React, { memo, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "../Redux/store";
import {
  getLocalCart,
  setLocalCart,
  showToast,
} from "../utils/commonFunctions";
import axios from "axios";

import Navbar from "../Components/Navbar";
import Contact from "../Components/Contact";
import Footer from "../Components/Footer";
import useFetch, { baseUrl } from "../utils/commonFunctions";

interface Product {
  _id: string;
  name: string;
  price: number;
  description: string;
  images?: Array<{ url: string }>;
  slug: string;
}

interface ProductsPageProps {
  title?: string;
}

const ProductCardImageCarousel: React.FC<{
  images?: Array<{ url: string }>;
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
    <div className="relative h-72 overflow-hidden">
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
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

const ProductsPage: React.FC<ProductsPageProps> = ({
  title = "Our Premium Products",
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryFilter = searchParams.get("category");
  const auth = useSelector((state: RootState) => state.auth);

  const { data: prodRes, loading } = useFetch<any>(
    `${baseUrl}product/getAllProducts${categoryFilter ? `?category=${categoryFilter}` : ""}`,
  );
  const { data: catRes } = useFetch<any>(
    categoryFilter ? `${baseUrl}category/getAllCategories` : "",
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [categoryName, setCategoryName] = useState("");

  useEffect(() => {
    if (prodRes?.data) {
      const list = Array.isArray(prodRes.data)
        ? prodRes.data
        : prodRes.data.products ?? [];
      setProducts(Array.isArray(list) ? list : []);
    }
  }, [prodRes]);

  useEffect(() => {
    if (catRes?.data && categoryFilter) {
      const cats = Array.isArray(catRes.data) ? catRes.data : [];
      const found = cats.find((c: any) => c._id === categoryFilter);
      if (found) setCategoryName(found.name);
    }
  }, [catRes, categoryFilter]);

  const addToCart = async (product: Product) => {
    const productId = product._id;
    if (!productId) return showToast("Invalid product", "error");
    const prodAny = product as any;
    if (prodAny.stock !== undefined && prodAny.stock <= 0)
      return showToast("Product is out of stock", "error");

    if (auth.username) {
      try {
        await axios.post(
          `${baseUrl}cart/`,
          { productId, quantity: 1 },
          { withCredentials: true },
        );
        showToast("Added to cart", "success");
      } catch (err: any) {
        console.error("Add to cart error", err);
        showToast(err?.response?.data?.message || "Failed to add to cart", "error");
      }
    } else {
      const local = getLocalCart();
      const exists = local.find((i: any) => (i._id || i.id) === productId);
      if (exists) {
        const newQty = (exists.quantity || 1) + 1;
        if (prodAny.stock !== undefined && newQty > prodAny.stock)
          return showToast(`Only ${prodAny.stock} items available`, "error");
        exists.quantity = newQty;
      } else {
        if (prodAny.stock !== undefined && 1 > prodAny.stock)
          return showToast(`Only ${prodAny.stock} items available`, "error");
        local.push({ ...product, _id: productId, quantity: 1 });
      }
      setLocalCart(local);
      showToast("Added to cart", "success");
    }
  };

  const buyNow = async (product: Product) => {
    await addToCart(product);
    router.push("/checkout");
  };

  return (
    <>
      <Navbar />

      <section className="py-20 pt-28 bg-gradient-to-b from-gray-400 via-white to-white min-h-screen">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-3">
            <span className="text-[#EDAE17] text-xs font-black uppercase tracking-[0.3em] inline-block">
              {categoryName ? "Category" : "All Products"}
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-[#041241] tracking-tight">
              {categoryName || title}
            </h1>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-[32px] border border-slate-200 bg-white shadow-lg overflow-hidden">
                  <div className="h-72 bg-slate-100 animate-pulse" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 w-3/4 rounded-full bg-slate-200 animate-pulse" />
                    <div className="h-4 w-1/2 rounded-full bg-slate-200 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-500 text-lg">No products available in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {products.map((prod) => {
                const prodAny = prod as any;
                return (
                  <div
                    key={prod._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/product/${prod._id}`)}
                    onKeyDown={(e) => { if (e.key === "Enter") router.push(`/product/${prod._id}`); }}
                    className="cursor-pointer overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(6,18,75,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_90px_rgba(6,18,75,0.16)]"
                  >
                    <ProductCardImageCarousel
                      images={prod.images}
                      label={prodAny.category?.name ?? "Product"}
                    />

                    <div className="space-y-4 p-5 text-[#041241]">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="inline-flex items-center rounded-full border border-[#0856DF]/20 bg-[#0856DF]/10 px-3 py-1 font-semibold text-[#0856DF]">
                          {prodAny.brand ?? "ZeeF"}
                        </span>
                        <span className="text-slate-500 text-xs">
                          {prodAny.stock > 0 ? `${prodAny.stock} in stock` : "Out of stock"}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-black leading-tight">{prod.name}</h3>
                        <p className="text-sm text-slate-600 line-clamp-3">{prod.description}</p>
                      </div>
                      <p className="text-2xl font-black text-[#041241]">
                        Rs {prod.price.toLocaleString()}
                      </p>
                    </div>

                    <div className="grid gap-3 border-t border-slate-200/70 bg-[#F7F7FA] p-5">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); buyNow(prod); }}
                        className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-[#0856DF] px-4 text-sm font-semibold text-white transition hover:bg-[#0645c8]"
                      >
                        Buy Now
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); addToCart(prod); }}
                        className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#041241] transition hover:border-[#0856DF] hover:bg-[#f3f8ff]"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Contact />
      <Footer />
    </>
  );
};

function ProductsPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductsPage />
    </Suspense>
  );
}

export default memo(ProductsPageWrapper);
