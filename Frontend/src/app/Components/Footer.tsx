"use client";

import React from "react";
import Link from "next/link";
import { Facebook, Instagram, Mail, MapPin } from "lucide-react";

const WhatsAppIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
);

const TikTokIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48v-7.1a8.16 8.16 0 005.58 2.18v-3.45a4.85 4.85 0 01-2-.89 4.83 4.83 0 01-2-3.73z"/>
    </svg>
);

const Footer: React.FC = () => {
    return (
        <footer className="relative bg-[#041241] text-white overflow-hidden">
            {/* Animated gradient mesh background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-[#0856DF]/8 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-[#EDAE17]/6 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "2s" }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#061F95]/5 rounded-full blur-[150px]"></div>
            </div>

            {/* Top accent line */}
            <div className="relative h-[2px] bg-gradient-to-r from-transparent via-[#0856DF] to-transparent"></div>

            <div className="relative px-6 md:px-20 pt-16 pb-6">
                <div className="max-w-screen-xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 z-10">
                    {/* Logo and About */}
                    <div className="space-y-5">
                        <Link href="/" className="inline-flex items-center gap-3 group">
                            <div className="relative">
                                <img
                                    src="/Logo.png"
                                    alt="ZeeF Trendy Store"
                                    className="w-[110px] h-auto group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute -inset-2 bg-[#0856DF]/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            </div>
                        </Link>
                        <p className="text-sm leading-relaxed text-gray-400">
                            Your one-stop solution for{" "}
                            <span className="text-[#0856DF] font-semibold">quality clothes</span>,{" "}
                            <span className="text-[#EDAE17] font-semibold">accessories</span>, and
                            more — delivered with{" "}
                            <span className="text-white font-semibold">speed</span> and care
                            across Pakistan.
                        </p>
                        {/* Social Media Icons */}
                        <div className="flex gap-3 pt-2">
                            <Link
                                href="https://facebook.com/zeeftrendystore"
                                target="_blank"
                                className="group relative w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300 overflow-hidden"
                                aria-label="Facebook"
                            >
                                <div className="absolute inset-0 bg-[#0856DF] translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                <Facebook size={16} className="relative z-10" />
                            </Link>
                            <Link
                                href="https://instagram.com/zeeftrendystore"
                                target="_blank"
                                className="group relative w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300 overflow-hidden"
                                aria-label="Instagram"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-[#E63E5C] to-[#EDAE17] translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                <Instagram size={16} className="relative z-10" />
                            </Link>
                            <Link
                                href="https://wa.me/923343688913"
                                target="_blank"
                                className="group relative w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300 overflow-hidden"
                                aria-label="WhatsApp"
                            >
                                <div className="absolute inset-0 bg-[#25D366] translate-y-full text-white group-hover:translate-y-0 transition-transform duration-300"></div>
                                <WhatsAppIcon />
                            </Link>
                            <Link
                                href="https://tiktok.com/@zeeftrendystore"
                                target="_blank"
                                className="group relative w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300 overflow-hidden"
                                aria-label="TikTok"
                            >
                                <div className="absolute inset-0 bg-[#010101] translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                <TikTokIcon />
                            </Link>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-sm font-bold mb-6 text-white uppercase tracking-[0.2em] relative inline-block">
                            Quick Links
                            <span className="absolute -bottom-2 left-0 w-full h-[2px] bg-gradient-to-r from-[#EDAE17] to-transparent"></span>
                        </h3>
                        <ul className="space-y-3 text-sm mt-2">
                            {[
                                { name: "Home", href: "/" },
                                { name: "Products", href: "/#collection" },
                                { name: "About Us", href: "/#about" },
                                { name: "Contact", href: "/#contact" },
                            ].map((item, i) => (
                                <li key={i}>
                                    <Link
                                        href={item.href}
                                        className="text-gray-400 hover:text-white inline-flex items-center gap-2 group transition-all duration-300"
                                    >
                                        <span className="w-0 group-hover:w-4 h-[1px] bg-[#EDAE17] transition-all duration-300"></span>
                                        <span className="group-hover:translate-x-1 transition-transform duration-300">{item.name}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-sm font-bold mb-6 text-white uppercase tracking-[0.2em] relative inline-block">
                            Contact
                            <span className="absolute -bottom-2 left-0 w-full h-[2px] bg-gradient-to-r from-[#0856DF] to-transparent"></span>
                        </h3>
                        <div className="space-y-4 text-sm mt-2">
                            <a
                                href="mailto:ullahsibghat786@gmail.com"
                                className="flex items-start gap-3 text-gray-400 hover:text-white transition-all duration-300 group"
                            >
                                <span className="w-8 h-8 rounded-lg bg-[#0856DF]/10 flex items-center justify-center shrink-0 group-hover:bg-[#0856DF]/20 transition-colors">
                                    <Mail size={14} className="text-[#0856DF]" />
                                </span>
                                <span className="mt-1 leading-relaxed">ullahsibghat786@gmail.com</span>
                            </a>
                            <a
                                href="https://wa.me/923343688913"
                                target="_blank"
                                className="flex items-start gap-3 text-gray-400 hover:text-white transition-all duration-300 group"
                            >
                                <span className="w-8 h-8 rounded-lg bg-[#25D366]/10 flex items-center justify-center shrink-0 group-hover:bg-[#25D366]/20 transition-colors">
                                    <WhatsAppIcon />
                                </span>
                                <span className="mt-1 leading-relaxed">+92 334 3688913</span>
                            </a>
                            <div className="flex items-start gap-3 text-gray-400">
                                <span className="w-8 h-8 rounded-lg bg-[#E63E5C]/10 flex items-center justify-center shrink-0">
                                    <MapPin size={14} className="text-[#E63E5C]" />
                                </span>
                                <span className="mt-1 leading-relaxed">Karachi, Pakistan</span>
                            </div>
                        </div>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h3 className="text-sm font-bold mb-6 text-white uppercase tracking-[0.2em] relative inline-block">
                            Stay Updated
                            <span className="absolute -bottom-2 left-0 w-full h-[2px] bg-gradient-to-r from-[#0856DF] to-transparent"></span>
                        </h3>
                        <p className="text-sm text-gray-400 mb-5 leading-relaxed mt-2">
                            Subscribe for exclusive deals, new arrivals, and trending styles.
                        </p>
                        <div className="flex flex-col gap-3">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:border-[#0856DF] focus:bg-white/[0.07] transition-all duration-300"
                            />
                            <button className="w-full px-4 py-3 bg-gradient-to-r from-[#061F95] to-[#0856DF] text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-[#0856DF]/30 active:scale-[0.98] transition-all duration-300 uppercase tracking-wider">
                                Subscribe
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Bottom */}
                <div className="relative mt-14 pt-6 border-t border-white/[0.06]">
                    <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
                        <p>
                            &copy; {new Date().getFullYear()}{" "}
                            <span className="text-[#0856DF] font-bold">ZeeF Trendy Store</span>. All
                            rights reserved.
                        </p>
                        <div className="flex items-center gap-6">
                            <Link href="#" className="hover:text-white transition-colors duration-300">Privacy Policy</Link>
                            <span className="text-white/10">|</span>
                            <Link href="#" className="hover:text-white transition-colors duration-300">Terms of Service</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
