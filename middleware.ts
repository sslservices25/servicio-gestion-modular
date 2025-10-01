import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT, isAdmin } from '@/lib/utils/auth';

// Rutas que requieren autenticación
const protectedRoutes = ['/dashboard'];

// Rutas que requieren rol de admin
const adminRoutes = ['/dashboard/admin'];

// Rutas públicas que no necesitan verificación
const publicRoutes = ['/login', '/', '/seguimiento'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Si es una ruta pública, permitir acceso
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Si es una ruta protegida, verificar autenticación
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      // Redirigir a login si no está autenticado
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    const user = verifyJWT(token);
    
    if (!user) {
      // Token inválido, redirigir a login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Si es una ruta de admin, verificar rol
    if (adminRoutes.some(route => pathname.startsWith(route))) {
      if (!isAdmin(user)) {
        // Redirigir a dashboard si no es admin
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
