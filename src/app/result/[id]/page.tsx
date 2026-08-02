"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { toFaNum } from "@/lib/utils";

export default function ResultPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const sheetId = (params instanceof Promise ? use(params) : params)?.id;
  const [versions, setVersions] = useState<any[]>([]);
  const [selectedV, setSelectedV] = useState<number>(0);
  const [showCorrect, setShowCorrect] = useState(true);

  useEffect(() => {
    if (!sheetId) return;
    fetch(`/api/student/result?sheetId=${sheetId}`).then(res => res.json()).then(data => {
      if(Array.isArray(data)) setVersions(data);
    });
  }, [sheetId]);

  if (!versions.length) return <div className="text-center mt-20 font-bold">در حال بارگذاری...</div>;

  const result = versions[selectedV];
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
      <div className="max-w-5xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 text-center mb-8 border dark:border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <Link href={`/dashboard#sheet-${sheetId}`} className="text-blue-600 font-bold hover:underline">← بازگشت</Link>
            <select className="bg-gray-100 dark:bg-gray-700 p-2 rounded-xl font-bold outline-none" value={selectedV} onChange={e => setSelectedV(Number(e.target.value))}>
              {versions.map((v, idx) => <option key={v.id} value={idx}>نسخه {toFaNum(v.version)}</option>)}
            </select>
          </div>
          
          <h1 className="text-3xl font-bold mb-2">کارنامه: {result.title}</h1>
          <div className="text-6xl font-black my-6 text-blue-600 dark:text-blue-400" dir="ltr">%{toFaNum(result.score_percentage)}</div>
          
          <div className="flex justify-center gap-6 text-sm font-bold mb-8">
            <span className="text-green-600 bg-green-100 px-4 py-2 rounded-xl">درست: {toFaNum(correctCount)}</span>
            <span className="text-red-600 bg-red-100 px-4 py-2 rounded-xl">غلط: {toFaNum(wrongCount)}</span>
            <span className="text-gray-600 bg-gray-200 px-4 py-2 rounded-xl">نزده: {toFaNum(emptyCount)}</span>
          </div>

          <label className="flex items-center justify-center gap-3 cursor-pointer bg-gray-100 dark:bg-gray-700 w-fit mx-auto px-4 py-2 rounded-full">
            <input type="checkbox" checked={showCorrect} onChange={e => setShowCorrect(e.target.checked)} className="w-5 h-5 accent-blue-600" />
            <span className="font-bold text-sm">نمایش کلیدهای صحیح در کارنامه</span>
          </label>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4" dir="ltr">
          {questions.map(q => {
            const isCorrect = userAns[q] === correctAns[q];
            const isEmpty = !userAns[q];
            const bgColor = isEmpty ? 'bg-gray-100 dark:bg-gray-800' : (isCorrect ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40');

            return (
              <Link href={`/exam/${sheetId}#q-${q}`} key={q} className={`p-3 rounded-xl border dark:border-gray-700 flex justify-between items-center hover:scale-105 transition ${bgColor}`}>
                <span className="font-bold text-gray-700 dark:text-gray-300">{toFaNum(q)}-</span>
                <div className="text-xs text-right">
                  <div className="font-bold text-gray-900 dark:text-white">شما: {userAns[q] ? toFaNum(userAns[q]) : '-'}</div>
                  {showCorrect && <div className="font-bold opacity-60 mt-1">کلید: {toFaNum(correctAns[q])}</div>}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}