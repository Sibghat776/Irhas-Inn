"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSelector } from "react-redux";
import useFetch, {
  baseUrl,
  getLocalCart,
  setLocalCart,
  showToast,
} from "../../utils/commonFunctions";
import { RootState } from "../../Redux/store";
import {
  ArrowLeft,
  ArrowRight,
  ShoppingCart,
  Tag,
  Star,
  CheckCircle,
  MessageSquare,
  Truck,
} from "lucide-react";

interface Review {
  user: {
    _id: string;
    username: string;
    email: string;
    profilePic?: string;
  };
  star: number;
  comment: string;
  reviewDate: string;
}

interface ProductDetail {
  _id: string;
  name: string;
  description: string;
  price: number;
  brand?: string;
  stock?: number;
  category?: {
    name: string;
  };
  images?: Array<{ url: string }>;
  colors?: string[];
  sizes?: string[];
  averageRating?: number;
  totalReviews?: number;
  sold?: number;
  ratings?: Review[];
}

interface ProductDetailApiResponse {
  status: number;
  message: string;
  data: ProductDetail;
}

const ProductDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const [productId, setProductId] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (params?.id) {
      setProductId(params.id as string);
    }
  }, [params]);

  const { data, loading, error, reFetch } = useFetch<ProductDetailApiResponse>(
    productId ? `${baseUrl}product/getProduct/${productId}` : "",
  );

  const product = data?.data;

  const auth = useSelector((state: RootState) => state.auth);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [star, setStar] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const availableColors = product?.colors ?? [];
  const availableSizes = product?.sizes ?? [];

  const imageList = useMemo(
    () =>
      product?.images && product.images.length > 0
        ? product.images
        : [{ url: "/carousel/Pens.avif" }],
    [product],
  );

  const reviews = product?.ratings ?? [];

  useEffect(() => {
    setCurrentImageIndex(0);
    if (availableColors.length) {
      setSelectedColor((prev) => prev || availableColors[0] || "");
    }
    if (availableSizes.length) {
      setSelectedSize((prev) => prev || availableSizes[0] || "");
    }
  }, [product?.images, availableColors, availableSizes]);

  const handleAddToCart = async () => {
    if (!product) return false;

    if (availableColors.length && !selectedColor) {
      showToast("Please select a color before adding to cart", "warn");
      return false;
    }

    if (availableSizes.length && !selectedSize) {
      showToast("Please select a size before adding to cart", "warn");
      return false;
    }

    const payload: any = {
      productId: product._id,
      quantity: 1,
    };

    if (selectedColor) payload.selectedColor = selectedColor;
    if (selectedSize) payload.selectedSize = selectedSize;

    if (auth.username) {
      try {
        await axios.post(`${baseUrl}cart`, payload, { withCredentials: true });
        window.dispatchEvent(new Event("cart-updated"));
        showToast(
          `${product.name} added to cart${selectedColor || selectedSize ? ` (${[selectedColor, selectedSize].filter(Boolean).join(" / ")})` : ""}`,
          "success",
        );
        return true;
      } catch (err: any) {
        console.error(err);
        showToast(
          err?.response?.data?.message || "Failed to add product to cart",
          "error",
        );
        return false;
      }
    }

    const currentCart = getLocalCart() as Array<ProductDetail & { quantity: number; selectedColor?: string; selectedSize?: string }>;
    const existing = currentCart.find(
      (item) => item._id === product._id && item.selectedColor === selectedColor && item.selectedSize === selectedSize,
    );
    if (existing) {
      existing.quantity += 1;
    } else {
      currentCart.push({
        ...product,
        quantity: 1,
        selectedColor: selectedColor || undefined,
        selectedSize: selectedSize || undefined,
      });
    }
    setLocalCart(currentCart);
    showToast(
      `${product.name} added to cart${selectedColor || selectedSize ? ` (${[selectedColor, selectedSize].filter(Boolean).join(" / ")})` : ""}`,
      "success",
    );
    return true;
  };

  const handleBuyNow = async () => {
    const added = await handleAddToCart();
    if (added) {
      router.push("/checkout");
    }
  };

  const handleSubmitRating = async () => {
    if (!star) return showToast("Please select a star rating", "error");
    if (!productId) return;

    setSubmitting(true);
    try {
      await axios.put(
        `${baseUrl}product/productRatings/${productId}`,
        { star, comment },
        { withCredentials: true },
      );
      showToast("Rating submitted successfully!", "success");
      setSubmitted(true);
      setStar(0);
      setComment("");
      reFetch();
    } catch (err: any) {
      showToast(
        err?.response?.data?.message || "Failed to submit rating",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + imageList.length) % imageList.length,
    );
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % imageList.length);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-400 pt-12 via-white to-gray-100 text-[#041241]">
      <div className="mx-auto max-w-7xl px-3 py-8 sm:px-6 sm:py-20">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-[#041241] shadow-sm transition hover:bg-[#0856DF] hover:text-white sm:mb-8 sm:gap-2 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
        >
          <ArrowLeft size={14} className="sm:hidden" />
          <ArrowLeft size={16} className="hidden sm:block" />
          Back to Products
        </button>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm shadow-lg sm:rounded-[32px] sm:p-12 sm:text-base">
            Loading product details...
          </div>
        ) : error || !product ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-lg sm:rounded-[32px] sm:p-12 sm:text-base">
            Unable to fetch product. Please login and try again.
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:gap-10">
              <div className="space-y-4 rounded-2xl bg-white p-3 shadow-[0_10px_40px_rgba(6,18,75,0.06)] sm:space-y-6 sm:rounded-[32px] sm:p-6 sm:shadow-[0_20px_70px_rgba(6,18,75,0.08)]">
                <div className="relative overflow-hidden rounded-xl bg-slate-100 shadow-inner sm:rounded-[32px]">
                  <div className="relative h-64 overflow-hidden sm:h-96 md:h-[460px]">
                    {imageList.map((image, imgIndex) => (
                      <img
                        key={`${image.url}-${imgIndex}`}
                        src={image.url}
                        alt={`${product.name} ${imgIndex + 1}`}
                        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-out ${imgIndex === currentImageIndex
                          ? "opacity-100"
                          : "opacity-0"
                          }`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/90 text-[#041241] shadow-lg transition hover:bg-white sm:left-4 sm:h-12 sm:w-12"
                  >
                    <ArrowLeft size={16} className="sm:hidden" />
                    <ArrowLeft size={20} className="hidden sm:block" />
                  </button>
                  <button
                    type="button"
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/90 text-[#041241] shadow-lg transition hover:bg-white sm:right-4 sm:h-12 sm:w-12"
                  >
                    <ArrowRight size={16} className="sm:hidden" />
                    <ArrowRight size={20} className="hidden sm:block" />
                  </button>

                  <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5 sm:bottom-4 sm:gap-2">
                    {imageList.map((_, dotIndex) => (
                      <span
                        key={dotIndex}
                        className={`h-1.5 w-1.5 rounded-full transition-all duration-300 sm:h-2.5 sm:w-2.5 ${dotIndex === currentImageIndex
                          ? "bg-white"
                          : "bg-white/50"
                          }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5 sm:space-y-4">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
                    <span className="rounded-full bg-[#0856DF] px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-white sm:px-3 sm:py-1 sm:text-xs sm:tracking-[0.3em]">
                      {product.category?.name ?? "General"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600 sm:gap-2 sm:px-3 sm:py-1 sm:text-sm">
                      <Tag size={12} className="sm:hidden" />
                      <Tag size={14} className="hidden sm:block" />
                      {product.brand ?? "ZeeF"}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600 sm:px-2 sm:text-xs">
                      <Truck size={11} className="sm:hidden" />
                      <Truck size={13} className="hidden sm:block" />
                      Free Shipping
                    </span>
                  </div>
                  <h1 className="text-xl font-black tracking-tight text-[#041241] sm:text-3xl md:text-4xl">
                    {product.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2.5 text-slate-500 sm:gap-4">
                    <span className="inline-flex items-center gap-1.5 text-xs sm:gap-2 sm:text-sm">
                      <Star size={14} className="text-amber-500 sm:h-4 sm:w-4" />
                      {product.averageRating?.toFixed(1) ?? "0.0"} Rating
                    </span>
                    <span className="text-xs sm:text-sm">{reviews.length} review(s)</span>
                    <span className="text-xs sm:text-sm">{product.sold ?? 0} sold</span>
                    <span className="text-xs sm:text-sm">{product.stock ?? 0} in stock</span>
                  </div>
                  <p className="max-w-2xl whitespace-pre-wrap break-words text-sm leading-6 text-slate-600 sm:text-base sm:leading-8">
                    {product.description}
                  </p>
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_10px_40px_rgba(6,18,75,0.06)] sm:space-y-6 sm:rounded-[32px] sm:p-6 sm:shadow-[0_20px_70px_rgba(6,18,75,0.08)]">
                <div className="space-y-1 sm:space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400 sm:text-sm sm:tracking-[0.3em]">
                    Price
                  </p>
                  <div className="flex items-end gap-2 sm:gap-3">
                    <p className="text-3xl font-black text-[#041241] sm:text-5xl">
                      Rs {product.price.toLocaleString()}
                    </p>
                    <p className="pb-1 text-sm font-medium text-slate-400 line-through sm:pb-2 sm:text-xl">
                      Rs {Math.round(product.price * 1.4).toLocaleString()}
                    </p>
                  </div>
                </div>

                {availableColors.length > 0 || availableSizes.length > 0 ? (
                  <div className="space-y-4 rounded-2xl bg-[#F7F7FA] p-3.5 text-xs text-slate-600 sm:space-y-5 sm:rounded-3xl sm:p-5 sm:text-sm">
                    {availableColors.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold text-slate-800 sm:mb-3 sm:text-sm">Choose a Color</p>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {availableColors.map((color) => {
                            const clean = String(color).replace(/[\[\]"']/g, "").trim();
                            return (
                              <button
                                key={color}
                                type="button"
                                onClick={() => setSelectedColor(clean)}
                                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:px-4 sm:py-2 sm:text-sm ${selectedColor === clean
                                    ? "border-black bg-black text-white"
                                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                                  }`}
                              >
                                {clean}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {availableSizes.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold text-slate-800 sm:mb-3 sm:text-sm">Choose a Size</p>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {availableSizes.map((size) => {
                            const clean = String(size).replace(/[\[\]"']/g, "").trim();
                            return (
                              <button
                                key={size}
                                type="button"
                                onClick={() => setSelectedSize(clean)}
                                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:px-4 sm:py-2 sm:text-sm ${selectedSize === clean
                                    ? "border-black bg-black text-white"
                                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                                  }`}
                              >
                                {clean}
                              </button>
                            );
                          })}
                        </div>  
                      </div>
                    )}

                    {selectedColor || selectedSize ? (
                      <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-700 sm:rounded-3xl sm:p-4 sm:text-sm">
                        <span className="font-semibold">Selected:</span> {[
                          selectedColor && `Color: ${selectedColor}`,
                          selectedSize && `Size: ${selectedSize}`,
                        ]
                          .filter(Boolean)
                          .join(" / ")}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-[#F7F7FA] p-3.5 text-xs text-slate-600 sm:rounded-3xl sm:p-5 sm:text-sm">
                    Premium quality product, ready to ship with fast delivery.
                  </div>
                )}

                <div className="grid gap-2.5 sm:gap-4">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-[#0856DF] px-4 text-sm font-semibold text-white transition hover:bg-[#0645c8] sm:min-h-[56px] sm:gap-3 sm:rounded-3xl sm:px-5 sm:text-base"
                  >
                    <ShoppingCart size={16} className="sm:hidden" />
                    <ShoppingCart size={20} className="hidden sm:block" />
                    Add to Cart
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleAddToCart();
                      router.push("/checkout");
                    }}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-[#041241] transition hover:bg-[#f3f8ff] sm:min-h-[56px] sm:gap-3 sm:rounded-3xl sm:px-5 sm:text-base"
                  >
                    Buy Now
                  </button>
                </div>

                <div className="rounded-2xl bg-[#F7F7FA] p-3.5 text-xs text-slate-600 sm:rounded-3xl sm:p-5 sm:text-sm">
                  <p className="font-semibold text-slate-900">Product Details</p>
                  <p className="mt-1.5 whitespace-pre-wrap break-words sm:mt-2">{product.description}</p>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_40px_rgba(6,18,75,0.06)] sm:mt-12 sm:rounded-[32px] sm:p-8 sm:shadow-[0_20px_70px_rgba(6,18,75,0.08)]">
              <div className="mb-5 flex items-center gap-2 sm:mb-8 sm:gap-3">
                <MessageSquare size={18} className="text-[#0856DF] sm:h-6 sm:w-6" />
                <h2 className="text-lg font-black text-[#041241] sm:text-2xl">
                  Reviews &amp; Ratings
                </h2>
                <span className="ml-auto text-xs text-slate-500 sm:text-sm">
                  {reviews.length} review(s)
                </span>
              </div>

              {/* Rating Form */}
              {auth.username ? (
                <div className="mb-6 rounded-2xl border border-slate-200 bg-[#F7F7FA] p-4 sm:mb-10 sm:rounded-3xl sm:p-6">
                  <p className="mb-2.5 text-xs font-bold text-slate-800 sm:mb-3 sm:text-sm">
                    Write a Review
                  </p>
                  <div className="mb-2.5 flex gap-1 sm:mb-3">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStar(s)}
                        onMouseEnter={() => setHover(s)}
                        onMouseLeave={() => setHover(0)}
                      >
                        <Star
                          size={22}
                          className={`transition-colors sm:h-7 sm:w-7 ${s <= (hover || star)
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-300"
                            }`}
                        />
                      </button>
                    ))}
                    {star > 0 && (
                      <span className="ml-2 self-center text-xs text-slate-500 sm:text-sm">
                        {star} star{star > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write your review (optional)"
                    rows={3}
                    className="mb-2.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs focus:border-[#0856DF] focus:outline-none sm:mb-3 sm:px-4 sm:py-3 sm:text-sm"
                  />
                  {submitted ? (
                    <div className="flex items-center gap-1 text-xs font-semibold text-green-600 sm:text-sm">
                      <CheckCircle size={14} className="sm:h-4 sm:w-4" /> Thank you! Your review has been submitted.
                    </div>
                  ) : (
                    <button
                      onClick={handleSubmitRating}
                      disabled={submitting || star === 0}
                      className="rounded-xl bg-[#0856DF] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#0645c8] disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:py-2.5 sm:text-sm"
                    >
                      {submitting ? "Submitting..." : "Submit Review"}
                    </button>
                  )}
                </div>
              ) : (
                <div className="mb-6 rounded-2xl border border-dashed border-slate-300 bg-[#F7F7FA] p-4 text-center sm:mb-10 sm:rounded-3xl sm:p-6">
                  <p className="text-xs text-slate-500 sm:text-sm">
                    Please{" "}
                    <button
                      onClick={() => router.push("/")}
                      className="font-semibold text-[#0856DF] hover:underline"
                    >
                      login
                    </button>{" "}
                    to write a review.
                  </p>
                </div>
              )}

              {/* Reviews List */}
              {reviews.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {[...reviews].reverse().map((review, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-sm sm:rounded-2xl sm:p-5"
                    >
                      <div className="mb-1.5 flex items-center gap-2.5 sm:mb-2 sm:gap-3">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#0856DF] text-xs font-bold text-white sm:h-9 sm:w-9 sm:text-sm">
                          {review.user?.username?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold capitalize text-slate-900 sm:text-sm">
                            {review.user?.username || "User"}
                          </p>
                          <p className="text-[10px] text-slate-400 sm:text-xs">
                            {new Date(review.reviewDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="ml-auto flex flex-shrink-0 gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={12}
                              className={`sm:h-3.5 sm:w-3.5 ${s <= review.star
                                ? "fill-amber-400 text-amber-400"
                                : "text-gray-200"
                                }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:mt-2 sm:text-sm">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center sm:py-10">
                  <Star size={32} className="mx-auto mb-2.5 text-slate-200 sm:h-10 sm:w-10 sm:mb-3" />
                  <p className="text-xs text-slate-500 sm:text-sm">
                    No reviews yet. Be the first to review this product!
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
};

export default ProductDetailPage;