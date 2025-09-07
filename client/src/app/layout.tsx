import type { Metadata } from "next";
import { Poppins } from "next/font/google";
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
        <Providers>{children}</Providers>
        {/* <Footer /> */}
      </body>
    </html>
  );
}
