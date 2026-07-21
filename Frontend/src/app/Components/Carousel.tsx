"use client";

import { useState, useEffect, useCallback } from "react";
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
    description: "Premium accessories designed to complete your everyday style.",
  },
  {
    image: "/carousel/Clothes-Carousel.jpeg",
    tag: "New Arrivals",
    title: "Stylish Clothes",
    description: "Modern styles made for comfort, confidence, and everyday living.",
  },
  {
    image: "/carousel/pens.avif",
    tag: "Office Luxury",
    title: "Smooth Pens",
    description: "Premium pens made for writing, gifting, and making an impression.",
  },
  {
    image: "/carousel/Pens-and-Men-Accessories.jpg",
    tag: "Medical Essentials",
    title: "Premium Scrubs",
    description: "Comfortable and durable scrubs designed for everyday performance.",
  },
];

const Carousel = () => {
  const router = useRouter();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  const handleSlideChange = useCallback(
    (newIndex: number) => {
      if (animating || newIndex === currentIndex) return;

      setAnimating(true);
      setCurrentIndex(newIndex);

      window.setTimeout(() => {
        setAnimating(false);
      }, 700);
    },
    [animating, currentIndex],
  );

  const handleNext = () => {
    handleSlideChange(
      currentIndex === slides.length - 1 ? 0 : currentIndex + 1,
    );
  };

  const handlePrevious = () => {
    handleSlideChange(
      currentIndex === 0 ? slides.length - 1 : currentIndex - 1,
    );
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentIndex((previousIndex) =>
        previousIndex === slides.length - 1 ? 0 : previousIndex + 1,
      );
    }, 6000);

    return () => window.clearInterval(timer);
  }, []);

  const activeSlide = slides[currentIndex];

  return (
    <section className="relative h-[calc(100vh-72px)] min-h-[580px] w-full overflow-hidden bg-[#EEEEEE]">
      {/* =========================================================
          HERO IMAGE
          Full screen image with subtle neutral treatment
      ========================================================== */}

      {slides.map((slide, index) => (
        <div
          key={slide.image}
          className={`absolute inset-0 transition-all duration-1000 ease-out ${currentIndex === index
              ? "visible scale-100 opacity-100"
              : "invisible scale-[1.03] opacity-0"
            }`}
        >
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            priority={index === 0}
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
      ))}

      {/* =========================================================
          SOFT NEUTRAL CONTENT BACKDROP
          Not white, not dark
      ========================================================== */}

      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-[#EEEEEE]/95 via-[#EEEEEE]/75 via-45% to-transparent" />

      {/* Very subtle bottom depth */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-[#222831]/10 to-transparent" />

      {/* =========================================================
          CONTENT
      ========================================================== */}

      <div className="relative z-20 mx-auto flex h-full min-h-[580px] max-w-7xl items-center px-6 sm:px-10 md:px-14 lg:px-16 xl:px-20">
        <div
          key={activeSlide.title}
          className="max-w-[430px] animate-carousel-content"
        >
          {/* Small Tag */}
          <div className="mb-4 flex items-center gap-3">
            <span className="h-[2px] w-7 rounded-full bg-[#00ADB5]" />

            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00ADB5]">
              {activeSlide.tag}
            </span>
          </div>

          {/* Short Title */}
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-[-0.035em] text-[#222831] sm:text-5xl md:text-6xl">
            {activeSlide.title}
          </h1>

          {/* Short Description */}
          <p className="mt-5 max-w-[370px] text-sm font-medium leading-6 text-[#222831]/65 sm:text-base">
            {activeSlide.description}
          </p>

          {/* Single CTA */}
          <button
            type="button"
            onClick={() => router.push("/productsPage")}
            className="mt-7 rounded-lg bg-[#00ADB5] px-7 py-3.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(0,173,181,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0099A1] hover:shadow-[0_12px_28px_rgba(0,173,181,0.28)] active:translate-y-0"
          >
            Explore Now
          </button>
        </div>
      </div>

      {/* =========================================================
          PREVIOUS BUTTON
      ========================================================== */}

      <button
        type="button"
        onClick={handlePrevious}
        disabled={animating}
        aria-label="Previous Slide"
        className="absolute left-5 top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#222831]/10 bg-[#EEEEEE]/80 text-[#222831] shadow-md backdrop-blur-sm transition-all duration-300 hover:border-[#00ADB5] hover:bg-[#00ADB5] hover:text-white md:flex lg:left-8"
      >
        <ChevronLeft size={20} strokeWidth={2} />
      </button>

      {/* =========================================================
          NEXT BUTTON
      ========================================================== */}

      <button
        type="button"
        onClick={handleNext}
        disabled={animating}
        aria-label="Next Slide"
        className="absolute right-5 top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#222831]/10 bg-[#EEEEEE]/80 text-[#222831] shadow-md backdrop-blur-sm transition-all duration-300 hover:border-[#00ADB5] hover:bg-[#00ADB5] hover:text-white md:flex lg:right-8"
      >
        <ChevronRight size={20} strokeWidth={2} />
      </button>

      {/* =========================================================
          SLIDE INDICATORS
      ========================================================== */}

      <div className="absolute bottom-7 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.title}
            type="button"
            onClick={() => handleSlideChange(index)}
            aria-label={`Go to ${slide.title} slide`}
            aria-current={index === currentIndex ? "true" : "false"}
            className={`h-1.5 rounded-full transition-all duration-500 ${index === currentIndex
                ? "w-9 bg-[#00ADB5]"
                : "w-2 bg-[#222831]/25 hover:bg-[#00ADB5]/60"
              }`}
          />
        ))}
      </div>

      {/* =========================================================
          ANIMATION
      ========================================================== */}

      <style jsx global>{`
        @keyframes carouselContent {
          from {
            opacity: 0;
            transform: translateY(14px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-carousel-content {
          animation: carouselContent 0.65s
            cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>
    </section>
  );
};

export default Carousel;