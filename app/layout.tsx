import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/components/layout/app-provider";
import { OnboardingGuard } from "@/components/layout/onboarding-guard";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";

const privacyInitScript = `try{if(localStorage.getItem('mintea:privacy')==='1'){document.documentElement.classList.add('privacy-hidden')}}catch(e){}`;

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "mintea — Household Finance",
  description:
    "Shared workspace with private personal accounts. Track spending, budgets, and savings together.",
  manifest: "/manifest.json",
  applicationName: "mintea",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "mintea",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#065f46" },
    { media: "(prefers-color-scheme: dark)", color: "#065f46" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full bg-[#f3f4f6] font-sans antialiased">
        <script dangerouslySetInnerHTML={{ __html: privacyInitScript }} />
        <ClerkProvider>
          <ConvexClientProvider>
            <AppProvider>
              <OnboardingGuard>{children}</OnboardingGuard>
            </AppProvider>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
