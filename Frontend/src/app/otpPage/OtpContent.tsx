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
      console.log(identifier);
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
    <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC] px-4 py-8 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-[#0856DF]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-[#EDAE17]/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-[0_20px_60px_rgba(4,18,65,0.10)] p-6 sm:p-8"
      >
        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-[#0856DF]/10 flex items-center justify-center">
            <ShieldCheck
              size={34}
              strokeWidth={2}
              className="text-[#0856DF]"
            />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#041241] tracking-tight">
            Verify OTP
          </h1>

          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            Enter the 6-digit verification code sent to your account.
          </p>
        </div>

        {/* Identifier */}
        <div className="mt-6 p-4 rounded-2xl bg-[#F7F9FC] border border-gray-100 text-center">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Code sent to
          </p>

          <p className="mt-1 text-sm sm:text-base font-bold text-[#041241] truncate">
            {identifier}
          </p>
        </div>

        {/* OTP INPUTS */}
        <form onSubmit={handleSubmit} className="mt-7 space-y-6">
          <div
            className="flex justify-center gap-2 sm:gap-3"
            onPaste={handlePaste}
          >
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                value={digit}
                maxLength={1}
                inputMode="numeric"
                onChange={(e) => handleChange(e.target.value, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                className="w-11 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold text-[#041241] bg-white border-2 border-gray-200 rounded-xl sm:rounded-2xl outline-none transition-all duration-200 focus:border-[#0856DF] focus:ring-4 focus:ring-[#0856DF]/10 hover:border-gray-300"
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-13 py-3.5 rounded-2xl font-bold text-white bg-[#0856DF] hover:bg-[#0649C2] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-[#0856DF]/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-[#0856DF]"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying...
              </span>
            ) : (
              "Verify OTP"
            )}
          </button>
        </form>

        {/* TIMER / RESEND */}
        <div className="mt-6 text-center">
          {timer > 0 ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-100">
              <span className="text-sm text-gray-500">
                Resend available in
              </span>

              <span className="text-sm font-bold text-[#0856DF]">
                {timer}s
              </span>
            </div>
          ) : (
            <button
              onClick={handleResendOtp}
              disabled={isResending}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-bold text-[#0856DF] bg-[#0856DF]/5 hover:bg-[#0856DF]/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#0856DF]/30 border-t-[#0856DF] rounded-full animate-spin" />
                  Sending...
                </span>
              ) : (
                "Resend OTP"
              )}
            </button>
          )}
        </div>

        {/* ERROR */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 px-4 py-3 rounded-xl bg-red-50 border border-red-100"
          >
            <p className="text-red-600 text-center text-sm font-medium">
              {error}
            </p>
          </motion.div>
        )}

        {/* SUCCESS */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 px-4 py-3 rounded-xl bg-green-50 border border-green-100"
          >
            <p className="text-green-600 text-center text-sm font-medium">
              {success}
            </p>
          </motion.div>
        )}

        {/* Bottom Security Text */}
        <div className="mt-7 pt-5 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Your verification code is secure and private.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default otpContent;