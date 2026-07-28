import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'لطفاً وارد شوید' }, { status: 401 });

    const { env } = await getCloudflareContext();
    const db = (env as any).testbaan_db;

    const query = `
      SELECT 
        a.id as sheet_id, a.title as sheet_title, a.type, a.duration_minutes, a.total_questions,
        b.id as book_id, b.title as book_title, b.description as book_description,
        s.id as submission_id, s.status, s.score_percentage
      FROM user_permissions p
      JOIN answer_sheets a ON p.answer_sheet_id = a.id
      JOIN books b ON a.book_id = b.id
      LEFT JOIN user_submissions s ON s.answer_sheet_id = a.id AND s.user_id = ?
      WHERE p.user_id = ?
      ORDER BY b.created_at DESC, a.created_at ASC
    `;

    const { results } = await db.prepare(query).bind(user.id, user.id).all();
    return NextResponse.json(results || [], { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}