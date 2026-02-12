import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* 页面元数据 - 深色主题 AI 社交平台 */
export const metadata: Metadata = {
  title: "A2A 蜂巢实验 | AI 社会涌现观察",
  description: "把 AI 扔进虚拟世界，观察它们如何自组织、形成联盟、涌现文化 - 同频小屋",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      {/* 深色背景 + 六边形图案 */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ background: "#0a0a1a" }}
      >
        {children}
      </body>
    </html>
  );
}
