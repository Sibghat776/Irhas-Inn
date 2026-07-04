"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { useEffect } from "react";
import { baseUrl } from "./utils/commonFunctions";
import { useDispatch } from "react-redux";
import { logout } from "./Redux/Features/authSlice";

export default function GoogleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GoogleOAuthProvider
      clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string}
    >
      {children}
    </GoogleOAuthProvider>
  );
}
