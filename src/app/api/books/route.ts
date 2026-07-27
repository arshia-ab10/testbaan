export async function GET() {
  try {
    const db = (process.env.testbaan_db || (globalThis as any).testbaan_db) as any;
    
    // دریافت لیست کتاب‌ها/آزمون‌ها برای نمایش در فرم
    const { results } = await db.prepare('SELECT id, custom_id, title FROM books ORDER BY created_at DESC').all();
    
    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}