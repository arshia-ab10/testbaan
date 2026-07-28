import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subId = searchParams.get('id');
  const { env } = await getCloudflareContext();
  const db = (env as any).testbaan_db;
  
  const query = `
    SELECT s.score_percentage, s.user_answers, a.correct_keys, a.title, a.start_question_number, a.total_questions
    FROM user_submissions s JOIN answer_sheets a ON s.answer_sheet_id = a.id WHERE s.id = ?
  `;
  const { results } = await db.prepare(query).bind(subId).all();
  return NextResponse.json(results[0]);
}