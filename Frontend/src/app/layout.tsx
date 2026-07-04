import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./Redux/Providers/provider";
import ClientLayout from "./ClientLayout";
import GoogleProvider from "./GoogleProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZeeF Trendy Store",
  description: "Premium E-Commerce Store",
  manifest: "/manifest.json",
  icons: {
    icon: "/Logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ZeeF Store",
  },
};

export const viewport: Viewport = {
  themeColor: "#0856DF",
};

// Kisi bhi function/button ke andar yeh paste karke Console mein check karein
// const checkAvailableModels = async () => {
//   try {
//     const response = await fetch(
//       `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`,
//     );
//     const data = await response.json();
//     console.log(
//       "Allowed Models:",
//       data.models.map((m: any) => m.name),
//     );
//   } catch (error) {
//     console.error("Error fetching models:", error);
//   }
// };
// checkAvailableModels();
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <GoogleProvider>
            <ClientLayout>{children}</ClientLayout>
          </GoogleProvider>
        </Providers>
      </body>
    </html>
  );
}
