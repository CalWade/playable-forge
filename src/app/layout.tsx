import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "PlayableForge",
  description: "AI-powered Playable Ads generator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <AuthProvider>
          {children}
          <ToastProvider />
        </AuthProvider>
      </body>
    </html>
  );
}
