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
    if (!confirm("آیا از ثبت نهایی پاسخ‌برگ مطمئن هستید؟ (غیرقابل ویرایش خواهد بود)")) return;
    setLoading(true);
    const res = await fetch("/api/student/exam", {
      method: "POST", body: JSON.stringify({ sheetId: params.id, userAnswers: answers })
    });
    const data = await res.json();
    if (data.success) router.push(`/result/${data.submissionId}`);
  };

  if (!exam) return <div className="text-center mt-20">در حال بارگذاری...</div>;

  const questions = Array.from({ length: exam.total_questions }, (_, i) => exam.start_question_number + i);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border dark:border-gray-700">
        <div className="bg-blue-600 text-white p-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">{exam.title}</h1>
          <button onClick={handleSubmit} disabled={loading} className="bg-white text-blue-600 px-6 py-2 rounded-full font-bold shadow hover:bg-gray-100">
            {loading ? 'در حال ثبت...' : 'پایان و ثبت نهایی'}
          </button>
        </div>

        <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {questions.map(q => (
            <div key={q} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-xl border dark:border-gray-600">
              <span className="font-bold text-gray-500 dark:text-gray-300 w-6">{q}-</span>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map(opt => (
                  <button key={opt} onClick={() => setAnswers(prev => ({...prev, [q]: prev[q] === opt ? 0 : opt}))}
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all
                    ${answers[q] === opt ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-gray-400 hover:border-blue-400'}`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}