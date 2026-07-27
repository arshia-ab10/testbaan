import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      book_id, custom_id, title, type, 
      duration_minutes, start_question_number, 
      total_questions, correct_keys 
    } = body;

    // اعتبارسنجی فیلدهای ضروری
    if (!book_id || !custom_id || !title || !total_questions || !correct_keys) {
      return NextResponse.json({ error: 'اطلاعات ضروری پاسخ‌برگ ناقص است' }, { status: 400 });
    }

    const db = (process.env.testbaan_db || (globalThis as any).testbaan_db) as any;

    const id = crypto.randomUUID();
    
    // تبدیل کلید سوالات (آرایه/آبجکت) به رشته متنی (JSON) برای ذخیره در دیتابیس
    const keysJson = JSON.stringify(correct_keys);

    await db.prepare(
      `INSERT INTO answer_sheets 
      (id, book_id, custom_id, title, type, duration_minutes, start_question_number, total_questions, correct_keys) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id, 
      book_id, 
      custom_id, 
      title, 
      type || 'practice', 
      duration_minutes || null, 
      start_question_number || 1, 
      total_questions, 
      keysJson
    ).run();

    return NextResponse.json({ 
      message: 'پاسخ‌برگ با موفقیت ساخته شد', 
      answerSheetId: id 
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}