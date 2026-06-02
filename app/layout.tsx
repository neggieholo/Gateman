import type { Metadata } from "next";
import "./globals.css";
import { UserProvider } from "./UserContext";
import { Montserrat, Oswald, Roboto } from "next/font/google";
import Script from "next/script";

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-oswald",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-montserrat",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: {
    template: "%s | GateMan",
    default: "GateMan | Smart Estate Security & Management",
  },
  description:
    "Advanced access control and estate management for modern communities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Moved font variables to HTML tag for clean portal inheritance
    <html
      lang="en"
      className={`${oswald.variable} ${montserrat.variable} ${roboto.variable}`}
    >
      <body className="antialiased">
        <UserProvider>{children}</UserProvider>

        <Script
          src="https://cdn.smileidentity.com/js/v1/smileid.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
