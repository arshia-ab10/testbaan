"use client";
import { useState, useEffect, useRef } from "react";
import { toFaNum } from "@/lib/utils";

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

  const [cols, setCols] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchBooks(); fetchAllSheets(); fetchUsers(); }, []);
  useEffect(() => { if (selectedBook) fetchAnswerSheets(selectedBook.id); }, [selectedBook]);
  useEffect(() => { if (selectedUser) fetchPermissions(selectedUser.id); }, [selectedUser]);

  useEffect(() => {
    const updateLayout = () => {
      if (containerRef.current && totalQuestions > 0) {
        const width = containerRef.current.clientWidth;
        let calculatedCols = Math.floor(width / 280);
        setCols(calculatedCols > 0 ? calculatedCols : 1);
      }
    };
    const timer = setTimeout(updateLayout, 50);
    window.addEventListener('resize', updateLayout);
    return () => { clearTimeout(timer); window.removeEventListener('resize', updateLayout); };
  }, [totalQuestions, activeTab, selectedBook, editingSheetId]);

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
      if (index < totalQuestions) newKeys[startNum + index] = parseInt(digit);
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
      id: editingSheetId, book_id: selectedBook.id, title: sheetTitle, type: sheetType,
      duration_minutes: duration ? parseInt(duration) : null, start_question_number: startNum, total_questions: totalQuestions, correct_keys: keys
    };
    const res = await fetch("/api/answer-sheets", { method: editingSheetId ? "PUT" : "POST", body: JSON.stringify(payload) });
    if (res.ok) {
      setMessage(editingSheetId ? "✅ پاسخ‌برگ ویرایش شد" : "✅ پاسخ‌برگ ساخته شد");
      setSheetTitle(""); setKeys({}); setEditingSheetId(null); setFastPasteText("");
      fetchAnswerSheets(selectedBook.id); fetchAllSheets();
    }
    setLoading(false);
  };

  const startEditSheet = (s: any) => {
    setEditingSheetId(s.id); setSheetTitle(s.title); setSheetType(s.type);
    setDuration(s.duration_minutes || ""); setStartNum(s.start_question_number); setTotalQuestions(s.total_questions); setKeys(s.correct_keys || {});
  };

  const handleDeleteSheet = async (id: string) => {
    if (!confirm("مطمئن هستید؟")) return;
    await fetch(`/api/answer-sheets?id=${id}`, { method: "DELETE" });
    fetchAnswerSheets(selectedBook.id); fetchAllSheets();
  };

  const handleSavePermissions = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/permissions", { method: "POST", body: JSON.stringify({ userId: selectedUser.id, sheetIds: userPermissions }) });
    if (res.ok) setMessage("✅ دسترسی‌ها ذخیره شد");
    setLoading(false);
  };

  const togglePermission = (sheetId: string) => {
    setUserPermissions(prev => prev.includes(sheetId) ? prev.filter(id => id !== sheetId) : [...prev, sheetId]);
  };

  const adminBlocks: number[][] = [];
  for (let i = 0; i < totalQuestions; i += 10) {
    const chunk = [];
    for (let j = i; j < Math.min(i + 10, totalQuestions); j++) chunk.push(startNum + j);
    adminBlocks.push(chunk);
  }

  const adminTotalBlocks = adminBlocks.length;
  const rawRows = adminTotalBlocks / cols;
  const adminNumRows = Math.max(1, Math.ceil(Number(rawRows.toFixed(4))));

  const adminOrderedBlocks: (number[] | null)[] = [];
  for (let r = 0; r < adminNumRows; r++) {
    for (let c = 0; c < cols; c++) {
      const blockIndex = c * adminNumRows + r;
      if (blockIndex < adminTotalBlocks) {
        adminOrderedBlocks.push(adminBlocks[blockIndex]);
      } else {
        adminOrderedBlocks.push(null);
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap justify-between items-center mb-6 border-b pb-4 dark:border-gray-800 gap-4">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">پنل مدیریت تست‌بان</h1>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => {setActiveTab('exams'); setSelectedBook(null);}} className={`px-5 py-2.5 rounded-xl font-bold transition shadow-sm ${activeTab === 'exams' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 border dark:border-gray-700'}`}>آزمون‌ها</button>
            <button onClick={() => {setActiveTab('users'); setSelectedUser(null);}} className={`px-5 py-2.5 rounded-xl font-bold transition shadow-sm ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 border dark:border-gray-700'}`}>کاربران</button>
            <a href="/" className="px-5 py-2.5 rounded-xl font-bold bg-gray-800 text-white hover:bg-gray-900 shadow-sm transition">صفحه اصلی</a>
          </div>
        </div>

        {message && <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-2xl text-center font-bold border border-green-200">{message}</div>}

        {activeTab === 'exams' && (
          !selectedBook ? (
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border dark:border-gray-700 h-fit">
                <h2 className="text-lg font-bold mb-5">افزودن مجموعه جدید</h2>
                <form onSubmit={handleCreateBook} className="space-y-4">
                  <input required placeholder="نام کتاب یا آزمون" className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600" value={bookTitle} onChange={e => setBookTitle(e.target.value)} />
                  <textarea placeholder="توضیحات" className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600" value={bookDesc} onChange={e => setBookDesc(e.target.value)} />
                  <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-bold transition">ثبت مجموعه</button>
                </form>
              </div>
              <div className="md:col-span-2 grid sm:grid-cols-2 gap-6">
                {books.map(b => (
                  <div key={b.id} className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border dark:border-gray-700 flex flex-col justify-between">
                    <div><h3 className="font-bold text-xl">{b.title}</h3><p className="text-sm text-gray-500 mt-2 leading-relaxed">{b.description}</p></div>
                    <div className="flex gap-2 mt-6 pt-4 border-t dark:border-gray-700">
                      <button onClick={() => setSelectedBook(b)} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-bold transition">مدیریت پاسخ‌برگ‌ها</button>
                      <button onClick={() => handleDeleteBook(b.id)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm transition font-bold">حذف</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <button onClick={() => setSelectedBook(null)} className="bg-white dark:bg-gray-800 border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition">← بازگشت به مجموعه‌ها</button>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border dark:border-gray-700 md:col-span-3">
                  <h3 className="text-xl font-bold mb-6 pb-2 border-b dark:border-gray-700">{editingSheetId ? 'ویرایش پاسخ‌برگ' : 'افزودن پاسخ‌برگ جدید'}</h3>
                  <form onSubmit={handleSaveSheet} className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-4">
                      <input required placeholder="عنوان (مثلا فصل ۱)" className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600" value={sheetTitle} onChange={e => setSheetTitle(e.target.value)} />
                      <select className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600" value={sheetType} onChange={e => setSheetType(e.target.value)}><option value="practice">تست عادی</option><option value="exam">آزمون زمان‌دار</option></select>
                      <input type="number" placeholder="زمان (دقیقه)" disabled={sheetType === 'practice'} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50" value={duration} onChange={e => setDuration(e.target.value)} />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <input type="number" placeholder="شروع سوال" className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600" value={startNum} onChange={e => setStartNum(parseInt(e.target.value) || 1)} />
                      <input type="number" placeholder="تعداد سوال" className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600" value={totalQuestions} onChange={e => setTotalQuestions(parseInt(e.target.value) || 1)} />
                    </div>

                    <div>
                      <label className="block text-sm font-bold mb-2 text-blue-600 dark:text-blue-400">ورود سریع کلیدها (مثلا 12341234):</label>
                      <input type="text" placeholder="پیست کردن کلیدها..." className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-mono tracking-[0.2em]" value={fastPasteText} onChange={e => handleFastPaste(e.target.value)} />
                    </div>

                    <div className="mt-8 bg-gray-50/50 dark:bg-gray-900/30 p-6 rounded-3xl border dark:border-gray-700" dir="ltr" ref={containerRef}>
                      {/* حذف CSS Grid Flow اضافی */}
                      <div 
                        className="grid gap-6 items-start"
                        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
                      >
                        {adminOrderedBlocks.map((block, bIdx) => {
                          if (!block) return <div key={`admin-empty-${bIdx}`} />;
                          return (
                            <div key={bIdx} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border dark:border-gray-700 shadow-sm flex flex-col gap-2.5">
                              <span className="text-xs font-mono text-gray-500 font-bold text-center border-b dark:border-gray-700 pb-2">
                                {toFaNum(block[0])} - {toFaNum(block[block.length - 1])}
                              </span>
                              {block.map(qNum => (
                                <div key={qNum} className="flex items-center justify-start gap-4 p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition">
                                  <span className="font-bold text-sm text-gray-600 dark:text-gray-300 w-9 font-mono text-right dir-ltr">
                                    {toFaNum(qNum)}_
                                  </span>
                                  <div className="flex gap-2">
                                    {[1, 2, 3, 4].map(opt => (
                                      <button
                                        key={opt}
                                        type="button"
                                        onClick={() => setKeys(prev => ({ ...prev, [qNum]: prev[qNum] === opt ? 0 : opt }))}
                                        className={`w-8 h-8 rounded-full text-sm font-bold border-2 transition-all flex items-center justify-center ${
                                          keys[qNum] === opt
                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow scale-105'
                                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-emerald-500'
                                        }`}
                                      >
                                        {toFaNum(opt)}
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

                    <div className="flex gap-4 pt-4 border-t dark:border-gray-700">
                      <button disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-xl font-bold transition shadow-md">{editingSheetId ? 'ذخیره تغییرات' : 'ثبت پاسخ‌برگ'}</button>
                      {editingSheetId && <button type="button" onClick={() => {setEditingSheetId(null); setSheetTitle(""); setKeys({}); setFastPasteText("");}} className="bg-gray-500 hover:bg-gray-600 text-white px-8 rounded-xl font-bold transition">انصراف</button>}
                    </div>
                  </form>
                </div>

                <div className="md:col-span-3 space-y-4">
                  <h3 className="text-xl font-bold mb-4">پاسخ‌برگ‌های این مجموعه</h3>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {answerSheets.map(s => (
                      <div key={s.id} className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border dark:border-gray-700 flex flex-col justify-between">
                        <div>
                          <span className="font-bold text-xl">{s.title}</span>
                          <p className="text-sm text-gray-500 mt-2">{toFaNum(s.total_questions)} سوال | {s.type === 'exam' ? `زمان‌دار (${toFaNum(s.duration_minutes)} دقیقه)` : 'تست عادی'}</p>
                        </div>
                        <div className="flex gap-2 mt-6 pt-4 border-t dark:border-gray-700">
                          <button onClick={() => startEditSheet(s)} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl text-sm font-bold transition">ویرایش</button>
                          <button onClick={() => handleDeleteSheet(s.id)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition">حذف</button>
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
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border dark:border-gray-700 h-fit">
              <h2 className="text-lg font-bold mb-6">لیست کاربران</h2>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {users.map(u => (
                  <button key={u.id} onClick={() => setSelectedUser(u)} className={`w-full text-right p-4 rounded-2xl border transition ${selectedUser?.id === u.id ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/30 dark:border-blue-500 shadow-sm' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-700'}`}>
                    <div className="font-bold flex justify-between items-center">
                      <span className="text-lg">{u.first_name || u.last_name ? `${u.first_name || ''} ${u.last_name || ''}` : 'کاربر بدون نام'}</span>
                      {u.role === 'admin' && <span className="text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 px-2.5 py-1 rounded-full font-bold">مدیر</span>}
                    </div>
                    <div className="text-sm text-gray-500 mt-2 font-mono">{u.email}</div>
                  </button>
                ))}
              </div>
            </div>

            {selectedUser && (
              <div className="md:col-span-2 bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border dark:border-gray-700">
                <h2 className="text-xl font-bold mb-6 pb-3 border-b dark:border-gray-700">مدیریت دسترسی: <span className="text-blue-600 dark:text-blue-400">{selectedUser.first_name || selectedUser.last_name ? `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}` : selectedUser.email}</span></h2>
                <div className="space-y-6 max-h-[500px] overflow-y-auto mb-8 pr-3">
                  {books.map(book => {
                    const bookSheets = allSheets.filter(s => s.book_id === book.id);
                    if(bookSheets.length === 0) return null;
                    return (
                      <div key={book.id} className="border dark:border-gray-700 rounded-2xl p-5 bg-gray-50 dark:bg-gray-900/50">
                        <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4">{book.title}</h3>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {bookSheets.map(sheet => (
                            <label key={sheet.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 cursor-pointer hover:border-blue-400 transition shadow-sm">
                              <input type="checkbox" checked={userPermissions.includes(sheet.id)} onChange={() => togglePermission(sheet.id)} className="w-5 h-5 accent-blue-600 rounded" />
                              <span className="text-sm font-bold">{sheet.title}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <button onClick={handleSavePermissions} disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white p-4 rounded-2xl font-bold text-lg transition shadow-lg">ذخیره نهایی دسترسی‌ها</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}