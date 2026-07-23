"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

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

/*
 * NOTE: The app name shown on the Google Sign-In consent screen
 * is controlled by the Google Cloud Console OAuth consent screen
 * configuration — it CANNOT be changed from the codebase.
 *
 * To update it:
 * 1. Go to https://console.cloud.google.com/apis/credentials/consent
 * 2. Under "App information" → "App name", change it to "Irhas'Inn"
 * 3. Optionally upload /Logo.png as the app logo
 * 4. Save and re-verify the consent screen if needed
 */
