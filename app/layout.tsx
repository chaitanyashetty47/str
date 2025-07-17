
import { Geist } from "next/font/google";
import { Providers } from "@/components/providers/Providers";
import Link from "next/link";
import "./globals.css";
import { Toaster } from "sonner";
import Script from "next/script";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Next.js and Supabase Starter Kit",
  description: "The fastest way to build apps with Next.js and Supabase",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
          <Providers>
            {children}
            <Toaster />
          </Providers>
          <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      </body>
    </html>
  );
}
