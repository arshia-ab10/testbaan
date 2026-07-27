import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // دریافت اطلاعات ارسال شده از سمت کاربر (فرانت‌اند)
    const body = await request.json();
    const { custom_id, title, description } = body;

    // اعتبارسنجی: بررسی اینکه فیلدهای ضروری پر شده باشند
    if (!custom_id || !title) {
      return NextResponse.json({ error: 'شناسه اختصاصی و عنوان کتاب الزامی است' }, { status: 400 });
    }

    // اتصال به دیتابیس D1 کلودفلر
    // در OpenNext دیتابیس از طریق process.env در دسترس است
    const db = (process.env.testbaan_db || (globalThis as any).testbaan_db) as any;
    
    if (!db) {
      return NextResponse.json({ error: 'دیتابیس متصل نیست' }, { status: 500 });
    }

    // تولید یک آیدی یکتا و تصادفی برای دیتابیس
    const id = crypto.randomUUID();

    // ذخیره در دیتابیس
    await db.prepare(
      'INSERT INTO books (id, custom_id, title, description) VALUES (?, ?, ?, ?)'
    ).bind(id, custom_id, title, description || '').run();

    return NextResponse.json({ 
      message: 'کتاب با موفقیت ساخته شد', 
      book: { id, custom_id, title } 
    }, { status: 201 });

  } catch (error: any) {
    // اگر شناسه تکراری باشد یا خطای دیگری رخ دهد
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}