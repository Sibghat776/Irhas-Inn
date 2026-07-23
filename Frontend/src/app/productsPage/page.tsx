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
import { Truck } from "lucide-react";

import Contact from "../Components/Contact";
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
    () => (images && images.length > 0 ? images : [{ url: "/carousel/Clothes.jpg" }]),
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
    <div className="relative h-36 overflow-hidden bg-[#FFFFFF] p-2 sm:h-44 md:h-56 lg:h-64">
      {normalizedImages.map((image, index) => (
        <img
          key={`${image.url}-${index}`}
          src={image.url}
          alt={`${label} ${index + 1}`}
          className={`absolute inset-0 h-full w-full object-contain p-2 transition-opacity duration-700 ease-out ${index === currentIndex ? "opacity-100" : "opacity-0"
            }`}
        />
      ))}
      <div className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-semibold text-[#222831] shadow-sm sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[10px]">
        {label}
      </div>
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1 sm:bottom-3 sm:gap-1.5">
        {normalizedImages.map((_, dotIndex) => (
          <span
            key={dotIndex}
            className={`h-1.5 w-1.5 rounded-full transition-all duration-300 sm:h-2 sm:w-2 ${dotIndex === currentIndex ? "bg-white" : "bg-white/50"
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
        window.dispatchEvent(new Event("cart-updated"));
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
      <section className="min-h-screen bg-gradient-to-b from-[#FFFFFF] via-white to-white py-10 pt-24 sm:py-16 sm:pt-28">
        <div className="mx-auto max-w-7xl px-3 sm:px-6">
          <div className="mb-8 space-y-1.5 text-center sm:mb-16 sm:space-y-3">
            <span className="inline-block text-[9px] font-black uppercase tracking-[0.25em] text-[#EEEEEE] sm:text-xs sm:tracking-[0.3em]">
              {categoryName ? "Category" : "All Products"}
            </span>
            <h1 className="text-xl font-black tracking-tight text-[#222831] sm:text-3xl md:text-5xl">
              {categoryName || title}
            </h1>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-8 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-[#EEEEEE] bg-white shadow-lg sm:rounded-[32px]">
                  <div className="h-36 animate-pulse bg-[#FFFFFF] sm:h-56" />
                  <div className="space-y-2 p-3 sm:space-y-3 sm:p-5">
                    <div className="h-3 w-3/4 rounded-full bg-[#FFFFFF] animate-pulse sm:h-4" />
                    <div className="h-3 w-1/2 rounded-full bg-[#FFFFFF] animate-pulse sm:h-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center sm:py-20">
              <p className="text-sm text-[#222831] sm:text-lg">No products available in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-8 md:grid-cols-3 lg:grid-cols-4">
              {products.map((prod) => {
                const prodAny = prod as any;
                return (
                  <div
                    key={prod._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/product/${prod._id}`)}
                    onKeyDown={(e) => { if (e.key === "Enter") router.push(`/product/${prod._id}`); }}
                    className="cursor-pointer overflow-hidden rounded-2xl border border-[#EEEEEE] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.14)] sm:rounded-[32px] sm:shadow-[0_20px_60px_rgba(0,0,0,0.08)] sm:hover:shadow-[0_30px_90px_rgba(0,0,0,0.16)]"
                  >
                    <ProductCardImageCarousel
                      images={prod.images}
                      label={prodAny.category?.name ?? "Product"}
                    />

                    <div className="space-y-2 p-3 text-[#222831] sm:space-y-4 sm:p-5">
                      <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px] sm:gap-3 sm:text-sm">
                        <span className="inline-flex items-center rounded-full border border-[#00ADB5]/20 bg-[#00ADB5]/10 px-2 py-0.5 font-semibold text-[#222831] sm:px-3 sm:py-1">
                          {prodAny.brand ?? "Irhas'Inn"}
                        </span>
                        <span className="hidden text-[10px] text-[#222831] sm:inline-block sm:text-xs">
                          {prodAny.stock > 0 ? `${prodAny.stock} in stock` : "Out of stock"}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#EEEEEE] bg-[#FFFFFF] px-1.5 py-0.5 text-[8px] font-semibold text-[#222831] sm:px-2 sm:text-[10px]">
                          <Truck size={10} className="sm:hidden" />
                          <Truck size={12} className="hidden sm:block" />
                          <span className="hidden sm:inline">Free Shipping</span>
                          <span className="sm:hidden">Free</span>
                        </span>
                      </div>
                      <div className="space-y-0.5 sm:space-y-1">
                        <h3 className="line-clamp-1 text-sm font-black leading-tight sm:text-xl">{prod.name}</h3>
                        <p className="line-clamp-2 text-xs text-[#222831] sm:line-clamp-3 sm:text-sm">{prod.description}</p>
                      </div>
                      <div>
                        <div className="flex items-end gap-1.5 sm:gap-2">
                          <p className="text-base font-black text-[#222831] sm:text-2xl">
                            Rs {prod.price.toLocaleString()}
                          </p>
                          <p className="pb-0.5 text-[11px] font-medium text-[#222831] line-through sm:pb-1 sm:text-sm">
                            Rs {Math.round(prod.price * 1.4).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-1.5 border-t border-[#EEEEEE] bg-[#FFFFFF] p-3 sm:gap-3 sm:p-5">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); buyNow(prod); }}
                        className="inline-flex min-h-[36px] items-center justify-center rounded-xl bg-[#00ADB5] px-3 text-xs font-semibold text-white transition hover:bg-[#00ADB5] sm:min-h-[48px] sm:rounded-2xl sm:px-4 sm:text-sm"
                      >
                        Buy Now
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); addToCart(prod); }}
                        className="inline-flex min-h-[36px] items-center justify-center rounded-xl border border-[#EEEEEE] bg-white px-3 text-xs font-semibold text-[#222831] transition hover:border-[#00ADB5] hover:bg-[#FFFFFF] sm:min-h-[48px] sm:rounded-2xl sm:px-4 sm:text-sm"
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
