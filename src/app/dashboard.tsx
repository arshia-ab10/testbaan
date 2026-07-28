"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function StudentDashboard() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/dashboard").then(res => res.json()).then(data => {
      if(Array.isArray(data)) setExams(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">در حال بارگذاری...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b pb-4 dark:border-gray-800">
          <h1 className="text-3xl font-black text-blue-600 dark:text-blue-400">داشبورد آزمون‌های من</h1>
          <a href="/api/auth/logout" className="text-red-500 text-sm font-bold hover:underline">خروج</a>
        </div>

        {exams.length === 0 ? (
          <div className="text-center py-20 text-gray-500">هنوز هیچ آزمونی برای شما فعال نشده است.</div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {exams.map(exam => (
              <div key={exam.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border dark:border-gray-700 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">{exam.book_title}</span>
                  <h2 className="text-xl font-bold mt-3 mb-1">{exam.title}</h2>
                  <p className="text-sm text-gray-500 mb-4">
                    {exam.type === 'exam' ? `آزمون زمان‌دار (${exam.duration_minutes} دقیقه)` : 'تست تمرینی'} • {exam.total_questions} سوال
                  </p>
                </div>
                
                {exam.status === 'completed' ? (
                  <Link href={`/result/${exam.submission_id}`} className="block text-center bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 p-3 rounded-xl font-bold hover:bg-green-200 transition">
                    مشاهده کارنامه ({exam.score_percentage}%)
                  </Link>
                ) : (
                  <Link href={`/exam/${exam.id}`} className="block text-center bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-md">
                    {exam.status === 'in_progress' ? 'ادامه آزمون' : 'شروع آزمون'}
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}