import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// دریافت پاسخ‌برگ‌های یک کتاب
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const book_id = searchParams.get('book_id');

    const { env } = await getCloudflareContext();
    const db = (env as any).testbaan_db;
    if (!db) return NextResponse.json({ error: 'دیتابیس متصل نیست' }, { status: 500 });

    let query = 'SELECT * FROM answer_sheets';
    let params: any[] = [];

    if (book_id) {
      query += ' WHERE book_id = ?';
      params.push(book_id);
    }
    query += ' ORDER BY created_at DESC';

    const { results } = await db.prepare(query).bind(...params).all();

    const parsedResults = results.map((item: any) => ({
      ...item,
      correct_keys: item.correct_keys ? JSON.parse(item.correct_keys) : {}
    }));

    return NextResponse.json(parsedResults, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ساخت پاسخ‌برگ جدید
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as any;
    const { book_id, title, type, duration_minutes, start_question_number, total_questions, correct_keys } = body;

    if (!book_id || !title || !total_questions || !correct_keys) {
      return NextResponse.json({ error: 'اطلاعات ضروری ناقص است' }, { status: 400 });
    }

    const { env } = await getCloudflareContext();
    const db = (env as any).testbaan_db;
    if (!db) return NextResponse.json({ error: 'دیتابیس متصل نیست' }, { status: 500 });

    const custom_id = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const id = crypto.randomUUID();
    const keysJson = JSON.stringify(correct_keys);

    await db.prepare(
      `INSERT INTO answer_sheets (id, book_id, custom_id, title, type, duration_minutes, start_question_number, total_questions, correct_keys) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, book_id, custom_id, title, type || 'practice', duration_minutes || null, start_question_number || 1, total_questions, keysJson).run();

    return NextResponse.json({ message: 'پاسخ‌برگ ساخته شد' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// حذف پاسخ‌برگ
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'شناسه ارسال نشده است' }, { status: 400 });

    const { env } = await getCloudflareContext();
    const db = (env as any).testbaan_db;
    if (!db) return NextResponse.json({ error: 'دیتابیس متصل نیست' }, { status: 500 });

    await db.prepare('DELETE FROM answer_sheets WHERE id = ?').bind(id).run();
    return NextResponse.json({ message: 'پاسخ‌برگ حذف شد' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}