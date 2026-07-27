"use client";

import { useState, useEffect } from "react";

export default function AdminPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // استیت‌های فرم کتاب/آزمون
  const [bookForm, setBookForm] = useState({ custom_id: "", title: "", description: "" });

  // استیت‌های فرم پاسخ‌برگ
  const [sheetForm, setSheetForm] = useState({
    book_id: "", custom_id: "", title: "", type: "practice",
    duration_minutes: "", start_question_number: 1, total_questions: 10
  });
  
  // استیت کلید سوالات (مثلاً { "1": 2, "2": 4 })
  const [keys, setKeys] = useState<Record<number, number>>({});

  // دریافت لیست کتاب‌ها هنگام لود صفحه
  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    const res = await fetch("/api/books");
    if (res.ok) {
      const data = (await res.json()) as any[];
      setBooks(data);
    }
  };

  // ارسال فرم کتاب/آزمون
  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    
    const res = await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookForm),
    });
    
    if (res.ok) {
      setMessage("✅ مجموعه/آزمون با موفقیت ثبت شد!");
      setBookForm({ custom_id: "", title: "", description: "" });
      fetchBooks(); // بروزرسانی لیست
    } else {
      setMessage("❌ خطا در ثبت اطلاعات.");
    }
    setLoading(false);
  };

  // ارسال فرم پاسخ‌برگ
  const handleSheetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const payload = {
      ...sheetForm,
      duration_minutes: sheetForm.duration_minutes ? parseInt(sheetForm.duration_minutes) : null,
      correct_keys: keys
    };

    const res = await fetch("/api/answer-sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setMessage("✅ پاسخ‌برگ با موفقیت ثبت شد!");
      setKeys({});
    } else {
      setMessage("❌ خطا در ثبت پاسخ‌برگ.");
    }
    setLoading(false);
  };

  // تولید آرایه برای رندر کردن اینپوت‌های کلید سوالات
  const questionsArray = Array.from({ length: sheetForm.total_questions }, (_, i) => i + sheetForm.start_question_number);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center text-blue-600 dark:text-blue-400">پنل مدیریت تست‌بان</h1>
      
      {message && (
        <div className="mb-6 p-4 rounded-lg text-center font-bold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
          {message}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* فرم اول: ثبت کتاب یا آزمون */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">۱. تعریف مجموعه (کتاب یا آزمون)</h2>
          <form onSubmit={handleBookSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">شناسه اختصاصی (انگلیسی - مثلا bio-1403)</label>
              <input required type="text" dir="ltr"
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                value={bookForm.custom_id} onChange={e => setBookForm({...bookForm, custom_id: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm mb-1">نام کتاب یا آزمون</label>
              <input required type="text" 
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                value={bookForm.title} onChange={e => setBookForm({...bookForm, title: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm mb-1">توضیحات (اختیاری)</label>
              <textarea className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                value={bookForm.description} onChange={e => setBookForm({...bookForm, description: e.target.value})} />
            </div>
            <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded font-bold transition">
              ثبت مجموعه
            </button>
          </form>
        </div>

        {/* فرم دوم: ثبت پاسخ‌برگ */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">۲. تعریف پاسخ‌برگ (فصل / بخش)</h2>
          <form onSubmit={handleSheetSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">انتخاب مجموعه (کتاب/آزمون)</label>
              <select required className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                value={sheetForm.book_id} onChange={e => setSheetForm({...sheetForm, book_id: e.target.value})}>
                <option value="">-- انتخاب کنید --</option>
                {books.map(b => <option key={b.id} value={b.id}>{b.title} ({b.custom_id})</option>)}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">شناسه پاسخ‌برگ (مثلا ch1)</label>
                <input required type="text" dir="ltr" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  value={sheetForm.custom_id} onChange={e => setSheetForm({...sheetForm, custom_id: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm mb-1">عنوان (مثلا فصل اول)</label>
                <input required type="text" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  value={sheetForm.title} onChange={e => setSheetForm({...sheetForm, title: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">نوع</label>
                <select className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  value={sheetForm.type} onChange={e => setSheetForm({...sheetForm, type: e.target.value})}>
                  <option value="practice">تست عادی (بدون زمان)</option>
                  <option value="exam">آزمون (زمان‌دار)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">زمان (دقیقه)</label>
                <input type="number" disabled={sheetForm.type === 'practice'} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50"
                  value={sheetForm.duration_minutes} onChange={e => setSheetForm({...sheetForm, duration_minutes: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">شماره اولین سوال</label>
                <input required type="number" min="1" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  value={sheetForm.start_question_number} onChange={e => setSheetForm({...sheetForm, start_question_number: parseInt(e.target.value) || 1})} />
              </div>
              <div>
                <label className="block text-sm mb-1">تعداد کل سوالات</label>
                <input required type="number" min="1" max="300" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  value={sheetForm.total_questions} onChange={e => setSheetForm({...sheetForm, total_questions: parseInt(e.target.value) || 1})} />
              </div>
            </div>

            {/* بخش ورود کلید سوالات */}
            <div className="mt-6 border-t pt-4">
              <label className="block font-bold mb-3 text-blue-600 dark:text-blue-400">وارد کردن کلید سوالات:</label>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-60 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900 rounded border dark:border-gray-700">
                {questionsArray.map(qNum => (
                  <div key={qNum} className="flex flex-col items-center">
                    <span className="text-xs mb-1 text-gray-500">{qNum}</span>
                    <input 
                      type="number" min="1" max="4"
                      className="w-12 p-1 text-center border rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                      value={keys[qNum] || ""}
                      onChange={(e) => setKeys({...keys, [qNum]: parseInt(e.target.value)})}
                    />
                  </div>
                ))}
              </div>
            </div>

            <button disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white p-2 rounded font-bold transition mt-4">
              ثبت پاسخ‌برگ و کلیدها
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}