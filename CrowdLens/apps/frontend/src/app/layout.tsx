import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import WalletContextProvider from "@/components/WalletAdaptors";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeToaster } from "@/components/theme/ThemeToaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const themeInitScript = `(function(){try{var t=localStorage.getItem("crowdlens.theme");if(t!=="light"&&t!=="dark")t="dark";var r=document.documentElement;r.classList.remove("light","dark");r.classList.add(t);r.style.colorScheme=t;}catch(e){document.documentElement.classList.add("dark");}})();`;

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
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${inter.variable} ${plusJakarta.variable} font-sans antialiased min-h-screen bg-canvas text-fg`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <WalletContextProvider>
            {children}
            <ThemeToaster />
          </WalletContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
