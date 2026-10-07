import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ozima AI — Intelligent Assistant & Search",
  description: "Direct, high-intelligence model answers with autonomous web search when freshness matters.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0D0E12] text-[#EDEDED] min-h-screen antialiased selection:bg-cyan-500/20 selection:text-white`}>
        {children}
      </body>
    </html>
  );
}
