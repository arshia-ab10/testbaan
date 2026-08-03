export default function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <linearGradient id="logoGlass" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E293B" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#334155" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id="logoSheen" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="logoTNeon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="45%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <filter id="logoShadow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#000000" floodOpacity="0.65"/>
        </filter>
        <filter id="logoGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width="120" height="120" rx="30" fill="url(#logoBg)" />
      <rect x="16" y="20" width="88" height="82" rx="16" fill="url(#logoGlass)" stroke="url(#logoSheen)" strokeWidth="1.5" filter="url(#logoShadow)" />

      <g stroke="#475569" strokeWidth="1.8" fill="none">
        <circle cx="33" cy="38" r="4.5"/><circle cx="51" cy="38" r="4.5"/><circle cx="69" cy="38" r="4.5" fill="#38BDF8" stroke="#38BDF8"/><circle cx="87" cy="38" r="4.5"/>
        <circle cx="33" cy="58" r="4.5" fill="#F43F5E" stroke="#F43F5E"/><circle cx="51" cy="58" r="4.5"/><circle cx="69" cy="58" r="4.5"/><circle cx="87" cy="58" r="4.5"/>
        <circle cx="33" cy="78" r="4.5"/><circle cx="51" cy="78" r="4.5"/><circle cx="69" cy="78" r="4.5"/><circle cx="87" cy="78" r="4.5" fill="#10B981" stroke="#10B981"/>
      </g>

      <g filter="url(#logoGlow)">
        <path d="M 26 31 Q 60 18 94 31" fill="none" stroke="url(#logoTNeon)" strokeWidth="6.5" strokeLinecap="round" />
        <path d="M 60 25 V 78 L 81 55" fill="none" stroke="url(#logoTNeon)" strokeWidth="7.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}