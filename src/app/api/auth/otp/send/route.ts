import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as any;
    const email = body.email;
    
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'ایمیل نامعتبر است' }, { status: 400 });
    }

    // دریافت امن متغیرها
    let env: any;
    try {
      const context = (await getCloudflareContext()) as any;
      env = context?.env || process.env;
    } catch {
      env = process.env;
    }

    const db = env?.testbaan_db;
    if (!db) {
      return NextResponse.json({ error: 'دیتابیس در محیط npm run dev متصل نیست. لطفاً با npx wrangler dev --port 3000 اجرا کنید.' }, { status: 500 });
    }
    
    // ساخت کد 6 رقمی
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 دقیقه اعتبار
    const otpId = crypto.randomUUID();

    // ذخیره در دیتابیس
    await db.prepare('INSERT INTO otps (id, email, code, expires_at) VALUES (?, ?, ?, ?)').bind(otpId, email.toLowerCase(), code, expiresAt).run();

    // --- اتصال به Gmail API ---
    const clientId = env.GOOGLE_CLIENT_ID;
    const clientSecret = env.GOOGLE_CLIENT_SECRET;
    const refreshToken = env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      return NextResponse.json({ error: 'کلیدهای گوگل در فایل .dev.vars پیدا نشدند.' }, { status: 500 });
    }

    // 1. دریافت Access Token تازه از گوگل
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    
    const tokenData = (await tokenRes.json()) as any;
    
    if (!tokenData.access_token) {
      console.error("Google OAuth Token Error:", tokenData);
      return NextResponse.json({ error: tokenData.error_description || 'خطا در دریافت توکن از گوگل' }, { status: 500 });
    }

    // 2. ساخت قالب ایمیل طبق استاندارد RFC 2822
    const subject = "کد ورود به تست‌بان";
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `From: TestBaan <testbaan10@gmail.com>`,
      `To: ${email}`,
      `Subject: ${utf8Subject}`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      `<div dir="rtl" style="font-family: Tahoma, sans-serif; padding: 30px; background: #f8fafc; border-radius: 12px; text-align: center;">`,
      `<h2 style="color: #2563eb;">سلام کاربر عزیز!</h2>`,
      `<p style="color: #475569; font-size: 16px;">کد تایید شما برای ورود به سامانه مدیریت آزمون تست‌بان:</p>`,
      `<h1 style="background: #e0e7ff; padding: 15px; text-align: center; letter-spacing: 8px; color: #1e40af; border-radius: 12px; font-size: 32px;">${code}</h1>`,
      `<p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">این کد تا ۵ دقیقه دیگر اعتبار دارد.</p>`,
      `</div>`
    ];
    const emailBody = messageParts.join('\r\n');
    const encodedMessage = Buffer.from(emailBody, 'utf-8').toString('base64url');

    // 3. ارسال ایمیل از طریق سرور گوگل (اصلاح آدرس بدون /upload/)
    const sendRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: encodedMessage }),
    });

    if (!sendRes.ok) {
      const errorDetail = (await sendRes.json()) as any;
      console.error("Gmail API Error:", errorDetail);
      throw new Error(errorDetail?.error?.message || "ارسال ایمیل با خطا مواجه شد");
    }

    return NextResponse.json({ success: true, message: 'کد ارسال شد' });
  } catch (error: any) {
    console.error("OTP Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}