"use client";
import { useState, useEffect } from "react";

export default function AdminDashboard() {
  // استیت‌های تب‌ها و داده‌های اصلی
  const [activeTab, setActiveTab] = useState("exams"); // 'exams' | 'users'
  const [books, setBooks] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [answerSheets, setAnswerSheets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [allSheets, setAllSheets] = useState<any[]>([]);
  
  // استیت‌های وضعیت
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // استیت‌های فرم کتاب
  const [bookTitle, setBookTitle] = useState("");
  const [bookDesc, setBookDesc] = useState("");
  
  // استیت‌های فرم پاسخ‌برگ
  const [sheetTitle, setSheetTitle] = useState("");
  const [sheetType, setSheetType] = useState("practice");
  const [duration, setDuration] = useState("");
  const [startNum, setStartNum] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [keys, setKeys] = useState<Record<number, number>>({});

  // دریافت اطلاعات اولیه هنگام لود صفحه
  useEffect(() => {
    fetchBooks();
    fetchAllSheets();
    fetchUsers();
  }, []);

  // دریافت پاسخ‌برگ‌ها وقتی یک کتاب انتخاب می‌شود
  useEffect(() => {
    if (selectedBook) fetchAnswerSheets(selectedBook.id);
  }, [selectedBook]);

  // دریافت دسترسی‌ها وقتی یک کاربر انتخاب می‌شود
  useEffect(() => {
    if (selectedUser) fetchPermissions(selectedUser.id);
  }, [selectedUser]);

  // توابع ارتباط با API
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

  // توابع عملیاتی (ثبت و حذف)
  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/books", {
      method: "POST", body: JSON.stringify({ title: bookTitle, description: bookDesc }),
    });
    if (res.ok) { 
      setMessage("✅ کتاب/آزمون اضافه شد"); 
      setBookTitle(""); 
      setBookDesc(""); 
      fetchBooks(); 
    }
    setLoading(false);
  };

  const handleDeleteBook = async (id: string) => {
    if (!confirm("آیا از حذف این مجموعه مطمئن هستید؟")) return;
    await fetch(`/api/books?id=${id}`, { method: "DELETE" });
    fetchBooks();
    if (selectedBook?.id === id) setSelectedBook(null);
  };

  const handleCreateSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/answer-sheets", {
      method: "POST",
      body: JSON.stringify({ 
        book_id: selectedBook.id, 
        title: sheetTitle, 
        type: sheetType, 
        duration_minutes: duration ? parseInt(duration) : null, 
        start_question_number: startNum, 
        total_questions: totalQuestions, 
        correct_keys: keys 
      }),
    });
    if (res.ok) { 
      setMessage("✅ پاسخ‌برگ ثبت شد"); 
      setSheetTitle(""); 
      setKeys({}); 
      fetchAnswerSheets(selectedBook.id); 
      fetchAllSheets(); 
    }
    setLoading(false);
  };

  const handleDeleteSheet = async (id: string) => {
    if (!confirm("آیا از حذف این پاسخ‌برگ مطمئن هستید؟")) return;
    await fetch(`/api/answer-sheets?id=${id}`, { method: "DELETE" });
    fetchAnswerSheets(selectedBook.id); 
    fetchAllSheets();
  };

  const handleSavePermissions = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/permissions", {
      method: "POST", body: JSON.stringify({ userId: selectedUser.id, sheetIds: userPermissions })
    });
    if (res.ok) setMessage("✅ دسترسی‌ها با موفقیت بروزرسانی شد");
    setLoading(false);
  };

  const togglePermission = (sheetId: string) => {
    setUserPermissions(prev => prev.includes(sheetId) ? prev.filter(id => id !== sheetId) : [...prev, sheetId]);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* هدر و تب‌ها */}
        <div className="flex justify-between items-center mb-6 border-b pb-4 dark:border-gray-800">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">پنل مدیریت تست‌بان</h1>
          <div className="flex gap-2">
            <button 
              onClick={() => {setActiveTab('exams'); setSelectedBook(null);}} 
              className={`px-4 py-2 rounded-lg font-bold transition ${activeTab === 'exams' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
              آزمون‌ها
            </button>
            <button 
              onClick={() => {setActiveTab('users'); setSelectedUser(null);}} 
              className={`px-4 py-2 rounded-lg font-bold transition ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
              کاربران
            </button>
            <a href="/" className="px-4 py-2 rounded-lg font-bold bg-gray-800 text-white hover:bg-gray-900 transition">
              صفحه اصلی
            </a>
          </div>
        </div>

        {/* پیام سیستم */}
        {message && (
          <div className="mb-6 p-3 bg-green-100 text-green-800 rounded-lg text-center font-bold border border-green-200">
            {message}
          </div>
        )}

        {/* ==================== تب آزمون‌ها ==================== */}
        {activeTab === 'exams' && (
          !selectedBook ? (
            <div className="grid md:grid-cols-3 gap-8">
              {/* فرم افزودن کتاب */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow border dark:border-gray-700 h-fit">
                <h2 className="text-lg font-bold mb-4">افزودن کتاب یا آزمون</h2>
                <form onSubmit={handleCreateBook} className="space-y-4">
                  <input required placeholder="نام کتاب یا آزمون" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={bookTitle} onChange={e => setBookTitle(e.target.value)} />
                  <textarea placeholder="توضیحات (اختیاری)" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={bookDesc} onChange={e => setBookDesc(e.target.value)} />
                  <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded font-bold transition">ثبت مجموعه</button>
                </form>
              </div>
              
              {/* لیست کتاب‌ها */}
              <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
                {books.length === 0 && <p className="text-gray-500 col-span-2 text-center py-8">هیچ مجموعه‌ای یافت نشد.</p>}
                {books.map(b => (
                  <div key={b.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow border dark:border-gray-700 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-mono bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded">آیدی: {b.custom_id}</span>
                      <h3 className="font-bold text-lg mt-2">{b.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{b.description || "بدون توضیحات"}</p>
                    </div>
                    <div className="flex gap-2 mt-4 pt-3 border-t dark:border-gray-700">
                      <button onClick={() => setSelectedBook(b)} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1.5 rounded text-sm font-bold transition">پاسخ‌برگ‌ها</button>
                      <button onClick={() => handleDeleteBook(b.id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-sm transition">حذف</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <button onClick={() => setSelectedBook(null)} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-4 py-2 rounded-lg text-sm mb-4 transition">← بازگشت به لیست مجموعه‌ها</button>
              
              <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded-xl border border-blue-200 dark:border-gray-700">
                <span className="text-xs font-mono text-gray-500">مجموعه انتخاب شده:</span>
                <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400">{selectedBook.title}</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {/* فرم افزودن پاسخ‌برگ */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow border dark:border-gray-700">
                  <h3 className="font-bold mb-4">افزودن پاسخ‌برگ جدید</h3>
                  <form onSubmit={handleCreateSheet} className="space-y-4">
                    <input required placeholder="عنوان (مثلا فصل ۱)" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={sheetTitle} onChange={e => setSheetTitle(e.target.value)} />
                    <div className="grid grid-cols-2 gap-2">
                      <select className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={sheetType} onChange={e => setSheetType(e.target.value)}>
                        <option value="practice">تست عادی</option>
                        <option value="exam">آزمون زمان‌دار</option>
                      </select>
                      <input type="number" placeholder="زمان (دقیقه)" disabled={sheetType === 'practice'} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50" value={duration} onChange={e => setDuration(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" placeholder="شروع سوال" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={startNum} onChange={e => setStartNum(parseInt(e.target.value) || 1)} />
                      <input type="number" placeholder="تعداد سوال" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={totalQuestions} onChange={e => setTotalQuestions(parseInt(e.target.value) || 1)} />
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-xs font-bold mb-2">کلید سوالات:</label>
                      <div className="max-h-48 overflow-y-auto grid grid-cols-5 gap-1 p-2 bg-gray-50 dark:bg-gray-900 rounded border dark:border-gray-700">
                        {Array.from({ length: totalQuestions }, (_, i) => i + startNum).map(qNum => (
                          <div key={qNum} className="flex flex-col items-center">
                            <span className="text-[10px] text-gray-500">{qNum}</span>
                            <input type="number" min="1" max="4" className="w-9 p-1 text-center border rounded text-xs dark:bg-gray-700 dark:border-gray-600" value={keys[qNum] || ""} onChange={e => setKeys({...keys, [qNum]: parseInt(e.target.value)})} />
                          </div>
                        ))}
                      </div>
                    </div>
                    <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded font-bold transition">ثبت پاسخ‌برگ</button>
                  </form>
                </div>
                
                {/* لیست پاسخ‌برگ‌ها */}
                <div className="md:col-span-2 space-y-3">
                  <h3 className="font-bold mb-4">پاسخ‌برگ‌های این مجموعه</h3>
                  {answerSheets.length === 0 && <p className="text-gray-500 text-center py-8">هیچ پاسخ‌برگی یافت نشد.</p>}
                  {answerSheets.map(s => (
                    <div key={s.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border dark:border-gray-700 flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{s.title}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${s.type === 'exam' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                            {s.type === 'exam' ? `آزمون (${s.duration_minutes} دقیقه)` : 'تست عادی'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">تعداد سوالات: {s.total_questions} | شماره شروع: {s.start_question_number}</p>
                      </div>
                      <button onClick={() => handleDeleteSheet(s.id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-xs transition">حذف</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        )}

        {/* ==================== تب کاربران ==================== */}
        {activeTab === 'users' && (
          <div className="grid md:grid-cols-3 gap-8">
            {/* لیست کاربران */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow border dark:border-gray-700 h-fit">
              <h2 className="text-lg font-bold mb-4">لیست کاربران</h2>
              {/* لیست کاربران با نشان مدیر */}
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {users.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">هیچ کاربری یافت نشد.</p>
                ) : (
                  users.map(u => (
                    <button 
                      key={u.id} 
                      onClick={() => setSelectedUser(u)} 
                      className={`w-full text-right p-3 rounded-lg border transition ${selectedUser?.id === u.id ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/30 dark:border-blue-500' : 'hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-700'}`}>
                      <div className="font-bold flex items-center justify-between">
                        <span>
                          {u.first_name || u.last_name ? `${u.first_name || ''} ${u.last_name || ''}` : 'کاربر بدون نام'}
                        </span>
                        {u.role === 'admin' && (
                          <span className="text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 px-2 py-0.5 rounded-full">
                            مدیر
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{u.email}</div>
                    </button>
                  ))
                )}
              </div>
            </div>
            
            {/* مدیریت دسترسی کاربر انتخاب شده */}
            {selectedUser ? (
              <div className="md:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow border dark:border-gray-700">
                <h2 className="text-lg font-bold mb-4">
                  مدیریت دسترسی: <span className="text-blue-600 dark:text-blue-400">{selectedUser.first_name || selectedUser.last_name ? `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}` : selectedUser.email}</span>
                </h2>
                
                <div className="space-y-4 max-h-96 overflow-y-auto mb-6 pr-2">
                  {books.length === 0 && <p className="text-gray-500 text-sm">هیچ آزمونی برای تخصیص وجود ندارد.</p>}
                  {books.map(book => {
                    const bookSheets = allSheets.filter(s => s.book_id === book.id);
                    if(bookSheets.length === 0) return null;
                    return (
                      <div key={book.id} className="border dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800/50">
                        <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3">{book.title}</h3>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {bookSheets.map(sheet => (
                            <label key={sheet.id} className="flex items-center gap-3 p-2 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 cursor-pointer hover:border-blue-400 transition">
                              <input 
                                type="checkbox" 
                                checked={userPermissions.includes(sheet.id)} 
                                onChange={() => togglePermission(sheet.id)} 
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" 
                              />
                              <span className="text-sm font-medium">
                                {sheet.title} <span className="text-xs text-gray-500 font-normal">({sheet.type === 'exam' ? 'آزمون' : 'تست'})</span>
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                <button 
                  onClick={handleSavePermissions} 
                  disabled={loading} 
                  className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-xl font-bold transition shadow-md">
                  {loading ? 'در حال ذخیره...' : 'ذخیره دسترسی‌ها'}
                </button>
              </div>
            ) : (
              <div className="md:col-span-2 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border dark:border-gray-700 border-dashed flex items-center justify-center text-gray-500">
                برای مدیریت دسترسی‌ها، یک کاربر را از لیست انتخاب کنید.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}