import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
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
  description:
    "Plataforma para la gestión integral de prácticas preprofesionales.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${montserrat.variable} ${roboto.variable} font-body antialiased bg-slate-50 text-slate-900`}
      >
        <div className="min-h-screen flex flex-col">
          <header className="bg-[#003366] text-white shadow-lg sticky top-0 z-50">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
              <Link href="/" className="flex items-center">
                <Image 
                  src="/images/ISTPET_sin_fondo.png" 
                  alt="Logo ISTPET" 
                  width={160} 
                  height={40} 
                  className="h-10 w-auto brightness-0 invert"
                  priority
                />
              </Link>
              <nav className="flex items-center gap-8 text-sm font-semibold uppercase tracking-wider">
                <Link href="/" className="hover:text-[#C5A059] transition-colors">Inicio</Link>
                <Link href="/login" className="bg-[#C5A059] text-[#003366] px-5 py-2 rounded-xl shadow-md hover:bg-opacity-90 transition-all font-bold">ACCESO</Link>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}

