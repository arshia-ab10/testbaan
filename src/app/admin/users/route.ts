import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET() {
  try {
    const { env } = await getCloudflareContext();
    const db = (env as any).testbaan_db;
    
    if (!db) return NextResponse.json({ error: 'دیتابیس متصل نیست' }, { status: 500 });

    // دریافت تمام کاربران (شامل ادمین و کاربران عادی)
    const { results } = await db.prepare("SELECT id, first_name, last_name, email, role FROM users ORDER BY id DESC").all();
    
    return NextResponse.json(results || [], { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}