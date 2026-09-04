import type { Metadata } from "next";
import { Poppins, Nunito, Space_Mono } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

const nunito = Nunito({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-nunito",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: "Nirikshak AI | AI-Powered Fund Utilization & Anomaly Monitoring Platform",
  description: "Detection & Risk Inspection via Semantic & Hierarchical Trend Intelligence for Members of Parliament Local Area Development Scheme",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${nunito.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-nunito bg-background text-foreground">{children}</body>
    </html>
  );
}
