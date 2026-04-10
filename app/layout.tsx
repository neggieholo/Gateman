import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { UserProvider } from "./UserContext"
import { Montserrat } from "next/font/google";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: {
    template: "%s | GateMan",
    default: "GateMan | Smart Estate Security & Management",
  },
  description: "Advanced access control and estate management for modern communities.",
  // manifest: "/manifest.json", 
  // icons: {
  //   icon: "/favicon.ico",
  //   apple: "/apple-icon.png",
  // },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://cdn.smileidentity.com/js/v1/smileid.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className={`${inter.variable} ${montserrat.variable} antialiased`}>
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
