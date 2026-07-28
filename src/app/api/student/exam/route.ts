import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// مسدود کردن درخواست GET مستقیم از مرورگر
export async function GET() {
  return NextResponse.json({ error: 'درخواست غیرمجاز (فقط POST پذیرفته می‌شود)' }, { status: 405 });
}

// تمام عملیات‌ها (دریافت و ثبت) از طریق POST انجام می‌شوند
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'غیرمجاز' }, { status: 401 });

    const body = (await request.json()) as any;
    const { action, sheetId, userAnswers } = body;

    const { env } = await getCloudflareContext();
    const db = (env as any).testbaan_db;

    if (!db) return NextResponse.json({ error: 'دیتابیس متصل نیست' }, { status: 500 });

    // اکشن ۱: دریافت اطلاعات پاسخ‌برگ برای شروع آزمون
    if (action === 'fetch') {
      const permCheck = await db.prepare("SELECT id FROM user_permissions WHERE user_id = ? AND answer_sheet_id = ?").bind(user.id, sheetId).all();
      if (!permCheck.results || permCheck.results.length === 0) {
        return NextResponse.json({ error: 'شما به این آزمون دسترسی ندارید' }, { status: 403 });
      }

      const { results } = await db.prepare("SELECT id, title, type, duration_minutes, start_question_number, total_questions FROM answer_sheets WHERE id = ?").bind(sheetId).all();
      return NextResponse.json(results[0] || null, { status: 200 });
    }

    // اکشن ۲: ثبت نهایی پاسخ‌ها و محاسبه درصد
    if (action === 'submit') {
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

      let score = ((correct * 3) - wrong) / (total * 3) * 100;
      score = parseFloat(score.toFixed(2));

      const submissionId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      const answersJson = JSON.stringify(userAnswers || {});

      await db.prepare(
        "INSERT INTO user_submissions (id, user_id, answer_sheet_id, status, user_answers, score_percentage, completed_at) VALUES (?, ?, ?, 'completed', ?, ?, CURRENT_TIMESTAMP)"
      ).bind(submissionId, user.id, sheetId, answersJson, score).run();

      return NextResponse.json({ success: true, submissionId });
    }

    return NextResponse.json({ error: 'اکشن نامعتبر است' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}