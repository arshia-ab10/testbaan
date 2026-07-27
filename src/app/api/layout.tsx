import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";

// بهینه‌سازی و لود فونت وزیرمتن
const vazirmatn = Vazirmatn({ 
  subsets: ["arabic", "latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "TestBaan | تست‌بان",
  description: "سیستم هوشمند مدیریت آزمون و پاسخ‌برگ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // تنظیم زبان فارسی و راست‌چین بودن کل سایت
    <html lang="fa" dir="rtl">
      <body className={`${vazirmatn.className} bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen transition-colors duration-300`}>
        {children}
      </body>
    </html>
  );
}