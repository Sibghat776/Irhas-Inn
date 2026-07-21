"use client";

import axios from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { ArrowLeft, ArrowRight, ShoppingBag, ShoppingCart, Star } from "lucide-react";
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
    <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-gradient-to-br from-[#F8F9FA] to-[#F1F2F4]">
      {normalizedImages.map((image, index) => (
        <img
          key={`${image.url}-${index}`}
          src={image.url}
          alt={`${label} ${index + 1}`}
          className={`absolute inset-0 h-full w-full object-contain p-6 transition duration-700 ease-out group-hover:scale-[1.04] ${index === currentIndex ? "opacity-100" : "opacity-0"
            }`}
        />
      ))}

      <span className="absolute left-3 top-3 rounded-full border border-[#EEEEEE] bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#222831] shadow-sm backdrop-blur-sm">
        {label}
      </span>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/[0.03] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {normalizedImages.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {normalizedImages.map((_, dotIndex) => (
            <span
              key={dotIndex}
              className={`h-1.5 rounded-full transition-all duration-300 ${dotIndex === currentIndex ? "w-5 bg-[#00ADB5]" : "w-1.5 bg-[#222831]/20"
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
      className="flex aspect-square w-[240px] shrink-0 snap-start flex-col overflow-hidden rounded-[28px] border border-[#EEEEEE] bg-white sm:w-[270px] md:w-[300px]"
    >
      <div className="aspect-square w-full animate-pulse bg-[#F1F2F4]" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-20 animate-pulse rounded-full bg-[#F1F2F4]" />
        <div className="h-5 w-4/5 animate-pulse rounded-full bg-[#F1F2F4]" />
        <div className="h-10 w-full animate-pulse rounded-2xl bg-[#F1F2F4]" />
      </div>
    </div>
  ));

  return (
    <section id="featured-products" className="bg-[#FFFFFF] py-8 sm:py-24">
      <div ref={wrapperRef} className="relative">
        <div className="sticky top-16 mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#EEEEEE] bg-white px-3 py-1.5 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00ADB5]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#222831]/70">
                  Featured Picks
                </span>
              </div>
              <h2 className="text-3xl font-black leading-tight tracking-tight text-[#222831] sm:text-4xl">
                Trending <span className="text-[#00ADB5]">Products</span>
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
            <div className="mb-6 rounded-2xl border border-[#EEEEEE] bg-[#FFFFFF] px-5 py-4 text-sm text-[#222831]">
              Unable to load products. Please login or refresh the page.
            </div>
          )}

          <div
            ref={sliderRef}
            onScroll={handleSliderScroll}
            className="hide-scrollbar flex snap-x snap-mandatory items-stretch gap-5 overflow-x-auto scroll-smooth pb-2"
          >
            {loading
              ? skeletonCards
              : products.length > 0
                ? products.slice(0, 10).map((product) => (
                  <div
                    key={product._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/product/${product._id}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") router.push(`/product/${product._id}`);
                    }}
                    className="group flex w-[240px] shrink-0 snap-start cursor-pointer flex-col overflow-hidden rounded-[28px] border border-[#EEEEEE] bg-white shadow-[0_14px_40px_rgba(34,40,49,0.06)] transition duration-300 hover:-translate-y-1.5 hover:border-[#00ADB5]/40 hover:shadow-[0_26px_60px_rgba(34,40,49,0.12)] sm:w-[270px] md:w-[300px]"
                  >
                    <ProductCardImageCarousel
                      images={product.images}
                      label={product.category?.name ?? "Product"}
                    />

                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-[#222831]/55">
                          {product.brand ?? "ZeeF"}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#F1F2F4] px-2 py-1 text-[11px] font-bold text-[#222831]">
                          <Star size={11} className="fill-[#00ADB5] text-[#00ADB5]" />
                          {product.averageRating?.toFixed(1) ?? "4.8"}
                        </span>
                      </div>

                      <h3 className="mt-3 line-clamp-1 text-[15px] font-black leading-snug text-[#222831]">
                        {product.name}
                      </h3>

                      <div className="mt-auto pt-4">
                        <div className="flex items-end justify-between">
                          <div className="flex items-end gap-2">
                            <p className="text-lg font-black text-[#222831]">
                              Rs {product.price.toLocaleString()}
                            </p>
                            <p className="pb-0.5 text-[11px] font-medium text-[#222831]/35 line-through">
                              Rs {Math.round(product.price * 1.4).toLocaleString()}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${product.stock && product.stock > 0
                                ? "bg-[#00ADB5]/10 text-[#00ADB5]"
                                : "bg-red-50 text-red-500"
                              }`}
                          >
                            {product.stock && product.stock > 0 ? "In Stock" : "Sold Out"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-t border-[#EEEEEE] bg-[#FAFAFA] px-3 pb-3 pt-3">
                      <button
                        type="button"
                        onClick={(event) => handleBuyNow(event, product)}
                        className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl bg-[#00ADB5] text-[11px] font-bold text-white transition hover:bg-[#0099a1] active:scale-95"
                      >
                        <ShoppingBag size={13} />
                        Buy Now
                      </button>
                      <button
                        type="button"
                        onClick={(event) => handleAddToCart(event, product)}
                        className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-[#EEEEEE] bg-white text-[11px] font-bold text-[#222831] transition hover:border-[#00ADB5] hover:text-[#00ADB5] active:scale-95"
                      >
                        <ShoppingCart size={13} />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))
                : (
                  <div className="min-w-full rounded-3xl border border-dashed border-[#EEEEEE] bg-white p-10 text-center text-sm text-[#222831]/65">
                    No products found right now.
                  </div>
                )}
          </div>

          {!loading && products.length > 0 && (
            <div className="mt-5 h-0.5 w-full overflow-hidden rounded-full bg-[#EEEEEE]">
              <div
                className="h-full rounded-full bg-[#00ADB5] transition-[width] duration-150 ease-out"
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