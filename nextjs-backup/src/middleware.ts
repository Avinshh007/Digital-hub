// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decodeToken } from '@/lib/auth';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Admin paths protection
  if (pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login?redirect=' + encodeURIComponent(pathname), request.url));
    }
    const decoded = decodeToken(token);
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 2. Customer protected paths (profile, checkout, etc.)
  if (pathname.startsWith('/profile') || pathname.startsWith('/checkout') || pathname.startsWith('/cart/checkout')) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    const decoded = decodeToken(token);
    if (!decoded) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Prevent logged-in users from visiting auth pages
  if (pathname === '/login' || pathname === '/register') {
    if (token) {
      const decoded = decodeToken(token);
      if (decoded) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/profile/:path*',
    '/checkout/:path*',
    '/cart/checkout/:path*',
    '/login',
    '/register'
  ],
};
