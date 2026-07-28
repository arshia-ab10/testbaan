// تابع تبدیل اعداد انگلیسی به فارسی (مشابه TextFaNum)
export function toFaNum(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  const faDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (w) => faDigits[parseInt(w, 10)]);
}