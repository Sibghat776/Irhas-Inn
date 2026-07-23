"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ArrowRight, Zap, Shield } from "lucide-react";
import axios from "axios";
import { baseUrl } from "../utils/commonFunctions";

interface Slide {
  _id: string;
  image: string;
  tag: string;
  title: string;
  subtitle: string;
}

interface PromoSlide {
  image: string;
  icon: any;
  title: string;
  subtitle: string;
  link: string;
  gradient: string;
}

// Static promo styling — icons and gradients cycle through available images
const PROMO_STYLES = [
  { icon: Zap, gradient: "from-emerald-600/60 to-teal-800/80" },
  { icon: Shield, gradient: "from-violet-600/60 to-purple-800/80" },
  { icon: Zap, gradient: "from-orange-600/60 to-red-800/80" },
  { icon: Shield, gradient: "from-amber-600/60 to-yellow-800/80" },
  { icon: Zap, gradient: "from-sky-600/60 to-blue-800/80" },
  { icon: Shield, gradient: "from-pink-600/60 to-rose-800/80" },
];

const Carousel = () => {
  const router = useRouter();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [promoOffset, setPromoOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [prevIndex, setPrevIndex] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);

  // Fetch carousel banners from API
  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const res = await axios.get(`${baseUrl}homepage-banners?type=carousel`);
        const data = res.data?.data;
        if (Array.isArray(data) && data.length > 0) {
          setSlides(
            data.map((banner: any) => ({
              _id: banner._id,
              image: banner.image,
              tag: banner.tag || "Featured",
              title: banner.title || "Irha's Inn",
              subtitle:
                banner.subtitle ||
                "Discover our curated collection of premium products",
            })),
          );
        }
      } catch (err) {
        console.error("Failed to fetch carousel slides:", err);
        // Keep empty — will show fallback
      } finally {
        setLoading(false);
      }
    };
    fetchSlides();
  }, []);

  // Build promo banners from slides
  const promoBanners: PromoSlide[] = React.useMemo(() => {
    if (slides.length === 0) return [];
    return slides.map((slide, i) => {
      const style = PROMO_STYLES[i % PROMO_STYLES.length];
      return {
        image: slide.image,
        icon: style.icon,
        title: slide.tag || "Featured",
        subtitle: slide.title || "Collection",
        link: "/productsPage",
        gradient: style.gradient,
      };
    });
  }, [slides]);

  const updatePromo = useCallback((newIndex: number) => {
    if (newIndex % 2 === 0 && promoBanners.length > 0) {
      setPromoOffset((prev) => (prev + 1) % Math.max(1, promoBanners.length));
    }
  }, [promoBanners.length]);

  const next = useCallback(() => {
    if (isTransitioning || slides.length === 0) return;
    setPrevIndex(currentIndex);
    setIsTransitioning(true);
    const nextIdx = currentIndex === slides.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(nextIdx);
    updatePromo(nextIdx);
    setTimeout(() => setIsTransitioning(false), 700);
  }, [currentIndex, isTransitioning, updatePromo, slides.length]);

  const prev = useCallback(() => {
    if (isTransitioning || slides.length === 0) return;
    setPrevIndex(currentIndex);
    setIsTransitioning(true);
    const prevIdx = currentIndex === 0 ? slides.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIdx);
    updatePromo(prevIdx);
    setTimeout(() => setIsTransitioning(false), 700);
  }, [currentIndex, isTransitioning, updatePromo, slides.length]);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning || index === currentIndex || slides.length === 0) return;
    setPrevIndex(currentIndex);
    setIsTransitioning(true);
    setCurrentIndex(index);
    updatePromo(index);
    setTimeout(() => setIsTransitioning(false), 700);
  }, [currentIndex, isTransitioning, updatePromo, slides.length]);

  // Derive which two promo banners to show
  const promoA = promoBanners.length > 0
    ? promoBanners[promoOffset % promoBanners.length]
    : null;
  const promoB = promoBanners.length > 1
    ? promoBanners[(promoOffset + 1) % promoBanners.length]
    : null;

  // Auto-advance
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = 6000;
    const timer = window.setInterval(next, interval);
    return () => window.clearInterval(timer);
  }, [next, slides.length]);

  // Reset progress bar animation on slide change
  useEffect(() => {
    if (progressRef.current) {
      progressRef.current.style.animation = "none";
      void progressRef.current.offsetWidth;
      progressRef.current.style.animation = "progressBar 6s linear forwards";
    }
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [next, prev]);

  // ── Loading / Empty State ──
  if (loading) {
    return (
      <section className="w-full bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 md:py-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-5">
            <div className="md:col-span-3 h-[300px] sm:h-[400px] md:h-[500px] rounded-2xl bg-slate-100 animate-pulse" />
            <div className="hidden md:flex md:col-span-2 flex-col gap-4">
              <div className="flex-1 rounded-2xl bg-slate-100 animate-pulse" />
              <div className="flex-1 rounded-2xl bg-slate-100 animate-pulse" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (slides.length === 0) {
    return (
      <section className="w-full bg-gradient-to-br from-[#222831] to-[#1a1f29] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="relative max-w-7xl mx-auto px-3 sm:px-4 py-16 md:py-24 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight">
            Welcome to{" "}
            <span className="text-[#C8A84E]">Irha's Inn</span>
          </h1>
          <p className="mt-4 text-white/60 max-w-xl mx-auto">
            Discover premium customized products — mugs, apparel, accessories, and more.
            Browse our collection to find something unique.
          </p>
          <button
            onClick={() => router.push("/productsPage")}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-[#C8A84E] hover:bg-[#B8943F] text-white font-bold rounded-xl transition-all"
          >
            Shop Now <ArrowRight size={16} />
          </button>
        </div>
      </section>
    );
  }

  const slide = slides[currentIndex];

  return (
    <section className="w-full bg-white relative overflow-hidden">
      {/* Subtle background texture */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-30 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-3 sm:px-4 py-4 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-5">
          {/* ─── HERO SLIDE ─── */}
          <div
            className="relative md:col-span-3 h-[300px] sm:h-[400px] md:h-[500px] rounded-2xl overflow-hidden bg-[#222831] shadow-xl group cursor-pointer"
            onClick={() => router.push("/productsPage")}
          >
            {slides.map((s, i) => (
              <div key={s._id} className="absolute inset-0">
                <div
                  className={`absolute inset-0 transition-all duration-[800ms] ease-in-out ${
                    i === currentIndex
                      ? "opacity-100 scale-100 animate-ken-burns"
                      : "opacity-0 scale-105"
                  }`}
                >
                  <div className="absolute inset-0">
                      <Image
                        src={s.image}
                        alt={s.title}
                        fill
                        priority={i === 0 || i === 1}
                        sizes="(max-width: 768px) 100vw, 60vw"
                        className="object-cover"
                      />
                    </div>
                    <div className="absolute inset-0">
                      <Image
                        src={s.image}
                        alt={s.title}
                        fill
                        priority={i === 0 || i === 1}
                        sizes="(max-width: 768px) 100vw, 60vw"
                        className="object-contain"
                        style={{ zIndex: 2, filter: "blur(20px)", transform: "scale(1.15)" }}
                      />
                    </div>
                </div>
              </div>
            ))}

            {/* Gradient overlays */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent z-10" />

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 z-20 p-6 sm:p-8 md:p-10">
              <div key={slide.title} className="space-y-1">
                {/* Tag */}
                <div className="flex items-center gap-2.5 mb-2 opacity-0 animate-content-in" style={{ animationDelay: "0ms" }}>
                  <span className="h-0.5 w-5 bg-[#C8A84E] rounded-full" />
                  <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.3em] text-[#C8A84E]">
                    {slide.tag}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.05] tracking-tight opacity-0 animate-content-in" style={{ animationDelay: "100ms" }}>
                  {slide.title.split(" ").map((word, i, arr) => (
                    <span key={i}>
                      {i === arr.length - 1 ? (
                        <span className="text-[#C8A84E]">{word}</span>
                      ) : (
                        word
                      )}
                      {i < arr.length - 1 && " "}
                    </span>
                  ))}
                </h1>

                {/* Subtitle */}
                <p className="text-xs sm:text-sm text-white/70 max-w-md leading-relaxed mt-2 opacity-0 animate-content-in" style={{ animationDelay: "200ms" }}>
                  {slide.subtitle}
                </p>

                {/* CTA */}
                <div className="mt-4 flex items-center gap-3 opacity-0 animate-content-in" style={{ animationDelay: "300ms" }}>
                  <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C8A84E] hover:bg-[#B8943F] text-white text-[10px] font-bold uppercase tracking-[0.15em] rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-[#C8A84E]/30 hover:scale-105 active:scale-95">
                    Shop Now
                    <ArrowRight size={13} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                  <span className="text-white/40 text-[9px] font-medium hidden sm:inline">
                    Browse collection
                  </span>
                </div>
              </div>
            </div>

            {/* Top-right nav arrows */}
            <div className="absolute top-4 right-4 z-20 hidden md:flex items-center gap-1.5">
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                aria-label="Previous"
                className="flex h-8 w-8 items-center justify-center bg-white/10 backdrop-blur-md text-white/70 rounded-xl hover:bg-white/25 hover:text-white transition-all border border-white/10 hover:border-white/30 active:scale-90"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                aria-label="Next"
                className="flex h-8 w-8 items-center justify-center bg-[#C8A84E] text-white rounded-xl hover:bg-[#B8943F] transition-all shadow-lg shadow-[#C8A84E]/20 hover:shadow-[#C8A84E]/40 active:scale-90"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 z-20 h-0.5 bg-white/10">
              <div
                ref={progressRef}
                className="h-full bg-[#C8A84E] rounded-r-full origin-left"
                style={{ animation: "progressBar 6s linear forwards" }}
              />
            </div>

            {/* Dot indicators */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 md:hidden">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); goToSlide(i); }}
                  aria-label={`Slide ${i + 1}`}
                  className={`rounded-full transition-all duration-500 ${
                    i === currentIndex
                      ? "w-5 h-1.5 bg-[#C8A84E] shadow-sm"
                      : "w-1.5 h-1.5 bg-white/40 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* ─── STACKED PROMO BANNERS ─── */}
          {promoA && (
            <div className="hidden md:flex md:col-span-2 flex-col gap-4">
              {[promoA, promoB].filter(Boolean).map((promo:any, i) => {
                const Icon = promo.icon;
                return (
                  <button
                    key={`${promo.title}-${i}-${promoOffset}`}
                    onClick={() => router.push(promo.link)}
                    className="relative flex-1 min-h-[calc(50%-8px)] rounded-2xl overflow-hidden group shadow-sm hover:shadow-xl transition-all duration-500"
                  >
                    {/* Two-layer image with Instagram/Snapchat effect */}
                    <div className="absolute inset-0">
                      <Image
                        src={promo.image}
                        alt={promo.title}
                        fill
                        className="object-cover transition-all duration-700 group-hover:scale-110"
                        style={{ filter: "blur(20px)", transform: "scale(1.15)", opacity: 0.7, zIndex: 1 }}
                      />
                    </div>
                    <div className="absolute inset-0">
                      <Image
                        src={promo.image}
                        alt={promo.title}
                        fill
                        className="object-contain transition-all duration-700 group-hover:scale-110"
                        style={{ zIndex: 2 }}
                      />
                    </div>

                    {/* Gradient overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-t ${promo.gradient} opacity-90`} />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7 text-left z-10">
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-7 h-7 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center">
                          <Icon size={13} className="text-[#C8A84E]" />
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white">
                          {promo.title}
                        </span>
                      </div>
                      <p className="text-white text-base md:text-lg font-bold leading-tight">
                        {promo.subtitle}
                      </p>
                      <div className="mt-2.5 inline-flex items-center gap-1 text-white/60 text-[9px] font-bold uppercase tracking-wider group-hover:text-white transition-all group-hover:gap-2 duration-300">
                        Learn More
                        <ArrowRight size={11} />
                      </div>
                    </div>

                    {/* Hover border */}
                    <div className="absolute inset-0 border-[1.5px] border-transparent group-hover:border-white/20 rounded-2xl transition-all duration-500 pointer-events-none z-10" />

                    {/* Corner accent */}
                    <div className="absolute top-4 right-4 w-12 h-12 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
                        <path d="M0 48L48 48L48 0" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" />
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes contentIn {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes kenBurns {
          from { transform: scale(1.1); }
          to { transform: scale(1); }
        }
        @keyframes progressBar {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        .animate-content-in {
          animation: contentIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .animate-ken-burns {
          animation: kenBurns 6s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
      `}</style>
    </section>
  );
};

export default Carousel;
