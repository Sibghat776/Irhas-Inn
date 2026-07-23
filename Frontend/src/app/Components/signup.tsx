"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

import {
  Eye,
  EyeOff,
  ImagePlus,
  Lock,
  Mail,
  Phone,
  User,
  X,
  Sparkles,
  Loader2,
  Camera,
} from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useDispatch, useSelector } from "react-redux";

import { closeSignup } from "../Redux/Features/modalSlice";
import {
  loginFailure,
  loginRequest,
  loginSuccess,
} from "@/app/Redux/Features/authSlice";

import { AppDispatch, RootState } from "../Redux/store";
import { baseUrl, showToast } from "../utils/commonFunctions";

const Signup = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const signupOpen = useSelector((state: RootState) => state.modal.signupOpen);
  const data = useSelector((state: RootState) => state.auth);

  const [showPassword, setShowPassword] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [profilePic, setProfilePic] = useState<File | null>(null);

  const [credentials, setCredentials] = useState({
    username: "",
    email: "",
    phoneNo: "",
    password: "",
  });

  /* ==========================================
     RESET STATE ON OPEN
  ========================================== */
  useEffect(() => {
    if (signupOpen) {
      setCredentials({
        username: "",
        email: "",
        phoneNo: "",
        password: "",
      });

      setProfilePic(null);
      setPreview(null);
    }
  }, [signupOpen]);

  /* ==========================================
     INPUT CHANGE HANDLER
  ========================================== */
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCredentials((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  /* ==========================================
     IMAGE HANDLER
  ========================================== */
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProfilePic(file);
    setPreview(URL.createObjectURL(file));
  };

  /* ==========================================
     SIGNUP FORM SUBMIT
  ========================================== */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const { username, email, phoneNo, password } = credentials;

    if (!username || !email || !phoneNo || !password) {
      return showToast("All fields are required!", "error", "dark");
    }

    if (password.length < 6) {
      return showToast("Password must be at least 6 characters!", "error");
    }

    dispatch(loginRequest());

    try {
      const formData = new FormData();

      Object.entries(credentials).forEach(([key, value]) => {
        formData.append(key, value);
      });

      if (profilePic) formData.append("profilePic", profilePic);

      const res = await axios.post(`${baseUrl}auth/register`, formData);
      console.log(res?.data);

      dispatch(loginFailure(""));

      const otpSent = res?.data?.data?.otpSent;

      if (!otpSent) {
        showToast(
          "Failed to send verification OTP. Please try again.",
          "error",
        );
        return;
      }

      showToast(
        "OTP sent successfully! Please verify your account.",
        "success",
      );
      dispatch(closeSignup());
      const identifier = email || phoneNo;
      router.push(`/otpPage?identifier=${encodeURIComponent(identifier)}`);
    } catch (err: any) {
      dispatch(loginFailure(err?.response?.data?.message || "Signup Failed!"));
      showToast(err?.response?.data?.message || "Signup Failed!", "error");
    }
  };

  /* ==========================================
     GOOGLE SIGNUP HANDLER
  ========================================== */
  const handleGoogleSignup = async (response: any) => {
    dispatch(loginRequest());

    try {
      const res = await axios.post(`${baseUrl}auth/google`, {
        credential: response.credential,
      });

      dispatch(loginSuccess(res.data.data));

      showToast("Google Login Successful!", "success");
      dispatch(closeSignup());
      router.push("/");
    } catch (err: any) {
      dispatch(
        loginFailure(err?.response?.data?.message || "Google Login Failed!"),
      );

      showToast("Google Login Failed!", "error");
    }
  };

  if (!signupOpen) return null;

  return (
    <>
      {/* FULL PAGE VIEWPORT LOADER (Managed by Redux Loading State) */}
      {data.loading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#222831]/40 backdrop-blur-md transition-all duration-500">
          <div className="bg-white/90 px-8 py-6 rounded-3xl shadow-2xl border border-[#EEEEEE] flex flex-col items-center max-w-xs text-center">
            <div className="relative flex items-center justify-center mb-4">
              <div className="absolute w-12 h-12 border-2 border-[#EEEEEE] rounded-full"></div>
              <Loader2 className="w-12 h-12 text-[#222831] animate-spin relative z-10 stroke-[1.5]" />
            </div>
            <h3 className="text-[#222831] font-semibold tracking-tight text-lg">
              Irhas'Inn Authenticating
            </h3>
            <p className="text-[#222831] text-xs mt-1 leading-relaxed">
              Loading...
            </p>
          </div>
        </div>
      )}

      {/* MODAL WRAPPER */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FFFFFF] backdrop-blur-sm p-4 animate-fade-in">
        {/* MAIN CONTAINER */}
        <div className="relative w-full max-w-[480px] bg-white rounded-[28px] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.08)] border border-[#EEEEEE] p-8 sm:p-9 max-h-[92vh] overflow-y-auto no-scrollbar">
          {/* CLOSE MODAL BUTTON */}
          <button
            onClick={() => dispatch(closeSignup())}
            className="absolute right-5 top-5 p-2 text-[#222831] hover:text-[#00ADB5] bg-[#FFFFFF] hover:bg-[#EEEEEE] rounded-full transition-all duration-300"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* BRAND TITLE / HEADER */}
          <div className="text-center mb-8 mt-2">
            <div className="inline-flex items-center justify-center bg-[#00ADB5] text-white w-10 h-10 rounded-xl mb-3 shadow-md shadow-[#00ADB5]/10">
              <Sparkles className="w-5 h-5 fill-white/10" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[#222831] sm:text-3xl">
              Create Account
            </h2>
            <p className="text-xs font-medium text-[#222831] mt-1.5 uppercase tracking-widest">
              Irhas'Inn Premium Network
            </p>
          </div>

          {/* OAUTH INTEGRATION */}
          <div className="w-full flex justify-center mb-5 transform transition-all duration-300 hover:scale-[1.01]">
            <GoogleLogin onSuccess={handleGoogleSignup} />
          </div>

          {/* STYLISH ACCENT DIVIDER */}
          <div className="flex items-center gap-4 my-6">
            <div className="h-[1px] bg-[#FFFFFF] flex-1"></div>
            <span className="text-[#222831] text-[10px] font-bold uppercase tracking-[0.2em] select-none">
              Or Register Electronically
            </span>
            <div className="h-[1px] bg-[#FFFFFF] flex-1"></div>
          </div>

          {/* REGISTRATION FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* AVATAR SELECTION COMPONENT */}
            <div className="flex flex-col items-center justify-center mb-6">
              <label className="relative cursor-pointer group select-none">
                <input
                  type="file"
                  hidden
                  onChange={handleImageChange}
                  accept="image/*"
                />

                <div className="w-24 h-24 rounded-full border border-[#EEEEEE] p-1 bg-white shadow-sm transition-all duration-300 group-hover:border-[#EEEEEE] group-hover:shadow-md overflow-hidden relative">
                  <div className="w-full h-full rounded-full overflow-hidden bg-[#FFFFFF] flex items-center justify-center relative">
                    {preview ? (
                      <img
                        src={preview}
                        alt="Profile snapshot"
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <ImagePlus className="w-6 h-6 text-[#222831] stroke-[1.5]" />
                    )}
                  </div>
                </div>

                {/* Micro Camera Badge Overlay */}
                <div className="absolute bottom-0 right-0 bg-[#00ADB5] text-white p-1.5 rounded-full shadow-md border border-white transition-all duration-300 group-hover:bg-[#FFFFFF]">
                  <Camera className="w-3.5 h-3.5 stroke-[2]" />
                </div>
              </label>
            </div>

            {/* FORM INPUT STACKS */}
            <div className="space-y-3.5">
              {/* USERNAME ARCHITECTURE */}
              <div className="space-y-1.5">
                <Input
                  icon={<User className="w-4 h-4" />}
                  id="username"
                  type="text"
                  value={credentials.username}
                  onChange={handleChange}
                  placeholder="Choose unique username"
                />
              </div>

              {/* EMAIL ARCHITECTURE */}
              <Input
                icon={<Mail className="w-4 h-4" />}
                id="email"
                type="email"
                value={credentials.email}
                onChange={handleChange}
                placeholder="Secure email address"
              />

              {/* PHONE ARCHITECTURE */}
              <Input
                icon={<Phone className="w-4 h-4" />}
                id="phoneNo"
                type="tel"
                value={credentials.phoneNo}
                onChange={handleChange}
                placeholder="Contact number (03xx-xxxxxxx)"
              />

              {/* PASSWORD ARCHITECTURE */}
              <div className="relative group/pass">
                <span className="absolute left-4 top-[15px] text-[#222831] group-focus-within/pass:text-[#222831] transition-colors duration-300">
                  <Lock className="w-4 h-4 stroke-[1.8]" />
                </span>

                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={credentials.password}
                  onChange={handleChange}
                  className="w-full bg-[#FFFFFF] hover:bg-[#EEEEEE] focus:bg-white border border-[#EEEEEE] focus:border-[#00ADB5] transition-all duration-300 p-3.5 pl-11 pr-11 rounded-xl outline-none font-medium text-sm text-[#222831] placeholder-[#EEEEEE]/90 tracking-wide"
                  placeholder="Password"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-[15px] text-[#222831] hover:text-[#00ADB5] transition-colors duration-200"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 stroke-[1.8]" />
                  ) : (
                    <Eye className="w-4 h-4 stroke-[1.8]" />
                  )}
                </button>
              </div>
            </div>

            {/* COMPREHENSIVE FORM CONSOLE BUTTON */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={data.loading}
                className="w-full bg-[#00ADB5] hover:bg-[#00ADB5] text-white font-medium text-sm py-3.5 rounded-xl shadow-lg shadow-[#00ADB5]/10 hover:shadow-xl transition-all duration-300 transform active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none tracking-wide"
              >
                Create Account
              </button>
            </div>
          </form>

          {/* FORMAL DISCLAIMER FOOTER */}
          <p className="text-center text-[11px] text-[#222831] mt-6 leading-relaxed px-4">
            By accessing this portal, you align with Irhas'Inn's formal luxury
            operations framework & global verification guidelines.
          </p>
        </div>
      </div>
    </>
  );
};

export default Signup;

/* ==========================================================================
   FORMAL HIGH-END STYLED INPUT SUB-COMPONENT
========================================================================== */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ReactNode;
}

const Input = ({ icon, ...props }: InputProps) => (
  <div className="relative group/input">
    <span className="absolute left-4 top-[15px] text-[#222831] group-focus-within/input:text-[#222831] transition-colors duration-300">
      {icon}
    </span>
    <input
      {...props}
      className="w-full bg-[#FFFFFF] hover:bg-[#EEEEEE] focus:bg-white border border-[#EEEEEE] focus:border-[#00ADB5] transition-all duration-300 p-3.5 pl-11 rounded-xl outline-none font-medium text-sm text-[#222831] placeholder-[#EEEEEE]/90 tracking-wide"
    />
  </div>
);
