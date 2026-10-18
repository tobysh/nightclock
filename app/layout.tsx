import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import RegisterSW from "@/components/RegisterSW";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "600"],
});

// metadata URLs aren't auto-prefixed with basePath
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "Night Clock",
  description: "A customisable bedside night clock — analogue and digital styles, your colours.",
  icons: { icon: `${base}/icon-192.png`, apple: `${base}/apple-touch-icon.png` },
  appleWebApp: { capable: true, title: "Night Clock", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0b0d12",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={outfit.variable}>
      <body>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
