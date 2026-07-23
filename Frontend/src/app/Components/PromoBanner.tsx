"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

interface PromoBannerProps {
  bannerImages?: Record<string, string>;
}

const promotions = [
  {
    id: 1,
    titleKey: "Azaadi Collection",
    image: "/Azadi Collection.jpg",
    title: "Azaadi Collection",
    subtitle: "Celebrate freedom with style",
    badge: "Shop Now",
    link: "/productsPage?category=azaadi",
    accent: "from-amber-800/30 to-yellow-900/40",
  },
  {
    id: 2,
    titleKey: "Eid Collection",
    image: "/Eid Collection Banner.jpg",
    title: "Eid Collection",
    subtitle: "Celebrate in style",
    badge: "Limited Edition",
    link: "/productsPage?category=eid",
    accent: "from-emerald-800/30 to-teal-900/40",
  },
  {
    id: 3,
    titleKey: "Customize Pop Socket",
    image: "/Pop Socket Banner.jpg",
    title: "Customized Pop Sockets",
    subtitle: "Personalize your grip",
    badge: "Trending",
    link: "/productsPage?category=pop-socket",
    accent: "from-violet-800/30 to-purple-900/40",
  },
];

const PromoBanner: React.FC<PromoBannerProps> = ({
  bannerImages = {},
}) => {
  return (
    <section className="py-10 bg-gradient-to-b from-white to-gray-50/50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Heading */}
        <div className="flex items-center gap-3 mb-6">
          <Sparkles size={14} className="text-[#C8A84E]" />

          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C8A84E]">
            Limited Offers
          </span>

          <span className="h-px flex-1 bg-gray-100" />
        </div>

        {/* Promo Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {promotions.map((promo) => {
            const resolvedImage =
              bannerImages[promo.titleKey] || promo.image;

            return (
              <Link
                key={promo.id}
                href={promo.link}
                className="group relative h-52 md:h-60 rounded-2xl overflow-hidden bg-[#222831] shadow-sm hover:shadow-xl transition-all duration-500"
              >
                {/* ─────────────────────────────────────
                    BLURRED + ZOOMED BACKGROUND IMAGE
                ────────────────────────────────────── */}
                <div className="absolute inset-0 overflow-hidden">
                  <img
                    src={resolvedImage}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl transition-transform duration-700 group-hover:scale-[1.35]"
                  />

                  {/* Background Dark Overlay */}
                  <div className="absolute inset-0 bg-black/25" />
                </div>

                {/* ─────────────────────────────────────
                    MAIN CLEAR IMAGE
                ────────────────────────────────────── */}
                <div className="absolute inset-0 z-[2] flex items-center justify-center">
                  <img
                    src={resolvedImage}
                    alt={promo.title}
                    className="absolute inset-0 w-full h-full object-contain transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </div>

                {/* ─────────────────────────────────────
                    COLOR GRADIENT OVERLAY
                ────────────────────────────────────── */}
                <div
                  className={`absolute inset-0 z-[3] bg-gradient-to-t ${promo.accent} opacity-80`}
                />

                {/* Side Gradient */}
                <div className="absolute inset-0 z-[3] bg-gradient-to-r from-black/25 via-transparent to-transparent" />

                {/* Soft Vignette */}
                <div className="absolute inset-0 z-[3] bg-gradient-to-b from-black/10 via-transparent to-black/30" />

                {/* ─────────────────────────────────────
                    BADGE
                ────────────────────────────────────── */}
                <div className="absolute top-4 left-4 z-10">
                  <span className="inline-block bg-white/20 backdrop-blur-md text-white text-[9px] font-bold px-3 py-1 rounded-full border border-white/20 shadow-sm">
                    {promo.badge}
                  </span>
                </div>

                {/* ─────────────────────────────────────
                    CONTENT
                ────────────────────────────────────── */}
                <div className="absolute bottom-0 left-0 right-0 z-10 p-5 md:p-6">
                  <h3 className="text-xl md:text-2xl font-black text-white leading-tight mb-1">
                    {promo.title}
                  </h3>

                  <p className="text-sm text-white/80 mb-3">
                    {promo.subtitle}
                  </p>

                  <div className="inline-flex items-center gap-1.5 text-white text-xs font-bold group-hover:gap-3 transition-all duration-300">
                    <span className="border-b border-white/30 group-hover:border-[#C8A84E] transition-colors">
                      Shop Now
                    </span>

                    <ArrowRight
                      size={14}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </div>
                </div>

                {/* ─────────────────────────────────────
                    HOVER BORDER
                ────────────────────────────────────── */}
                <div className="absolute inset-0 z-20 border-2 border-transparent group-hover:border-white/20 rounded-2xl transition-all duration-500 pointer-events-none" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PromoBanner;