import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/components/layout/app-provider";
import { OnboardingGuard } from "@/components/layout/onboarding-guard";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "mintea — Personal Finance",
  description: "Track savings, spending, and earnings. Your personal finance companion.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "mintea",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full bg-gray-50 font-sans antialiased">
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
