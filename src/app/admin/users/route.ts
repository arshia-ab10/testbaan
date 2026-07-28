import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET() {
  try {
    const { env } = await getCloudflareContext();
    const db = (env as any).testbaan_db;
    // دریافت لیست دانش‌آموزان
    const { results } = await db.prepare("SELECT id, name, email FROM users WHERE role = 'user' ORDER BY id DESC").all();
    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}