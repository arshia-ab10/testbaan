import Link from "next/link";
import { cookies } from "next/headers";

export default async function Home({ searchParams }: { searchParams: any }) {
  const cookieStore = await cookies();
  const session = cookieStore.get("user_session");
  const user = session ? JSON.parse(session.value) : null;
  const error = searchParams?.error;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl border dark:border-gray-700 text-center">
        <h1 className="text-4xl font-black text-blue-600 dark:text-blue-400 mb-3">تست‌بان</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">سامانه آنلاین برگزاری آزمون و پاسخ‌برگ الکترونیکی</p>

        {error && (
          <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-xl text-sm font-bold border border-red-200">
            خطا در ورود: {error}
          </div>
        )}

        {user ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-gray-700 rounded-2xl">
              <p className="text-sm text-gray-500 dark:text-gray-300">خوش آمدید،</p>
              <p className="font-bold text-lg text-green-700 dark:text-green-300">
                {user.first_name || user.last_name ? `${user.first_name} ${user.last_name}` : 'کاربر عزیز'}
              </p>
              <p className="text-xs text-gray-400 mt-1 font-mono">{user.email}</p>
            </div>
            
            <Link href="/dashboard" className="block w-full bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-xl font-bold transition shadow-lg">
              ورود به داشبورد آزمون‌ها ←
            </Link>

            {/* دکمه مخصوص ادمین */}
            {user.role === 'admin' && (
              <Link href="/admin" className="block w-full bg-gray-800 hover:bg-gray-900 text-white p-3.5 rounded-xl font-bold transition shadow-lg">
                ورود به پنل مدیریت ⚙️
              </Link>
            )}

            <a href="/api/auth/logout" className="block text-xs text-red-500 hover:underline pt-2">
              خروج از حساب کاربری
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            <a href="/api/auth/google" className="flex items-center justify-center gap-3 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-800 dark:text-white p-3.5 rounded-xl font-bold transition shadow-md">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              ورود با حساب گوگل (جیمیل)
            </a>
          </div>
        )}
      </div>
    </main>
  );
}