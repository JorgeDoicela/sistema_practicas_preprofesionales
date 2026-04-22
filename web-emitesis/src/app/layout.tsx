import type { Metadata } from "next";
import { Montserrat, Roboto } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Emitesis - Prácticas Preprofesionales",
  description: "Plataforma para la gestión integral de prácticas preprofesionales.",
  icons: {
    icon: "/images/Logo.png",
    apple: "/images/Logo.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Emitesis",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${montserrat.variable} ${roboto.variable} font-body antialiased bg-slate-50 text-slate-900`}>
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
      </body>
    </html>
  );
}
