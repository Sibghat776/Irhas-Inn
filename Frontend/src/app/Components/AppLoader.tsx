"use client";

import { useState, useEffect, useRef } from "react";

const AppLoader = () => {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const hasShown = useRef(false);

  useEffect(() => {
    // Check if already shown this session
    if (typeof window !== "undefined") {
      try {
        const alreadyShown = sessionStorage.getItem("irhasinn_loader_shown");
        if (alreadyShown) {
          setVisible(false);
          hasShown.current = true;
          return;
        }
      } catch {
        // sessionStorage may not be available
      }
    }

    const hideLoader = () => {
      if (hasShown.current) return;
      hasShown.current = true;

      // Mark as shown for this session
      try {
        sessionStorage.setItem("irhasinn_loader_shown", "true");
      } catch {
        // ignore
      }

      // Start fade-out
      setFadeOut(true);

      // Remove from DOM after transition
      setTimeout(() => {
        setVisible(false);
      }, 500);
    };

    // Minimum display time: 800ms
    // Combine with page ready / load event
    const minTimer = setTimeout(() => {
      // Wait for window load or a max of 3 seconds
      if (document.readyState === "complete") {
        hideLoader();
      } else {
        window.addEventListener("load", hideLoader, { once: true });
        // Fallback timeout: hide after 3s max
        setTimeout(hideLoader, 2500);
      }
    }, 800);

    return () => {
      clearTimeout(minTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#222831] transition-opacity duration-700 ease-out ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Background subtle pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] opacity-50" />

      {/* Decorative accents */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-[#C8A84E]/5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-[#C8A84E]/3 blur-3xl" />

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="relative">
          {/* Glow behind logo */}
          <div className="absolute inset-0 rounded-full bg-[#C8A84E]/10 blur-xl animate-pulse" />

          {/* Logo image */}
          <div className="relative h-auto w-auto sm:h-[5rem] sm:w-[11rem] overflow-hidden rounded-2xl border-2 border-[#C8A84E]/30 shadow-lg shadow-[#C8A84E]/10">
            <img
              src="/Irha Studio-12.jpg"
              alt="Irhas'Inn"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Brand name */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Irhas'<span className="text-[#C8A84E]">Inn</span>
          </h1>
          <p className="mt-1 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
            Customize Product All In One
          </p>
        </div>

        {/* Animated dots */}
        <div className="flex items-center gap-2 mt-2">
          <div className="h-2 w-2 rounded-full bg-[#C8A84E]/60 animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="h-2 w-2 rounded-full bg-[#C8A84E]/60 animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="h-2 w-2 rounded-full bg-[#C8A84E]/60 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>

      {/* Bottom text */}
      <p className="absolute bottom-8 text-[9px] font-medium text-white/20 tracking-wider uppercase">
        Premium Quality — Delivered with Care
      </p>
    </div>
  );
};

export default AppLoader;
