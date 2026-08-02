import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'غیرمجاز' }, { status: 401 });

    const body = (await request.json()) as any;
    const { action, sheetId, userAnswers, questionFlags, qNum } = body;

    const { env } = await getCloudflareContext();
    const db = (env as any).testbaan_db;

    // ۱. دریافت اطلاعات اولیه و پیش‌نویس ابری
    if (action === 'fetch') {
      const { results: sheetRes } = await db.prepare("SELECT * FROM answer_sheets WHERE id = ?").bind(sheetId).all();
      if (!sheetRes.length) return NextResponse.json({ error: 'آزمون یافت نشد' }, { status: 404 });
      
      const { results: progRes } = await db.prepare("SELECT draft_answers, question_flags FROM user_sheet_progress WHERE user_id = ? AND answer_sheet_id = ?").bind(user.id, sheetId).all();
      
      return NextResponse.json({ 
        exam: sheetRes[0], 
        progress: progRes.length ? progRes[0] : null 
      }, { status: 200 });
    }

    // ۲. ذخیره ابری (بدون ثبت کارنامه)
    if (action === 'save_cloud') {
      const ansJson = JSON.stringify(userAnswers || {});
      const flagsJson = JSON.stringify(questionFlags || {});
      await db.prepare(`INSERT INTO user_sheet_progress (user_id, answer_sheet_id, draft_answers, question_flags) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, answer_sheet_id) DO UPDATE SET draft_answers = excluded.draft_answers, question_flags = excluded.question_flags, updated_at = CURRENT_TIMESTAMP`).bind(user.id, sheetId, ansJson, flagsJson).run();
      return NextResponse.json({ success: true });
    }

    // ۳. بررسی آنی یک سوال (Instant Check)
    if (action === 'instant_check') {
      const { results } = await db.prepare("SELECT correct_keys FROM answer_sheets WHERE id = ?").bind(sheetId).all();
      const keys = JSON.parse(results[0].correct_keys || '{}');
      return NextResponse.json({ isCorrect: keys[qNum] === userAnswers[qNum], correctOpt: keys[qNum] });
    }

    // ۴. ثبت نهایی و صدور کارنامه (ورژن‌بندی شده)
    if (action === 'submit') {
      const { results: sheetRes } = await db.prepare("SELECT * FROM answer_sheets WHERE id = ?").bind(sheetId).all();
      const sheet = sheetRes[0] as any;
      
      // محاسبه محدودیت دفعات شرکت (۲ برابر تعداد دسته‌های ۱۰تایی)
      const maxVersions = Math.ceil(sheet.total_questions / 10) * 2;
      const { results: subRes } = await db.prepare("SELECT COUNT(*) as count, MAX(version) as last_v FROM user_submissions WHERE user_id = ? AND answer_sheet_id = ?").bind(user.id, sheetId).all();
      const currentCount = subRes[0].count;
      const nextVersion = (subRes[0].last_v || 0) + 1;

      if (currentCount >= maxVersions) {
        return NextResponse.json({ error: `شما به حداکثر دفعات مجاز (${maxVersions} بار) برای این آزمون رسیده‌اید.` }, { status: 403 });
      }

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
        "INSERT INTO user_submissions (id, user_id, answer_sheet_id, status, user_answers, score_percentage, version, completed_at) VALUES (?, ?, ?, 'completed', ?, ?, ?, CURRENT_TIMESTAMP)"
      ).bind(submissionId, user.id, sheetId, answersJson, score, nextVersion).run();

      // ذخیره رنگ‌ها در دیتابیس هنگام ثبت
      const flagsJson = JSON.stringify(questionFlags || {});
      await db.prepare(`INSERT INTO user_sheet_progress (user_id, answer_sheet_id, draft_answers, question_flags) VALUES (?, ?, '{}', ?) ON CONFLICT(user_id, answer_sheet_id) DO UPDATE SET draft_answers = '{}', question_flags = excluded.question_flags`).bind(user.id, sheetId, flagsJson).run();

      return NextResponse.json({ success: true, sheetId });
    }

    return NextResponse.json({ error: 'اکشن نامعتبر' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}