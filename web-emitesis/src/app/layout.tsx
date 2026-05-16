import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Praxis Hub - Prácticas Preprofesionales",
  description: "Plataforma para la gestión integral de prácticas preprofesionales.",
  icons: {
    icon: "/images/brand/sin_fondo_png.png",
    shortcut: "/images/brand/sin_fondo_png.png",
    apple: "/images/brand/logo_fondo2_png.png",
  },


  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Praxis Hub",
  },
  formatDetection: {
    telephone: false,
  },
};

import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { PrivacyConsentWrapper } from "@/components/auth/PrivacyConsentWrapper";
import { ReCaptchaProviderWrapper } from "@/components/providers/ReCaptchaProviderWrapper";
import { SocketProvider } from "@/providers/SocketProvider";
import { ChatProvider } from "@/providers/ChatProvider";
import ChatWidgetLoader from "@/components/chat/ChatWidgetLoader";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ThemeScript } from "@/components/providers/ThemeScript";
import { LanguageProvider } from "@/providers/LanguageProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="font-google antialiased bg-background text-foreground">
        <ThemeProvider>
          <LanguageProvider>
            <Navbar />
            <main className="min-h-screen">
              <SocketProvider>
                <ChatProvider>
                  <ReCaptchaProviderWrapper>
                    <PrivacyConsentWrapper>
                      {children}
                    </PrivacyConsentWrapper>
                  </ReCaptchaProviderWrapper>
                  <ChatWidgetLoader />
                </ChatProvider>
              </SocketProvider>
            </main>
            <Footer />
            <Toaster position="top-right" richColors />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
