import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sheetId = searchParams.get('id');
  const { env } = await getCloudflareContext();
  const db = (env as any).testbaan_db;
  
  // ارسال اطلاعات آزمون بدون کلیدهای صحیح
  const { results } = await db.prepare("SELECT id, title, type, duration_minutes, start_question_number, total_questions FROM answer_sheets WHERE id = ?").bind(sheetId).all();
  return NextResponse.json(results[0]);
}

export async function POST(request: Request) {
  const { sheetId, userAnswers } = (await request.json()) as any;
  const cookieStore = await cookies();
  const user = JSON.parse(cookieStore.get('user_session')!.value);
  
  const { env } = await getCloudflareContext();
  const db = (env as any).testbaan_db;

  // دریافت کلیدهای صحیح برای محاسبه درصد
  const { results } = await db.prepare("SELECT * FROM answer_sheets WHERE id = ?").bind(sheetId).all();
  const sheet = results[0] as any;
  const correctKeys = JSON.parse(sheet.correct_keys);

  let correct = 0, wrong = 0;
  for (let i = sheet.start_question_number; i < sheet.start_question_number + sheet.total_questions; i++) {
    if (userAnswers[i]) {
      if (userAnswers[i] === correctKeys[i]) correct++;
      else wrong++;
    }
  }
  
  // فرمول درصد کنکور: (تعداد درست * 3 - تعداد غلط) / (کل سوالات * 3) * 100
  let score = ((correct * 3) - wrong) / (sheet.total_questions * 3) * 100;
  score = parseFloat(score.toFixed(2)); // دو رقم اعشار

  const submissionId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
  const answersJson = JSON.stringify(userAnswers);

  await db.prepare(
    "INSERT INTO user_submissions (id, user_id, answer_sheet_id, status, user_answers, score_percentage, completed_at) VALUES (?, ?, ?, 'completed', ?, ?, CURRENT_TIMESTAMP)"
  ).bind(submissionId, user.id, sheetId, answersJson, score).run();

  return NextResponse.json({ success: true, submissionId });
}