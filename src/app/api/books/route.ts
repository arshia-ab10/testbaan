import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET() {
  try {
    const { env } = await getCloudflareContext();
    const db = (env as any).testbaan_db;
    if (!db) return NextResponse.json({ error: 'دیتابیس متصل نیست' }, { status: 500 });

    const { results } = await db.prepare('SELECT * FROM books ORDER BY created_at DESC').all();
    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as any;
    const { title, description } = body;

    if (!title) return NextResponse.json({ error: 'عنوان کتاب/آزمون الزامی است' }, { status: 400 });

    const { env } = await getCloudflareContext();
    const db = (env as any).testbaan_db;
    if (!db) return NextResponse.json({ error: 'دیتابیس متصل نیست' }, { status: 500 });

    // تمام آیدی‌ها ۱۰ رقمی تصادفی
    const random10Digit = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const id = random10Digit;
    const custom_id = random10Digit;

    await db.prepare('INSERT INTO books (id, custom_id, title, description) VALUES (?, ?, ?, ?)')
      .bind(id, custom_id, title, description || '').run();

    return NextResponse.json({ message: 'کتاب ساخته شد', book: { id, custom_id, title } }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'شناسه ارسال نشده است' }, { status: 400 });

    const { env } = await getCloudflareContext();
    const db = (env as any).testbaan_db;
    if (!db) return NextResponse.json({ error: 'دیتابیس متصل نیست' }, { status: 500 });

    await db.prepare('DELETE FROM books WHERE id = ?').bind(id).run();
    return NextResponse.json({ message: 'کتاب حذف شد' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}