// src/Components/About.tsx
"use client";

import React from "react";
import { Target, Lightbulb, Rocket } from "lucide-react";

const About: React.FC = () => {
    return (
        <section
            id="about"
            className="w-full py-24 px-6 md:px-10 bg-[#FFFFFF] transition-colors duration-500 ease-in-out"
        >
            <div className="max-w-6xl mx-auto">
                
                {/* Header Block */}
                <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
                    <span className="text-[#00ADB5] text-xs font-black uppercase tracking-[0.3em] inline-block border border-[#00ADB5]/25 bg-[#00ADB5]/10 px-4 py-1.5 rounded-full">
                        Our Identity
                    </span>
                    <h2 className="text-4xl md:text-5xl font-black text-[#222831] tracking-tight">
                        Who We <span className="bg-gradient-to-r from-[#00ADB5] to-[#00ADB5] bg-clip-text text-transparent">Are</span>
                    </h2>
                    <p className="text-[#222831]/75 text-base md:text-lg font-medium leading-relaxed">
                        We are a passionate team dedicated to bringing you stylish, reliable,
                        and innovative products. From luxury clothing to premium accessories and modern tools,
                        our core mission is to seamlessly blend unparalleled quality with creative execution.
                    </p>
                </div>

                {/* 3 Premium Feature Concept Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
                    
                    {/* Card 1: Mission */}
                    <div className="group relative bg-white rounded-2xl border border-[#EEEEEE] p-8 text-center shadow-md hover:shadow-2xl hover:shadow-[#00ADB5]/5 transform hover:-translate-y-2 transition-all duration-500 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl bg-[#00ADB5]/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#222831] transition-all duration-500">
                            <Target className="text-[#222831] group-hover:text-white w-8 h-8 transition-colors duration-500" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-[#222831]  tracking-tight">
                            Our Mission
                        </h3>
                        <p className="text-[#222831] text-sm font-medium leading-relaxed">
                            Delivering premium products, fast secure logistics, and an unforgettable, 
                            tailored customer ecosystem that sets a new industry standard.
                        </p>
                        {/* Soft Base Accent Border */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[3px] bg-[#00ADB5] rounded-full group-hover:w-[40%] transition-all duration-500" />
                    </div>

                    {/* Card 2: Vision */}
                    <div className="group relative bg-white rounded-2xl border border-[#EEEEEE] p-8 text-center shadow-md hover:shadow-2xl hover:shadow-[#222831]/10 transform hover:-translate-y-2 transition-all duration-500 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl bg-[#222831]/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#222831] transition-all duration-500">
                            <Lightbulb className="text-[#222831] group-hover:text-white w-8 h-8 transition-colors duration-500" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-[#222831]  tracking-tight">
                            Our Vision
                        </h3>
                        <p className="text-[#222831] text-sm font-medium leading-relaxed">
                            Leading the global retail & eCommerce paradigm by merging progressive creativity, 
                            ergonomic functionality, and ultimate customer loyalty.
                        </p>
                        {/* Soft Base Accent Border */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[3px] bg-[#222831] rounded-full group-hover:w-[40%] transition-all duration-500" />
                    </div>

                    {/* Card 3: Future */}
                    <div className="group relative bg-white rounded-2xl border border-[#EEEEEE] p-8 text-center shadow-md hover:shadow-2xl hover:shadow-[#00ADB5]/5 transform hover:-translate-y-2 transition-all duration-500 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl bg-[#00ADB5]/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#00ADB5] transition-all duration-500">
                            <Rocket className="text-[#00ADB5] group-hover:text-white w-8 h-8 transition-colors duration-500" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-[#222831]  tracking-tight">
                            Our Future
                        </h3>
                        <p className="text-[#222831] text-sm font-medium leading-relaxed">
                            Expanding globally with predictive smart systems, eco-friendly green alternatives, 
                            and automated omnichannel fulfillment interfaces.
                        </p>
                        {/* Soft Base Accent Border */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[3px] bg-[#00ADB5] rounded-full group-hover:w-[40%] transition-all duration-500" />
                    </div>

                </div>
            </div>
        </section>
    );
};

export default About;
