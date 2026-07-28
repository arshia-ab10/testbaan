import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const { env } = await getCloudflareContext();
    const db = (env as any).testbaan_db;

    if (!db) {
      return NextResponse.json({ error: 'دیتابیس متصل نیست' }, { status: 500 });
    }

    // جستجوی کاربر ادمین در دیتابیس
    const { results } = await db
      .prepare("SELECT * FROM users WHERE (email = ? OR name = ?) AND role = 'admin' LIMIT 1")
      .bind(username, username)
      .all();

    const adminUser = results[0] as any;

    // بررسی وجود کاربر و تطابق رمز عبور (بدون هش در این مرحله)
    if (adminUser && adminUser.password === password) {
      const cookieStore = await cookies();
      cookieStore.set('admin_token', 'true', { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 // ۱ روز اعتبار
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'نام کاربری یا رمز عبور اشتباه است' }, { status: 401 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}