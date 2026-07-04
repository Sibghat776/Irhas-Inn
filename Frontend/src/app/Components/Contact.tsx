"use client";

import { Mail, Phone, MapPin, Linkedin, Instagram, Twitter } from "lucide-react";
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
            className="w-full bg-white py-16 px-6 md:px-12 lg:px-24"
        >
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                {/* Left Section */}
                <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Get in Touch
                    </h2>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                        We&apos;d love to hear from you. Whether it&apos;s a question, feedback, or just
                        a hello — drop us a message!
                    </p>

                    <div className="space-y-4 text-gray-700">
                        <div className="flex items-center gap-3">
                            <Mail className="text-blue-500" size={22} />
                            <a
                                href="mailto:ullahsibghat786@gmail.com"
                                className="hover:underline"
                            >
                                ullahsibghat786@gmail.com
                            </a>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone className="text-green-500" size={22} />
                            <span>+92 334 3688913</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <MapPin className="text-red-500" size={22} />
                            <span>Karachi, Pakistan</span>
                        </div>
                    </div>

                    {/* Social Links */}
                    <div className="flex gap-5 mt-6">
                        <a
                            href="https://www.linkedin.com/in/sibghat776/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:scale-110 transition-transform"
                        >
                            <Linkedin size={28} />
                        </a>
                        <a
                            href="#"
                            className="text-pink-500 hover:scale-110 transition-transform"
                        >
                            <Instagram size={28} />
                        </a>
                        <a
                            href="#"
                            className="text-sky-500 hover:scale-110 transition-transform"
                        >
                            <Twitter size={28} />
                        </a>
                    </div>
                </div>

                {/* Right Section: Contact Form */}
                <div className="bg-gray-100 p-8 rounded-2xl shadow-lg">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label
                                htmlFor="name"
                                className="block text-sm font-medium text-gray-700 mb-1"
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
                                className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700 mb-1"
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
                                className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="message"
                                className="block text-sm font-medium text-gray-700 mb-1"
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
                                className="w-full px-4 py-2 border border-gray-300 text-black rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg shadow-md hover:bg-blue-700 transition"
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
