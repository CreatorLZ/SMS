import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Footer from "@/components/footer";
import Providers from "./providers";

const poppins = Poppins({
  weight: ["400", "700", "800", "900"],
  style: ["normal"],
  variable: "--font-poppins",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title:
    "Treasure Land School - Excellence in Education | Okitipupa, Ondo State",
  description:
    "Treasure Land School provides quality primary and secondary education. Nurturing young minds to become future leaders.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} antialiased`}>
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="animate-pulse">
                <img
                  src="/treasure.png"
                  alt="Treasure Land Logo"
                  className="h-32 w-auto mb-8 drop-shadow-lg"
                />
              </div>
              <div
                className="flex justify-center space-x-3"
                aria-label="Loading animation"
              >
                <div
                  className="w-3 h-3 bg-slate-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0s" }}
                ></div>
                <div
                  className="w-3 h-3 bg-slate-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.15s" }}
                ></div>
                <div
                  className="w-3 h-3 bg-slate-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.3s" }}
                ></div>
                <div
                  className="w-3 h-3 bg-slate-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.45s" }}
                ></div>
              </div>
            </div>
          }
        >
          <Providers>{children}</Providers>
        </Suspense>
        {/* <Footer /> */}
      </body>
    </html>
  );
}
