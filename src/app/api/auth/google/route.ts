import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET(request: Request) {
  const { env } = await getCloudflareContext();
  // استفاده از آیدی مستقیم در صورت خوانده نشدن از سرور
  const clientId = (env as any).GOOGLE_CLIENT_ID || '765863500546-a8s2p2cfhtobs68o5am0fv9tt9nm1b0e.apps.googleusercontent.com';
  
  const url = new URL(request.url);
  const protocol = url.hostname === 'localhost' ? 'http' : 'https';
  const redirectUri = `${protocol}://${url.host}/api/auth/callback/google`;

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=openid%20email%20profile&` +
    `prompt=select_account`;

  return NextResponse.redirect(googleAuthUrl);
}