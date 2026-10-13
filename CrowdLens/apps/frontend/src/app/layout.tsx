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

const description =
  "Real humans pick the thumbnail before you publish. Upload two to five images, escrow SOL, and let validators vote. When the batch fills, the winner is committed on-chain and voters are paid in Devnet SOL.";

export const metadata: Metadata = {
  metadataBase: new URL("https://crowdlens-bay.vercel.app"),
  title: "CrowdLens | Real humans pick the thumbnail",
  description,
  keywords: "CrowdLens, thumbnail testing, Solana Devnet, image comparison, creator tools, validator voting",
  openGraph: {
    title: "CrowdLens | Real humans pick the thumbnail",
    description,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "CrowdLens | Real humans pick the thumbnail",
    description,
  },
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
