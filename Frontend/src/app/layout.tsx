import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AIProductChat from "./Components/AIProductChat";

import ClientLayout from "./ClientLayout";
import GoogleProvider from "./GoogleProvider";
import RouteProgressBar from "./Components/RouteProgressBar";
import Providers from "./Redux/Providers/provider";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const siteUrl = "https://irhasinn.vercel.app";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Irhas'Inn | Premium Online Shopping in Pakistan",
    template: "%s | Irhas'Inn",
  },
  description:
    "Shop the latest trendy fashion, accessories, and lifestyle products at Irhas'Inn. Premium quality, affordable prices, fast delivery across Pakistan.",
  keywords: [
    "Irhas'Inn",
    "online shopping Pakistan",
    "trendy fashion store",
    "premium e-commerce",
    "buy clothes online Pakistan",
    "accessories online store",
    "Irhas'Inn",
  ],
  authors: [{ name: "Irhas'Inn" }],
  creator: "Irhas'Inn",
  publisher: "Irhas'Inn",
  applicationName: "Irhas'Inn",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/Irha Studio-12.jpg", type: "image/png", sizes: "192x192" },
    ],
    apple: "/Irha Studio-12.jpg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Irhas'Inn",
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Irhas'Inn",
    title: "Irhas'Inn | Premium Online Shopping in Pakistan",
    description:
      "Shop the latest trendy fashion, accessories, and lifestyle products at Irhas'Inn. Premium quality, affordable prices, fast delivery across Pakistan.",
    images: [
      {
        url: "/Irha Studio-12.jpg",
        width: 800,
        height: 800,
        alt: "Irhas'Inn",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Irhas'Inn | Premium Online Shopping in Pakistan",
    description:
      "Shop the latest trendy fashion, accessories, and lifestyle products at Irhas'Inn.",
    images: ["/Irha Studio-12.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    google: ["O7tMFq5hf-oGfMl6diWnTNPK3H60yPhvrAoWcJuZH2o", "h9HbGrTmTRWd0g2xeUlfvs1qhHcTSm-DFmqRqLPdRlU"],
  },
  category: "e-commerce",
};

export const viewport: Viewport = {
  themeColor: "#C8A84E",
  width: "device-width",
  initialScale: 1,
};



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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Irhas'Inn",
              url: siteUrl,
              logo: `${siteUrl}/Irha Studio-12.jpg`,
              sameAs: [
                // Yahan apne social media links daal dena (Facebook, Instagram, etc.)
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Irhas'Inn",
              url: siteUrl,
              potentialAction: {
                "@type": "SearchAction",
                target: `${siteUrl}/search?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <Providers>
          <GoogleProvider>
            <ClientLayout>{children}</ClientLayout>
            <RouteProgressBar />
            <AIProductChat />
          </GoogleProvider>
        </Providers>
      </body>
    </html>
  );
}
