"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function StudentDashboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/student/dashboard").then(res => res.json()).then(resData => {
      if(Array.isArray(resData)) setData(resData);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">در حال بارگذاری...</div>;

  // استخراج لیست کتاب‌های منحصر به فرد
  const booksMap = new Map();
  data.forEach(item => {
    if (!booksMap.has(item.book_id)) {
      booksMap.set(item.book_id, {
        id: item.book_id,
        title: item.book_title,
        description: item.book_description,
        sheets: []
      });
    }
    booksMap.get(item.book_id).sheets.push(item);
  });
  const books = Array.from(booksMap.values());

  const selectedBook = books.find(b => b.id === selectedBookId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b pb-4 dark:border-gray-800">
          <h1 className="text-3xl font-black text-blue-600 dark:text-blue-400">داشبورد آزمون‌های من</h1>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-bold text-gray-600 dark:text-gray-300 hover:underline">صفحه اصلی</Link>
            <a href="/api/auth/logout" className="text-red-500 text-sm font-bold hover:underline">خروج</a>
          </div>
        </div>

        {/* نمای اول: انتخاب کتاب / مجموعه */}
        {!selectedBookId ? (
          <div>
            <h2 className="text-xl font-bold mb-6">مجموعه‌ها و کتاب‌های فعال برای شما:</h2>
            {books.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 p-12 rounded-3xl text-center text-gray-500 border dark:border-gray-700">
                هنوز هیچ آزمونی برای شما فعال نشده است.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                {books.map(book => (
                  <div key={book.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border dark:border-gray-700 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-bold mb-2">{book.title}</h3>
                      <p className="text-sm text-gray-500 mb-4">{book.description || 'بدون توضیحات'}</p>
                      <span className="inline-block text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-2.5 py-1 rounded-full font-bold mb-4">
                        {book.sheets.length} پاسخ‌برگ موجود
                      </span>
                    </div>
                    <button onClick={() => setSelectedBookId(book.id)} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-bold transition shadow-md">
                      ورود به پاسخ‌برگ‌ها ←
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* نمای دوم: لیست پاسخ‌برگ‌های کتاب انتخاب شده */
          <div>
            <button onClick={() => setSelectedBookId(null)} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-4 py-2 rounded-xl text-sm font-bold mb-6 transition">
              ← بازگشت به لیست کتاب‌ها
            </button>

            <div className="bg-blue-50 dark:bg-gray-800 p-6 rounded-2xl border border-blue-200 dark:border-gray-700 mb-8">
              <span className="text-xs font-bold text-gray-500">کتاب انتخاب شده:</span>
              <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{selectedBook?.title}</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {selectedBook?.sheets.map((sheet: any) => (
                <div key={sheet.sheet_id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow border dark:border-gray-700 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-bold">{sheet.sheet_title}</h4>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${sheet.type === 'exam' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                        {sheet.type === 'exam' ? `زمان‌دار (${sheet.duration_minutes} دقیقه)` : 'تست عادی'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-6">تعداد کل سوالات: {sheet.total_questions}</p>
                  </div>

                  {sheet.status === 'completed' ? (
                    <Link href={`/result/${sheet.submission_id}`} className="block text-center bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 p-3 rounded-xl font-bold hover:bg-green-200 transition">
                      مشاهده کارنامه ({sheet.score_percentage}%)
                    </Link>
                  ) : (
                    <Link href={`/exam/${sheet.sheet_id}`} className="block text-center bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-md">
                      {sheet.status === 'in_progress' ? 'ادامه پاسخ‌دهی' : 'پاسخ به سوالات (شروع)'}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}