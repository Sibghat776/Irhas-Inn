"use client";

import React from "react";
import { Award, Shield, Sparkles, Truck } from "lucide-react";

const stats = [
  { icon: Award, value: "500+", label: "Happy Customers" },
  { icon: Truck, value: "1000+", label: "Orders Delivered" },
  { icon: Shield, value: "100%", label: "Satisfaction" },
  { icon: Sparkles, value: "50+", label: "Custom Products" },
];

const About: React.FC = () => {
  return (
    <section id="about" className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Label */}
        <div className="flex items-center gap-3 mb-4">
          <span className="h-px w-6 bg-[#C8A84E]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C8A84E]">
            About Us
          </span>
          <span className="h-px flex-1 bg-gray-100" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left: Content */}
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-[#222831] leading-tight mb-5">
              Your Vision,{" "}
              <span className="text-[#C8A84E]">Our Craft</span>
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              At <strong className="text-[#222831]">Irhas'Inn</strong>, we specialize in bringing your
              ideas to life through premium customization. From personalized
              apparel and accessories to unique gifts and home decor, every
              product is crafted with attention to detail and a commitment to
              quality.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              Whether you&apos;re looking for branded corporate merchandise,
              custom cricket jerseys, printed mugs, or one-of-a-kind birthday
              gifts — we make it easy to design, order, and receive products
              that truly represent you.
            </p>

            {/* Highlight points */}
            <div className="space-y-3 mb-8">
              {[
                "Premium quality materials & printing",
                "Custom designs tailored to your needs",
                "Fast delivery across Pakistan",
                "Easy ordering & dedicated support",
              ].map((point, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#C8A84E]/10">
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#C8A84E"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="group rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm hover:shadow-md hover:border-[#C8A84E]/30 transition-all duration-300"
                >
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#C8A84E]/10 text-[#C8A84E] group-hover:bg-[#C8A84E] group-hover:text-white transition-all duration-300">
                    <Icon size={22} />
                  </div>
                  <p className="text-2xl md:text-3xl font-black text-[#222831]">{stat.value}</p>
                  <p className="text-xs text-gray-500 font-medium mt-1">{stat.label}</p>
                </div>
              );
            })}

            {/* Brand statement */}
            <div className="col-span-2 rounded-2xl bg-[#222831] p-6 text-center">
              <p className="text-[#C8A84E] font-bold text-sm mb-1 tracking-wider uppercase">
                Irhas'Inn
              </p>
              <p className="text-white/80 text-sm leading-relaxed">
                Customize Product All In One — Premium Quality, Delivered with Care Across Pakistan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
