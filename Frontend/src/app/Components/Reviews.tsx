"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Star,
    Quote,
    ChevronLeft,
    ChevronRight,
    MessageCircle,
} from "lucide-react";
import useFetch, { baseUrl } from "../utils/commonFunctions";

interface RatingUser {
    _id?: string;
    username?: string;
    avatar?: string;
}

interface Rating {
    _id?: string;
    rating?: number;
    review?: string;
    comment?: string;
    user?: RatingUser | null;
}

interface Product {
    _id: string;
    name: string;
    ratings?: Rating[];
}

interface ProductsResponse {
    success?: boolean;
    data?: {
        products?: Product[];
    };
}

interface Review {
    id: string;
    username: string;
    avatar?: string;
    rating: number;
    review: string;
    productName: string;
}

const Reviews = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const { data, loading, error } =
        useFetch<ProductsResponse>(
            `${baseUrl}product/getAllProducts?limit=100&sort=rating`,
        );

    /*
    ============================================================
    EXTRACT REVIEWS WHEN API DATA ARRIVES
    ============================================================
    */

    useEffect(() => {
        if (!data) return;


        const products = data?.data?.products || [];

        const allReviews: Review[] = products.flatMap(
            (product) => {
                const ratings = product.ratings || [];

                return ratings
                    .filter((rating) => {
                        /*
                        Accept review if either review OR comment exists.
                        */

                        return Boolean(
                            rating.review?.trim() ||
                            rating.comment?.trim(),
                        );
                    })
                    .map((rating, index) => ({
                        id:
                            rating._id ||
                            `${product._id}-${index}`,

                        username:
                            rating.user?.username ||
                            "Happy Customer",

                        avatar:
                            rating.user?.avatar,

                        rating: Math.min(
                            5,
                            Math.max(
                                1,
                                Number(rating.rating) || 5,
                            ),
                        ),

                        review:
                            rating.review?.trim() ||
                            rating.comment?.trim() ||
                            "Amazing product and excellent shopping experience!",

                        productName:
                            product.name,
                    }));
            },
        );

        setReviews(allReviews);
    }, [data]);

    /*
    ============================================================
    AUTO SLIDER
    ============================================================
    */

    useEffect(() => {
        if (reviews.length <= 1) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) =>
                prev === reviews.length - 1
                    ? 0
                    : prev + 1,
            );
        }, 5000);

        return () => clearInterval(timer);
    }, [reviews.length]);

    /*
    ============================================================
    SLIDER CONTROLS
    ============================================================
    */

    const nextReview = () => {
        if (!reviews.length) return;

        setCurrentIndex((prev) =>
            prev === reviews.length - 1
                ? 0
                : prev + 1,
        );
    };

    const previousReview = () => {
        if (!reviews.length) return;

        setCurrentIndex((prev) =>
            prev === 0
                ? reviews.length - 1
                : prev - 1,
        );
    };

    /*
    ============================================================
    LOADING
    ============================================================
    */

    if (loading) {
        return (
            <section className="w-full py-20">
                <div className="mx-auto max-w-6xl px-6">
                    <div className="mx-auto h-8 w-48 animate-pulse rounded-lg bg-[#EEEEEE]" />

                    <div className="mx-auto mt-4 h-4 w-72 animate-pulse rounded bg-[#EEEEEE]" />

                    <div className="mx-auto mt-10 h-[280px] max-w-3xl animate-pulse rounded-3xl bg-[#EEEEEE]" />
                </div>
            </section>
        );
    }

    /*
    ============================================================
    ERROR
    ============================================================
    */

    if (error) {
        console.error(
            "Reviews API Error:",
            error,
        );

        return null;
    }

    /*
    ============================================================
    NO REVIEWS
    ============================================================
    */

    if (!reviews.length) {
        console.log(
            "No reviews found. Products were fetched successfully, but no product contains review/comment data.",
        );

        return null;
    }

    const activeReview =
        reviews[currentIndex];

    return (
        <section className="relative w-full overflow-hidden bg-[#F8FAFA] py-20 md:py-28">
            {/* Decorative Background */}

            <div className="pointer-events-none absolute left-0 top-0 h-64 w-64 rounded-full bg-[#00ADB5]/5 blur-3xl" />

            <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#00ADB5]/5 blur-3xl" />

            <div className="relative mx-auto max-w-6xl px-5 sm:px-6">

                {/* HEADER */}

                <div className="mb-12 text-center">

                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#00ADB5]/20 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#00ADB5] shadow-sm">
                        <MessageCircle size={14} />
                        Customer Reviews
                    </div>

                    <h2 className="text-3xl font-black tracking-tight text-[#222831] sm:text-4xl md:text-5xl">
                        What Our Customers Say
                    </h2>

                    <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#222831]/60 sm:text-base">
                        Real experiences from customers who
                        love shopping with ZeeF Trendy Store.
                    </p>
                </div>

                {/* REVIEW CARD */}

                <div className="relative mx-auto max-w-4xl">

                    <div
                        key={activeReview.id}
                        className="animate-reviewSlide relative overflow-hidden rounded-[28px] border border-white bg-white p-7 shadow-[0_20px_70px_rgba(34,40,49,0.08)] sm:p-10 md:p-14"
                    >

                        {/* Quote */}

                        <div className="absolute right-8 top-8 opacity-[0.06]">
                            <Quote size={100} />
                        </div>

                        <div className="relative z-10">

                            {/* STARS */}

                            <div className="mb-7 flex items-center gap-1">
                                {Array.from({
                                    length: 5,
                                }).map((_, index) => (
                                    <Star
                                        key={index}
                                        size={19}
                                        className={
                                            index <
                                                activeReview.rating
                                                ? "fill-[#EDAE17] text-[#EDAE17]"
                                                : "text-[#D9D9D9]"
                                        }
                                    />
                                ))}
                            </div>

                            {/* REVIEW */}

                            <blockquote className="max-w-3xl text-xl font-semibold leading-relaxed text-[#222831] sm:text-2xl md:text-3xl">
                                “{activeReview.review}”
                            </blockquote>

                            {/* PRODUCT */}

                            <div className="mt-6 text-sm text-[#222831]/50">
                                Purchased:
                                <span className="ml-1 font-semibold text-[#00ADB5]">
                                    {activeReview.productName}
                                </span>
                            </div>

                            {/* USER */}

                            <div className="mt-8 flex items-center gap-4 border-t border-[#EEEEEE] pt-7">

                                {activeReview.avatar ? (
                                    <img
                                        src={activeReview.avatar}
                                        alt={
                                            activeReview.username
                                        }
                                        className="h-12 w-12 rounded-full object-cover ring-4 ring-[#00ADB5]/10"
                                    />
                                ) : (
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#00ADB5] text-lg font-bold text-white ring-4 ring-[#00ADB5]/10">
                                        {activeReview.username
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>
                                )}

                                <div>
                                    <p className="font-bold text-[#222831]">
                                        {activeReview.username}
                                    </p>

                                    <p className="text-xs font-medium text-[#222831]/50">
                                        Verified Customer
                                    </p>
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* ARROWS */}

                    {reviews.length > 1 && (
                        <>
                            <button
                                onClick={previousReview}
                                aria-label="Previous Review"
                                className="absolute -left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#EEEEEE] bg-white text-[#222831] shadow-lg transition hover:border-[#00ADB5] hover:bg-[#00ADB5] hover:text-white sm:-left-6"
                            >
                                <ChevronLeft size={20} />
                            </button>

                            <button
                                onClick={nextReview}
                                aria-label="Next Review"
                                className="absolute -right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#EEEEEE] bg-white text-[#222831] shadow-lg transition hover:border-[#00ADB5] hover:bg-[#00ADB5] hover:text-white sm:-right-6"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </>
                    )}
                </div>

                {/* DOTS */}

                {reviews.length > 1 && (
                    <div className="mt-8 flex justify-center gap-2">
                        {reviews.map((review, index) => (
                            <button
                                key={review.id}
                                onClick={() =>
                                    setCurrentIndex(index)
                                }
                                aria-label={`Go to review ${index + 1
                                    }`}
                                className={`h-2 rounded-full transition-all duration-300 ${index === currentIndex
                                        ? "w-8 bg-[#00ADB5]"
                                        : "w-2 bg-[#D5DADB] hover:bg-[#00ADB5]/50"
                                    }`}
                            />
                        ))}
                    </div>
                )}

                {/* REVIEW COUNT */}

                <p className="mt-6 text-center text-xs font-medium text-[#222831]/40">
                    Showing {currentIndex + 1} of{" "}
                    {reviews.length} customer reviews
                </p>
            </div>

            <style jsx>{`
        @keyframes reviewSlide {
          from {
            opacity: 0;
            transform: translateY(12px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-reviewSlide {
          animation: reviewSlide 0.45s ease-out;
        }
      `}</style>
        </section>
    );
};

export default Reviews;