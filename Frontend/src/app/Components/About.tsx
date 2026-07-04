// src/Components/About.tsx
"use client";

import React from "react";
import { Target, Lightbulb, Rocket } from "lucide-react";

const About: React.FC = () => {
    return (
        <section
            id="about"
            className="w-full py-24 px-6 md:px-10 bg-[#F7F7FA] transition-colors duration-500 ease-in-out"
        >
            <div className="max-w-6xl mx-auto">
                
                {/* Header Block */}
                <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
                    <span className="text-[#0856DF] 4FA8E8] text-xs font-black uppercase tracking-[0.3em] inline-block bg-[#0856DF]/5 4FA8E8]/10 px-4 py-1.5 rounded-full">
                        Our Identity
                    </span>
                    <h2 className="text-4xl md:text-5xl font-black text-[#041241]  tracking-tight">
                        Who We <span className="bg-gradient-to-r from-[#061F95] to-[#0856DF] 4FA8E8] 0856DF] bg-clip-text text-transparent">Are</span>
                    </h2>
                    <p className="text-gray-500 /70 text-base md:text-lg font-medium leading-relaxed">
                        We are a passionate team dedicated to bringing you stylish, reliable,
                        and innovative products. From luxury clothing to premium accessories and modern tools,
                        our core mission is to seamlessly blend unparalleled quality with creative execution.
                    </p>
                </div>

                {/* 3 Premium Feature Concept Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
                    
                    {/* Card 1: Mission */}
                    <div className="group relative bg-white 041241]/40 rounded-2xl border border-gray-100 /5 p-8 text-center shadow-md hover:shadow-2xl hover:shadow-[#0856DF]/5 transform hover:-translate-y-2 transition-all duration-500 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl bg-[#0856DF]/5 0856DF]/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#0856DF] transition-all duration-500">
                            <Target className="text-[#0856DF] group-hover:text-white w-8 h-8 transition-colors duration-500" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-[#041241]  tracking-tight">
                            Our Mission
                        </h3>
                        <p className="text-gray-500 text-sm font-medium leading-relaxed">
                            Delivering premium products, fast secure logistics, and an unforgettable, 
                            tailored customer ecosystem that sets a new industry standard.
                        </p>
                        {/* Soft Base Accent Border */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[3px] bg-[#0856DF] rounded-full group-hover:w-[40%] transition-all duration-500" />
                    </div>

                    {/* Card 2: Vision */}
                    <div className="group relative bg-white rounded-2xl border border-gray-100 /5 p-8 text-center shadow-md hover:shadow-2xl hover:shadow-[#EDAE17]/5 transform hover:-translate-y-2 transition-all duration-500 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl bg-[#EDAE17]/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#EDAE17] transition-all duration-500">
                            <Lightbulb className="text-[#EDAE17] group-hover:text-white w-8 h-8 transition-colors duration-500" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-[#041241]  tracking-tight">
                            Our Vision
                        </h3>
                        <p className="text-gray-500 /60 text-sm font-medium leading-relaxed">
                            Leading the global retail & eCommerce paradigm by merging progressive creativity, 
                            ergonomic functionality, and ultimate customer loyalty.
                        </p>
                        {/* Soft Base Accent Border */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[3px] bg-[#EDAE17] rounded-full group-hover:w-[40%] transition-all duration-500" />
                    </div>

                    {/* Card 3: Future */}
                    <div className="group relative bg-white rounded-2xl border border-gray-100 /5 p-8 text-center shadow-md hover:shadow-2xl hover:shadow-purple-500/5 transform hover:-translate-y-2 transition-all duration-500 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl bg-purple-500/5 -500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-purple-600 transition-all duration-500">
                            <Rocket className="text-purple-600 group-hover:text-white w-8 h-8 transition-colors duration-500" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-[#041241]  tracking-tight">
                            Our Future
                        </h3>
                        <p className="text-gray-500 text-sm font-medium leading-relaxed">
                            Expanding globally with predictive smart systems, eco-friendly green alternatives, 
                            and automated omnichannel fulfillment interfaces.
                        </p>
                        {/* Soft Base Accent Border */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[3px] bg-purple-600 rounded-full group-hover:w-[40%] transition-all duration-500" />
                    </div>

                </div>
            </div>
        </section>
    );
};

export default About;