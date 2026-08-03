"use client";
import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { toFaNum } from "@/lib/utils";

const FLAG_COLORS = ['bg-gray-200 dark:bg-gray-700', 'bg-red-400', 'bg-yellow-400', 'bg-green-400', 'bg-blue-400', 'bg-purple-400'];

export default function ExamPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const router = useRouter();
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const sheetId = resolvedParams?.id;

  const [exam, setExam] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flags, setFlags] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [checkModal, setCheckModal] = useState<{qNum: number, isCorrect: boolean, correctOpt: number, showCorrect: boolean} | null>(null);

  // استیت‌های الگوریتم ریاضی
  const [cols, setCols] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // محاسبه زنده تعداد ستون‌ها بر اساس عرض کانتینر
  useEffect(() => {
    const updateLayout = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        // عرض هر بلوک با فاصله‌ها حدود ۲۸۰ پیکسل است
        let calculatedCols = Math.floor(width / 280);
        setCols(calculatedCols > 0 ? calculatedCols : 1);
      }
    };

    // یک تاخیر کوچک برای اطمینان از لود شدن کامل DOM
    const timer = setTimeout(updateLayout, 50);
    window.addEventListener('resize', updateLayout);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateLayout);
    };
  }, [exam]);

  useEffect(() => {
    if (!sheetId) return;
    const hash = window.location.hash;
    if (hash) setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 500);

    fetch("/api/student/exam", { method: "POST", body: JSON.stringify({ action: "fetch", sheetId }) })
      .then(res => res.json())
      .then((data: any) => {
        if (data.error) { setErrorMsg(data.error); return; }
        setExam(data.exam);
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
      router.push(`/result/${data.submissionId}`);
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

  if (errorMsg) return <div className="min-h-screen flex items-center justify-center font-bold text-red-500">{errorMsg}</div>;
  if (!exam) return <div className="min-h-screen flex items-center justify-center">در حال بارگذاری...</div>;

  // ۱. ساخت دسته‌های ۱۰ تایی (رند به بالا)
  const blocks: number[][] = [];
  for (let i = 0; i < exam.total_questions; i += 10) {
    const chunk = [];
    for (let j = i; j < Math.min(i + 10, exam.total_questions); j++) { chunk.push(exam.start_question_number + j); }
    blocks.push(chunk);
  }

  // ۲. محاسبه سطرها بر اساس ستون‌های مجاز (با رفع خطای اعشاری JS)
  const totalBlocks = blocks.length;
  const rawRows = totalBlocks / cols;
  const numRows = Math.max(1, Math.ceil(Number(rawRows.toFixed(4))));

  // ۳. چیدمان ستون به ستون
  const orderedBlocks: (number[] | null)[] = [];
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < cols; c++) {
      const blockIndex = c * numRows + r;
      if (blockIndex < totalBlocks) {
        orderedBlocks.push(blocks[blockIndex]);
      } else {
        orderedBlocks.push(null);
      }
    }
  }

  const answeredCount = Object.values(answers).filter(val => val > 0).length;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pb-16">
      <div className="sticky top-0 z-40 bg-blue-600/95 backdrop-blur text-white px-6 py-4 shadow-lg border-b border-blue-500 mb-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">{exam.title}</h1>
            <p className="text-xs text-blue-100 mt-1">پاسخ داده شده: {toFaNum(answeredCount)} از {toFaNum(exam.total_questions)}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSaveCloud} disabled={loading} className="bg-blue-800 hover:bg-blue-900 px-4 py-2.5 rounded-xl font-bold text-sm transition shadow">ذخیره ابری ☁️</button>
            <button onClick={handleSubmit} disabled={loading} className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-2.5 rounded-xl font-bold shadow transition">ثبت نهایی</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4" dir="ltr" ref={containerRef}>
        <div 
          className="grid gap-6 items-start"
          style={{ 
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${numRows}, min-content)`, 
            gridAutoFlow: 'column'
          }}
        >
          {orderedBlocks.map((block, idx) => {
            if (!block) return <div key={`empty-${idx}`} />;
            return (
              <div key={idx} className="bg-white/90 dark:bg-gray-800/90 p-4 rounded-3xl border dark:border-gray-700 shadow-sm flex flex-col gap-2.5">
                <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 text-center border-b dark:border-gray-700 pb-2">
                  سوالات {toFaNum(block[0])} تا {toFaNum(block[block.length - 1])}
                </div>
                {block.map(q => (
                  <div key={q} id={`q-${q}`} className="flex items-center justify-between gap-3 p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition">
                    <button onClick={() => cycleFlag(q)} className={`w-3.5 h-3.5 rounded-full flex-shrink-0 ${FLAG_COLORS[flags[q] || 0]}`} />
                    <button onClick={() => handleInstantCheck(q)} className="font-bold text-sm text-gray-600 dark:text-gray-300 w-8 font-mono text-right hover:text-blue-500 cursor-pointer">
                      {toFaNum(q)}_
                    </button>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4].map(opt => (
                        <button key={opt} onClick={() => setAnswers(prev => ({ ...prev, [q]: prev[q] === opt ? 0 : opt }))}
                          className={`w-8 h-8 rounded-full font-bold text-sm border-2 transition-all flex items-center justify-center ${answers[q] === opt ? 'bg-blue-600 text-white border-blue-600 scale-105 shadow-md' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-500'}`}>
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

      {checkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-2xl max-w-sm w-full text-center border dark:border-gray-700">
            <h3 className="text-xl font-bold mb-4">بررسی سوال {toFaNum(checkModal.qNum)}</h3>
            {checkModal.isCorrect ? <div className="text-green-600 text-2xl font-black mb-6">✅ صحیح!</div> : <div className="text-red-600 text-2xl font-black mb-6">❌ غلط!</div>}
            {!checkModal.isCorrect && !checkModal.showCorrect && <button onClick={() => setCheckModal({...checkModal, showCorrect: true})} className="text-blue-600 underline text-sm mb-4 block w-full font-bold">نمایش گزینه صحیح</button>}
            {checkModal.showCorrect && <div className="bg-green-100 text-green-800 p-3 rounded-xl font-bold mb-4 border border-green-200">گزینه صحیح: {toFaNum(checkModal.correctOpt)}</div>}
            <button onClick={() => setCheckModal(null)} className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 p-3 rounded-xl font-bold transition">بستن</button>
          </div>
        </div>
      )}
    </div>
  );
}