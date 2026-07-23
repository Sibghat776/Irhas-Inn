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
    accent: "from-amber-800/70 to-yellow-900/80",
  },
  {
    id: 2,
    titleKey: "Eid Collection",
    image: "/Eid Collection Banner.jpg",
    title: "Eid Collection",
    subtitle: "Celebrate in style",
    badge: "Limited Edition",
    link: "/productsPage?category=eid",
    accent: "from-emerald-800/70 to-teal-900/80",
  },
  {
    id: 3,
    titleKey: "Customize Pop Socket",
    image: "/Pop Socket Banner.jpg",
    title: "Customized Pop Sockets",
    subtitle: "Personalize your grip",
    badge: "Trending",
    link: "/productsPage?category=pop-socket",
    accent: "from-violet-800/70 to-purple-900/80",
  },
];

const PromoBanner: React.FC<PromoBannerProps> = ({ bannerImages = {} }) => {
  return (
    <section className="py-10 bg-gradient-to-b from-white to-gray-50/50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section heading */}
        <div className="flex items-center gap-3 mb-6">
          <Sparkles size={14} className="text-[#C8A84E]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C8A84E]">Limited Offers</span>
          <span className="h-px flex-1 bg-gray-100" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {promotions.map((promo) => {
            const resolvedImage = bannerImages[promo.titleKey] || promo.image;
            return (
              <Link
                key={promo.id}
                href={promo.link}
                className="group relative h-52 md:h-60 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
              >
                <img
                  src={resolvedImage}
                  alt={promo.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${promo.accent} opacity-90`} />
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />

                {/* Badge pill */}
                <div className="absolute top-4 left-4">
                  <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-[9px] font-bold px-3 py-1 rounded-full border border-white/20">
                    {promo.badge}
                  </span>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                  <h3 className="text-xl md:text-2xl font-black text-white leading-tight mb-1">
                    {promo.title}
                  </h3>
                  <p className="text-sm text-white/80 mb-3">{promo.subtitle}</p>
                  <div className="inline-flex items-center gap-1.5 text-white text-xs font-bold group-hover:gap-3 transition-all duration-300">
                    <span className="border-b border-white/30 group-hover:border-[#C8A84E] transition-colors">Shop Now</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/20 rounded-2xl transition-all duration-500 pointer-events-none" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PromoBanner;
