import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as any;
    const email = body.email;
    const code = body.code;
    
    if (!email || !code) return NextResponse.json({ error: 'اطلاعات ناقص است' }, { status: 400 });

    const context = (await getCloudflareContext()) as any;
    const env = context.env;
    const db = env.testbaan_db;
    const lowerEmail = email.toLowerCase();

    // 1. بررسی کد OTP
    const { results: otpResults } = await db.prepare('SELECT * FROM otps WHERE email = ? ORDER BY expires_at DESC LIMIT 1').bind(lowerEmail).all();
    if (!otpResults || otpResults.length === 0) return NextResponse.json({ error: 'کدی برای این ایمیل یافت نشد' }, { status: 400 });

    const otpData = otpResults[0] as any;
    if (otpData.code !== code) return NextResponse.json({ error: 'کد وارد شده اشتباه است' }, { status: 400 });
    if (new Date(otpData.expires_at) < new Date()) return NextResponse.json({ error: 'کد منقضی شده است' }, { status: 400 });

    // 2. ساخت Session و ثبت/ورود کاربر
    const sessionToken = crypto.randomUUID() + '-' + Date.now().toString();
    const { results: userResults } = await db.prepare('SELECT id FROM users WHERE email = ? LIMIT 1').bind(lowerEmail).all();

    if (userResults && userResults.length > 0) {
      await db.prepare('UPDATE users SET session_token = ? WHERE id = ?').bind(sessionToken, userResults[0].id).run();
    } else {
      const userId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      await db.prepare('INSERT INTO users (id, email, role, session_token) VALUES (?, ?, ?, ?)').bind(userId, lowerEmail, 'user', sessionToken).run();
    }

    // 3. پاک کردن کدهای یک‌بار مصرف استفاده شده
    await db.prepare('DELETE FROM otps WHERE email = ?').bind(lowerEmail).run();

    // 4. تنظیم کوکی
    const cookieStore = await cookies();
    cookieStore.set('user_session', sessionToken, { httpOnly: true, secure: true, path: '/', maxAge: 60 * 60 * 24 * 7 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}