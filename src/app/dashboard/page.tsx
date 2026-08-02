"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { toFaNum } from "@/lib/utils";

export default function StudentDashboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/student/dashboard").then(res => res.json()).then(resData => {
      if(Array.isArray(resData)) setData(resData);
      setLoading(false);
      
      // اسکرول هوشمند به پاسخ‌برگ خاص پس از بازگشت از آزمون
      setTimeout(() => {
        const hash = window.location.hash;
        if (hash) {
          const el = document.querySelector(hash);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    });
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">در حال بارگذاری...</div>;

  const booksMap = new Map();
  data.forEach(item => {
    if (!booksMap.has(item.book_id)) booksMap.set(item.book_id, { id: item.book_id, title: item.book_title, sheets: [] });
    booksMap.get(item.book_id).sheets.push(item);
  });
  const books = Array.from(booksMap.values());
  const selectedBook = books.find(b => b.id === selectedBookId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b pb-4 dark:border-gray-800">
          <h1 className="text-3xl font-black text-blue-600 dark:text-blue-400">داشبورد آزمون‌ها</h1>
          <a href="/api/auth/logout" className="text-red-500 text-sm font-bold hover:underline">خروج</a>
        </div>

        {!selectedBookId ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {books.map(book => (
              <div key={book.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border dark:border-gray-700">
                <h3 className="text-xl font-bold mb-4">{book.title}</h3>
                <button onClick={() => setSelectedBookId(book.id)} className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold">ورود به پاسخ‌برگ‌ها</button>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <button onClick={() => setSelectedBookId(null)} className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-xl text-sm font-bold mb-6">← بازگشت</button>
            <div className="grid sm:grid-cols-2 gap-6">
              {selectedBook?.sheets.map((sheet: any) => (
                <div key={sheet.sheet_id} id={`sheet-${sheet.sheet_id}`} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow border dark:border-gray-700 flex flex-col justify-between">
                  <div className="mb-6">
                    <h4 className="text-lg font-bold">{sheet.sheet_title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{toFaNum(sheet.total_questions)} سوال</p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/exam/${sheet.sheet_id}`} className="flex-1 text-center bg-blue-600 text-white p-2.5 rounded-xl font-bold hover:bg-blue-700">
                      {sheet.status === 'completed' ? 'شرکت مجدد' : 'شروع / ادامه'}
                    </Link>
                    {sheet.status === 'completed' && (
                      <Link href={`/result/${sheet.sheet_id}`} className="flex-1 text-center bg-green-100 text-green-800 p-2.5 rounded-xl font-bold hover:bg-green-200">
                        مشاهده کارنامه‌ها
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}