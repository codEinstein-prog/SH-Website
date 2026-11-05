import type { Metadata } from "next";
import "./globals.css";
import { Header, Footer } from "@/components/site-shell";

export const metadata: Metadata = {
  title: { default: "S/H Home Solutions", template: "%s | S/H Home Solutions" },
  description: "Roofing, solar, and impact-window solutions with consultation, project qualification, and preliminary estimates.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body><Header/><main>{children}</main><Footer/></body>
    </html>
  );
}
