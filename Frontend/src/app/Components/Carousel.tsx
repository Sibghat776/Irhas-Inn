"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Slide {
  image: string;
  tag: string;
  title: string;
  description: string;
}

const slides: Slide[] = [
  {
    image: "/carousel/Accessories.jpeg",
    tag: "Exclusive Collection",
    title: "Mens Accessories",
    description:
      "Complete your look with our premium, carefully crafted accessories collection designed for the modern man.",
  },
  {
    image: "/carousel/Clothes-Carousel.jpeg",
    tag: "New Arrivals",
    title: "Stylish Clothes",
    description:
      "Experience luxury fabrics and trendy outfits delivered seamlessly across Pakistan with top-tier comfort.",
  },
  {
    image: "/carousel/pens.avif",
    tag: "Office Luxury",
    title: "Smooth Pens",
    description:
      "Premium quality signature pens engineered flawlessly for school, office, corporate gifting, and beyond.",
  },
  {
    image: "/carousel/Pens-and-Men-Accessories.jpg",
    tag: "Medical Essentials",
    title: "Premium Scrubs",
    description:
      "High-end, durable, and ultra-comfortable performance scrubs tailored specifically for Hospitals and Labs.",
  },
];

const Carousel = () => {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  const handleSlideChange = (newIndex: number) => {
    if (animating) return;
    setAnimating(true);
    setCurrentIndex(newIndex);
    setTimeout(() => setAnimating(false), 800); // Syncs with text animation timeline
  };

  useEffect(() => {
    const timer = setInterval(() => {
      handleSlideChange(
        currentIndex === slides.length - 1 ? 0 : currentIndex + 1,
      );
    }, 6000); // 6 seconds for rich reading time

    return () => clearInterval(timer);
  }, [currentIndex, animating]);

  return (
    <section className="relative h-[90vh] md:h-screen w-full overflow-hidden bg-[#041241]">
      {/* Background Images Layer */}
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-all duration-[1400ms] ease-in-out ${
            currentIndex === i
              ? "opacity-100 scale-100 visible"
              : "opacity-0 scale-110 invisible"
          }`}
        >
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            priority={i === 0}
            className="object-cover object-center brightness-[0.85]"
          />
        </div>
      ))}

      {/* Next-Gen Custom Overlay (Left-to-Right shadow blend for perfect dynamic text contrast) */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-white/40 via-[#041241]/40 to-[#041241]/50" />
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#041241]/30 via-transparent to-black/20" />

      {/* Main Content Layout */}
      <div className="absolute inset-0 z-20 max-w-7xl mx-auto px-6 md:px-12 flex items-center">
        <div className="max-w-2xl text-left space-y-6">
          {/* Animated Text Shell (Triggers animation on Index Switch) */}
          {slides.map((slide, i) => {
            if (i !== currentIndex) return null;
            return (
              <div key={i} className="space-y-4 animate-slideUpContent">
                {/* Dynamic Subtle Badge */}
                <span className="inline-block text-[#EDAE17] font-bold text-xs uppercase tracking-[0.25em] border-l-2 border-[#EDAE17] pl-3">
                  {slide.tag}
                </span>

                {/* Main Heading */}
                <h1 className="text-white text-4xl sm:text-5xl md:text-7xl font-black tracking-tight leading-none">
                  {slide.title}
                </h1>

                {/* Description */}
                <p className="text-[#F7F7FA]/80 text-base md:text-xl font-medium leading-relaxed max-w-xl">
                  {slide.description}
                </p>
              </div>
            );
          })}

          {/* Action Call-to-Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-4 animate-delayFadeIn">
            <button
              onClick={() => router.push("/productsPage")}
              className="px-8 py-3.5 rounded-xl font-bold text-white bg-[linear-gradient(90deg,#061F95,#0856DF)] shadow-xl shadow-[#061F95]/30 hover:shadow-[#0856DF]/40 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300">
              Explore Now
            </button>
            <button
              onClick={() => document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" })}
              className="px-8 py-3.5 rounded-xl font-bold text-white border-2 border-white/20 bg-white/5 backdrop-blur-md hover:bg-white hover:text-[#041241] hover:border-white transition-all duration-300">
              View Details
            </button>
          </div>
        </div>
      </div>

      {/* Left Control Arrow */}
      <button
        onClick={() =>
          handleSlideChange(
            currentIndex === 0 ? slides.length - 1 : currentIndex - 1,
          )
        }
        className="absolute left-6 top-1/2 -translate-y-1/2 z-30 opacity-0 md:opacity-100 translate-x-[-10px] hover:translate-x-0 group-hover:opacity-100 p-4 rounded-xl border border-black/90 bg-white/5 backdrop-blur-lg text-white hover:bg-[linear-gradient(90deg,#061F95,#0856DF)] hover:border-transparent hover:scale-105 active:scale-95 transition-all duration-300"
        aria-label="Previous Slide"
      >
        <ChevronLeft size={24} />
      </button>

      {/* Right Control Arrow */}
      <button
        onClick={() =>
          handleSlideChange(
            currentIndex === slides.length - 1 ? 0 : currentIndex + 1,
          )
        }
        className="absolute right-6 top-1/2 -translate-y-1/2 z-30 opacity-0 md:opacity-100 translate-x-[10px] hover:translate-x-0 group-hover:opacity-100 p-4 rounded-xl border border-black/90 bg-white/5 backdrop-blur-lg text-white hover:bg-[linear-gradient(90deg,#061F95,#0856DF)] hover:border-transparent hover:scale-105 active:scale-95 transition-all duration-300"
        aria-label="Next Slide"
      >
        <ChevronRight size={24} />
      </button>

      {/* Luxury Premium Dashboard Indicators (Pill Style Bars) */}
      <div className="absolute bottom-10 left-6 md:left-12 z-30 flex items-center gap-3">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => handleSlideChange(idx)}
            className={`h-2 rounded-full transition-all duration-500 relative overflow-hidden ${
              idx === currentIndex
                ? "w-12 bg-[linear-gradient(90deg,#061F95,#4FA8E8)]"
                : "w-3 bg-white/30 hover:bg-white/60"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

      {/* Seamless Component-Level Layout Styling */}
      <style jsx global>{`
        @keyframes slideUpContent {
          from {
            opacity: 0;
            transform: translateY(24px);
            filter: blur(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }
        @keyframes delayFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUpContent {
          animation: slideUpContent 0.75s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-delayFadeIn {
          animation: delayFadeIn 0.9s cubic-bezier(0.16, 1, 0.3, 1) setup
            forwards;
          animation-delay: 0.15s;
        }
      `}</style>
    </section>
  );
};

export default Carousel;
