"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "대시보드", icon: "📊" },
  { href: "/goals", label: "연간 목표", icon: "🎯" },
  { href: "/monthly", label: "월간 계획", icon: "📅" },
  { href: "/daily", label: "일간 기록", icon: "📝" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-60 shrink-0 bg-zinc-900 text-white flex flex-col transition-transform duration-300 md:static md:translate-x-0 md:min-h-screen ${
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-zinc-400 hover:text-white md:hidden"
        aria-label="메뉴 닫기"
      >
        ✕
      </button>
      <div className="px-6 py-5 border-b border-zinc-700">
        <h1 className="text-lg font-bold">100억 목표 정렬</h1>
        <p className="text-xs text-zinc-400 mt-0.5">Goal Alignment System</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-6 py-4 border-t border-zinc-700">
        <Link
          href="/logout"
          className="mb-3 block text-sm font-medium text-zinc-300 hover:text-white"
        >
          Sign out
        </Link>
        <p className="text-xs text-zinc-500">
          {new Date().getFullYear()}년 목표 관리
        </p>
      </div>
    </aside>
  );
}


