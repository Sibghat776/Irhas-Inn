"use client";

import React, { useState, useRef, useEffect } from "react";
import { Suspense } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { baseUrl, showToast } from "../utils/commonFunctions";
import { useDispatch, useSelector } from "react-redux";
import { loginSuccess } from "../Redux/Features/authSlice";
import { AppDispatch, RootState } from "../Redux/store";
import { useRouter, useSearchParams } from "next/navigation";

const otpContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const dispatch = useDispatch<AppDispatch>();
  const data = useSelector((state: RootState) => state.auth);

  // 🔥 FIX: identifier from login.tsx
  const identifier =
    searchParams.get("identifier") ??
    data.email ??
    (data.phoneNo ? String(data.phoneNo) : null);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [timer, setTimer] = useState(60);
  const [isResending, setIsResending] = useState(false);

  // Countdown
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();

    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    const newOtp = ["", "", "", "", "", ""];

    pasted.split("").forEach((digit, index) => {
      newOtp[index] = digit;
    });

    setOtp(newOtp);

    const focusIndex = pasted.length >= 6 ? 5 : pasted.length;

    inputRefs.current[focusIndex]?.focus();
  };

  // VERIFY OTP
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setIsLoading(true);

    const finalOtp = otp.join("");

    if (!identifier) {
      setError("Identifier not found");
      setIsLoading(false);
      return;
    }

    if (finalOtp.length !== 6) {
      setError("Please enter complete 6 digit OTP");
      setIsLoading(false);
      return;
    }
    try {
      const { data: responseData } = await axios.post(
        `${baseUrl}auth/verifyOtp`,
        {
          identifier,
          otp: finalOtp,
        },
        {
          withCredentials: true,
        },
      );

      dispatch(
        loginSuccess({
          _id: responseData?.data?._id,
          username: responseData?.data?.username,
          profilePic: responseData?.data?.profilePic,
          phoneNo: responseData?.data?.phoneNo?.toString?.() ?? "",
          email: responseData?.data?.email,
          isVerified: responseData?.data?.isVerified,
          isAdmin: responseData?.data?.isAdmin ?? false,
        }),
      );

      setSuccess("OTP Verified Successfully");

      showToast("OTP Verified Successfully", "success", "light");
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  };
  const handleResendOtp = async () => {
    if (timer > 0 || isResending) return;

    if (!identifier) {
      setError("Identifier not found");
      return;
    }

    setError("");
    setSuccess("");
    setIsResending(true);

    try {
      const { data } = await axios.post(`${baseUrl}auth/resendOtp`, {
        identifier,
      });
      console.log(identifier)
      setSuccess(data?.message || "OTP Resent Successfully!");

      setOtp(["", "", "", "", "", ""]);
      setTimer(60);

      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to resend OTP");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] p-4 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md backdrop-blur-2xl bg-white/10 border border-white/10 rounded-3xl p-8 shadow-2xl"
      >
        <div className="flex justify-center mb-3">
          <ShieldCheck size={50} className="text-purple-300" />
        </div>

        <h1 className="text-center text-3xl font-bold text-white">
          Verify OTP
        </h1>

        {/* 🔥 FIXED DISPLAY */}
        <div className="mt-4 mb-6 p-3 rounded-xl bg-white/5 border border-white/10 text-center">
          <p className="text-xs text-white/60">Code sent to</p>
          <p className="text-white font-semibold truncate">{identifier}</p>
        </div>

        {/* OTP INPUTS */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-between gap-2" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                value={digit}
                maxLength={1}
                onChange={(e) => handleChange(e.target.value, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                className="w-14 h-16 text-center text-xl font-bold text-white bg-white/10 border border-white/20 rounded-2xl focus:ring-4 focus:ring-purple-500/30 outline-none transition"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-purple-500 to-blue-500 hover:scale-[1.02] transition-all shadow-lg"
          >
            {isLoading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        {/* TIMER */}
        <div className="mt-6 text-center">
          {timer > 0 ? (
            <p className="text-white/60 text-sm">
              Resend available in {timer}s
            </p>
          ) : (
            <button
              onClick={handleResendOtp}
              disabled={isResending}
              className="text-purple-300 font-semibold"
            >
              {isResending ? "Sending..." : "Resend OTP"}
            </button>
          )}
        </div>

        {/* ERROR */}
        {error && (
          <p className="mt-4 text-red-300 text-center text-sm">{error}</p>
        )}

        {/* SUCCESS */}
        {success && (
          <p className="mt-4 text-green-300 text-center text-sm">{success}</p>
        )}
      </motion.div>
    </div>
  );
};
export default otpContent;
