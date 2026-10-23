import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "트릭 오어 트립",
  description: "할로윈 시즌 공포체험·이벤트·테마 공간을 채팅으로 찾고 카카오맵 코스로 잇기",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* 제목용 Tanker (Fontshare). 영문 전용이라 한글은 시스템 글꼴로 대체됨 */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=tanker@400&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
