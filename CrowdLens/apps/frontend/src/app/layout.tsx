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
  title: "CrowdLens | Decentralized Content Feedback Platform",
  description: "CrowdLens is a revolutionary Web3 platform where creators get real human feedback on their content through a decentralized network. Powered by Solana blockchain, we enable transparent, on-chain content validation with fair compensation for contributors. Join us in shaping the future of content creation and community engagement.",
  keywords: "Web3, content feedback, decentralized platform, Solana, blockchain, content validation, creator economy, community engagement",
  openGraph: {
    title: "CrowdLens | Decentralized Content Feedback Platform",
    description: "Get real human feedback on your content through our decentralized network. Powered by Solana blockchain for transparent, on-chain content validation.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "CrowdLens | Decentralized Content Feedback Platform",
    description: "Get real human feedback on your content through our decentralized network. Powered by Solana blockchain for transparent, on-chain content validation.",
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
