import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // اگر کاربر خواست وارد صفحات ادمین شود ولی در صفحه لاگین نبود
  if (path.startsWith('/admin') && !path.startsWith('/admin/login')) {
    const token = request.cookies.get('admin_token');
    
    // اگر کوکی لاگین نداشت، پرتش کن به صفحه لاگین
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'], // فقط روی مسیرهای ادمین حساس باش
};