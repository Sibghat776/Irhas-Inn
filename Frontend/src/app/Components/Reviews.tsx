"use client";

import { useEffect, useState } from "react";
import { Star, Quote, MessageCircle } from "lucide-react";
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

    const { data, loading, error } = useFetch<ProductsResponse>(
        `${baseUrl}product/getAllProducts?limit=100&sort=rating`,
    );

    /*
    ============================================================
    EXTRACT REVIEWS FROM API
    ============================================================
    */

    useEffect(() => {
        if (!data) return;

        const products = data?.data?.products || [];

        const allReviews: Review[] = products.flatMap((product) => {
            const ratings = product.ratings || [];

            return ratings
                .filter((rating) => {
                    return Boolean(
                        rating.review?.trim() || rating.comment?.trim(),
                    );
                })
                .map((rating, index) => ({
                    id: rating._id || `${product._id}-${index}`,

                    username:
                        rating.user?.username || "Happy Customer",

                    avatar: rating.user?.avatar,

                    rating: Math.min(
                        5,
                        Math.max(1, Number(rating.rating) || 5),
                    ),

                    review:
                        rating.review?.trim() ||
                        rating.comment?.trim() ||
                        "Amazing product and excellent shopping experience!",

                    productName: product.name,
                }));
        });

        setReviews(allReviews);
    }, [data]);

    /*
    ============================================================
    ERROR
    ============================================================
    */

    if (error) {
        console.error("Reviews API Error:", error);
        return null;
    }

    /*
    ============================================================
    LOADING
    ============================================================
    */

    if (loading) {
        return (
            <section className="w-full bg-white py-16 md:py-20">
                <div className="mx-auto max-w-7xl px-5">
                    <div className="mx-auto h-7 w-48 animate-pulse rounded-lg bg-[#EEEEEE]" />

                    <div className="mx-auto mt-4 h-4 w-64 animate-pulse rounded bg-[#EEEEEE]" />

                    <div className="mt-10 flex gap-5 overflow-hidden">
                        <div className="h-[250px] min-w-[280px] animate-pulse rounded-2xl bg-[#EEEEEE]" />

                        <div className="hidden h-[250px] min-w-[280px] animate-pulse rounded-2xl bg-[#EEEEEE] sm:block" />

                        <div className="hidden h-[250px] min-w-[280px] animate-pulse rounded-2xl bg-[#EEEEEE] lg:block" />

                        <div className="hidden h-[250px] min-w-[280px] animate-pulse rounded-2xl bg-[#EEEEEE] xl:block" />
                    </div>
                </div>
            </section>
        );
    }

    /*
    ============================================================
    NO REVIEWS
    ============================================================
    */

    if (!reviews.length) {
        return null;
    }

    /*
    ============================================================
    DUPLICATE REVIEWS FOR INFINITE LOOP
    ============================================================
    */

    const infiniteReviews = [
        ...reviews,
        ...reviews,
        ...reviews,
    ];

    /*
    ============================================================
    MAIN REVIEWS SECTION
    ============================================================
    */

    return (
        <section className="relative w-full overflow-hidden bg-[#FFFFFF] py-14 md:py-20">
            {/* Very subtle theme accents */}

            <div className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full bg-[#00ADB5]/[0.035] blur-3xl" />

            <div className="pointer-events-none absolute -right-32 bottom-0 h-72 w-72 rounded-full bg-[#00ADB5]/[0.035] blur-3xl" />

            <div className="relative">
                {/* =====================================================
                    HEADER
                ===================================================== */}

                <div className="mx-auto mb-9 max-w-7xl px-5 text-center md:mb-12">
                    <div className="mb-3 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#00ADB5]">
                        <MessageCircle size={14} strokeWidth={2.2} />

                        <span>Customer Reviews</span>
                    </div>

                    <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-[#222831] sm:text-4xl md:text-[42px]">
                        What Our Customers Say
                    </h2>

                    <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#222831]/50">
                        Real experiences from our happy customers.
                    </p>
                </div>

                {/* =====================================================
                    SLIDER
                ===================================================== */}

                <div className="relative w-full overflow-hidden">
                    {/* Left Fade */}

                    <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-white via-white/90 to-transparent sm:w-24 md:w-36" />

                    {/* Right Fade */}

                    <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-white via-white/90 to-transparent sm:w-24 md:w-36" />
                    {/* Moving Track */}

                    <div className="reviews-marquee flex w-max gap-4 px-2 sm:gap-5">
                        {infiniteReviews.map((review, index) => (
                            <article
                                key={`${review.id}-${index}`}
                                className=" group relative flex w-[270px] shrink-0 flex-col rounded-[20px] border border-[#EEEEEE] bg-white p-5 shadow-[0_8px_30px_rgba(34,40,49,0.045)] transition-all duration-300 hover:-translate-y-1 hover:border-[#00ADB5]/20 hover:shadow-[0_18px_45px_rgba(34,40,49,0.09)] sm:w-[285px] lg:w-[300px]"
                            >
                                {/* Decorative Quote */}

                                <div className="pointer-events-none absolute right-5 top-4 text-[#00ADB5] opacity-[0.07] transition-opacity duration-300 group-hover:opacity-[0.12]">
                                    <Quote size={52} strokeWidth={1.5} />
                                </div>

                                {/* Rating */}

                                <div className="relative mb-4 flex items-center gap-1">
                                    {Array.from({ length: 5 }).map(
                                        (_, starIndex) => (
                                            <Star
                                                key={starIndex}
                                                size={15}
                                                strokeWidth={1.8}
                                                className={
                                                    starIndex < review.rating
                                                        ? "fill-[#FFCC00] text-[#FFCC00]"
                                                        : "text-[#D5DADB]"
                                                }
                                            />
                                        ),
                                    )}
                                </div>

                                {/* Review */}

                                <p className="relative min-h-[60px] text-[13px] font-medium leading-[1.65] text-[#222831]/70">
                                    “{review.review}”
                                </p>

                                {/* Product */}

                                <div className="mt-4 truncate border-t border-[#EEEEEE] pt-3 text-[10px] font-medium uppercase tracking-wide text-[#222831]/35">
                                    Purchased:
                                    <span className="ml-1.5 font-bold normal-case tracking-normal text-[#00ADB5]">
                                        {review.productName}
                                    </span>
                                </div>

                                {/* Customer */}

                                <div className="mt-4 flex items-center gap-3">
                                    {review.avatar ? (
                                        <img
                                            src={review.avatar}
                                            alt={review.username}
                                            className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-[#00ADB5]/10"
                                        />
                                    ) : (
                                        <div
                                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#222831] text-xs font-bold text-white ring-2 ring-[#00ADB5]/10"
                                        >
                                            {review.username
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>
                                    )}

                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-bold text-[#222831]">
                                            {review.username}
                                        </p>

                                        <p className="mt-0.5 text-[9px] font-medium uppercase tracking-wide text-[#222831]/35">
                                            Verified Customer
                                        </p>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </div>

            {/* =====================================================
                CONTINUOUS ANIMATION
            ===================================================== */}

            <style jsx>{`
                .reviews-marquee {
                    animation: reviewsMarquee 10s linear infinite;
                    will-change: transform;
                }

                .reviews-marquee:hover {
                    animation-play-state: paused;
                }

                @keyframes reviewsMarquee {
                    from {
                        transform: translateX(0);
                    }

                    to {
                        transform: translateX(calc(-33.333333% - 6.666px));
                    }
                }

                @media (max-width: 640px) {
                    .reviews-marquee {
                        animation-duration: 24s;
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .reviews-marquee {
                        animation-play-state: paused;
                    }
                }
            `}</style>
        </section>
    );
};

export default Reviews;