import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// دریافت اطلاعات پاسخ‌برگ برای شروع آزمون
export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'غیرمجاز' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const sheetId = searchParams.get('id');

    const { env } = await getCloudflareContext();
    const db = (env as any).testbaan_db;

    // بررسی اینکه کاربر حتماً دسترسی به این پاسخ‌برگ داشته باشد
    const permCheck = await db.prepare("SELECT id FROM user_permissions WHERE user_id = ? AND answer_sheet_id = ?").bind(user.id, sheetId).all();
    if (!permCheck.results || permCheck.results.length === 0) {
      return NextResponse.json({ error: 'شما به این آزمون دسترسی ندارید' }, { status: 403 });
    }

    const { results } = await db.prepare("SELECT id, title, type, duration_minutes, start_question_number, total_questions FROM answer_sheets WHERE id = ?").bind(sheetId).all();
    return NextResponse.json(results[0] || null, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ثبت نهایی پاسخ‌برگ و محاسبه درصد
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'غیرمجاز' }, { status: 401 });

    const { sheetId, userAnswers } = (await request.json()) as any;

    const { env } = await getCloudflareContext();
    const db = (env as any).testbaan_db;

    const { results } = await db.prepare("SELECT * FROM answer_sheets WHERE id = ?").bind(sheetId).all();
    if (!results || results.length === 0) {
      return NextResponse.json({ error: 'آزمون یافت نشد' }, { status: 404 });
    }

    const sheet = results[0] as any;
    const correctKeys = JSON.parse(sheet.correct_keys || '{}');

    let correct = 0, wrong = 0;
    const startNum = sheet.start_question_number || 1;
    const total = sheet.total_questions || 0;

    for (let i = startNum; i < startNum + total; i++) {
      if (userAnswers && userAnswers[i]) {
        if (userAnswers[i] === correctKeys[i]) correct++;
        else wrong++;
      }
    }

    // فرمول درصد کنکور: (درست * 3 - غلط) / (کل * 3) * 100
    let score = ((correct * 3) - wrong) / (total * 3) * 100;
    score = parseFloat(score.toFixed(2));

    const submissionId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const answersJson = JSON.stringify(userAnswers || {});

    await db.prepare(
      "INSERT INTO user_submissions (id, user_id, answer_sheet_id, status, user_answers, score_percentage, completed_at) VALUES (?, ?, ?, 'completed', ?, ?, CURRENT_TIMESTAMP)"
    ).bind(submissionId, user.id, sheetId, answersJson, score).run();

    return NextResponse.json({ success: true, submissionId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}