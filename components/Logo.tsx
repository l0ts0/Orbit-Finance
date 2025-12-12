import React from 'react';

export const Logo = ({ className = "w-8 h-8", showText = true }: { className?: string, showText?: boolean }) => (
  <div className="flex items-center gap-3 select-none">
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]">
        <defs>
          <linearGradient id="orbit-gradient" x1="0" y1="0" x2="100" y2="100">
            <stop offset="0%" stopColor="#6366f1" /> {/* Indigo-500 */}
            <stop offset="50%" stopColor="#8b5cf6" /> {/* Violet-500 */}
            <stop offset="100%" stopColor="#ec4899" /> {/* Pink-500 */}
          </linearGradient>
        </defs>
        
        {/* Outer Orbit Ring (Broken) */}
        <path 
          d="M 50 10 A 40 40 0 1 1 21.7 81.7" 
          stroke="url(#orbit-gradient)" 
          strokeWidth="12" 
          strokeLinecap="round" 
        />
        
        {/* Satellite Dot (Automation) */}
        <circle cx="21.7" cy="81.7" r="6" fill="#10b981" /> {/* Emerald-500 */}

        {/* Inner Core (Net Worth) */}
        <circle cx="50" cy="50" r="18" fill="white" className="opacity-90" />
      </svg>
    </div>
    {showText && (
      <div className="flex flex-col justify-center">
        <h1 className="text-2xl font-bold tracking-tight text-white font-sans leading-none">
          Orbit
        </h1>
        <span className="text-[10px] tracking-[0.2em] text-indigo-400 font-bold uppercase">
          Finance
        </span>
      </div>
    )}
  </div>
);
