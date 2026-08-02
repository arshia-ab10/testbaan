"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { toFaNum } from "@/lib/utils";

const FLAG_COLORS = ['bg-gray-200 dark:bg-gray-700', 'bg-red-400', 'bg-yellow-400', 'bg-green-400', 'bg-blue-400', 'bg-purple-400'];

export default function ExamPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const sheetId = (params instanceof Promise ? use(params) : params)?.id;
  const router = useRouter();

  const [exam, setExam] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flags, setFlags] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  
  // مودال چک آنی
  const [checkModal, setCheckModal] = useState<{qNum: number, isCorrect: boolean, correctOpt: number, showCorrect: boolean} | null>(null);

  useEffect(() => {
    if (!sheetId) return;
    // اسکرول به سوال خاص (در صورت ارجاع از کارنامه)
    const hash = window.location.hash;
    if (hash) setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 500);

    fetch("/api/student/exam", { method: "POST", body: JSON.stringify({ action: "fetch", sheetId }) })
      .then(res => res.json())
      .then((data: any) => {
        setExam(data.exam);
        // ادغام دیتای ابری و لوکال استوریج
        const localAns = JSON.parse(localStorage.getItem(`ans_${sheetId}`) || '{}');
        const localFlags = JSON.parse(localStorage.getItem(`flags_${sheetId}`) || '{}');
        const cloudAns = data.progress?.draft_answers ? JSON.parse(data.progress.draft_answers) : {};
        const cloudFlags = data.progress?.question_flags ? JSON.parse(data.progress.question_flags) : {};
        
        setAnswers({ ...cloudAns, ...localAns });
        setFlags({ ...cloudFlags, ...localFlags });
      });
  }, [sheetId]);

  useEffect(() => {
    if (!exam) return;
    localStorage.setItem(`ans_${sheetId}`, JSON.stringify(answers));
    localStorage.setItem(`flags_${sheetId}`, JSON.stringify(flags));
  }, [answers, flags, sheetId, exam]);

  const handleSaveCloud = async () => {
    setLoading(true);
    await fetch("/api/student/exam", { method: "POST", body: JSON.stringify({ action: "save_cloud", sheetId, userAnswers: answers, questionFlags: flags }) });
    alert("پیش‌نویس و رنگ‌ها در فضای ابری ذخیره شد.");
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!confirm("ثبت نهایی و صدور کارنامه؟")) return;
    setLoading(true);
    const res = await fetch("/api/student/exam", { method: "POST", body: JSON.stringify({ action: "submit", sheetId, userAnswers: answers, questionFlags: flags }) });
    const data = await res.json() as any;
    if (data.success) {
      localStorage.removeItem(`ans_${sheetId}`);
      router.push(`/dashboard#sheet-${sheetId}`);
    } else alert(data.error);
    setLoading(false);
  };

  const handleInstantCheck = async (qNum: number) => {
    if (!answers[qNum]) return alert("اول به سوال پاسخ دهید!");
    const res = await fetch("/api/student/exam", { method: "POST", body: JSON.stringify({ action: "instant_check", sheetId, qNum, userAnswers: answers }) });
    const data = await res.json() as any;
    setCheckModal({ qNum, isCorrect: data.isCorrect, correctOpt: data.correctOpt, showCorrect: false });
  };

  const cycleFlag = (qNum: number) => {
    setFlags(prev => ({ ...prev, [qNum]: ((prev[qNum] || 0) + 1) % FLAG_COLORS.length }));
  };

  if (!exam) return <div className="min-h-screen flex items-center justify-center">بارگذاری...</div>;

  const blocks: number[][] = [];
  for (let i = 0; i < exam.total_questions; i += 10) {
    const chunk = [];
    for (let j = i; j < Math.min(i + 10, exam.total_questions); j++) { chunk.push(exam.start_question_number + j); }
    blocks.push(chunk);
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pb-16">
      <div className="sticky top-0 z-40 bg-blue-600/95 backdrop-blur text-white px-6 py-4 shadow-lg border-b border-blue-500 mb-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-bold">{exam.title}</h1>
          <div className="flex gap-2">
            <button onClick={handleSaveCloud} disabled={loading} className="bg-blue-800 hover:bg-blue-900 px-4 py-2 rounded-xl font-bold text-sm transition">ذخیره ابری ☁️</button>
            <button onClick={handleSubmit} disabled={loading} className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-2 rounded-xl font-bold shadow transition">ثبت نهایی</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4" dir="ltr">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 items-start">
          {blocks.map((block, idx) => (
            <div key={idx} className="bg-white/90 dark:bg-gray-800/90 p-4 rounded-2xl border dark:border-gray-700 shadow-sm flex flex-col gap-2.5">
              {block.map(q => (
                <div key={q} id={`q-${q}`} className="flex items-center justify-between gap-2 p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition">
                  {/* دکمه رنگ‌بندی */}
                  <button onClick={() => cycleFlag(q)} className={`w-3 h-3 rounded-full flex-shrink-0 ${FLAG_COLORS[flags[q] || 0]}`} />
                  
                  {/* شماره سوال (قابل کلیک برای چک آنی) */}
                  <button onClick={() => handleInstantCheck(q)} className="font-bold text-sm text-gray-600 dark:text-gray-300 w-7 font-mono text-right hover:text-blue-500 cursor-pointer">
                    {toFaNum(q)}_
                  </button>
                  
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map(opt => (
                      <button key={opt} onClick={() => setAnswers(prev => ({ ...prev, [q]: prev[q] === opt ? 0 : opt }))}
                        className={`w-8 h-8 rounded-full font-bold text-sm border-2 transition-all flex items-center justify-center ${answers[q] === opt ? 'bg-blue-600 text-white border-blue-600 scale-105' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'}`}>
                        {toFaNum(opt)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* مودال چک آنی */}
      {checkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-2xl max-w-sm w-full text-center border dark:border-gray-700">
            <h3 className="text-xl font-bold mb-4">بررسی سوال {toFaNum(checkModal.qNum)}</h3>
            {checkModal.isCorrect ? (
              <div className="text-green-600 text-2xl font-black mb-6">✅ پاسخ شما صحیح است!</div>
            ) : (
              <div className="text-red-600 text-2xl font-black mb-6">❌ پاسخ شما غلط است!</div>
            )}
            
            {!checkModal.isCorrect && !checkModal.showCorrect && (
              <button onClick={() => setCheckModal({...checkModal, showCorrect: true})} className="text-blue-600 underline text-sm mb-4 block w-full">نمایش گزینه صحیح</button>
            )}
            {checkModal.showCorrect && (
              <div className="bg-green-100 text-green-800 p-3 rounded-xl font-bold mb-4">گزینه صحیح: {toFaNum(checkModal.correctOpt)}</div>
            )}
            
            <button onClick={() => setCheckModal(null)} className="w-full bg-gray-200 dark:bg-gray-700 p-3 rounded-xl font-bold">بستن</button>
          </div>
        </div>
      )}
    </div>
  );
}