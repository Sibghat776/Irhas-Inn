"use client";

import axios from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { ArrowLeft, ArrowRight, ShoppingBag, ShoppingCart, Star, Sparkles } from "lucide-react";
import { RootState } from "../Redux/store";
import useFetch, {
  baseUrl,
  getLocalCart,
  setLocalCart,
  showToast,
} from "../utils/commonFunctions";

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
  colors?: string[];
  sizes?: string[];
  addedBy?: string;
}

interface ProductsApiResponse {
  status: number;
  message: string;
  data: { products: ApiProduct[] };
}

const ProductCardImageCarousel: React.FC<{
  images: ApiProduct["images"];
  label: string;
  rating?: number;
  discountPct: number;
}> = ({ images, label, rating, discountPct }) => {
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
    <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-[#F1F2F4]">
      {normalizedImages.map((image, index) => (
        <img
          key={`${image.url}-${index}`}
          src={image.url}
          alt={`${label} ${index + 1}`}
          className={`absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.08] ${index === currentIndex ? "opacity-100" : "opacity-0"
            }`}
        />
      ))}

      {/* bottom gradient so overlay text/badges stay legible on any photo */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(0,173,181,0.18),transparent_60%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      {discountPct > 0 && (
        <span className="absolute left-2 top-2 z-10 rounded-full bg-[#222831] px-2 py-0.5 text-[9px] font-bold text-white shadow-sm sm:left-2.5 sm:top-2.5 sm:px-2.5 sm:text-[10px]">
          −{discountPct}%
        </span>
      )}

      <span className="absolute right-2 top-2 z-10 inline-flex items-center gap-0.5 rounded-full bg-white/95 px-1.5 py-0.5 text-[9px] font-bold text-[#222831] shadow-sm backdrop-blur-sm sm:right-2.5 sm:top-2.5 sm:px-2 sm:text-[10px]">
        <Star size={9} className="fill-[#00ADB5] text-[#00ADB5] sm:h-2.5 sm:w-2.5" />
        {rating?.toFixed(1) ?? "4.8"}
      </span>

      <span className="absolute bottom-2 left-2 z-10 text-[9px] font-bold uppercase tracking-[0.12em] text-white/90 sm:bottom-2.5 sm:left-2.5 sm:text-[10px]">
        {label}
      </span>

      {normalizedImages.length > 1 && (
        <div className="absolute bottom-2 right-2 z-10 flex gap-1 sm:bottom-2.5 sm:right-2.5">
          {normalizedImages.map((_, dotIndex) => (
            <span
              key={dotIndex}
              className={`h-1 rounded-full transition-all duration-300 ${dotIndex === currentIndex ? "w-3 bg-white" : "w-1 bg-white/50"
                }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Products: React.FC = () => {
  const router = useRouter();
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const auth = useSelector((state: RootState) => state.auth);
  const { data, loading, error } = useFetch<ProductsApiResponse>(
    `${baseUrl}product/getAllProducts?limit=10`,
  );

  const products = useMemo(() => data?.data?.products ?? [], [data]);

  const handleScroll = (direction: "left" | "right") => {
    if (!sliderRef.current) return;
    const width = sliderRef.current.clientWidth * 0.8;
    sliderRef.current.scrollBy({
      left: direction === "left" ? -width : width,
      behavior: "smooth",
    });
  };

  const handleSliderScroll = () => {
    const slider = sliderRef.current;
    if (!slider) return;
    const maxScroll = slider.scrollWidth - slider.clientWidth;
    if (maxScroll <= 0) {
      setScrollProgress(0);
      return;
    }
    setScrollProgress(Math.min(100, Math.max(0, (slider.scrollLeft / maxScroll) * 100)));
  };

  useEffect(() => {
    if (loading || products.length === 0 || typeof window === "undefined") return;
    const isDesktop = () => window.innerWidth >= 768;
    if (!isDesktop()) return;

    const wrapper = wrapperRef.current;
    const slider = sliderRef.current;
    if (!wrapper || !slider) return;

    let maxScroll = 0;
    const recalculate = () => {
      maxScroll = slider.scrollWidth - slider.clientWidth;
      const innerHeight =
        slider.parentElement?.getBoundingClientRect().height ?? slider.clientHeight;
      wrapper.style.height =
        maxScroll > 0 ? `${innerHeight + Math.max(maxScroll, 0)}px` : "auto";
    };
    const onScroll = () => {
      if (!isDesktop() || maxScroll <= 0) return;
      const rect = wrapper.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) return;
      const ratio = Math.min(Math.max(-rect.top, 0), total) / total;
      slider.scrollLeft = ratio * maxScroll;
    };

    recalculate();
    window.addEventListener("resize", recalculate);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", recalculate);
      window.removeEventListener("scroll", onScroll);
      wrapper.style.height = "auto";
    };
  }, [loading, products.length]);

  const doAddToCart = async (product: ApiProduct) => {
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
      } catch (err: any) {
        showToast(
          err?.response?.data?.message || "Failed to add product to cart",
          "error",
        );
      }
      return;
    }

    const currentCart = getLocalCart() as Array<
      ApiProduct & { quantity: number; selectedColor?: string; selectedSize?: string }
    >;
    const existing = currentCart.find((item) => item._id === product._id);

    if (existing) {
      existing.quantity += 1;
    } else {
      currentCart.push({
        ...product,
        quantity: 1,
      });
    }

    setLocalCart(currentCart);
    showToast(`${product.name} added to cart`, "success");
  };

  const handleAddToCart = (event: React.MouseEvent, product: ApiProduct) => {
    event.stopPropagation();
    doAddToCart(product);
  };

  const handleBuyNow = (event: React.MouseEvent, product: ApiProduct) => {
    event.stopPropagation();
    doAddToCart(product).then(() => router.push("/checkout"));
  };

  const skeletonCards = Array.from({ length: 5 }, (_, index) => (
    <div
      key={`product-skeleton-${index}`}
      className="flex w-[168px] shrink-0 snap-start flex-col overflow-hidden rounded-[22px] border border-[#EEEEEE] bg-white xs:w-[190px] sm:w-[250px] sm:rounded-[28px] md:w-[280px]"
    >
      <div className="aspect-square w-full animate-pulse bg-[#F1F2F4]" />
      <div className="space-y-2 p-2.5 sm:space-y-2.5 sm:p-3.5">
        <div className="h-3.5 w-4/5 animate-pulse rounded-full bg-[#F1F2F4] sm:h-4" />
        <div className="h-8 w-full animate-pulse rounded-xl bg-[#F1F2F4] sm:h-9" />
      </div>
    </div>
  ));

  return (
    <section id="featured-products" className="bg-[#FFFFFF] py-8 sm:py-24">
      <div ref={wrapperRef} className="relative">
        <div className="sticky top-16 mx-auto max-w-7xl px-3 sm:px-6">
          <div className="mb-6 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between md:mb-8">
            <div className="max-w-xl">
              <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-[#EEEEEE] bg-white px-2.5 py-1 shadow-sm sm:mb-3 sm:gap-2 sm:px-3 sm:py-1.5">
                <Sparkles size={11} className="text-[#00ADB5] sm:h-3 sm:w-3" />
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#222831]/70 sm:text-[11px] sm:tracking-[0.24em]">
                  Featured Picks
                </span>
              </div>
              <h2 className="text-2xl font-black leading-[1.1] tracking-tight text-[#222831] sm:text-4xl">
                Trending <span className="italic text-[#00ADB5]">Products</span>
              </h2>
            </div>

            <div className="hidden items-center gap-3 md:flex">
              <button
                onClick={() => handleScroll("left")}
                type="button"
                aria-label="Scroll left"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#EEEEEE] bg-white text-[#222831] transition hover:border-[#00ADB5] hover:text-[#00ADB5] active:scale-95"
              >
                <ArrowLeft size={17} />
              </button>
              <button
                onClick={() => handleScroll("right")}
                type="button"
                aria-label="Scroll right"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#EEEEEE] bg-white text-[#222831] transition hover:border-[#00ADB5] hover:text-[#00ADB5] active:scale-95"
              >
                <ArrowRight size={17} />
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-[#EEEEEE] bg-[#FFFFFF] px-4 py-3.5 text-xs text-[#222831] sm:px-5 sm:py-4 sm:text-sm">
              Unable to load products. Please login or refresh the page.
            </div>
          )}

          <div
            ref={sliderRef}
            onScroll={handleSliderScroll}
            className="hide-scrollbar flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto scroll-smooth pb-2 sm:gap-5"
          >
            {loading
              ? skeletonCards
              : products.length > 0
                ? products.slice(0, 10).map((product) => {
                  const inStock = !!product.stock && product.stock > 0;
                  const originalPrice = Math.round(product.price * 1.4);
                  const discountPct = Math.round(
                    ((originalPrice - product.price) / originalPrice) * 100,
                  );

                  return (
                    <div
                      key={product._id}
                      role="button"
                      tabIndex={0}
                      onClick={() => router.push(`/product/${product._id}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") router.push(`/product/${product._id}`);
                      }}
                      className="group relative flex w-[168px] shrink-0 snap-start cursor-pointer flex-col overflow-hidden rounded-[22px] border border-[#EEEEEE] bg-white shadow-[0_8px_24px_rgba(34,40,49,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-[#00ADB5]/40 hover:shadow-[0_20px_44px_rgba(34,40,49,0.12)] xs:w-[190px] sm:w-[250px] sm:rounded-[28px] sm:shadow-[0_14px_40px_rgba(34,40,49,0.06)] sm:hover:-translate-y-1.5 sm:hover:shadow-[0_26px_60px_rgba(34,40,49,0.12)] md:w-[280px]"
                    >
                      <ProductCardImageCarousel
                        images={product.images}
                        label={product.category?.name ?? "Product"}
                        rating={product.averageRating}
                        discountPct={discountPct}
                      />

                      <div className="flex flex-1 flex-col gap-2 p-2.5 sm:gap-2.5 sm:p-3.5">
                        <div className="flex items-end justify-between gap-1.5">
                          <div className="min-w-0">
                            <h3 className="line-clamp-1 text-[12.5px] font-black leading-snug text-[#222831] sm:text-[15px]">
                              {product.name}
                            </h3>
                            <p className="mt-0.5 text-sm font-black text-[#222831] sm:text-lg">
                              Rs {product.price.toLocaleString()}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-bold sm:px-2 sm:py-1 sm:text-[10px] ${inStock
                                ? "bg-[#00ADB5]/10 text-[#00ADB5]"
                                : "bg-red-50 text-red-500"
                              }`}
                          >
                            {inStock ? "In Stock" : "Sold Out"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                          <button
                            type="button"
                            onClick={(event) => handleBuyNow(event, product)}
                            className="inline-flex min-h-[32px] items-center justify-center gap-1 rounded-lg bg-[#00ADB5] text-[9.5px] font-bold text-white transition hover:bg-[#0099a1] active:scale-95 sm:min-h-[38px] sm:gap-1.5 sm:rounded-xl sm:text-[11px]"
                          >
                            <ShoppingBag size={11} className="sm:h-[13px] sm:w-[13px]" />
                            Buy
                          </button>
                          <button
                            type="button"
                            onClick={(event) => handleAddToCart(event, product)}
                            className="inline-flex min-h-[32px] items-center justify-center gap-1 rounded-lg border border-[#EEEEEE] bg-white text-[9.5px] font-bold text-[#222831] transition hover:border-[#00ADB5] hover:text-[#00ADB5] active:scale-95 sm:min-h-[38px] sm:gap-1.5 sm:rounded-xl sm:text-[11px]"
                          >
                            <ShoppingCart size={11} className="sm:h-[13px] sm:w-[13px]" />
                            Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
                : (
                  <div className="min-w-full rounded-3xl border border-dashed border-[#EEEEEE] bg-white p-8 text-center text-xs text-[#222831]/65 sm:p-10 sm:text-sm">
                    No products found right now.
                  </div>
                )}
          </div>

          {!loading && products.length > 0 && (
            <div className="mt-4 h-[3px] w-full overflow-hidden rounded-full bg-[#EEEEEE] sm:mt-5 sm:h-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#00ADB5] to-[#222831] transition-[width] duration-150 ease-out"
                style={{ width: `${Math.max(scrollProgress, 6)}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Products;