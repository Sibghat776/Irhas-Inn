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
    <main className="min-h-screen bg-gradient-to-b from-gray-400 via-white to-gray-100 text-[#041241]">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-8 inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-[#041241] shadow-sm transition hover:bg-[#0856DF] hover:text-white"
        >
          <ArrowLeft size={16} /> Back to Products
        </button>

        {loading ? (
          <div className="rounded-[32px] border border-slate-200 bg-white p-12 shadow-lg">
            Loading product details...
          </div>
        ) : error || !product ? (
          <div className="rounded-[32px] border border-red-200 bg-red-50 p-12 text-red-700 shadow-lg">
            Unable to fetch product. Please login and try again.
          </div>
        ) : (
          <>
            <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-6 rounded-[32px] bg-white p-6 shadow-[0_20px_70px_rgba(6,18,75,0.08)]">
                <div className="relative overflow-hidden rounded-[32px] bg-slate-100 shadow-inner">
                  <div className="relative h-[460px] overflow-hidden">
                    {imageList.map((image, imgIndex) => (
                      <img
                        key={`${image.url}-${imgIndex}`}
                        src={image.url}
                        alt={`${product.name} ${imgIndex + 1}`}
                        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-out ${
                          imgIndex === currentImageIndex
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/90 text-[#041241] shadow-lg transition hover:bg-white"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/90 text-[#041241] shadow-lg transition hover:bg-white"
                  >
                    <ArrowRight size={20} />
                  </button>

                  <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
                    {imageList.map((_, dotIndex) => (
                      <span
                        key={dotIndex}
                        className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                          dotIndex === currentImageIndex
                            ? "bg-white"
                            : "bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-[#0856DF] px-3 py-1 text-xs font-black uppercase tracking-[0.3em] text-white">
                      {product.category?.name ?? "General"}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                      <Tag size={14} /> {product.brand ?? "ZeeF"}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-600">
                      <Truck size={13} /> Free Shipping
                    </span>
                  </div>
                  <h1 className="text-4xl font-black tracking-tight text-[#041241]">
                    {product.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-slate-500">
                    <span className="inline-flex items-center gap-2 text-sm">
                      <Star size={16} className="text-amber-500" />
                      {product.averageRating?.toFixed(1) ?? "0.0"} Rating
                    </span>
                    <span className="text-sm">{reviews.length} review(s)</span>
                    <span className="text-sm">{product.sold ?? 0} sold</span>
                    <span className="text-sm">{product.stock ?? 0} in stock</span>
                  </div>
                  <p className="max-w-2xl text-base leading-8 text-slate-600">
                    {product.description}
                  </p>
                </div>
              </div>

              <div className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_70px_rgba(6,18,75,0.08)]">
                <div className="space-y-2">
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
                    Price
                  </p>
                  <div className="flex items-end gap-3">
                    <p className="text-5xl font-black text-[#041241]">
                      Rs {product.price.toLocaleString()}
                    </p>
                    <p className="pb-2 text-xl font-medium text-slate-400 line-through">
                      Rs {Math.round(product.price * 1.4).toLocaleString()}
                    </p>
                  </div>
                </div>

                {availableColors.length > 0 || availableSizes.length > 0 ? (
                  <div className="space-y-5 rounded-3xl bg-[#F7F7FA] p-5 text-sm text-slate-600">
                    {availableColors.length > 0 && (
                      <div>
                        <p className="mb-3 text-sm font-semibold text-slate-800">Choose a Color</p>
                        <div className="flex flex-wrap gap-2">
                          {availableColors.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setSelectedColor(color)}
                              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                                selectedColor === color
                                  ? "border-black bg-black text-white"
                                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              {color}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {availableSizes.length > 0 && (
                      <div>
                        <p className="mb-3 text-sm font-semibold text-slate-800">Choose a Size</p>
                        <div className="flex flex-wrap gap-2">
                          {availableSizes.map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => setSelectedSize(size)}
                              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                                selectedSize === size
                                  ? "border-black bg-black text-white"
                                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedColor || selectedSize ? (
                      <div className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
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
                  <div className="rounded-3xl bg-[#F7F7FA] p-5 text-sm text-slate-600">
                    Premium quality product, ready to ship with fast delivery.
                  </div>
                )}

                <div className="grid gap-4">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="inline-flex min-h-[56px] items-center justify-center gap-3 rounded-3xl bg-[#0856DF] px-5 text-base font-semibold text-white transition hover:bg-[#0645c8]"
                  >
                    <ShoppingCart size={20} /> Add to Cart
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleAddToCart();
                      router.push("/checkout");
                    }}
                    className="inline-flex min-h-[56px] items-center justify-center gap-3 rounded-3xl border border-slate-300 bg-white px-5 text-base font-semibold text-[#041241] transition hover:bg-[#f3f8ff]"
                  >
                    Buy Now
                  </button>
                </div>

                <div className="rounded-3xl bg-[#F7F7FA] p-5 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">Product Details</p>
                  <p className="mt-2">{product.description}</p>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="mt-12 rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_70px_rgba(6,18,75,0.08)]">
              <div className="flex items-center gap-3 mb-8">
                <MessageSquare size={24} className="text-[#0856DF]" />
                <h2 className="text-2xl font-black text-[#041241]">
                  Reviews & Ratings
                </h2>
                <span className="ml-auto text-sm text-slate-500">
                  {reviews.length} review(s)
                </span>
              </div>

              {/* Rating Form */}
              {auth.username ? (
                <div className="mb-10 rounded-3xl border border-slate-200 bg-[#F7F7FA] p-6">
                  <p className="text-sm font-bold text-slate-800 mb-3">
                    Write a Review
                  </p>
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStar(s)}
                        onMouseEnter={() => setHover(s)}
                        onMouseLeave={() => setHover(0)}
                      >
                        <Star
                          size={28}
                          className={`transition-colors ${
                            s <= (hover || star)
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                    {star > 0 && (
                      <span className="ml-2 text-sm text-slate-500 self-center">
                        {star} star{star > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write your review (optional)"
                    rows={3}
                    className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:border-[#0856DF] mb-3 bg-white"
                  />
                  {submitted ? (
                    <div className="text-sm text-green-600 font-semibold flex items-center gap-1">
                      <CheckCircle size={16} /> Thank you! Your review has been submitted.
                    </div>
                  ) : (
                    <button
                      onClick={handleSubmitRating}
                      disabled={submitting || star === 0}
                      className="px-6 py-2.5 bg-[#0856DF] text-white text-sm font-semibold rounded-xl hover:bg-[#0645c8] disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {submitting ? "Submitting..." : "Submit Review"}
                    </button>
                  )}
                </div>
              ) : (
                <div className="mb-10 rounded-3xl border border-dashed border-slate-300 bg-[#F7F7FA] p-6 text-center">
                  <p className="text-sm text-slate-500">
                    Please{" "}
                    <button
                      onClick={() => router.push("/")}
                      className="text-[#0856DF] font-semibold hover:underline"
                    >
                      login
                    </button>{" "}
                    to write a review.
                  </p>
                </div>
              )}

              {/* Reviews List */}
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {[...reviews].reverse().map((review, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-full bg-[#0856DF] flex items-center justify-center text-white text-sm font-bold">
                          {review.user?.username?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 capitalize">
                            {review.user?.username || "User"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Date(review.reviewDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="ml-auto flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={14}
                              className={
                                s <= review.star
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-gray-200"
                              }
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Star size={40} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-sm text-slate-500">
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
