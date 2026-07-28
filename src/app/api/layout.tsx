import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";

const vazirmatn = Vazirmatn({ 
  subsets: ["arabic", "latin"],
  variable: '--font-vazirmatn', // اضافه کردن متغیر CSS
  display: 'swap',
});

export const metadata: Metadata = {
  title: "TestBaan | تست‌بان",
  description: "سیستم هوشمند مدیریت آزمون و پاسخ‌برگ",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      {/* اعمال فونت به کل بادی */}
      <body className={`${vazirmatn.variable} font-sans bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}