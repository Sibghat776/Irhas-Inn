"use client";

import { Loader2 } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "../Redux/store";

const LoadingOverlay = () => {
  const { loading, loadingMessage } = useSelector(
    (state: RootState) => state.ui,
  );

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#222831]/40 backdrop-blur-md transition-all duration-500">
      <div className="bg-white/90 px-8 py-6 rounded-3xl shadow-2xl border border-[#EEEEEE] flex flex-col items-center max-w-xs text-center">
        <div className="relative flex items-center justify-center mb-4">
          <div className="absolute w-12 h-12 border-2 border-[#EEEEEE] rounded-full"></div>
          <Loader2 className="w-12 h-12 text-[#222831] animate-spin relative z-10 stroke-[1.5]" />
        </div>
        <h3 className="text-[#222831] font-semibold tracking-tight text-lg">
          {loadingMessage}
        </h3>
        <p className="text-[#222831] text-xs mt-1 leading-relaxed">
          Loading...
        </p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
