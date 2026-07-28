import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'غیرمجاز' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const subId = searchParams.get('id');

    const { env } = await getCloudflareContext();
    const db = (env as any).testbaan_db;

    const query = `
      SELECT s.score_percentage, s.user_answers, a.correct_keys, a.title, a.start_question_number, a.total_questions
      FROM user_submissions s 
      JOIN answer_sheets a ON s.answer_sheet_id = a.id 
      WHERE s.id = ? AND s.user_id = ?
    `;
    const { results } = await db.prepare(query).bind(subId, user.id).all();

    if (!results || results.length === 0) {
      return NextResponse.json({ error: 'کارنامه یافت نشد' }, { status: 404 });
    }

    return NextResponse.json(results[0], { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}