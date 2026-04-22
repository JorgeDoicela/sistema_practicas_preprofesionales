import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Rutas completamente públicas (no requieren autenticación ni redireccionan). */
const PUBLIC_PREFIXES = [
  '/',
  '/login',
  '/olvido-password',
  '/reset-password',
  '/verificar',  // página pública de verificación de certificados QR
  '/_next',
  '/api',
  '/images',
  '/manifest.json',
  '/favicon',
  '/nosotros',
  '/servicios',
  '/privacidad',
  '/empresas',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/') || pathname.startsWith(prefix + '?'),
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Archivos estáticos (contienen extensión) → pasar siempre
  if (/\.[a-z0-9]+$/i.test(pathname)) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  // Encabezados de seguridad en todas las respuestas
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(self), microphone=(), geolocation=(self)',
  );

  // Para rutas protegidas, Next.js no puede leer localStorage (solo existe en el cliente).
  // La protección real se aplica en DashboardLayout (client-side).
  // Aquí nos limitamos a añadir los headers de seguridad y devolver la respuesta.
  if (isPublicPath(pathname)) {
    return response;
  }

  // Ruta no pública: devolver con headers de seguridad.
  // DashboardLayout se encargará de redirigir si el usuario no está autenticado.
  return response;
}

export const config = {
  // Aplica el middleware a todas las rutas excepto las internas de Next.js
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
