// src/app/page.tsx (ya aapka home path)
"use client";

import React from "react";
import About from "./Components/About";
import Carousel from "./Components/Carousel";
import Products from "./Components/Products";
import CategoriesCards from "./Components/Categories"; // Make sure file name matches this or ProductCards
import Contact from "./Components/Contact";
import Reviews from "./Components/Reviews";

export default function Home() {
  return (
    <main className="w-full min-h-screen bg-[#FFFFFF] text-[#222831] dark:text-white/90 font-body overflow-x-hidden transition-colors duration-500 ease-in-out">

      {/* Hero Visual Segment */}
      <Carousel />

      {/* Premium Content Body Wrapper */}

      {/* Curated Featured Products Slider */}
      <Products />

      {/* Curated Grid Categories */}
      <CategoriesCards />

      <Reviews />
      {/* Brand Narrative Section */}
      <About />


      {/* Global Interactive Footer Context */}
      <Contact />

    </main>
  );
}