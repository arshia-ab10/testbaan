"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { toFaNum } from "@/lib/utils";

export default function ResultPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const subId = resolvedParams?.id;

  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!subId) return;
    fetch(`/api/student/result?id=${subId}`).then(res => res.json()).then(setResult);
  }, [subId]);

  if (!result) return <div className="text-center mt-20 font-bold">در حال محاسبه کارنامه...</div>;

  const userAns = JSON.parse(result.user_answers || '{}');
  const correctAns = JSON.parse(result.correct_keys || '{}');
  const questions = Array.from({ length: result.total_questions }, (_, i) => result.start_question_number + i);

  let correctCount = 0, wrongCount = 0, emptyCount = 0;
  questions.forEach(q => {
    if (!userAns[q]) emptyCount++;
    else if (userAns[q] === correctAns[q]) correctCount++;
    else wrongCount++;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 text-center mb-8 border dark:border-gray-700">
          <h1 className="text-3xl font-bold mb-2">کارنامه: {result.title}</h1>
          <div className="text-6xl font-black my-6 text-blue-600 dark:text-blue-400" dir="ltr">
            %{toFaNum(result.score_percentage)}
          </div>
          <div className="flex justify-center gap-6 text-sm font-bold">
            <span className="text-green-600 bg-green-100 dark:bg-green-900/40 px-4 py-2 rounded-xl">درست: {toFaNum(correctCount)}</span>
            <span className="text-red-600 bg-red-100 dark:bg-red-900/40 px-4 py-2 rounded-xl">غلط: {toFaNum(wrongCount)}</span>
            <span className="text-gray-600 bg-gray-200 dark:bg-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl">نزده: {toFaNum(emptyCount)}</span>
          </div>
          <Link href="/dashboard" className="inline-block mt-8 text-blue-600 hover:underline font-bold">← بازگشت به داشبورد</Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {questions.map(q => {
            const isCorrect = userAns[q] === correctAns[q];
            const isEmpty = !userAns[q];
            const bgColor = isEmpty ? 'bg-gray-100 dark:bg-gray-800' : (isCorrect ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40');
            const textColor = isEmpty ? 'text-gray-500' : (isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300');

            return (
              <div key={q} className={`p-3 rounded-xl border dark:border-gray-700 flex justify-between items-center ${bgColor} ${textColor}`}>
                <span className="font-bold">{toFaNum(q)}-</span>
                <div className="text-xs text-right">
                  <div>شما: {userAns[q] ? toFaNum(userAns[q]) : '-'}</div>
                  <div className="font-bold opacity-70">کلید: {toFaNum(correctAns[q])}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}