"use client";

import React from "react";
import { Truck, ShieldCheck, BadgePercent, Headphones } from "lucide-react";

const badges = [
  { icon: Truck, label: "Fast & Free Shipping", desc: "On all orders over Rs. 2,000" },
  { icon: ShieldCheck, label: "Fast Delivery", desc: "2-5 working days across Pakistan" },
  { icon: BadgePercent, label: "Low Price Guarantee", desc: "Best prices guaranteed" },
  { icon: Headphones, label: "24/7 Support", desc: "Dedicated customer care" },
];

const TrustBadges: React.FC = () => {
  return (
    <section className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
          {badges.map((badge) => {
            const Icon = badge.icon;
            return (
              <div
                key={badge.label}
                className="flex items-center gap-3 py-5 px-4 group cursor-default transition-all duration-300 hover:bg-gray-50/80"
              >
                <div className="relative w-11 h-11 rounded-full bg-[#C8A84E]/10 flex items-center justify-center shrink-0 group-hover:bg-[#C8A84E]/20 transition-all duration-300">
                  <Icon size={19} className="text-[#C8A84E] group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute inset-0 rounded-full bg-[#C8A84E]/5 scale-0 group-hover:scale-150 transition-transform duration-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#222831] leading-tight">{badge.label}</p>
                  <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{badge.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
