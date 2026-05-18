import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShopMind — Akıllı Alışveriş Asistanı",
  description: "Bütçenizi, fiyat trendlerini ve kullanıcı yorumlarını analiz eden yapay zeka alışveriş asistanı",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
