"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Star,
  Quote,
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

  const { data, loading, error } =
    useFetch<ProductsResponse>(
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

    const allReviews: Review[] = products.flatMap(
      (product) => {
        const ratings = product.ratings || [];

        return ratings
          .filter((rating) => {
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
  LOADING
  ============================================================
  */

  if (loading) {
    return (
      <section className="w-full bg-[#F8FAFA] py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto h-7 w-44 animate-pulse rounded-lg bg-[#EEEEEE]" />

          <div className="mx-auto mt-3 h-4 w-64 animate-pulse rounded bg-[#EEEEEE]" />

          <div className="mt-8 flex gap-5 overflow-hidden">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-[260px] min-w-[280px] flex-1 animate-pulse rounded-2xl bg-[#EEEEEE]"
              />
            ))}
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
    console.log(
      "No reviews found. Products were fetched successfully, but no product contains review/comment data.",
    );

    return null;
  }

  /*
  ============================================================
  DUPLICATE REVIEWS FOR SEAMLESS INFINITE LOOP
  ============================================================
  */

  const infiniteReviews = [
    ...reviews,
    ...reviews,
  ];

  return (
    <section className="relative w-full overflow-hidden bg-[#F8FAFA] py-16 md:py-20">

      {/* ======================================================
          SOFT BACKGROUND DECORATION
      ======================================================= */}

      <div className="pointer-events-none absolute left-[-100px] top-[-100px] h-64 w-64 rounded-full bg-[#00ADB5]/5 blur-3xl" />

      <div className="pointer-events-none absolute bottom-[-100px] right-[-100px] h-72 w-72 rounded-full bg-[#00ADB5]/5 blur-3xl" />

      <div className="relative">

        {/* ====================================================
            SECTION HEADER
        ===================================================== */}

        <div className="mx-auto mb-10 max-w-7xl px-6 text-center">

          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#00ADB5]">
            <MessageCircle size={14} />
            Customer Reviews
          </div>

          <h2 className="text-3xl font-black tracking-tight text-[#222831] sm:text-4xl">
            What Our Customers Say
          </h2>

          <p className="mx-auto mt-3 max-w-lg text-sm text-[#222831]/55">
            Real experiences from customers who shop with
            ZeeF Trendy Store.
          </p>

        </div>

        {/* ====================================================
            CONTINUOUS SLIDER
        ===================================================== */}

        <div className="relative w-full overflow-hidden">

          {/* Left Fade */}

          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-[#F8FAFA] to-transparent md:w-28" />

          {/* Right Fade */}

          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-[#F8FAFA] to-transparent md:w-28" />

          {/* Moving Track */}

          <div className="reviews-marquee flex w-max gap-5">

            {infiniteReviews.map(
              (review, index) => (
                <article
                  key={`${review.id}-${index}`}
                  className="
                    group
                    relative
                    w-[280px]
                    shrink-0
                    rounded-2xl
                    border
                    border-[#EEEEEE]
                    bg-white
                    p-5
                    shadow-[0_8px_30px_rgba(34,40,49,0.05)]
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:shadow-[0_15px_40px_rgba(34,40,49,0.09)]
                    sm:w-[300px]
                    lg:w-[310px]
                    xl:w-[320px]
                  "
                >

                  {/* Quote Icon */}

                  <div className="absolute right-4 top-4 opacity-[0.05]">
                    <Quote size={55} />
                  </div>

                  {/* Stars */}

                  <div className="relative mb-4 flex items-center gap-0.5">

                    {Array.from({
                      length: 5,
                    }).map((_, starIndex) => (
                      <Star
                        key={starIndex}
                        size={15}
                        className={
                          starIndex <
                          review.rating
                            ? "fill-[#EDAE17] text-[#EDAE17]"
                            : "text-[#D9D9D9]"
                        }
                      />
                    ))}

                  </div>

                  {/* Review */}

                  <p className="relative line-clamp-3 min-h-[66px] text-sm font-medium leading-5 text-[#222831]/75">
                    “{review.review}”
                  </p>

                  {/* Product */}

                  <p className="mt-3 truncate text-[11px] font-medium text-[#222831]/40">
                    Purchased:
                    <span className="ml-1 font-semibold text-[#00ADB5]">
                      {review.productName}
                    </span>
                  </p>

                  {/* User */}

                  <div className="mt-5 flex items-center gap-3 border-t border-[#EEEEEE] pt-4">

                    {review.avatar ? (
                      <img
                        src={review.avatar}
                        alt={review.username}
                        className="
                          h-9
                          w-9
                          rounded-full
                          object-cover
                          ring-2
                          ring-[#00ADB5]/10
                        "
                      />
                    ) : (
                      <div
                        className="
                          flex
                          h-9
                          w-9
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          bg-[#00ADB5]
                          text-sm
                          font-bold
                          text-white
                          ring-2
                          ring-[#00ADB5]/10
                        "
                      >
                        {review.username
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0">

                      <p className="truncate text-sm font-bold text-[#222831]">
                        {review.username}
                      </p>

                      <p className="text-[10px] font-medium text-[#222831]/40">
                        Verified Customer
                      </p>

                    </div>

                  </div>

                </article>
              ),
            )}

          </div>

        </div>

      </div>

      {/* ======================================================
          CONTINUOUS ANIMATION
      ======================================================= */}

      <style jsx>{`

        .reviews-marquee {
          animation: reviewsScroll 45s linear infinite;
        }

        .reviews-marquee:hover {
          animation-play-state: paused;
        }

        @keyframes reviewsScroll {

          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(
              calc(-50% - 10px)
            );
          }

        }

        @media (max-width: 640px) {

          .reviews-marquee {
            animation-duration: 35s;
          }

        }

        @media (prefers-reduced-motion: reduce) {

          .reviews-marquee {
            animation: none;
          }

        }

      `}</style>

    </section>
  );
};

export default Reviews;