"use client";

import { X, Eye, EyeOff, Mail, Lock, Loader2, Sparkles } from "lucide-react";
import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { closeLogin, closeSignup } from "../Redux/Features/modalSlice";
import { RootState, AppDispatch } from "../Redux/store";
import { baseUrl, showToast } from "../utils/commonFunctions";
import axios from "axios";
import {
  loginFailure,
  loginRequest,
  loginSuccess,
} from "@/app/Redux/Features/authSlice";
import { useRouter } from "next/navigation"; // 👈 CRITICAL BUG FIX: Changed from 'next/router' to 'next/navigation'
import { GoogleLogin } from "@react-oauth/google";

const Login = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const loginOpen = useSelector((state: RootState) => state.modal.loginOpen);
  const { loading } = useSelector((state: RootState) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [profilePic, setProfilePic] = useState("");
  const togglePassword = () => setShowPassword((prev) => !prev);

  const [credentials, setCredentials] = useState({
    identifier: "",
    password: "",
  });

  /* ==========================================
     RESET STATE ON OPEN
  ========================================== */
  useEffect(() => {
    if (loginOpen) {
      setCredentials({
        identifier: "",
        password: "",
      });
    }
  }, [loginOpen]);

  /* ==========================================
     GOOGLE LOGIN HANDLER
  ========================================== */
  const handleGoogleSignup = async (response: any) => {
    dispatch(loginRequest());

    try {
      const res = await axios.post(
        `${baseUrl}auth/google`,
        { credential: response.credential },
        { withCredentials: true },
      );

      dispatch(loginSuccess(res.data.data));

      showToast("Google Login Successful!", "success");
      dispatch(closeLogin());
      router.push("/");
    } catch (err: any) {
      dispatch(
        loginFailure(err?.response?.data?.message || "Google Login Failed!"),
      );

      showToast("Google Login Failed!", "error");
    }
  };

  /* ==========================================
     INPUT CHANGE HANDLER
  ========================================== */
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [e.target.id]: e.target.value });
  };

  /* ==========================================
     CLOSE MODAL CONSOLE
  ========================================== */
  const handleClose = () => {
    dispatch(closeLogin());
    setCredentials({
      identifier: "",
      password: "",
    });
  };

  /* ==========================================
     FORM SUBMIT HIERARCHY
  ========================================== */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const { identifier, password } = credentials;

    if (!identifier || !password) {
      return showToast("Both Fields should be filled!", "error", "dark");
    }
    if (password.length < 6) {
      return showToast(
        "Password must be at least 6 characters!",
        "error",
        "dark",
      );
    }

    try {
      dispatch(loginRequest());
      const res = await axios.post(
        `${baseUrl}auth/login`,
        {
          identifier,
          password,
        },
        { withCredentials: true },
      );
      if (res?.data?.requiresVerification) {
        dispatch(
          loginFailure(
            "Account not verified! Please verify your account before logging in.",
          ),
        );
        showToast(
          "Account not verified! Please verify your account",
          "error",
          "dark",
        );
        dispatch(closeLogin());
        router.push(`/otpPage?identifier=${encodeURIComponent(identifier)}`);
        return;
      }

      showToast(res.data.message || "Login successful!", "success", "light");

      dispatch(
        loginSuccess({
          _id: res?.data?.data?._id,
          username: res?.data?.data?.username,
          profilePic: res?.data?.data?.profilePic,
          email: res?.data?.data?.email,
          phoneNo: res?.data?.data?.phoneNo,
          isVerified: res?.data?.data?.isVerified,
          isAdmin: res?.data?.data?.isAdmin ?? false,
        }),
      );
      dispatch(closeLogin());
    } catch (err: any) {
      console.log(err.message);
      dispatch(loginFailure(err?.response?.data?.message || "Login failed!"));
      showToast(
        err?.response?.data?.message || "Login failed!",
        "error",
        "dark",
      );
    }
  };

  if (!loginOpen) return null;

  return (
    <>
      {/* FULL PAGE VIEWPORT LOADER (Syncing with Redux State) */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/40 backdrop-blur-md transition-all duration-500">
          <div className="bg-white/90 px-8 py-6 rounded-3xl shadow-2xl border border-neutral-100 flex flex-col items-center max-w-xs text-center animate-scale-up">
            <div className="relative flex items-center justify-center mb-4">
              <div className="absolute w-12 h-12 border-2 border-neutral-200 rounded-full"></div>
              <Loader2 className="w-12 h-12 text-neutral-900 animate-spin relative z-10 stroke-[1.5]" />
            </div>
            <h3 className="text-neutral-900 font-semibold tracking-tight text-lg">
              ZF Verification
            </h3>
            <p className="text-neutral-500 text-xs mt-1 leading-relaxed">
              Establishing secure tunnel to your profile...
            </p>
          </div>
        </div>
      )}

      {/* MODAL WRAPPER */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/30 backdrop-blur-sm p-4">
        {/* MAIN CONTAINER */}
        <div className="relative w-full max-w-[460px] bg-white rounded-[28px] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.08)] border border-neutral-100/80 p-8 sm:p-9 overflow-hidden">
          {/* CLOSE BUTTON */}
          <button
            onClick={handleClose}
            className="absolute right-5 top-5 p-2 text-neutral-400 hover:text-neutral-900 bg-neutral-50 hover:bg-neutral-100/80 rounded-full transition-all duration-300"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* BRAND TITLE ARCHITECTURE */}
          <div className="text-center mb-8 mt-2">
            <div className="inline-flex items-center justify-center gap-2 bg-neutral-950 text-white w-auto py-5 px-5 h-10 rounded-xl mb-3 shadow-md shadow-neutral-950/10">
              <Sparkles className="w-5 h-5 fill-white/10" />
              <h2 className="text-xl font-bold tracking-tight text-white">
                Login
              </h2>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              Welcome Back
            </h2>
            <p className="text-xs font-medium text-neutral-400 mt-1.5 uppercase tracking-widest">
              Access ZF Store
            </p>
          </div>

          {/* OAUTH INTEGRATION */}
          <div className="w-full flex justify-center mb-5 transform transition-all duration-300 hover:scale-[1.01]">
            <GoogleLogin onSuccess={handleGoogleSignup} />
          </div>

          {/* LUXURY ACCENT DIVIDER */}
          <div className="flex items-center gap-4 my-6">
            <div className="h-[1px] bg-neutral-100 flex-1"></div>
            <span className="text-neutral-400 text-[10px] font-bold uppercase tracking-[0.2em] select-none">
              Or Secure Credentials
            </span>
            <div className="h-[1px] bg-neutral-100 flex-1"></div>
          </div>

          {/* LOGIN FORM */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-3.5">
              {/* EMAIL FIELD */}
              <Input
                icon={<Mail className="w-4 h-4" />}
                type="text"
                id="identifier"
                placeholder="Registered Email OR Phone Number"
                value={credentials.identifier}
                onChange={handleChange}
              />

              {/* PASSWORD FIELD */}
              <div className="relative group/pass">
                <span className="absolute left-4 top-[15px] text-neutral-400 group-focus-within/pass:text-neutral-900 transition-colors duration-300">
                  <Lock className="w-4 h-4 stroke-[1.8]" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Enter your Password"
                  value={credentials.password}
                  onChange={handleChange}
                  className="w-full bg-neutral-50/60 hover:bg-neutral-50 focus:bg-white border border-neutral-200/60 focus:border-neutral-900 transition-all duration-300 p-3.5 pl-11 pr-11 rounded-xl outline-none font-medium text-sm text-neutral-900 placeholder-neutral-400/90 tracking-wide"
                />
                <button
                  type="button"
                  onClick={togglePassword}
                  className="absolute right-4 top-[15px] text-neutral-400 hover:text-neutral-900 transition-colors duration-200"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 stroke-[1.8]" />
                  ) : (
                    <Eye className="w-4 h-4 stroke-[1.8]" />
                  )}
                </button>
              </div>
            </div>

            {/* ACTION CONSOLES */}
            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="w-1/3 bg-neutral-50 hover:bg-neutral-100 text-neutral-600 font-medium text-sm py-3.5 rounded-xl border border-neutral-200/80 transition-all duration-300 transform active:scale-[0.99]"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-2/3 bg-neutral-950 hover:bg-neutral-900 text-white font-medium text-sm py-3.5 rounded-xl shadow-lg shadow-neutral-950/10 hover:shadow-xl transition-all duration-300 transform active:scale-[0.99] disabled:opacity-50 tracking-wide"
              >
                Identity Verification
              </button>
            </div>
          </form>

          {/* FORMAL FOOTER NOTE */}
          <p className="text-center text-[11px] text-neutral-400 mt-6 leading-relaxed px-4">
            Secured interface environment. System access subject to formal
            verification audit logs.
          </p>
        </div>
      </div>
    </>
  );
};

export default Login;

/* ==========================================================================
   FORMAL HIGH-END STYLED INPUT SUB-COMPONENT
========================================================================== */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ReactNode;
}

const Input = ({ icon, ...props }: InputProps) => (
  <div className="relative group/input">
    <span className="absolute left-4 top-[15px] text-neutral-400 group-focus-within/input:text-neutral-900 transition-colors duration-300">
      {icon}
    </span>
    <input
      {...props}
      className="w-full bg-neutral-50/60 hover:bg-neutral-50 focus:bg-white border border-neutral-200/60 focus:border-neutral-900 transition-all duration-300 p-3.5 pl-11 rounded-xl outline-none font-medium text-sm text-neutral-900 placeholder-neutral-400/90 tracking-wide"
    />
  </div>
);
