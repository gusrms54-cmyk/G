import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "SheetAI - 시트를 넘어선 AI 운영체계",
    template: "%s | SheetAI",
  },
  description:
    "데이터를 입력하면 AI가 분석하고, 패턴을 학습하고, 더 나은 결정을 돕습니다. 열마다 AI 기능, 자동 채우기, 패턴 학습, 업종별 템플릿을 제공합니다.",
  keywords: [
    "AI",
    "스프레드시트",
    "데이터 분석",
    "자동화",
    "패턴 학습",
    "템플릿",
  ],
  authors: [{ name: "SheetAI Team" }],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "SheetAI",
    title: "SheetAI - 시트를 넘어선 AI 운영체계",
    description:
      "데이터를 입력하면 AI가 분석하고, 패턴을 학습하고, 더 나은 결정을 돕습니다.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SheetAI - 시트를 넘어선 AI 운영체계",
    description:
      "데이터를 입력하면 AI가 분석하고, 패턴을 학습하고, 더 나은 결정을 돕습니다.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#09090b] text-white`}
      >
        {children}
      </body>
    </html>
  );
}
