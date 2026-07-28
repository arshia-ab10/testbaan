"use client";
import { useState, useEffect } from "react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("exams"); // 'exams' | 'users'
  const [books, setBooks] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [answerSheets, setAnswerSheets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [allSheets, setAllSheets] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [bookTitle, setBookTitle] = useState("");
  const [bookDesc, setBookDesc] = useState("");
  const [sheetTitle, setSheetTitle] = useState("");
  const [sheetType, setSheetType] = useState("practice");
  const [duration, setDuration] = useState("");
  const [startNum, setStartNum] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [keys, setKeys] = useState<Record<number, number>>({});

  useEffect(() => {
    fetchBooks();
    fetchAllSheets();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedBook) fetchAnswerSheets(selectedBook.id);
  }, [selectedBook]);

  useEffect(() => {
    if (selectedUser) fetchPermissions(selectedUser.id);
  }, [selectedUser]);

  const fetchBooks = async () => {
    const res = await fetch("/api/books");
    if (res.ok) setBooks(await res.json());
  };

  const fetchAllSheets = async () => {
    const res = await fetch("/api/answer-sheets");
    if (res.ok) setAllSheets(await res.json());
  };

  const fetchAnswerSheets = async (bookId: string) => {
    const res = await fetch(`/api/answer-sheets?book_id=${bookId}`);
    if (res.ok) setAnswerSheets(await res.json());
  };

  const fetchUsers = async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
  };

  const fetchPermissions = async (userId: string) => {
    const res = await fetch(`/api/admin/permissions?userId=${userId}`);
    if (res.ok) setUserPermissions(await res.json());
  };

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/books", {
      method: "POST", body: JSON.stringify({ title: bookTitle, description: bookDesc }),
    });
    if (res.ok) { setMessage("✅ کتاب اضافه شد"); setBookTitle(""); setBookDesc(""); fetchBooks(); }
    setLoading(false);
  };

  const handleDeleteBook = async (id: string) => {
    if (!confirm("مطمئن هستید؟")) return;
    await fetch(`/api/books?id=${id}`, { method: "DELETE" });
    fetchBooks();
    if (selectedBook?.id === id) setSelectedBook(null);
  };

  const handleCreateSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/answer-sheets", {
      method: "POST",
      body: JSON.stringify({ book_id: selectedBook.id, title: sheetTitle, type: sheetType, duration_minutes: duration ? parseInt(duration) : null, start_question_number: startNum, total_questions: totalQuestions, correct_keys: keys }),
    });
    if (res.ok) { setMessage("✅ پاسخ‌برگ ثبت شد"); setSheetTitle(""); setKeys({}); fetchAnswerSheets(selectedBook.id); fetchAllSheets(); }
    setLoading(false);
  };

  const handleDeleteSheet = async (id: string) => {
    if (!confirm("مطمئن هستید؟")) return;
    await fetch(`/api/answer-sheets?id=${id}`, { method: "DELETE" });
    fetchAnswerSheets(selectedBook.id); fetchAllSheets();
  };

  const handleSavePermissions = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/permissions", {
      method: "POST", body: JSON.stringify({ userId: selectedUser.id, sheetIds: userPermissions })
    });
    if (res.ok) setMessage("✅ دسترسی‌ها بروزرسانی شد");
    setLoading(false);
  };

  const togglePermission = (sheetId: string) => {
    setUserPermissions(prev => prev.includes(sheetId) ? prev.filter(id => id !== sheetId) : [...prev, sheetId]);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6 border-b pb-4 dark:border-gray-800">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">پنل مدیریت تست‌بان</h1>
          <div className="flex gap-2">
            <button onClick={() => {setActiveTab('exams'); setSelectedBook(null);}} className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'exams' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>آزمون‌ها</button>
            <button onClick={() => {setActiveTab('users'); setSelectedUser(null);}} className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>کاربران</button>
          </div>
        </div>

        {message && <div className="mb-6 p-3 bg-green-100 text-green-800 rounded-lg text-center font-bold">{message}</div>}

        {activeTab === 'exams' && (
          /* بخش آزمون‌ها (کد قبلی) */
          !selectedBook ? (
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow border dark:border-gray-700 h-fit">
                <h2 className="text-lg font-bold mb-4">افزودن کتاب یا آزمون</h2>
                <form onSubmit={handleCreateBook} className="space-y-4">
                  <input required placeholder="نام کتاب" className="w-full p-2 border rounded dark:bg-gray-700" value={bookTitle} onChange={e => setBookTitle(e.target.value)} />
                  <textarea placeholder="توضیحات" className="w-full p-2 border rounded dark:bg-gray-700" value={bookDesc} onChange={e => setBookDesc(e.target.value)} />
                  <button disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded font-bold">ثبت</button>
                </form>
              </div>
              <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
                {books.map(b => (
                  <div key={b.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow border flex flex-col justify-between">
                    <div><h3 className="font-bold text-lg">{b.title}</h3><p className="text-sm text-gray-500">{b.description}</p></div>
                    <div className="flex gap-2 mt-4 pt-3 border-t"><button onClick={() => setSelectedBook(b)} className="flex-1 bg-green-600 text-white py-1.5 rounded text-sm">پاسخ‌برگ‌ها</button><button onClick={() => handleDeleteBook(b.id)} className="bg-red-500 text-white px-3 py-1.5 rounded text-sm">حذف</button></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <button onClick={() => setSelectedBook(null)} className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-lg text-sm mb-4">← بازگشت</button>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow border">
                  <h3 className="font-bold mb-4">افزودن پاسخ‌برگ به {selectedBook.title}</h3>
                  <form onSubmit={handleCreateSheet} className="space-y-4">
                    <input required placeholder="عنوان (مثلا فصل ۱)" className="w-full p-2 border rounded dark:bg-gray-700" value={sheetTitle} onChange={e => setSheetTitle(e.target.value)} />
                    <div className="grid grid-cols-2 gap-2">
                      <select className="w-full p-2 border rounded dark:bg-gray-700" value={sheetType} onChange={e => setSheetType(e.target.value)}><option value="practice">تست عادی</option><option value="exam">آزمون زمان‌دار</option></select>
                      <input type="number" placeholder="زمان (دقیقه)" disabled={sheetType === 'practice'} className="w-full p-2 border rounded dark:bg-gray-700" value={duration} onChange={e => setDuration(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" placeholder="شروع سوال" className="w-full p-2 border rounded dark:bg-gray-700" value={startNum} onChange={e => setStartNum(parseInt(e.target.value) || 1)} />
                      <input type="number" placeholder="تعداد سوال" className="w-full p-2 border rounded dark:bg-gray-700" value={totalQuestions} onChange={e => setTotalQuestions(parseInt(e.target.value) || 1)} />
                    </div>
                    <div className="mt-4 max-h-48 overflow-y-auto grid grid-cols-5 gap-1 p-2 bg-gray-50 dark:bg-gray-900 rounded border">
                      {Array.from({ length: totalQuestions }, (_, i) => i + startNum).map(qNum => (
                        <div key={qNum} className="flex flex-col items-center"><span className="text-[10px]">{qNum}</span><input type="number" min="1" max="4" className="w-9 p-1 text-center border rounded text-xs dark:bg-gray-700" value={keys[qNum] || ""} onChange={e => setKeys({...keys, [qNum]: parseInt(e.target.value)})} /></div>
                      ))}
                    </div>
                    <button disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded font-bold">ثبت پاسخ‌برگ</button>
                  </form>
                </div>
                <div className="md:col-span-2 space-y-3">
                  {answerSheets.map(s => (
                    <div key={s.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border flex justify-between items-center">
                      <div><span className="font-bold">{s.title}</span> <span className="text-xs text-gray-500">({s.total_questions} سوال)</span></div>
                      <button onClick={() => handleDeleteSheet(s.id)} className="bg-red-500 text-white px-3 py-1.5 rounded text-xs">حذف</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        )}

        {activeTab === 'users' && (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow border h-fit">
              <h2 className="text-lg font-bold mb-4">لیست کاربران</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {users.map(u => (
                  <button key={u.id} onClick={() => setSelectedUser(u)} className={`w-full text-right p-3 rounded-lg border ${selectedUser?.id === u.id ? 'bg-blue-50 border-blue-500 dark:bg-blue-900' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                    <div className="font-bold">{u.name}</div>
                    <div className="text-xs text-gray-500">{u.email}</div>
                  </button>
                ))}
              </div>
            </div>
            
            {selectedUser && (
              <div className="md:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow border">
                <h2 className="text-lg font-bold mb-4">دسترسی‌های: <span className="text-blue-600">{selectedUser.name}</span></h2>
                <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                  {books.map(book => {
                    const bookSheets = allSheets.filter(s => s.book_id === book.id);
                    if(bookSheets.length === 0) return null;
                    return (
                      <div key={book.id} className="border dark:border-gray-700 rounded-lg p-4">
                        <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-3">{book.title}</h3>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {bookSheets.map(sheet => (
                            <label key={sheet.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded cursor-pointer hover:bg-gray-100">
                              <input type="checkbox" checked={userPermissions.includes(sheet.id)} onChange={() => togglePermission(sheet.id)} className="w-4 h-4 text-blue-600" />
                              <span className="text-sm">{sheet.title} <span className="text-xs text-gray-500">({sheet.type === 'exam' ? 'آزمون' : 'تست'})</span></span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <button onClick={handleSavePermissions} disabled={loading} className="w-full bg-green-600 text-white p-3 rounded-xl font-bold hover:bg-green-700">ذخیره دسترسی‌ها</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}