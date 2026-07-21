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
import { ArrowLeft, ArrowRight, ShoppingCart, ShoppingBag, Star, Truck, X, Check } from "lucide-react";

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
}

interface ProductsApiResponse {
  status: number;
  message: string;
  data: { products: ApiProduct[] };
}

// ── Variant Picker Modal ──────────────────────────────────────────────────────
interface VariantPickerProps {
  product: ApiProduct;
  mode: "cart" | "buy";
  onConfirm: (color?: string, size?: string) => void;
  onClose: () => void;
}

const VariantPicker: React.FC<VariantPickerProps> = ({ product, mode, onConfirm, onClose }) => {
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    product.colors?.length === 1 ? product.colors[0] : undefined,
  );
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    product.sizes?.length === 1 ? product.sizes[0] : undefined,
  );

  const needsColor = Boolean(product.colors?.length);
  const needsSize = Boolean(product.sizes?.length);
  const canConfirm =
    (!needsColor || selectedColor) && (!needsSize || selectedSize);

  const COLOR_SWATCHES: Record<string, string> = {
    black: "#1a1a1a", white: "#f5f5f5", red: "#ef4444", blue: "#3b82f6",
    green: "#22c55e", yellow: "#eab308", orange: "#f97316", purple: "#a855f7",
    pink: "#ec4899", gray: "#9ca3af", navy: "#1e3a8a", brown: "#92400e",
    beige: "#d4b483", silver: "#c0c0c0", gold: "#d4af37", cyan: "#06b6d4",
  };

  const getSwatchColor = (color: string) =>
    COLOR_SWATCHES[color.toLowerCase()] ?? color;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
      style={{ background: "rgba(4,18,65,0.55)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          background: "#ffffff",
          boxShadow: "0 32px 80px rgba(4,18,65,0.22), 0 8px 24px rgba(4,18,65,0.12)",
        }}
      >
        {/* Header */}
        <div className="flex items-start gap-4 p-6 pb-4">
          <img
            src={product.images?.[0]?.url ?? "/carousel/Pens.avif"}
            alt={product.name}
            className="h-14 w-14 rounded-2xl object-cover ring-1 ring-slate-100 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#0856DF]">
              {mode === "buy" ? "Buy Now" : "Add to Cart"}
            </p>
            <h3 className="mt-0.5 text-base font-black text-[#041241] leading-tight truncate">
              {product.name}
            </h3>
            <p className="mt-1 text-sm font-bold text-[#041241]">
              Rs {product.price.toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Color selection */}
          {needsColor && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Color</p>
                {selectedColor && (
                  <span className="text-xs font-semibold text-[#041241] capitalize">
                    {selectedColor}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {product.colors?.map((color) => {
                  const swatch = getSwatchColor(color);
                  const isLight = ["white", "beige", "silver", "yellow", "gold", "cyan"].includes(color.toLowerCase());
                  const isSelected = selectedColor === color;
                  return (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className="relative h-9 w-9 rounded-full transition-all duration-200"
                      style={{
                        background: swatch,
                        boxShadow: isSelected
                          ? `0 0 0 2px #ffffff, 0 0 0 4px #0856DF`
                          : isLight
                            ? `0 0 0 1px #e2e8f0`
                            : "none",
                        transform: isSelected ? "scale(1.15)" : "scale(1)",
                      }}
                      title={color}
                    >
                      {isSelected && (
                        <Check
                          size={14}
                          className="absolute inset-0 m-auto"
                          style={{ color: isLight ? "#041241" : "#ffffff" }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size selection */}
          {needsSize && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Size</p>
                {selectedSize && (
                  <span className="text-xs font-semibold text-[#041241]">{selectedSize}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes?.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`h-9 min-w-[2.25rem] px-3 rounded-xl text-xs font-bold transition-all duration-150 ${selectedSize === size
                        ? "bg-[#041241] text-white scale-105"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Confirm button */}
          <button
            onClick={() => canConfirm && onConfirm(selectedColor, selectedSize)}
            disabled={!canConfirm}
            className={`w-full rounded-2xl py-3.5 text-sm font-bold uppercase tracking-[0.15em] transition-all duration-200 ${canConfirm
                ? "bg-[#0856DF] text-white hover:bg-[#0645c8] active:scale-[0.98]"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
          >
            {canConfirm
              ? mode === "buy"
                ? "Proceed to checkout →"
                : "Add to cart"
              : "Select options above"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Product Image Carousel ────────────────────────────────────────────────────
const ProductCardImageCarousel: React.FC<{
  images: ApiProduct["images"];
  label: string;
}> = ({ images, label }) => {
  const normalizedImages = useMemo(
    () => (images && images.length > 0 ? images : [{ url: "/carousel/Pens.avif" }]),
    [images],
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => { setCurrentIndex(0); }, [normalizedImages]);

  useEffect(() => {
    if (normalizedImages.length <= 1) return;
    const interval = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % normalizedImages.length);
    }, 3500);
    return () => window.clearInterval(interval);
  }, [normalizedImages.length]);

  return (
    <div className="relative h-48 sm:h-56 shrink-0 overflow-hidden" style={{ background: "linear-gradient(135deg, #f8faff 0%, #eef3ff 100%)" }}>
      {normalizedImages.map((image, index) => (
        <img
          key={`${image.url}-${index}`}
          src={image.url}
          alt={`${label} ${index + 1}`}
          className={`absolute inset-0 h-full w-full object-contain p-2 transition-all duration-400 ease-out ${index === currentIndex ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
        />
      ))}

      {/* Category badge */}
      <div
        className="absolute left-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
        style={{ background: "white", color: "black" }}
      >
        {label}
      </div>

      {/* Dot indicators */}
      {normalizedImages.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {normalizedImages.map((_, dotIndex) => (
            <span
              key={dotIndex}
              className="h-1 rounded-full transition-all duration-300"
              style={{
                width: dotIndex === currentIndex ? "16px" : "4px",
                background: dotIndex === currentIndex ? "#0856DF" : "rgba(4,18,65,0.2)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main Products Component ───────────────────────────────────────────────────
const Products: React.FC = () => {
  const router = useRouter();
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [picker, setPicker] = useState<{ product: ApiProduct; mode: "cart" | "buy" } | null>(null);

  const auth = useSelector((state: RootState) => state.auth);
  const { data, loading, error } = useFetch<ProductsApiResponse>(
    `${baseUrl}product/getAllProducts?limit=10`,
  );

  const products = useMemo(() => data?.data?.products ?? [], [data]);

  const handleScroll = (direction: "left" | "right") => {
    if (!sliderRef.current) return;
    const width = sliderRef.current.clientWidth * 0.8;
    sliderRef.current.scrollBy({ left: direction === "left" ? -width : width, behavior: "smooth" });
  };

  const handleSliderScroll = () => {
    const el = sliderRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) { setScrollProgress(0); return; }
    setScrollProgress(Math.min(100, Math.max(0, (el.scrollLeft / maxScroll) * 100)));
  };

  useEffect(() => {
    if (loading || products.length === 0) return;
    if (typeof window === "undefined") return;
    const isDesktop = () => window.innerWidth >= 768;
    if (!isDesktop()) return;
    const wrapper = wrapperRef.current;
    const slider = sliderRef.current;
    if (!wrapper || !slider) return;
    let maxScroll = 0;
    const recalculate = () => {
      maxScroll = slider.scrollWidth - slider.clientWidth;
      const innerHeight = slider.parentElement?.getBoundingClientRect().height ?? slider.clientHeight;
      wrapper.style.height = maxScroll > 0 ? `${innerHeight + Math.max(maxScroll, 0)}px` : "auto";
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

  // Add to cart — with or without variants
  const doAddToCart = async (product: ApiProduct, color?: string, size?: string) => {
    if (typeof window === "undefined") return;
    if (auth.username) {
      try {
        await axios.post(
          `${baseUrl}cart`,
          { productId: product._id, quantity: 1, selectedColor: color, selectedSize: size },
          { withCredentials: true },
        );
        showToast(`${product.name} added to cart`, "success");
        window.dispatchEvent(new Event("cart-updated"));
      } catch (err: any) {
        showToast(err?.response?.data?.message || "Failed to add product to cart", "error");
      }
      return;
    }
    const currentCart = getLocalCart() as Array<ApiProduct & { quantity: number; selectedColor?: string; selectedSize?: string }>;
    const existing = currentCart.find((i) => i._id === product._id && i.selectedColor === color && i.selectedSize === size);
    if (existing) { existing.quantity += 1; } else { currentCart.push({ ...product, quantity: 1, selectedColor: color, selectedSize: size }); }
    setLocalCart(currentCart);
    showToast(`${product.name} added to cart`, "success");
  };

  const handleAddToCart = (e: React.MouseEvent, product: ApiProduct) => {
    e.stopPropagation();
    const hasVariants = Boolean(product.colors?.length) || Boolean(product.sizes?.length);
    if (hasVariants) { setPicker({ product, mode: "cart" }); return; }
    doAddToCart(product);
  };

  const handleBuyNow = (e: React.MouseEvent, product: ApiProduct) => {
    e.stopPropagation();
    const hasVariants = Boolean(product.colors?.length) || Boolean(product.sizes?.length);
    if (hasVariants) { setPicker({ product, mode: "buy" }); return; }
    doAddToCart(product).then(() => router.push("/checkout"));
  };

  const handlePickerConfirm = async (color?: string, size?: string) => {
    if (!picker) return;
    const { product, mode } = picker;
    setPicker(null);
    await doAddToCart(product, color, size);
    if (mode === "buy") router.push("/checkout");
  };

  const skeletonCards = Array.from({ length: 5 }, (_, i) => (
    <div key={`sk-${i}`} className="snap-start min-w-[230px] sm:min-w-[260px] md:min-w-[290px] rounded-3xl border border-slate-100 overflow-hidden" style={{ background: "#fafbff" }}>
      <div className="h-48 sm:h-56 bg-gradient-to-br from-slate-100 to-slate-50 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-20 rounded-full bg-slate-200 animate-pulse" />
        <div className="h-4 w-3/4 rounded-full bg-slate-200 animate-pulse" />
        <div className="h-3 w-full rounded-full bg-slate-100 animate-pulse" />
        <div className="h-3 w-2/3 rounded-full bg-slate-100 animate-pulse" />
      </div>
    </div>
  ));

  return (
    <>
      {picker && (
        <VariantPicker
          product={picker.product}
          mode={picker.mode}
          onConfirm={handlePickerConfirm}
          onClose={() => setPicker(null)}
        />
      )}

      <section id="featured-products" className="py-16 sm:py-24" style={{ background: "#f7f9ff" }}>
        <div ref={wrapperRef} className="relative">
          <div className="sticky top-16 max-w-7xl mx-auto px-4 sm:px-6">

            {/* Section header */}
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-8 sm:mb-10">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-3" style={{ background: "rgba(8,86,223,0.08)" }}>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0856DF]" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#0856DF]">Featured Picks</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-[1.1] text-[#041241]">
                  Trending <span style={{ color: "#0856DF" }}>Products</span>
                </h2>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                  Curated bestsellers — choose your color & size, then checkout in one tap.
                </p>
              </div>

              <div className="hidden md:flex items-center gap-3">
                <button
                  onClick={() => handleScroll("left")}
                  type="button"
                  aria-label="Scroll left"
                  className="group inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#041241] transition-all hover:border-[#0856DF] hover:bg-[#0856DF] hover:text-white hover:scale-105"
                >
                  <ArrowLeft size={17} />
                </button>
                <button
                  onClick={() => handleScroll("right")}
                  type="button"
                  aria-label="Scroll right"
                  className="group inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#041241] transition-all hover:border-[#0856DF] hover:bg-[#0856DF] hover:text-white hover:scale-105"
                >
                  <ArrowRight size={17} />
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">
                Unable to load products. Please login or refresh the page.
              </div>
            )}

            {/* Slider */}
            <div
              ref={sliderRef}
              onScroll={handleSliderScroll}
              className="flex items-stretch gap-4 md:gap-5 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory hide-scrollbar"
            >
              {loading
                ? skeletonCards
                : products.length > 0
                  ? products.slice(0, 10).map((product) => {
                    const hasVariants = Boolean(product.colors?.length) || Boolean(product.sizes?.length);
                    return (
                      <div
                        key={product._id}
                        role="button"
                        tabIndex={0}
                        onClick={() => router.push(`/product/${product._id}`)}
                        onKeyDown={(e) => e.key === "Enter" && router.push(`/product/${product._id}`)}
                        className="group flex flex-col snap-start min-w-[230px] sm:min-w-[260px] md:min-w-[290px] cursor-pointer overflow-hidden rounded-3xl bg-white border border-slate-100 transition-all duration-300 hover:-translate-y-1 hover:border-[#0856DF]/20 hover:shadow-[0_20px_60px_rgba(8,86,223,0.12)]"
                      >
                        <ProductCardImageCarousel images={product.images} label={product.category?.name ?? "Best Seller"} />

                        <div className="flex flex-1 flex-col p-4">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                              {product.brand ?? "ZeeF"}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500">
                              <Star size={11} fill="currentColor" strokeWidth={0} />
                              {product.averageRating?.toFixed(1) ?? "4.8"}
                            </span>
                          </div>

                          <h3 className="mt-2 text-sm font-black leading-snug text-[#041241] line-clamp-1">
                            {product.name}
                          </h3>
                          <p className="mt-1 text-xs leading-5 text-slate-400 line-clamp-2 min-h-[2.5rem]">
                            {product.description}
                          </p>

                          {/* Color dots preview */}
                          {Boolean(product.colors?.length) && (
                            <div className="mt-2.5 flex items-center gap-1.5">
                              {product.colors?.slice(0, 5).map((color) => (
                                <span
                                  key={color}
                                  className="h-3.5 w-3.5 rounded-full ring-1 ring-white ring-offset-1"
                                  style={{
                                    background: {
                                      black: "#1a1a1a", white: "#f5f5f5", red: "#ef4444",
                                      blue: "#3b82f6", green: "#22c55e", yellow: "#eab308",
                                      orange: "#f97316", purple: "#a855f7", pink: "#ec4899",
                                      gray: "#9ca3af", navy: "#1e3a8a", brown: "#92400e",
                                      beige: "#d4b483", silver: "#c0c0c0",
                                    }[color.toLowerCase()] ?? color,
                                    boxShadow: "0 0 0 1px rgba(0,0,0,0.1)",
                                  }}
                                  title={color}
                                />
                              ))}
                              {(product.colors?.length ?? 0) > 5 && (
                                <span className="text-[10px] text-slate-400 font-semibold">
                                  +{(product.colors?.length ?? 0) - 5}
                                </span>
                              )}
                              {Boolean(product.sizes?.length) && (
                                <span className="ml-1 text-[10px] text-slate-400">
                                  · {product.sizes?.length} sizes
                                </span>
                              )}
                            </div>
                          )}

                          {!product.colors?.length && Boolean(product.sizes?.length) && (
                            <div className="mt-2.5 flex flex-wrap gap-1">
                              {product.sizes?.slice(0, 4).map((s) => (
                                <span key={s} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                                  {s}
                                </span>
                              ))}
                              {(product.sizes?.length ?? 0) > 4 && (
                                <span className="text-[10px] text-slate-400 self-center">+{(product.sizes?.length ?? 0) - 4}</span>
                              )}
                            </div>
                          )}

                          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
                            <Truck size={11} /> Free Shipping
                          </div>

                          <div className="mt-auto pt-3">
                            <div className="flex items-baseline gap-2">
                              <p className="text-lg font-black text-[#041241]">
                                Rs {product.price.toLocaleString()}
                              </p>
                              <p className="text-xs text-slate-300 line-through">
                                Rs {Math.round(product.price * 1.4).toLocaleString()}
                              </p>
                              <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                                29% off
                              </span>
                            </div>
                            <p className="mt-0.5 text-[10px] text-slate-400">
                              {product.stock && product.stock > 0
                                ? `${product.stock} in stock`
                                : "Out of stock"}
                              {hasVariants && " · Select options"}
                            </p>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 px-4 pb-4">
                          <button
                            type="button"
                            onClick={(e) => handleBuyNow(e, product)}
                            className="flex flex-1 min-h-[40px] items-center justify-center gap-1.5 rounded-2xl bg-[#0856DF] text-xs font-bold text-white transition-all hover:bg-[#0645c8] active:scale-[0.97]"
                          >
                            <ShoppingBag size={13} />
                            {hasVariants ? "Buy Now →" : "Buy Now"}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleAddToCart(e, product)}
                            aria-label="Add to cart"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#041241] transition-all hover:border-[#0856DF] hover:bg-[#f0f5ff] active:scale-[0.97]"
                          >
                            <ShoppingCart size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                  : (
                    <div className="min-w-full rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
                      No products found right now.
                    </div>
                  )}
            </div>

            {/* Progress bar */}
            {!loading && products.length > 0 && (
              <div className="mt-5 h-0.5 w-full rounded-full overflow-hidden" style={{ background: "rgba(8,86,223,0.08)" }}>
                <div
                  className="h-full rounded-full transition-[width] duration-150 ease-out"
                  style={{ width: `${Math.max(scrollProgress, 6)}%`, background: "#0856DF" }}
                />
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default Products;