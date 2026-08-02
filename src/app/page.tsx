import Link from "next/link";
import Logo from "@/components/Logo";
import GoogleIcon from "@/components/GoogleIcon";
import { getAuthUser } from "@/lib/auth";

export default async function Home(props: { searchParams?: Promise<{ error?: string }> | { error?: string } }) {
  const user = await getAuthUser();
  const searchParams = props.searchParams instanceof Promise ? await props.searchParams : props.searchParams;
  const error = searchParams?.error;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl border dark:border-gray-700 text-center">
        
        {/* عنوان سایت به همراه آیکون جدید */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <Logo className="w-12 h-12" />
          <h1 className="text-4xl font-black text-blue-600 dark:text-blue-400">تست‌بان</h1>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-8">سامانه آنلاین برگزاری آزمون و پاسخ‌برگ الکترونیکی</p>

        {error && (
          <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-xl text-sm font-bold border border-red-200">
            خطا در ورود: {error}
          </div>
        )}

        {user ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-gray-700/50 border border-green-200 dark:border-gray-600 rounded-2xl">
              <p className="text-sm text-gray-500 dark:text-gray-300">خوش آمدید،</p>
              <p className="font-bold text-lg text-green-700 dark:text-green-300">
                {user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}` : 'کاربر عزیز'}
              </p>
              <p className="text-xs text-gray-400 mt-1 font-mono">{user.email}</p>
            </div>
            
            <Link href="/dashboard" className="block w-full bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-xl font-bold transition shadow-lg">
              ورود به داشبورد آزمون‌ها ←
            </Link>

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
              {/* کامپوننت جدید آیکون گوگل ۲۰۲۵ */}
              <GoogleIcon className="w-6 h-6" />
              ورود با حساب گوگل (جیمیل)
            </a>
          </div>
        )}
      </div>
    </main>
  );
}