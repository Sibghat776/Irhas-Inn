"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

interface Slide {
  image: string;
  tag: string;
  title: string;
}

const slides: Slide[] = [
  {
    image: "/carousel/Accessories.jpg",
    tag: "New In",
    title: "Accessories",
  },
  {
    image: "/carousel/Clothes.jpg",
    tag: "Trending",
    title: "Fashion",
  },
  {
    image: "/carousel/Decors.jpg",
    tag: "Lifestyle",
    title: "Décor",
  },
  {
    image: "/carousel/Electronic Devices.jpg",
    tag: "Tech",
    title: "Electronics",
  },
  {
    image: "/carousel/Home appliances.jpg",
    tag: "Smart Home",
    title: "Appliances",
  },
];

const Carousel = () => {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  const goTo = useCallback(
    (newIndex: number) => {
      if (animating || newIndex === currentIndex) return;
      setAnimating(true);
      setCurrentIndex(newIndex);
      window.setTimeout(() => setAnimating(false), 800);
    },
    [animating, currentIndex],
  );

  const next = useCallback(() => {
    goTo(currentIndex === slides.length - 1 ? 0 : currentIndex + 1);
  }, [currentIndex, goTo]);

  const prev = useCallback(() => {
    goTo(currentIndex === 0 ? slides.length - 1 : currentIndex - 1);
  }, [currentIndex, goTo]);

  /* Auto-play — bypasses animating guard intentionally */
  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentIndex((i) => (i === slides.length - 1 ? 0 : i + 1));
    }, 6000);
    return () => window.clearInterval(timer);
  }, []);

  const slide = slides[currentIndex];
  const num = String(currentIndex + 1).padStart(2, "0");
  const total = String(slides.length).padStart(2, "0");

  return (
    <section className="relative h-screen min-h-[640px] w-full overflow-hidden bg-black">

      {/* =====================================================
          IMAGES — fade + subtle scale
      ===================================================== */}
      {slides.map((s, i) => (
        <div
          key={s.image}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${currentIndex === i
              ? "scale-100 opacity-100"
              : "scale-[1.04] opacity-0"
            }`}
        >
          <Image
            src={s.image}
            alt={s.title}
            fill
            priority={i === 0}
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
      ))}

      {/* =====================================================
          OVERLAYS — cinematic darkness
      ===================================================== */}
      {/* Bottom-up (primary dark mass) */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
      {/* Left vignette */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-black/60 via-black/10 to-transparent" />
      {/* Top edge softener */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-black/30 to-transparent" />

      {/* =====================================================
          GHOST SLIDE NUMBER — signature editorial element
      ===================================================== */}
      <div
        key={`ghost-${currentIndex}`}
        aria-hidden="true"
        className="animate-ghost-fade pointer-events-none absolute right-4 top-3 z-20 select-none font-black leading-none tracking-tighter text-white/[0.05] sm:right-8 sm:top-5"
        style={{ fontSize: "clamp(110px, 17vw, 250px)" }}
      >
        {num}
      </div>

      {/* =====================================================
          VERTICAL PROGRESS BARS — desktop only
      ===================================================== */}
      <div className="absolute right-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-3 lg:flex xl:right-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`rounded-full transition-all duration-500 ease-in-out ${i === currentIndex
                ? "h-11 w-[2px] bg-[#00ADB5]"
                : "h-4 w-[2px] bg-white/25 hover:bg-white/55"
              }`}
          />
        ))}
      </div>

      {/* =====================================================
          BOTTOM CONTENT — tag · title · CTA  +  counter · nav
      ===================================================== */}
      <div className="absolute inset-x-0 bottom-0 z-20 mx-auto max-w-7xl px-6 pb-10 sm:px-10 md:px-14 lg:px-16 xl:px-20">
        <div className="flex items-end justify-between gap-6">

          {/* ── Left: text ── */}
          <div key={slide.title} className="animate-content-rise">

            {/* Tag */}
            <div className="mb-3 flex items-center gap-3">
              <span className="h-px w-8 bg-[#00ADB5]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#00ADB5]">
                {slide.tag}
              </span>
            </div>

            {/* Title */}
            <h1
              className="font-black leading-[0.88] tracking-[-0.03em] text-white"
              style={{ fontSize: "clamp(50px, 8.5vw, 108px)" }}
            >
              {slide.title}
            </h1>

            {/* CTA */}
            <button
              type="button"
              onClick={() => router.push("/productsPage")}
              className="group mt-7 flex items-center gap-3"
            >
              <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-white transition-colors duration-300 group-hover:text-[#00ADB5]">
                Shop Now
              </span>
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-white/25 text-white transition-all duration-300 group-hover:border-[#00ADB5] group-hover:bg-[#00ADB5]">
                <ArrowRight size={15} strokeWidth={2.5} />
              </span>
            </button>
          </div>

          {/* ── Right: counter + arrows (desktop) ── */}
          <div className="hidden flex-shrink-0 flex-col items-end gap-5 md:flex">

            {/* Slide counter */}
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black tabular-nums leading-none text-white">
                {num}
              </span>
              <span className="text-xs text-white/30">/ {total}</span>
            </div>

            {/* Prev / Next arrows */}
            <div className="flex gap-2">
              <button
                onClick={prev}
                disabled={animating}
                aria-label="Previous slide"
                className="flex h-10 w-10 items-center justify-center border border-white/15 text-white/50 transition-all duration-300 hover:border-[#00ADB5]/60 hover:text-[#00ADB5] disabled:opacity-30"
              >
                <ChevronLeft size={18} strokeWidth={2} />
              </button>
              <button
                onClick={next}
                disabled={animating}
                aria-label="Next slide"
                className="flex h-10 w-10 items-center justify-center bg-[#00ADB5] text-white transition-all duration-300 hover:bg-[#009aa2] disabled:opacity-30"
              >
                <ChevronRight size={18} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile dot indicators ── */}
        <div className="mt-5 flex items-center gap-2 md:hidden">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-[2px] rounded-full transition-all duration-500 ${i === currentIndex
                  ? "w-8 bg-[#00ADB5]"
                  : "w-2 bg-white/30 hover:bg-white/60"
                }`}
            />
          ))}
        </div>
      </div>

      {/* =====================================================
          ANIMATIONS
      ===================================================== */}
      <style jsx global>{`
        @keyframes contentRise {
          from {
            opacity: 0;
            transform: translateY(22px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes ghostFade {
          from {
            opacity: 0;
            transform: translateX(12px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-content-rise {
          animation: contentRise 0.72s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .animate-ghost-fade {
          animation: ghostFade 0.65s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>
    </section>
  );
};

export default Carousel;