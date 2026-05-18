import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/app/client-layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "100억 목표 정렬 시스템",
  description: "개인 목표 관리 - 연간 목표, 월간 계획, 일간 기록",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} h-full`}>
      <body className="h-full bg-zinc-50">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}


