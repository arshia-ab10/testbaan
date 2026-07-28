import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (username === 'admin' && password === 'admin123') {
      // در نسخه جدید Next.js حتماً باید await قرار بگیرد
      const cookieStore = await cookies();
      cookieStore.set('admin_token', 'true', { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'نام کاربری یا رمز عبور اشتباه است' }, { status: 401 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}