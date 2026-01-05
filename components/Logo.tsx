import React from 'react';

export const Logo = ({ className = "w-8 h-8", showText = true }: { className?: string, showText?: boolean }) => (
  <div className="flex items-center gap-3 select-none">
    <div className={`relative flex items-center justify-center ${className}`}>
      <img src="/pwa-192x192.png" alt="Orbit Logo" className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
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
