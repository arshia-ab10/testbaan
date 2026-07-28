import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const protocol = url.hostname === 'localhost' ? 'http' : 'https';
  const baseUrl = `${protocol}://${url.host}`;
  const redirectUri = `${baseUrl}/api/auth/callback/google`;

  try {
    const code = url.searchParams.get('code');
    if (!code) return NextResponse.redirect(`${baseUrl}/?error=no_code`);

    const { env } = await getCloudflareContext();
    const clientId = (env as any).GOOGLE_CLIENT_ID;
    const clientSecret = (env as any).GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${baseUrl}/?error=missing_credentials`);
    }

    // ۱. تبادل کد گوگل با توکن دسترسی
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = (await tokenResponse.json()) as any;
    if (!tokenData.access_token) {
      return NextResponse.redirect(`${baseUrl}/?error=token_failed_${tokenData.error || 'unknown'}`);
    }

    // ۲. دریافت اطلاعات کاربر
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = (await userResponse.json()) as any;
    const { email, name } = googleUser;

    if (!email) return NextResponse.redirect(`${baseUrl}/?error=no_email`);

    // ۳. ثبت در دیتابیس
    const db = (env as any).testbaan_db;
    let userId = "";
    let userRole = "user";

    if (db) {
      const { results } = await db.prepare('SELECT * FROM users WHERE email = ? LIMIT 1').bind(email).all();
      
      if (results && results.length > 0) {
        const existingUser = results[0] as any;
        userId = existingUser.id;
        userRole = existingUser.role;
      } else {
        userId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
        await db.prepare('INSERT INTO users (id, email, name, role) VALUES (?, ?, ?, ?)')
          .bind(userId, email, name || 'کاربر جدید', 'user').run();
      }
    }

    // ۴. ست کردن کوکی
    const cookieStore = await cookies();
    const sessionData = JSON.stringify({ id: userId, email, name, role: userRole });
    cookieStore.set('user_session', sessionData, {
      httpOnly: true,
      secure: true, // اجبار به امن بودن کوکی
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.redirect(`${baseUrl}/dashboard`);
  } catch (error: any) {
    return NextResponse.redirect(`${baseUrl}/?error=${encodeURIComponent(error.message)}`);
  }
}