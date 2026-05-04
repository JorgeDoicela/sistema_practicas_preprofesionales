import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ROLE_REDIRECTS, Role } from './constants/roles';

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
  
  // 1. Obtener sesión de las Cookies (Servidor)
  const token = request.cookies.get('token')?.value;
  const userJson = request.cookies.get('user')?.value;
  
  let user = null;
  try {
    if (userJson) user = JSON.parse(decodeURIComponent(userJson));
  } catch (e) {}

  // Archivos estáticos → pasar siempre
  if (/\.[a-z0-9]+$/i.test(pathname)) {
    return NextResponse.next();
  }

  // 2. Lógica de Redirección Proactiva
  
  // SI ESTÁ LOGEADO y trata de ir a Login/Registro → Redirigir a su Dashboard
  if (token && user && (pathname === '/login' || pathname === '/registrarse' || pathname === '/')) {
    const role = user.role as Role;
    const homePath = ROLE_REDIRECTS[role] || '/dashboard';
    return NextResponse.redirect(new URL(homePath, request.url));
  }

  // SI NO ESTÁ LOGEADO y trata de ir a rutas privadas → Redirigir a Login
  const isPrivatePath = !isPublicPath(pathname);
  if (!token && isPrivatePath) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
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

  return response;
}

export const config = {
  // Aplica el middleware a todas las rutas excepto las internas de Next.js
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
