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
    const clientId = (env as any).GOOGLE_CLIENT_ID || '765863500546-a8s2p2cfhtobs68o5am0fv9tt9nm1b0e.apps.googleusercontent.com';
    const clientSecret = (env as any).GOOGLE_CLIENT_SECRET;

    if (!clientSecret) return NextResponse.redirect(`${baseUrl}/?error=secret_not_found`);

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code',
      }),
    });

    const tokenData = (await tokenResponse.json()) as any;
    if (!tokenData.access_token) return NextResponse.redirect(`${baseUrl}/?error=token_failed`);

    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = (await userResponse.json()) as any;
    const { email, given_name, family_name } = googleUser;

    if (!email) return NextResponse.redirect(`${baseUrl}/?error=no_email`);

    const db = (env as any).testbaan_db;
    let userId = "";
    let userRole = "user";
    let firstName = given_name || "";
    let lastName = family_name || "";

    if (db) {
      const { results } = await db.prepare('SELECT * FROM users WHERE email = ? LIMIT 1').bind(email).all();
      
      if (results && results.length > 0) {
        const existingUser = results[0] as any;
        userId = existingUser.id;
        userRole = existingUser.role;
        firstName = existingUser.first_name || firstName;
        lastName = existingUser.last_name || lastName;
        
        if (!existingUser.first_name) {
          await db.prepare('UPDATE users SET first_name = ?, last_name = ? WHERE id = ?').bind(firstName, lastName, userId).run();
        }
      } else {
        userId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
        // ستون name حذف شد
        await db.prepare('INSERT INTO users (id, email, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)')
          .bind(userId, email, firstName, lastName, 'user').run();
      }
    }

    const cookieStore = await cookies();
    // ستون name از سشن هم حذف شد
    const sessionData = JSON.stringify({ id: userId, email, first_name: firstName, last_name: lastName, role: userRole });
    cookieStore.set('user_session', sessionData, {
      httpOnly: true, secure: true, path: '/', maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.redirect(`${baseUrl}/dashboard`);
  } catch (error: any) {
    return NextResponse.redirect(`${baseUrl}/?error=${encodeURIComponent(error.message)}`);
  }
}