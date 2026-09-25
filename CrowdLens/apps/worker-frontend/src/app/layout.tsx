import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import WalletContextProvider from "@/components/WalletAdaptors";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CrowdLens Worker | Earn by Providing Content Feedback",
  description: "Join CrowdLens as a content validator and earn rewards for providing valuable feedback. Our worker platform connects you with creators seeking authentic human insights. Powered by Solana blockchain for instant, transparent payments. Start contributing to the future of content creation today.",
  keywords: "content validation, earn crypto, Solana rewards, content feedback, decentralized work, Web3 jobs, creator economy",
  openGraph: {
    title: "CrowdLens Worker | Earn by Providing Content Feedback",
    description: "Join our network of content validators and earn rewards for providing valuable feedback. Powered by Solana blockchain for instant, transparent payments.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "CrowdLens Worker | Earn by Providing Content Feedback",
    description: "Join our network of content validators and earn rewards for providing valuable feedback. Powered by Solana blockchain for instant, transparent payments.",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-slate-950 text-white`}
        suppressHydrationWarning
      >
        <WalletContextProvider>
          {children}
          <Toaster />
        </WalletContextProvider>
      </body>
    </html>
  );
}
