import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET(request: Request) {
  const { env } = await getCloudflareContext();
  const clientId = (env as any).GOOGLE_CLIENT_ID;
  
  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/callback/google`;

  if (!clientId) {
    return NextResponse.json({ error: 'GOOGLE_CLIENT_ID در کلودفلر تنظیم نشده است' }, { status: 500 });
  }

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=openid%20email%20profile&` +
    `prompt=select_account`;

  return NextResponse.redirect(googleAuthUrl);
}