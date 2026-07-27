import { NextResponse } from 'next/server';

// ۱. ثبت کتاب یا آزمون جدید (POST)
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as any;
    const { custom_id, title, description } = body;

    if (!custom_id || !title) {
      return NextResponse.json({ error: 'شناسه اختصاصی و عنوان کتاب الزامی است' }, { status: 400 });
    }

    const db = (process.env.testbaan_db || (globalThis as any).testbaan_db) as any;
    
    if (!db) {
      return NextResponse.json({ error: 'دیتابیس متصل نیست' }, { status: 500 });
    }

    const id = crypto.randomUUID();

    await db.prepare(
      'INSERT INTO books (id, custom_id, title, description) VALUES (?, ?, ?, ?)'
    ).bind(id, custom_id, title, description || '').run();

    return NextResponse.json({ 
      message: 'کتاب با موفقیت ساخته شد', 
      book: { id, custom_id, title } 
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ۲. دریافت لیست کتاب‌ها (GET)
export async function GET() {
  try {
    const db = (process.env.testbaan_db || (globalThis as any).testbaan_db) as any;
    
    if (!db) {
      return NextResponse.json({ error: 'دیتابیس متصل نیست' }, { status: 500 });
    }

    const { results } = await db.prepare('SELECT id, custom_id, title FROM books ORDER BY created_at DESC').all();
    
    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}