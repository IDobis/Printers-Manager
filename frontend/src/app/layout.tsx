import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeRegistry } from "@/theme/ThemeRegistry";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Controle de Toners | Calpar",
  description: "Monitoramento local de toners de impressoras",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={geistSans.variable}>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
