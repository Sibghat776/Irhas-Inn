// src/app/page.tsx (ya aapka home path)
"use client";

import React from "react";
import About from "./Components/About";
import Carousel from "./Components/Carousel";
import Products from "./Components/Products";
import CategoriesCards from "./Components/Categories"; // Make sure file name matches this or ProductCards
import Contact from "./Components/Contact";

export default function Home() {
  return (
    <main className="w-full min-h-screen bg-[#F7F7FA] text-gray-800 dark:text-white/90 font-body overflow-x-hidden transition-colors duration-500 ease-in-out">
      
      {/* Hero Visual Segment */}
      <Carousel />
      
      {/* Premium Content Body Wrapper */}
      <div className="w-full space-y-4">
        
        {/* Curated Featured Products Slider */}
        <Products />

        {/* Curated Grid Categories */}
        <CategoriesCards />
        
        {/* Elite Mid-Page Welcome Accent Banner */}
        <div className="py-12 bg-white/40 backdrop-blur-md border-y border-gray-100 dark:border-white/5 my-6">
          <div className="max-w-4xl mx-auto text-center px-6 space-y-2">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[#041241] font-brand">
              Welcome to <span className="bg-gradient-to-r from-[#061F95] via-[#0856DF] to-[#4FA8E8] bg-clip-text text-transparent">ZeeF Trendy Store</span>
            </h1>
            <div className="h-[2px] w-20 bg-[#0856DF] mx-auto rounded-full my-3 opacity-60" />
            <p className="text-gray-500 text-sm md:text-base font-medium max-w-xl mx-auto">
              Your elite destination for premium clothing, state-of-the-art electronics, and exquisite modern accessories.
            </p>
          </div>
        </div>

        {/* Brand Narrative Section */}
        <About />
        
      </div>

      {/* Global Interactive Footer Context */}
      <Contact />
      
    </main>
  );
}