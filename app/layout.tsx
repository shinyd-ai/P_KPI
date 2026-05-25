import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/app/client-layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stride - 매일 목표를 향해 나아가다",
  description: "개인 목표 관리 - 연간 목표, 월간 계획, 일간 기록",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} h-full`}>
      <body className="h-full" style={{ background: "var(--background)" }}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
