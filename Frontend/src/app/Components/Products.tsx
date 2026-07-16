"use client";

import axios from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import useFetch, {
  baseUrl,
  getLocalCart,
  setLocalCart,
  showToast,
} from "../utils/commonFunctions";
import { RootState } from "../Redux/store";
import { ArrowLeft, ArrowRight, ShoppingCart, ShoppingBag, Star, Truck } from "lucide-react";

interface ApiProduct {
  _id: string;
  name: string;
  description: string;
  price: number;
  brand?: string;
  stock?: number;
  category?: {
    name: string;
  };
  images?: Array<{
    url: string;
  }>;
  averageRating?: number;
}

interface ProductsApiResponse {
  status: number;
  message: string;
  data: {
    products: ApiProduct[];
  };
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

const Products: React.FC = () => {
  const router = useRouter();
  const sliderRef = useRef<HTMLDivElement | null>(null);

  const auth = useSelector((state: RootState) => state.auth);
  const { data, loading, error } = useFetch<ProductsApiResponse>(
    `${baseUrl}product/getAllProducts?limit=10`,
  );

  const products = useMemo(
    () => data?.data?.products ?? [],
    [data],
  );

  const handleScroll = (direction: "left" | "right") => {
    if (!sliderRef.current) return;
    const width = sliderRef.current.clientWidth * 0.8;
    sliderRef.current.scrollBy({
      left: direction === "left" ? -width : width,
      behavior: "smooth",
    });
  };

  const handleAddToCart = async (product: ApiProduct) => {
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
        console.error(err);
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

  const handleBuyNow = async (event: any, product: ApiProduct) => {
    event.stopPropagation();
    await handleAddToCart(product);
    router.push("/checkout");
  };

  const defaultProducts = Array.from({ length: 5 }, (_, index) => (
    <div
      key={`placeholder-${index}`}
      className="snap-start min-w-[300px] sm:min-w-[320px] lg:min-w-[360px] rounded-[28px] border border-slate-200/70 bg-white p-5 shadow-lg shadow-slate-200/30"
    >
      <div className="h-64 rounded-3xl bg-slate-100 animate-pulse" />
      <div className="mt-5 space-y-3">
        <div className="h-4 w-3/4 rounded-full bg-slate-200 animate-pulse" />
        <div className="h-4 w-1/2 rounded-full bg-slate-200 animate-pulse" />
        <div className="h-3 w-full rounded-full bg-slate-200 animate-pulse" />
        <div className="h-3 w-full rounded-full bg-slate-200 animate-pulse" />
      </div>
    </div>
  ));

  return (
    <section id="featured-products" className="py-20 bg-[#F7F7FA] text-[#041241]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-8">
          <div className="max-w-2xl space-y-3">
            <p className="text-[#EDAE17] text-xs font-black uppercase tracking-[0.4em]">
              Featured Picks
            </p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              Top Trending Products With Direct Buy & Cart Actions
            </h2>
            <p className="text-sm text-slate-600">
              Smooth sliding product cards with quick Buy Now and Add to Cart behavior.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleScroll("left")}
              type="button"
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#041241] shadow-sm transition hover:bg-[#0856DF] hover:text-white"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              onClick={() => handleScroll("right")}
              type="button"
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#041241] shadow-sm transition hover:bg-[#0856DF] hover:text-white"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-8 rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            Unable to load products. Please login or refresh the page.
          </div>
        )}

        <div
          ref={sliderRef}
          className="flex gap-6 overflow-x-auto pb-3 scroll-smooth snap-x snap-mandatory hide-scrollbar"
        >
          {loading
            ? defaultProducts
            : products.length > 0
            ? products.slice(0, 10).map((product) => (
                <div
                  key={product._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/product/${product._id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      router.push(`/product/${product._id}`);
                    }
                  }}
                  className="snap-start min-w-[300px] sm:min-w-[320px] lg:min-w-[360px] cursor-pointer overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(6,18,75,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_90px_rgba(6,18,75,0.16)]"
                >
                  <ProductCardImageCarousel
                    images={product.images}
                    label={product.category?.name ?? "Best Seller"}
                  />

                  <div className="space-y-4 p-5 text-[#041241]">
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
                      <h3 className="text-xl font-black leading-tight">
                        {product.name}
                      </h3>
                      <p className="text-sm leading-6 text-slate-600 line-clamp-3">
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
                          <p className="pb-1 text-sm font-medium text-slate-400 line-through">
                            Rs {Math.round(product.price * 1.4).toLocaleString()}
                          </p>
                        </div>
                        <span className="mt-1 inline-block rounded-full bg-[#0856DF]/10 px-2 py-0.5 text-[10px] font-semibold text-[#0856DF]">
                          Save 40%
                        </span>
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
                      onClick={(event) => handleBuyNow(event, product)}
                      className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-[#0856DF] px-4 text-sm font-semibold text-white transition hover:bg-[#0645c8]"
                    >
                      <ShoppingBag size={18} />
                      <span className="ml-2">Buy Now</span>
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleAddToCart(product);
                      }}
                      className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#041241] transition hover:border-[#0856DF] hover:bg-[#f3f8ff]"
                    >
                      <ShoppingCart size={18} />
                      <span className="ml-2">Add to Cart</span>
                    </button>
                  </div>
                </div>
              ))
            : (
              <div className="min-w-full rounded-[32px] border border-dashed border-slate-300 bg-white/70 p-10 text-center text-slate-500">
                No products found right now.
              </div>
            )}
        </div>
      </div>
    </section>
  );
};

export default Products;
