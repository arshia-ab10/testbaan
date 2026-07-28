import { cookies } from 'next/headers';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function getAuthUser() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('user_session')?.value;

    if (!sessionToken) return null;

    const { env } = await getCloudflareContext();
    const db = (env as any).testbaan_db;

    if (!db) return null;

    // استعلام توکن از دیتابیس D1
    const { results } = await db
      .prepare('SELECT id, email, first_name, last_name, role FROM users WHERE session_token = ? LIMIT 1')
      .bind(sessionToken)
      .all();

    if (results && results.length > 0) {
      return results[0] as any;
    }

    return null;
  } catch (error) {
    return null;
  }
}