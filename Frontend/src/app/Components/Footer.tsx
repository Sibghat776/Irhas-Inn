"use client";

import React from "react";
import Link from "next/link";
import { Facebook, Instagram, Twitter, Linkedin } from "lucide-react";

type FooterProps = object;

const Footer: React.FC<FooterProps> = () => {
    const goWhatsapp = () => {
        window.open("https://wa.me/923343688913", "_blank");
    }
    return (
        <footer className="bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#1e3a8a] text-gray-200 px-6 md:px-20 pt-14 pb-6 relative overflow-hidden">
            {/* Decorative background circles */}
            <div className="absolute top-0 left-0 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-56 h-56 bg-blue-500/20 rounded-full blur-3xl"></div>

            <div className="relative max-w-screen-xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 z-10">
                {/* Logo and About */}
                <div>
                    <img
                        src="/carousel/Logo.png"
                        alt="Logo"
                        className="mb-4 w-[120px] h-auto"
                    />
                    <p className="text-sm leading-relaxed text-gray-300">
                        Your one-stop solution for{" "}
                        <span className="text-pink-400 font-medium">quality clothes</span>,{" "}
                        <span className="text-blue-400 font-medium">accessories</span>, and
                        more — delivered with{" "}
                        <span className="text-green-400 font-medium">speed</span> and care
                        across Pakistan.
                    </p>
                </div>

                {/* Quick Links */}
                <div>
                    <h3 className="text-lg font-semibold mb-4 text-white border-b-2 border-pink-500 inline-block pb-1">
                        Quick Links
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-300">
                        {["Home", "Products", "About Us", "Contact"].map((item, i) => (
                            <li key={i}>
                                <Link
                                    href={
                                        item === "Home"
                                            ? "/"
                                            : item === "Products"
                                                ? "#collection"
                                                : item === "About Us"
                                                    ? "#about"
                                                    : "#contact"
                                    }
                                    className="hover:text-pink-400 transition-all duration-300 relative after:absolute after:left-0 after:-bottom-0.5 after:w-0 after:h-[2px] after:bg-pink-500 hover:after:w-full after:transition-all after:duration-300"
                                >
                                    {item}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Contact Info */}
                <div>
                    <h3 className="text-lg font-semibold mb-4 text-white border-b-2 border-blue-500 inline-block pb-1">
                        Contact
                    </h3>
                    <p className="text-sm text-gray-300 mb-2">
                        Email:{" "}
                        <a
                            href="mailto:ullahsibghat786@gmail.com"
                            className="hover:text-blue-400 transition-colors"
                        >
                            ullahsibghat786@gmail.com
                        </a>
                    </p>
                    <p className="text-sm text-gray-300 mb-2">
                        Phone:{" "}
                        <span className="text-green-400 font-medium cursor-pointer hover:text-green-500" onClick={goWhatsapp}>+92 334 3688913</span>
                    </p>
                    <p className="text-sm text-gray-300">
                        Address:{" "}
                        <span className="text-yellow-400 font-medium">Karachi, Pakistan</span>
                    </p>
                </div>

                {/* Social Media */}
                <div>
                    <h3 className="text-lg font-semibold mb-4 text-white border-b-2 border-green-500 inline-block pb-1">
                        Follow Us
                    </h3>
                    <div className="flex gap-4">
                        <Link
                            href="#"
                            className="hover:text-blue-500 bg-white/10 p-2 rounded-full transition-colors hover:bg-blue-500 hover:text-white"
                            aria-label="Facebook"
                        >
                            <Facebook size={20} />
                        </Link>
                        <Link
                            href="#"
                            className="hover:text-pink-500 bg-white/10 p-2 rounded-full transition-colors hover:bg-pink-500 hover:text-white"
                            aria-label="Instagram"
                        >
                            <Instagram size={20} />
                        </Link>
                        <Link
                            href="#"
                            className="hover:text-sky-400 bg-white/10 p-2 rounded-full transition-colors hover:bg-sky-400 hover:text-white"
                            aria-label="Twitter"
                        >
                            <Twitter size={20} />
                        </Link>
                        <Link
                            href="https://www.linkedin.com/in/sibghat776/"
                            target="_blank"
                            className="hover:text-blue-400 bg-white/10 p-2 rounded-full transition-colors hover:bg-blue-400 hover:text-white"
                            aria-label="LinkedIn"
                        >
                            <Linkedin size={20} />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Footer Bottom */}
            <div className="relative z-10 text-center mt-10 border-t border-gray-700 pt-4 text-sm text-gray-400">
                &copy; {new Date().getFullYear()}{" "}
                <span className="text-pink-400 font-medium">M.M Collection</span>. All
                rights reserved.
            </div>
        </footer>
    );
};

export default Footer;