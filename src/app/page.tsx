"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import GoogleIcon from "@/components/GoogleIcon";
import { useState, useEffect } from "react";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<1 | 2>(1); // مرحله 1: ایمیل، مرحله 2: کد
  const [loadingAction, setLoadingAction] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // گرفتن اطلاعات کاربر در کلاینت برای جلوگیری از تداخل سرور در Next.js هنگام استفاده از هدرز
    fetch('/api/student/dashboard')
      .then(res => {
        if(res.ok) return res.json();
        throw new Error();
      })
      .then(() => setUser(true)) // اگر لاگین بود
      .catch(() => setUser(false))
      .finally(() => setLoadingUser(false));
  }, []);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    setErrorMsg("");
    
    const res = await fetch('/api/auth/otp/send', { method: 'POST', body: JSON.stringify({ email }) });
    const data = (await res.json()) as any;
    
    if (res.ok) {
      setStep(2);
    } else {
      setErrorMsg(data.error || 'خطا در ارسال کد');
    }
    setLoadingAction(false);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    setErrorMsg("");
    
    const res = await fetch('/api/auth/otp/verify', { method: 'POST', body: JSON.stringify({ email, code: otp }) });
    const data = (await res.json()) as any;
    
    if (res.ok) {
      window.location.href = '/dashboard';
    } else {
      setErrorMsg(data.error || 'کد اشتباه است');
      setLoadingAction(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl border dark:border-gray-700 text-center relative overflow-hidden">
        
        <div className="flex items-center justify-center gap-3 mb-3">
          <Logo className="w-12 h-12" />
          <h1 className="text-4xl font-black text-blue-600 dark:text-blue-400">تست‌بان</h1>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-8">سامانه آنلاین برگزاری آزمون الکترونیکی</p>

        {errorMsg && (
          <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-xl text-sm font-bold border border-red-200">
            {errorMsg}
          </div>
        )}

        {loadingUser ? (
           <div className="py-10 text-gray-400 font-bold">در حال بررسی اطلاعات شما...</div>
        ) : user ? (
          <div className="space-y-4">
            <Link href="/dashboard" className="block w-full bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-xl font-bold transition shadow-lg">
              ورود به داشبورد آزمون‌ها ←
            </Link>
            <Link href="/admin" className="block w-full bg-gray-800 hover:bg-gray-900 text-white p-3.5 rounded-xl font-bold transition shadow-lg">
              ورود به پنل مدیریت ⚙️
            </Link>
            <a href="/api/auth/logout" className="block text-xs text-red-500 hover:underline pt-2">خروج از حساب کاربری</a>
          </div>
        ) : (
          <div className="space-y-6">
            
            {step === 1 ? (
              <form onSubmit={handleSendCode} className="space-y-3">
                <input 
                  type="email" 
                  required 
                  placeholder="ایمیل خود را وارد کنید..." 
                  className="w-full p-4 border rounded-xl bg-gray-50 dark:bg-gray-700 dark:border-gray-600 outline-none focus:border-blue-500 transition text-left" 
                  dir="ltr"
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                />
                <button disabled={loadingAction} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-xl font-bold transition shadow-md flex justify-center items-center gap-2">
                  {loadingAction ? "در حال ارسال..." : "ارسال کد یک‌بار مصرف"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="text-sm text-gray-500 mb-2">کد ۶ رقمی به ایمیل <strong className="text-blue-600" dir="ltr">{email}</strong> ارسال شد.</div>
                <input 
                  type="text" 
                  required 
                  maxLength={6}
                  placeholder="کد ۶ رقمی" 
                  className="w-full p-4 border rounded-xl bg-gray-50 dark:bg-gray-700 dark:border-gray-600 outline-none focus:border-blue-500 transition text-center font-bold text-2xl tracking-[0.3em]" 
                  dir="ltr"
                  value={otp} 
                  onChange={e => setOtp(e.target.value)} 
                />
                <button disabled={loadingAction} className="w-full bg-green-600 hover:bg-green-700 text-white p-3.5 rounded-xl font-bold transition shadow-md flex justify-center items-center gap-2">
                  {loadingAction ? "در حال بررسی..." : "تایید کد و ورود"}
                </button>
                <button type="button" onClick={() => setStep(1)} className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">اصلاح ایمیل</button>
              </form>
            )}

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold">یا</span>
              <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
            </div>

            <a href="/api/auth/google" className="flex items-center justify-center gap-3 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-800 dark:text-white p-3.5 rounded-xl font-bold transition shadow-sm">
              <GoogleIcon className="w-6 h-6" />
              ورود سریع با حساب گوگل
            </a>
          </div>
        )}
      </div>
    </main>
  );
}