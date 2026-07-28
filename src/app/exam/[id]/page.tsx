"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ExamPage({ params }: { params: { id: string } }) {
  const [exam, setExam] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/student/exam?id=${params.id}`).then(res => res.json()).then(setExam);
  }, [params.id]);

  const handleSubmit = async () => {
    if (!confirm("آیا از ثبت نهایی پاسخ‌برگ مطمئن هستید؟ (پاسخ‌ها قفل خواهند شد)")) return;
    setLoading(true);
    const res = await fetch("/api/student/exam", {
      method: "POST", body: JSON.stringify({ sheetId: params.id, userAnswers: answers })
    });
    const data = (await res.json()) as any;
    if (data.success) router.push(`/result/${data.submissionId}`);
  };

  if (!exam) return <div className="min-h-screen flex items-center justify-center">در حال بارگذاری پاسخ‌برگ...</div>;

  const questions = Array.from({ length: exam.total_questions }, (_, i) => exam.start_question_number + i);
  const answeredCount = Object.values(answers).filter(val => val > 0).length;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border dark:border-gray-700">
        
        {/* هدر پاسخ‌برگ */}
        <div className="bg-blue-600 text-white p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">{exam.title}</h1>
            <p className="text-xs text-blue-100 mt-1">پاسخ داده شده: {answeredCount} از {exam.total_questions}</p>
          </div>
          <button onClick={handleSubmit} disabled={loading} className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-2.5 rounded-xl font-bold shadow transition">
            {loading ? 'در حال ثبت...' : 'پایان و ثبت نهایی'}
          </button>
        </div>

        {/* لیست سوالات به شکل دکمه‌های دایره‌ای کنکوری */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto">
          {questions.map(q => (
            <div key={q} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-3 rounded-2xl border dark:border-gray-600">
              <span className="font-bold text-gray-500 dark:text-gray-300 w-8 text-center">{q}-</span>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(opt => {
                  const isSelected = answers[q] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAnswers(prev => ({
                        ...prev,
                        [q]: prev[q] === opt ? 0 : opt // کلیک مجدد = پاک شدن گزینه
                      }))}
                      className={`w-9 h-9 rounded-full font-bold text-sm border-2 transition-all duration-150 flex items-center justify-center ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400'
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
      </div>
    </div>
  );
}