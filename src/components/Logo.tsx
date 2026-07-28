export default function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="28" fill="url(#logoGrad)"/>
      <path d="M50 20C65 20 75 24 75 24V48C75 66 50 78 50 78C50 78 25 66 25 48V24C25 24 35 20 50 20Z" fill="none" stroke="#FFFFFF" strokeWidth="6" strokeLinejoin="round"/>
      <path d="M38 48L46 56L62 38" fill="none" stroke="#34D399" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}