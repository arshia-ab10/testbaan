"use client";

import { useState, useEffect } from "react";

export default function AdminDashboard() {
  const [books, setBooks] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState<any>(null); // کتاب انتخاب شده
  const [answerSheets, setAnswerSheets] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // فرم کتاب
  const [bookTitle, setBookTitle] = useState("");
  const [bookDesc, setBookDesc] = useState("");

  // فرم پاسخ‌برگ
  const [sheetTitle, setSheetTitle] = useState("");
  const [sheetType, setSheetType] = useState("practice");
  const [duration, setDuration] = useState("");
  const [startNum, setStartNum] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [keys, setKeys] = useState<Record<number, number>>({});

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    if (selectedBook) {
      fetchAnswerSheets(selectedBook.id);
    }
  }, [selectedBook]);

  const fetchBooks = async () => {
    const res = await fetch("/api/books");
    if (res.ok) setBooks((await res.json()) as any[]);
  };

  const fetchAnswerSheets = async (bookId: string) => {
    const res = await fetch(`/api/answer-sheets?book_id=${bookId}`);
    if (res.ok) setAnswerSheets((await res.json()) as any[]);
  };

  // ساخت کتاب جدید
  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: bookTitle, description: bookDesc }),
    });
    if (res.ok) {
      setMessage("✅ کتاب/آزمون جدید اضافه شد");
      setBookTitle("");
      setBookDesc("");
      fetchBooks();
    }
    setLoading(false);
  };

  // حذف کتاب
  const handleDeleteBook = async (id: string) => {
    if (!confirm("آیا از حذف این مجموعه مطمئن هستید؟")) return;
    const res = await fetch(`/api/books?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchBooks();
      if (selectedBook?.id === id) setSelectedBook(null);
    }
  };

  // ساخت پاسخ‌برگ جدید
  const handleCreateSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;
    setLoading(true);

    const payload = {
      book_id: selectedBook.id,
      title: sheetTitle,
      type: sheetType,
      duration_minutes: duration ? parseInt(duration) : null,
      start_question_number: startNum,
      total_questions: totalQuestions,
      correct_keys: keys
    };

    const res = await fetch("/api/answer-sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setMessage("✅ پاسخ‌برگ جدید ثبت شد");
      setSheetTitle("");
      setKeys({});
      fetchAnswerSheets(selectedBook.id);
    }
    setLoading(false);
  };

  // حذف پاسخ‌برگ
  const handleDeleteSheet = async (id: string) => {
    if (!confirm("آیا از حذف این پاسخ‌برگ مطمئن هستید؟")) return;
    const res = await fetch(`/api/answer-sheets?id=${id}`, { method: "DELETE" });
    if (res.ok) fetchAnswerSheets(selectedBook.id);
  };

  const questionsArray = Array.from({ length: totalQuestions }, (_, i) => i + startNum);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b pb-4 dark:border-gray-800">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">پنل مدیریت تست‌بان</h1>
          {selectedBook && (
            <button onClick={() => setSelectedBook(null)} className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-lg text-sm">
              ← بازگشت به لیست کتاب‌ها
            </button>
          )}
        </div>

        {message && <div className="mb-6 p-3 bg-green-100 text-green-800 rounded-lg text-center font-bold">{message}</div>}

        {/* نمای اول: مدیریت کتاب‌ها / آزمون‌ها */}
        {!selectedBook ? (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow border dark:border-gray-700 h-fit">
              <h2 className="text-lg font-bold mb-4">افزودن کتاب یا آزمون جدید</h2>
              <form onSubmit={handleCreateBook} className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">نام کتاب یا آزمون</label>
                  <input required type="text" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    value={bookTitle} onChange={e => setBookTitle(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm mb-1">توضیحات</label>
                  <textarea className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    value={bookDesc} onChange={e => setBookDesc(e.target.value)} />
                </div>
                <button disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700">
                  ثبت کتاب / آزمون
                </button>
              </form>
            </div>

            <div className="md:col-span-2 space-y-4">
              <h2 className="text-lg font-bold">لیست کتاب‌ها و آزمون‌های موجود</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {books.map(b => (
                  <div key={b.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow border dark:border-gray-700 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-mono bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded">
                        آیدی: {b.custom_id}
                      </span>
                      <h3 className="font-bold text-lg mt-2">{b.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{b.description || "بدون توضیحات"}</p>
                    </div>
                    <div className="flex gap-2 mt-4 pt-3 border-t dark:border-gray-700">
                      <button onClick={() => setSelectedBook(b)} className="flex-1 bg-green-600 text-white py-1.5 rounded text-sm font-bold hover:bg-green-700">
                        مدیریت پاسخ‌برگ‌ها
                      </button>
                      <button onClick={() => handleDeleteBook(b.id)} className="bg-red-500 text-white px-3 py-1.5 rounded text-sm hover:bg-red-600">
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* نمای دوم: مدیریت پاسخ‌برگ‌های کتاب انتخاب شده */
          <div className="space-y-8">
            <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded-xl border border-blue-200 dark:border-gray-700 flex justify-between items-center">
              <div>
                <span className="text-xs font-mono text-gray-500">کتاب انتخاب شده:</span>
                <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400">{selectedBook.title} ({selectedBook.custom_id})</h2>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* فرم افزودن پاسخ‌برگ */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow border dark:border-gray-700">
                <h3 className="font-bold mb-4">افزودن پاسخ‌برگ به این کتاب</h3>
                <form onSubmit={handleCreateSheet} className="space-y-4">
                  <div>
                    <label className="block text-sm mb-1">عنوان (مثلا: فصل ۱)</label>
                    <input required type="text" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                      value={sheetTitle} onChange={e => setSheetTitle(e.target.value)} />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs mb-1">نوع</label>
                      <select className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                        value={sheetType} onChange={e => setSheetType(e.target.value)}>
                        <option value="practice">تست عادی</option>
                        <option value="exam">آزمون (زمان‌دار)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs mb-1">زمان (دقیقه)</label>
                      <input type="number" disabled={sheetType === 'practice'} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50"
                        value={duration} onChange={e => setDuration(e.target.value)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs mb-1">شماره اولین سوال</label>
                      <input type="number" min="1" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                        value={startNum} onChange={e => setStartNum(parseInt(e.target.value) || 1)} />
                    </div>
                    <div>
                      <label className="block text-xs mb-1">تعداد کل سوالات</label>
                      <input type="number" min="1" max="300" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                        value={totalQuestions} onChange={e => setTotalQuestions(parseInt(e.target.value) || 1)} />
                    </div>
                  </div>

                  {/* کلید سوالات */}
                  <div className="mt-4">
                    <label className="block text-xs font-bold mb-2">کلید سوالات (گزینه ۱ تا ۴):</label>
                    <div className="grid grid-cols-5 gap-1.5 max-h-48 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900 rounded border">
                      {questionsArray.map(qNum => (
                        <div key={qNum} className="flex flex-col items-center">
                          <span className="text-[10px] text-gray-500">{qNum}</span>
                          <input type="number" min="1" max="4" className="w-9 p-1 text-center border rounded dark:bg-gray-700 text-xs"
                            value={keys[qNum] || ""} onChange={e => setKeys({...keys, [qNum]: parseInt(e.target.value)})} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <button disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700">
                    ثبت پاسخ‌برگ
                  </button>
                </form>
              </div>

              {/* لیست پاسخ‌برگ‌های موجود */}
              <div className="md:col-span-2 space-y-4">
                <h3 className="font-bold">پاسخ‌برگ‌های این کتاب</h3>
                <div className="space-y-3">
                  {answerSheets.map(s => (
                    <div key={s.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border dark:border-gray-700 flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{s.title}</span>
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded font-mono">آیدی: {s.custom_id}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${s.type === 'exam' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                            {s.type === 'exam' ? `آزمون (${s.duration_minutes} دقیقه)` : 'تست عادی'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">تعداد سوالات: {s.total_questions} | شماره شروع: {s.start_question_number}</p>
                      </div>
                      <button onClick={() => handleDeleteSheet(s.id)} className="bg-red-500 text-white px-3 py-1.5 rounded text-xs hover:bg-red-600">
                        حذف
                      </button>
                    </div>
                  ))}
                  {answerSheets.length === 0 && <p className="text-gray-500 text-center py-8">هنوز هیچ پاسخ‌برگی برای این کتاب ثبت نشده است.</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}