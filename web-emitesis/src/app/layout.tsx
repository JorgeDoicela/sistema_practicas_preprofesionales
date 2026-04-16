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
};

import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { PrivacyConsentWrapper } from "@/components/auth/PrivacyConsentWrapper";
import { ReCaptchaProviderWrapper } from "@/components/providers/ReCaptchaProviderWrapper";

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
          <ReCaptchaProviderWrapper>
            <PrivacyConsentWrapper>
              {children}
            </PrivacyConsentWrapper>
          </ReCaptchaProviderWrapper>
        </main>
        <Footer />
      </body>
    </html>
  );
}
