import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SPOTFIX",
  description: "See it. Prove it. Fix it.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#050505] text-white antialiased min-h-screen flex justify-center bg-noise`}>
        <div className="w-full max-w-md min-h-screen bg-black border-x border-white/5 relative overflow-hidden flex flex-col shadow-2xl">
          {children}
        </div>
      </body>
    </html>
  );
}
