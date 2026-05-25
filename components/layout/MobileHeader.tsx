"use client";

import Image from "next/image";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <header
      className="flex items-center gap-3 px-4 py-3 md:hidden"
      style={{
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(0,0,0,0.07)",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      <button
        onClick={onMenuClick}
        className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
        aria-label="메뉴 열기"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <div className="flex items-center gap-2">
        <Image
          src="/icon.png"
          alt="Stride"
          width={28}
          height={28}
          className="h-7 w-7 rounded-lg"
          priority
        />
        <span className="text-sm font-bold text-slate-800">Stride</span>
      </div>
    </header>
  );
}
