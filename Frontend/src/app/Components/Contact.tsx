"use client";

import { Mail, Phone, MapPin, Linkedin, Instagram, Twitter, Facebook } from "lucide-react";
import { useState, FormEvent } from "react";
import axios from "axios";
import { baseUrl, showToast } from "../utils/commonFunctions";

const Contact: React.FC = () => {
    const [form, setForm] = useState({ name: "", email: "", message: "" });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!form.name || !form.email || !form.message) {
            showToast("All fields are required", "error");
            return;
        }

        try {
            await axios.post(`${baseUrl}auth/contact`, form);
            showToast("Message sent successfully!", "success");
            setForm({ name: "", email: "", message: "" });
        } catch (err: any) {
            showToast(err?.response?.data?.message || "Failed to send message", "error");
        }
    };

    return (
        <section
            id="contact"
            className="w-full bg-[#FFFFFF] py-16 px-6 md:px-12 lg:px-24"
        >
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                {/* Left Section */}
                <div className="rounded-2xl bg-[#222831] p-8 text-[#EEEEEE] shadow-lg md:p-10">
                    <span className="inline-flex rounded-full bg-[#00ADB5]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#00ADB5]">Support</span>
                    <h2 className="mt-4 text-3xl font-bold text-white md:text-4xl">
                        Get in Touch
                    </h2>
                    <p className="mb-8 leading-relaxed text-[#EEEEEE]">
                        We&apos;d love to hear from you. Whether it&apos;s a question, feedback, or just
                        a hello — drop us a message!
                    </p>

                    <div className="space-y-4 text-[#EEEEEE]">
                        <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5"><Mail className="text-[#00ADB5]" size={18} /></span>
                            <a
                                href="mailto:ullahsibghat786@gmail.com"
                                className="hover:underline"
                            >
                                ullahsibghat786@gmail.com
                            </a>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5"><Phone className="text-[#00ADB5]" size={18} /></span>
                            <span>+92 334 3688913</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5"><MapPin className="text-[#00ADB5]" size={18} /></span>
                            <span>Karachi, Pakistan</span>
                        </div>
                    </div>

                    {/* Social Links */}
                    <div className="mt-8 flex gap-3 border-t border-white/10 pt-6">
                        <a
                            href="https://www.linkedin.com/in/sibghat776/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#0A66C2] transition hover:scale-105 hover:bg-[#0A66C2] hover:text-white"
                        >
                            <Linkedin size={28} />
                        </a>
                        <a
                            href="https://www.instagram.com/zeeftrendystore/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#E4405F] transition hover:scale-105 hover:bg-[#E4405F] hover:text-white"
                        >
                            <Instagram size={28} />
                        </a>
                        <a
                            href="https://www.facebook.com/zeeftrendystore"
                            target="_blank"
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#1DA1F2] transition hover:scale-105 hover:bg-[#1DA1F2] hover:text-white"
                        >
                            <Facebook size={28} />
                        </a>
                    </div>
                </div>

                {/* Right Section: Contact Form */}
                <div className="rounded-2xl border border-[#EEEEEE] bg-white p-8 shadow-lg md:p-10">
                    <div className="mb-7 border-b border-[#EEEEEE] pb-5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00ADB5]">Message Us</p>
                        <h3 className="mt-2 text-2xl font-bold text-[#222831]">How can we help?</h3>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label
                                htmlFor="name"
                                className="block text-sm font-medium text-[#222831] mb-1"
                            >
                                Your Name
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Enter your name"
                                className="w-full px-4 py-2 border text-[#222831] border-[#EEEEEE] rounded-lg outline-none focus:ring-2 focus:ring-[#00ADB5] transition"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-[#222831] mb-1"
                            >
                                Your Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                className="w-full px-4 py-2 border text-[#222831] border-[#EEEEEE] rounded-lg outline-none focus:ring-2 focus:ring-[#00ADB5] transition"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="message"
                                className="block text-sm font-medium text-[#222831] mb-1"
                            >
                                Message
                            </label>
                            <textarea
                                id="message"
                                name="message"
                                rows={4}
                                value={form.message}
                                onChange={handleChange}
                                placeholder="Write your message..."
                                className="w-full px-4 py-2 border border-[#EEEEEE] text-[#222831] rounded-lg outline-none focus:ring-2 focus:ring-[#00ADB5] transition resize-none"
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            className="w-full rounded-lg bg-[#00ADB5] py-2.5 font-semibold text-white shadow-md transition hover:bg-[#0099a1]"
                        >
                            Send Message
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default Contact;
