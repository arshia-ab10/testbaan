"use client";
import { useState, useEffect } from "react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("exams");
  const [books, setBooks] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [answerSheets, setAnswerSheets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [allSheets, setAllSheets] = useState<any[]>([]);
  
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
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
  const [fastPasteText, setFastPasteText] = useState("");

  useEffect(() => { fetchBooks(); fetchAllSheets(); fetchUsers(); }, []);
  useEffect(() => { if (selectedBook) fetchAnswerSheets(selectedBook.id); }, [selectedBook]);
  useEffect(() => { if (selectedUser) fetchPermissions(selectedUser.id); }, [selectedUser]);

  const fetchBooks = async () => { const res = await fetch("/api/books"); if (res.ok) setBooks(await res.json()); };
  const fetchAllSheets = async () => { const res = await fetch("/api/answer-sheets"); if (res.ok) setAllSheets(await res.json()); };
  const fetchAnswerSheets = async (bookId: string) => { const res = await fetch(`/api/answer-sheets?book_id=${bookId}`); if (res.ok) setAnswerSheets(await res.json()); };
  const fetchUsers = async () => { const res = await fetch("/api/admin/users"); if (res.ok) setUsers(await res.json()); };
  const fetchPermissions = async (userId: string) => { const res = await fetch(`/api/admin/permissions?userId=${userId}`); if (res.ok) setUserPermissions(await res.json()); };

  const handleFastPaste = (text: string) => {
    setFastPasteText(text);
    const digits = text.replace(/[^1-4]/g, '').split('');
    const newKeys: Record<number, number> = {};
    digits.forEach((digit, index) => {
      if (index < totalQuestions) {
        newKeys[startNum + index] = parseInt(digit);
      }
    });
    setKeys(prev => ({ ...prev, ...newKeys }));
  };

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const res = await fetch("/api/books", { method: "POST", body: JSON.stringify({ title: bookTitle, description: bookDesc }) });
    if (res.ok) { setMessage("✅ مجموعه اضافه شد"); setBookTitle(""); setBookDesc(""); fetchBooks(); }
    setLoading(false);
  };

  const handleDeleteBook = async (id: string) => {
    if (!confirm("مطمئن هستید؟")) return;
    await fetch(`/api/books?id=${id}`, { method: "DELETE" });
    fetchBooks(); if (selectedBook?.id === id) setSelectedBook(null);
  };

  const handleSaveSheet = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const payload = {
      id: editingSheetId,
      book_id: selectedBook.id,
      title: sheetTitle,
      type: sheetType,
      duration_minutes: duration ? parseInt(duration) : null,
      start_question_number: startNum,
      total_questions: totalQuestions,
      correct_keys: keys
    };

    const url = "/api/answer-sheets";
    const method = editingSheetId ? "PUT" : "POST";

    const res = await fetch(url, { method, body: JSON.stringify(payload) });

    if (res.ok) {
      setMessage(editingSheetId ? "✅ پاسخ‌برگ ویرایش شد" : "✅ پاسخ‌برگ ساخته شد");
      setSheetTitle(""); setKeys({}); setEditingSheetId(null); setFastPasteText("");
      fetchAnswerSheets(selectedBook.id); fetchAllSheets();
    }
    setLoading(false);
  };

  const startEditSheet = (s: any) => {
    setEditingSheetId(s.id);
    setSheetTitle(s.title);
    setSheetType(s.type);
    setDuration(s.duration_minutes || "");
    setStartNum(s.start_question_number);
    setTotalQuestions(s.total_questions);
    setKeys(s.correct_keys || {});
  };

  const handleDeleteSheet = async (id: string) => {
    if (!confirm("مطمئن هستید؟")) return;
    await fetch(`/api/answer-sheets?id=${id}`, { method: "DELETE" });
    fetchAnswerSheets(selectedBook.id); fetchAllSheets();
  };

  const handleSavePermissions = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/permissions", { method: "POST", body: JSON.stringify({ userId: selectedUser.id, sheetIds: userPermissions }) });
    if (res.ok) setMessage("✅ دسترسی‌ها بروزرسانی شد");
    setLoading(false);
  };

  const togglePermission = (sheetId: string) => {
    setUserPermissions(prev => prev.includes(sheetId) ? prev.filter(id => id !== sheetId) : [...prev, sheetId]);
  };

  // الگوریتم چیدمان ستونی کنکوری برای ادمین
  const adminBlocks: number[][] = [];
  for (let i = 0; i < totalQuestions; i += 10) {
    const chunk = [];
    for (let j = i; j < Math.min(i + 10, totalQuestions); j++) {
      chunk.push(startNum + j);
    }
    adminBlocks.push(chunk);
  }

  const adminTotalBlocks = adminBlocks.length;
  const adminMaxCols = 4;
  const adminNumRows = Math.max(1, Math.ceil(adminTotalBlocks / adminMaxCols));

  const adminOrderedBlocks: (number[] | null)[] = [];
  for (let r = 0; r < adminNumRows; r++) {
    for (let c = 0; c < adminMaxCols; c++) {
      const blockIndex = c * adminNumRows + r;
      if (blockIndex < adminTotalBlocks) {
        adminOrderedBlocks.push(adminBlocks[blockIndex]);
      } else {
        adminOrderedBlocks.push(null);
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6 border-b pb-4 dark:border-gray-800">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">پنل مدیریت تست‌بان</h1>
          <div className="flex gap-2">
            <button onClick={() => {setActiveTab('exams'); setSelectedBook(null);}} className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'exams' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>آزمون‌ها</button>
            <button onClick={() => {setActiveTab('users'); setSelectedUser(null);}} className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>کاربران</button>
            <a href="/" className="px-4 py-2 rounded-lg font-bold bg-gray-800 text-white hover:bg-gray-900">صفحه اصلی</a>
          </div>
        </div>

        {message && <div className="mb-6 p-3 bg-green-100 text-green-800 rounded-lg text-center font-bold border border-green-200">{message}</div>}

        {activeTab === 'exams' && (
          !selectedBook ? (
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow border dark:border-gray-700 h-fit">
                <h2 className="text-lg font-bold mb-4">افزودن کتاب یا آزمون</h2>
                <form onSubmit={handleCreateBook} className="space-y-4">
                  <input required placeholder="نام کتاب یا آزمون" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={bookTitle} onChange={e => setBookTitle(e.target.value)} />
                  <textarea placeholder="توضیحات" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={bookDesc} onChange={e => setBookDesc(e.target.value)} />
                  <button disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded font-bold">ثبت</button>
                </form>
              </div>
              <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
                {books.map(b => (
                  <div key={b.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow border dark:border-gray-700 flex flex-col justify-between">
                    <div><h3 className="font-bold text-lg">{b.title}</h3><p className="text-sm text-gray-500">{b.description}</p></div>
                    <div className="flex gap-2 mt-4 pt-3 border-t dark:border-gray-700">
                      <button onClick={() => setSelectedBook(b)} className="flex-1 bg-green-600 text-white py-1.5 rounded text-sm font-bold">پاسخ‌برگ‌ها</button>
                      <button onClick={() => handleDeleteBook(b.id)} className="bg-red-500 text-white px-3 py-1.5 rounded text-sm">حذف</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <button onClick={() => setSelectedBook(null)} className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-lg text-sm mb-4">← بازگشت به مجموعه‌ها</button>
              
              <div className="grid md:grid-cols-3 gap-8">
                {/* فرم ساخت / ویرایش پاسخ‌برگ */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow border dark:border-gray-700 md:col-span-3">
                  <h3 className="font-bold mb-4">{editingSheetId ? 'ویرایش پاسخ‌برگ' : 'افزودن پاسخ‌برگ جدید'}</h3>
                  <form onSubmit={handleSaveSheet} className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <input required placeholder="عنوان (مثلا فصل ۱)" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={sheetTitle} onChange={e => setSheetTitle(e.target.value)} />
                      <select className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={sheetType} onChange={e => setSheetType(e.target.value)}><option value="practice">تست عادی</option><option value="exam">آزمون زمان‌دار</option></select>
                      <input type="number" placeholder="زمان (دقیقه)" disabled={sheetType === 'practice'} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={duration} onChange={e => setDuration(e.target.value)} />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <input type="number" placeholder="شروع سوال" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={startNum} onChange={e => setStartNum(parseInt(e.target.value) || 1)} />
                      <input type="number" placeholder="تعداد سوال" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={totalQuestions} onChange={e => setTotalQuestions(parseInt(e.target.value) || 1)} />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1 text-blue-600">ورود سریع کلیدها (مثلا 12341234):</label>
                      <input type="text" placeholder="مثلا: 12341234..." className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-xs font-mono" value={fastPasteText} onChange={e => handleFastPaste(e.target.value)} />
                    </div>

                    {/* شبکه کلیدهای ادمین با الگوریتم ستونی */}
                    <div className="max-h-80 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl border dark:border-gray-700" dir="ltr">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start">
                        {adminOrderedBlocks.map((block, bIdx) => {
                          if (!block) return <div key={`admin-empty-${bIdx}`} />;
                          return (
                            <div key={bIdx} className="bg-white dark:bg-gray-800 p-2.5 rounded-xl border dark:border-gray-700 flex flex-col gap-1.5">
                              <span className="text-[10px] font-mono text-gray-400 font-bold text-center border-b dark:border-gray-700 pb-1">
                                {block[0]} - {block[block.length - 1]}
                              </span>
                              {block.map(qNum => (
                                <div key={qNum} className="flex items-center justify-between p-1 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                  <span className="font-bold text-xs text-gray-500 dark:text-gray-300 font-mono text-left w-6">{qNum}_</span>
                                  <div className="flex gap-1">
                                    {[1, 2, 3, 4].map(opt => (
                                      <button
                                        key={opt}
                                        type="button"
                                        onClick={() => setKeys(prev => ({ ...prev, [qNum]: prev[qNum] === opt ? 0 : opt }))}
                                        className={`w-6 h-6 rounded-full text-xs font-bold border transition-all flex items-center justify-center ${
                                          keys[qNum] === opt
                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                                        }`}
                                      >
                                        {opt}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button disabled={loading} className="flex-1 bg-blue-600 text-white p-3 rounded-xl font-bold">{editingSheetId ? 'ذخیره تغییرات' : 'ثبت پاسخ‌برگ'}</button>
                      {editingSheetId && <button type="button" onClick={() => {setEditingSheetId(null); setSheetTitle(""); setKeys({});}} className="bg-gray-400 text-white px-4 rounded-xl font-bold">انصراف</button>}
                    </div>
                  </form>
                </div>

                {/* لیست پاسخ‌برگ‌ها */}
                <div className="md:col-span-3 space-y-3">
                  <h3 className="font-bold mb-4">پاسخ‌برگ‌های این مجموعه</h3>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {answerSheets.map(s => (
                      <div key={s.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border dark:border-gray-700 flex flex-col justify-between">
                        <div>
                          <span className="font-bold text-lg">{s.title}</span>
                          <p className="text-xs text-gray-500 mt-1">{s.total_questions} سوال | نوع: {s.type === 'exam' ? 'زمان‌دار' : 'عادی'}</p>
                        </div>
                        <div className="flex gap-2 mt-4 pt-3 border-t dark:border-gray-700">
                          <button onClick={() => startEditSheet(s)} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-1.5 rounded text-xs font-bold">ویرایش</button>
                          <button onClick={() => handleDeleteSheet(s.id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-xs">حذف</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        )}

        {activeTab === 'users' && (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow border dark:border-gray-700 h-fit">
              <h2 className="text-lg font-bold mb-4">لیست کاربران</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {users.map(u => (
                  <button key={u.id} onClick={() => setSelectedUser(u)} className={`w-full text-right p-3 rounded-lg border ${selectedUser?.id === u.id ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                    <div className="font-bold flex justify-between">
                      <span>{u.first_name || u.last_name ? `${u.first_name || ''} ${u.last_name || ''}` : 'کاربر بدون نام'}</span>
                      {u.role === 'admin' && <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">مدیر</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{u.email}</div>
                  </button>
                ))}
              </div>
            </div>

            {selectedUser && (
              <div className="md:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow border dark:border-gray-700">
                <h2 className="text-lg font-bold mb-4">مدیریت دسترسی: <span className="text-blue-600">{selectedUser.first_name || selectedUser.last_name ? `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}` : selectedUser.email}</span></h2>
                <div className="space-y-4 max-h-96 overflow-y-auto mb-6 pr-2">
                  {books.map(book => {
                    const bookSheets = allSheets.filter(s => s.book_id === book.id);
                    if(bookSheets.length === 0) return null;
                    return (
                      <div key={book.id} className="border dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800/50">
                        <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3">{book.title}</h3>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {bookSheets.map(sheet => (
                            <label key={sheet.id} className="flex items-center gap-3 p-2 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 cursor-pointer">
                              <input type="checkbox" checked={userPermissions.includes(sheet.id)} onChange={() => togglePermission(sheet.id)} className="w-4 h-4 text-blue-600" />
                              <span className="text-sm">{sheet.title}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <button onClick={handleSavePermissions} disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-xl font-bold">ذخیره دسترسی‌ها</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}