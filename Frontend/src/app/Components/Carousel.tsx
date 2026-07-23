"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ArrowRight, Zap, Shield } from "lucide-react";

interface Slide {
  image: string;
  tag: string;
  title: string;
  subtitle: string;
}

const slides: Slide[] = [
  // ── Images from /carousel/ folder ──
  {
    image: "/carousel/Accessories.jpg",
    tag: "New Collection",
    title: "Premium Accessories",
    subtitle: "Elevate your style with our latest curated collection of premium accessories",
  },
  {
    image: "/carousel/Clothes.jpg",
    tag: "Trending Now",
    title: "Fashion Forward",
    subtitle: "Discover the season's most sought-after fashion pieces for every occasion",
  },
  {
    image: "/carousel/Decors.jpg",
    tag: "Lifestyle Edit",
    title: "Home Décor",
    subtitle: "Transform your space with elegant décor pieces that tell your story",
  },
  {
    image: "/carousel/Electronic Devices.jpg",
    tag: "Tech Zone",
    title: "Electronics",
    subtitle: "Stay ahead with the latest gadgets and electronic essentials",
  },
  {
    image: "/carousel/Home appliances.jpg",
    tag: "Smart Home",
    title: "Appliances",
    subtitle: "Make life easier with modern home appliances designed for comfort",
  },
  // ── Loose banner images from /public/ ──
  {
    image: "/Azadi Collection.jpg",
    tag: "Limited Edition",
    title: "Azadi Collection",
    subtitle: "Celebrate freedom with our exclusive Azadi Collection — limited stock available",
  },
  {
    image: "/Eid Collection Banner.jpg",
    tag: "Festival Special",
    title: "Eid Collection",
    subtitle: "Shop our curated Eid collection for the whole family — festive styles await",
  },
  {
    image: "/Hajj Bannaer.jpg",
    tag: "Sacred Journey",
    title: "Hajj Essentials",
    subtitle: "Find everything you need for your blessed journey with our Hajj essentials",
  },
  {
    image: "/mug banner.jpg",
    tag: "Customized",
    title: "Premium Mugs",
    subtitle: "Personalized mugs that make every sip special — perfect gifts for loved ones",
  },
  {
    image: "/Pop Socket Banner.jpg",
    tag: "Accessories",
    title: "Pop Sockets",
    subtitle: "Customize your grip with trendy pop sockets — style meets function",
  },
  {
    image: "/Irha Studio-12.jpg",
    tag: "Brand Story",
    title: "Irha's Inn Studio",
    subtitle: "Discover our signature collection at Irha's Inn — where style meets comfort",
  },
];

interface PromoSlide {
  image: string;
  icon: any;
  title: string;
  subtitle: string;
  link: string;
  gradient: string;
}

const promoBanners: PromoSlide[] = [
  {
    image: "/carousel/Clothes.jpg",
    icon: Zap,
    title: "Free Shipping",
    subtitle: "On orders over Rs. 2,000",
    link: "/productsPage",
    gradient: "from-emerald-600/60 to-teal-800/80",
  },
  {
    image: "/carousel/Decors.jpg",
    icon: Shield,
    title: "New Collection",
    subtitle: "Explore trending styles",
    link: "/productsPage",
    gradient: "from-violet-600/60 to-purple-800/80",
  },
  {
    image: "/Azadi Collection.jpg",
    icon: Zap,
    title: "Azadi Sale",
    subtitle: "Limited time offers",
    link: "/productsPage",
    gradient: "from-orange-600/60 to-red-800/80",
  },
  {
    image: "/Eid Collection Banner.jpg",
    icon: Shield,
    title: "Eid Special",
    subtitle: "Shop festive favourites",
    link: "/productsPage",
    gradient: "from-amber-600/60 to-yellow-800/80",
  },
  {
    image: "/mug banner.jpg",
    icon: Zap,
    title: "Custom Mugs",
    subtitle: "Personalize your drinkware",
    link: "/productsPage",
    gradient: "from-sky-600/60 to-blue-800/80",
  },
  {
    image: "/Pop Socket Banner.jpg",
    icon: Shield,
    title: "Pop Sockets",
    subtitle: "Custom grips & stands",
    link: "/productsPage",
    gradient: "from-pink-600/60 to-rose-800/80",
  },
];

const Carousel = () => {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [promoOffset, setPromoOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [prevIndex, setPrevIndex] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);

  const updatePromo = useCallback((newIndex: number) => {
    // Advance promo offset every other slide so promo banners rotate through
    if (newIndex % 2 === 0) {
      setPromoOffset((prev) => (prev + 1) % promoBanners.length);
    }
  }, []);

  const next = useCallback(() => {
    if (isTransitioning) return;
    setPrevIndex(currentIndex);
    setIsTransitioning(true);
    const nextIdx = currentIndex === slides.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(nextIdx);
    updatePromo(nextIdx);
    setTimeout(() => setIsTransitioning(false), 700);
  }, [currentIndex, isTransitioning, updatePromo]);

  const prev = useCallback(() => {
    if (isTransitioning) return;
    setPrevIndex(currentIndex);
    setIsTransitioning(true);
    const prevIdx = currentIndex === 0 ? slides.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIdx);
    updatePromo(prevIdx);
    setTimeout(() => setIsTransitioning(false), 700);
  }, [currentIndex, isTransitioning, updatePromo]);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setPrevIndex(currentIndex);
    setIsTransitioning(true);
    setCurrentIndex(index);
    updatePromo(index);
    setTimeout(() => setIsTransitioning(false), 700);
  }, [currentIndex, isTransitioning, updatePromo]);

  // Derive which two promo banners to show (cycling through the pool)
  const promoA = promoBanners[promoOffset % promoBanners.length];
  const promoB = promoBanners[(promoOffset + 1) % promoBanners.length];

  // Auto-advance
  useEffect(() => {
    const interval = 6000;
    const timer = window.setInterval(next, interval);
    return () => window.clearInterval(timer);
  }, [next]);

  // Reset progress bar animation on slide change
  useEffect(() => {
    if (progressRef.current) {
      progressRef.current.style.animation = "none";
      void progressRef.current.offsetWidth;
      progressRef.current.style.animation = "progressBar 6s linear forwards";
    }
  }, [currentIndex]);

  const slide = slides[currentIndex];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [next, prev]);

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
              <div key={s.image} className="absolute inset-0">
                <div
                  className={`absolute inset-0 transition-all duration-[800ms] ease-in-out ${
                    i === currentIndex
                      ? "opacity-100 scale-100 animate-ken-burns"
                      : "opacity-0 scale-105"
                  }`}
                >
                  <Image
                    src={s.image}
                    alt={s.title}
                    fill
                    priority={i === 0 || i === 1}
                    sizes="(max-width: 768px) 100vw, 60vw"
                    className="object-cover"
                  />
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
          <div className="hidden md:flex md:col-span-2 flex-col gap-4">
            {[promoA, promoB].map((promo, i) => {
              const Icon = promo.icon;
              return (
                <button
                  key={`${promo.title}-${i}-${promoOffset}`}
                  onClick={() => router.push(promo.link)}
                  className="relative flex-1 min-h-[calc(50%-8px)] rounded-2xl overflow-hidden group shadow-sm hover:shadow-xl transition-all duration-500"
                >
                  {/* Background image */}
                  <img
                    src={promo.image}
                    alt={promo.title}
                    className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                  />

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
