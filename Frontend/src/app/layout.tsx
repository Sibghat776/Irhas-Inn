import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./Redux/Providers/provider";
import ClientLayout from "./ClientLayout";
import GoogleProvider from "./GoogleProvider";
import NotificationPrompt from "./Components/NotificationPrompt";
import RouteProgressBar from "./Components/RouteProgressBar";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const siteUrl = "https://zeeftrendystore.vercel.app";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ZeeF Trendy Store | Premium Online Shopping in Pakistan",
    template: "%s | ZeeF Trendy Store",
  },
  description:
    "Shop the latest trendy fashion, accessories, and lifestyle products at ZeeF Trendy Store. Premium quality, affordable prices, fast delivery across Pakistan.",
  keywords: [
    "ZeeF Trendy Store",
    "online shopping Pakistan",
    "trendy fashion store",
    "premium e-commerce",
    "buy clothes online Pakistan",
    "accessories online store",
    "ZeeF Store",
  ],
  authors: [{ name: "ZeeF Trendy Store" }],
  creator: "ZeeF Trendy Store",
  publisher: "ZeeF Trendy Store",
  applicationName: "ZeeF Trendy Store",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/Logo.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/Logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ZeeF Store",
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
    siteName: "ZeeF Trendy Store",
    title: "ZeeF Trendy Store | Premium Online Shopping in Pakistan",
    description:
      "Shop the latest trendy fashion, accessories, and lifestyle products at ZeeF Trendy Store. Premium quality, affordable prices, fast delivery across Pakistan.",
    images: [
      {
        url: "/Logo.png",
        width: 800,
        height: 800,
        alt: "ZeeF Trendy Store",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZeeF Trendy Store | Premium Online Shopping in Pakistan",
    description:
      "Shop the latest trendy fashion, accessories, and lifestyle products at ZeeF Trendy Store.",
    images: ["/Logo.png"],
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
  themeColor: "#0856DF",
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
              name: "ZeeF Trendy Store",
              url: siteUrl,
              logo: `${siteUrl}/Logo.png`,
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
              name: "ZeeF Trendy Store",
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
            <NotificationPrompt />
            <RouteProgressBar />
          </GoogleProvider>
        </Providers>
      </body>
    </html>
  );
}
