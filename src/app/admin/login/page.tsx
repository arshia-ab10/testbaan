"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      router.push("/admin"); // ورود موفق -> برو به پنل
    } else {
      setError("نام کاربری یا رمز عبور اشتباه است");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border dark:border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">تست‌بان</h1>
          <p className="text-gray-500 mt-2">ورود به پنل مدیریت</p>
        </div>
        
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-center">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm mb-1">نام کاربری</label>
            <input type="text" dir="ltr" required className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              value={username} onChange={e => setUsername(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">رمز عبور</label>
            <input type="password" dir="ltr" required className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-bold transition">
            ورود
          </button>
        </form>
      </div>
    </div>
  );
}