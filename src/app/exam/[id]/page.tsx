"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

export default function ExamPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const sheetId = resolvedParams?.id;

  const [exam, setExam] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [maxCols, setMaxCols] = useState(4);
  const router = useRouter();

  // محاسبه هوشمند تعداد ستون‌های مجاز بر اساس عرض مانیتور
  useEffect(() => {
    const updateCols = () => {
      const w = window.innerWidth;
      if (w < 640) setMaxCols(1);
      else if (w < 768) setMaxCols(2);
      else if (w < 1024) setMaxCols(3);
      else setMaxCols(4);
    };
    updateCols();
    window.addEventListener('resize', updateCols);
    return () => window.removeEventListener('resize', updateCols);
  }, []);

  useEffect(() => {
    if (!sheetId) return;
    fetch("/api/student/exam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "fetch", sheetId })
    })
      .then(res => res.json())
      .then((data: any) => {
        if (data.error) setErrorMsg(data.error);
        else setExam(data);
      });
  }, [sheetId]);

  const handleSubmit = async () => {
    if (!confirm("آیا از ثبت نهایی پاسخ‌برگ مطمئن هستید؟")) return;
    setLoading(true);
    const res = await fetch("/api/student/exam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "submit", sheetId, userAnswers: answers })
    });
    const data = (await res.json()) as any;
    if (data.success) router.push(`/result/${data.submissionId}`);
    else alert(data.error || "خطا در ثبت پاسخ‌برگ");
    setLoading(false);
  };

  if (errorMsg) return <div className="min-h-screen flex items-center justify-center font-bold text-red-500 p-6">{errorMsg}</div>;
  if (!exam) return <div className="min-h-screen flex items-center justify-center font-bold">در حال بارگذاری پاسخ‌برگ...</div>;

  // ۱. ساخت دسته‌های ۱۰ تایی از سوالات
  const blocks: number[][] = [];
  for (let i = 0; i < exam.total_questions; i += 10) {
    const chunk = [];
    for (let j = i; j < Math.min(i + 10, exam.total_questions); j++) {
      chunk.push(exam.start_question_number + j);
    }
    blocks.push(chunk);
  }

  // ۲. الگوریتم چیدمان عمودی و ستونی کنکوری (پر شدن ستون به ستون از چپ)
  const totalBlocks = blocks.length;
  const numRows = Math.max(1, Math.ceil(totalBlocks / maxCols));

  const orderedBlocks: (number[] | null)[] = [];
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < maxCols; c++) {
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border dark:border-gray-700">
        
        {/* هدر پاسخ‌برگ */}
        <div className="bg-blue-600 text-white p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">{exam.title}</h1>
            <p className="text-xs text-blue-100 mt-1">پاسخ داده شده: {answeredCount} از {exam.total_questions}</p>
          </div>
          <button onClick={handleSubmit} disabled={loading} className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-2.5 rounded-xl font-bold shadow transition">
            {loading ? 'در حال ثبت...' : 'پایان و ثبت نهایی'}
          </button>
        </div>

        {/* شبکه پاسخ‌برگ کنکوری دقیق (پر شدن عمودی و ستونی) */}
        <div className="p-6 max-h-[75vh] overflow-y-auto" dir="ltr">
          <div 
            className="grid gap-6 items-start"
            style={{ gridTemplateColumns: `repeat(${maxCols}, minmax(0, 1fr))` }}
          >
            {orderedBlocks.map((block, idx) => {
              if (!block) return <div key={`empty-${idx}`} />;
              return (
                <div key={idx} className="bg-gray-50 dark:bg-gray-900/60 p-3 rounded-2xl border dark:border-gray-700/60 flex flex-col gap-2">
                  <div className="text-[11px] font-mono text-gray-400 font-bold mb-1 text-center border-b dark:border-gray-700 pb-1">
                    سوالات {block[0]} تا {block[block.length - 1]}
                  </div>
                  
                  {block.map(q => (
                    <div key={q} className="flex items-center justify-between gap-3 p-1.5 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700/50 shadow-sm">
                      <span className="font-bold text-xs text-gray-600 dark:text-gray-300 w-7 font-mono text-left">{q}_</span>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4].map(opt => {
                          const isSelected = answers[q] === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setAnswers(prev => ({
                                ...prev,
                                [q]: prev[q] === opt ? 0 : opt
                              }))}
                              className={`w-7 h-7 rounded-full font-bold text-xs border-2 transition-all flex items-center justify-center ${
                                isSelected
                                  ? 'bg-blue-600 text-white border-blue-600 shadow scale-105'
                                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-500'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}