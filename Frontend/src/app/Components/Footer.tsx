"use client";

import React from "react";
import Link from "next/link";
import { Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48v-7.1a8.16 8.16 0 005.58 2.18v-3.45a4.85 4.85 0 01-2-.89 4.83 4.83 0 01-2-3.73z"/>
  </svg>
);

const Footer: React.FC = () => {
  return (
    <footer className="relative bg-[#222831] text-white">
      {/* Top accent line */}
      <div className="relative h-[2px] bg-gradient-to-r from-transparent via-[#00ADB5] to-transparent"></div>

      <div className="max-w-7xl mx-auto px-4 pt-14 pb-0">
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-10">
          {/* Column 1: Brand + Address + Phone */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <img
                src="/Logo.png"
                alt="Irhas'Inn"
                className="h-10 w-auto group-hover:scale-105 transition-transform duration-300"
              />
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your destination for customized, personalized products. Quality craftsmanship, delivered with care across Pakistan.
            </p>
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-start gap-2">
                <MapPin size={15} className="text-[#00ADB5] mt-0.5 shrink-0" />
                <span>Karachi, Pakistan</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={15} className="text-[#00ADB5] shrink-0" />
                <span>+92 334 3688913</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={15} className="text-[#00ADB5] shrink-0" />
                <a href="mailto:ullahsibghat786@gmail.com" className="hover:text-[#00ADB5] transition-colors">
                  ullahsibghat786@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Shopping */}
          <div>
            <h3 className="text-sm font-bold mb-5 uppercase tracking-[0.12em] text-white">
              Shopping
            </h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { name: "All Products", href: "/productsPage" },
                { name: "Featured Items", href: "/productsPage" },
                { name: "New Arrivals", href: "/productsPage?search=new" },
                { name: "Best Sellers", href: "/productsPage?search=best" },
                { name: "Track Order", href: "/track-order" },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-gray-400 hover:text-[#00ADB5] transition-colors duration-200"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Information */}
          <div>
            <h3 className="text-sm font-bold mb-5 uppercase tracking-[0.12em] text-white">
              Information
            </h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { name: "About Us", href: "/productsPage" },
                { name: "Contact Us", href: "/productsPage" },
                { name: "FAQ", href: "#" },
                { name: "Privacy Policy", href: "#" },
                { name: "Terms & Conditions", href: "#" },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-gray-400 hover:text-[#00ADB5] transition-colors duration-200"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Newsletter + Social */}
          <div>
            <h3 className="text-sm font-bold mb-5 uppercase tracking-[0.12em] text-white">
              Let&apos;s Keep in Touch
            </h3>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              Subscribe for exclusive deals, new arrivals, and trending styles.
            </p>
            <div className="flex flex-col gap-3 mb-5">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 outline-none focus:border-[#00ADB5] transition-all"
              />
              <button className="w-full px-4 py-2.5 bg-[#00ADB5] hover:bg-[#0099a1] text-white text-sm font-bold rounded-lg transition-all uppercase tracking-wider">
                Subscribe
              </button>
            </div>
            <div className="flex gap-3">
              <Link
                href="https://facebook.com/zeeftrendystore"
                target="_blank"
                className="w-9 h-9 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#1877F2] hover:border-[#1877F2] transition-all"
                aria-label="Facebook"
              >
                <Facebook size={14} />
              </Link>
              <Link
                href="https://instagram.com/zeeftrendystore"
                target="_blank"
                className="w-9 h-9 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#E4405F] hover:border-[#E4405F] transition-all"
                aria-label="Instagram"
              >
                <Instagram size={14} />
              </Link>
              <Link
                href="https://tiktok.com/@zeeftrendystore"
                target="_blank"
                className="w-9 h-9 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-black hover:border-black transition-all"
                aria-label="TikTok"
              >
                <TikTokIcon />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-5 pb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <Link href="/productsPage" className="hover:text-white transition-colors text-xs">
                Contact Us
              </Link>
              <span className="text-white/10">|</span>
              <Link href="#" className="hover:text-white transition-colors text-xs">
                Help Center
              </Link>
              <span className="text-white/10">|</span>
              <Link href="#" className="hover:text-white transition-colors text-xs">
                Give Feedback
              </Link>
            </div>
            <p className="text-xs">
              &copy; {new Date().getFullYear()} Irhas'Inn. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
