"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";
import Signup from "./Components/signup";
import Login from "./Components/login";
import LoadingOverlay from "./Components/LoadingOverlay";
import { ToastContainer } from "react-toastify";
import { RootState } from "./Redux/store";
import { startLoading, stopLoading } from "./Redux/Features/uiSlice";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentPathRef = useRef<string | null>(null);
  const dispatch = useDispatch();
  const { loading } = useSelector((state: RootState) => state.ui);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }
  }, []);
  // Verification helper for PWA Service Worker registration status
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => {
          console.log("🟢 PWA Service Worker is active & ready:", registration.scope);
        })
        .catch((err) => {
          console.error("🔴 PWA Service Worker failed to load/register:", err);
        });
    }
  }, []);

  useEffect(() => {
    if (currentPathRef.current === null) {
      currentPathRef.current = pathname;
      return;
    }

    if (pathname !== currentPathRef.current) {
      dispatch(startLoading("Irhas'Inn"));
      currentPathRef.current = pathname;
    }
  }, [pathname, dispatch]);

  useEffect(() => {
    if (loading) {
      const timer = window.setTimeout(() => {
        dispatch(stopLoading());
      }, 600);
      return () => window.clearTimeout(timer);
    }
  }, [loading, dispatch]);

  // Safely check if the current path starts with /Admin or is exactly /otpPage
  // `startsWith` ensures that all sub-routes like /Admin/Overview, /Admin/Products etc are matched correctly.
  const hideLayout =
    pathname === "/otpPage" || (pathname && pathname.startsWith("/Admin"));

  return (
    <>
      {/* Global Loading Overlay */}
      <LoadingOverlay />

      {/* Toast Global Notification Container */}
      <ToastContainer />

      {/* Navbar - Rendered conditionally, hidden on Admin and OTP routes */}
      {!hideLayout && <Navbar />}

      {/* Main Page Content */}
      <main>{children}</main>

      {/* Global Auth Modals */}
      <Signup />
      <Login />

      {/* Footer - Rendered conditionally, hidden on Admin and OTP routes */}
      {!hideLayout && <Footer />}
    </>
  );
}
