"use client";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <header className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 bg-white md:hidden">
      <button
        onClick={onMenuClick}
        className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition-colors"
        aria-label="메뉴 열기"
      >
        ☰
      </button>
      <span className="text-base font-bold text-zinc-800">100억 목표 정렬</span>
    </header>
  );
}


