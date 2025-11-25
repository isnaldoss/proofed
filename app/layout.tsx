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

export const metadata: Metadata = {
  title: "Proofed - Aprovação de Conteúdo Visual",
  description: "Plataforma minimalista para aprovação de posts e vídeos. Compartilhe, receba feedback e aprove com facilidade. ",
  icons: {
    icon: "/images/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full flex flex-col`}
      >
        <div className="flex-1">
          {children}
        </div>
        <footer className=" text-center text-xs sm:text-sm text-muted-foreground bg-background">
          Desenvolvido pela <a href="https://barondesk.com.br" target="_blank" rel="noopener noreferrer" className="font-medium hover:text-foreground transition-colors">Barondesk</a>
        </footer>
      </body>
    </html>
  );
}
