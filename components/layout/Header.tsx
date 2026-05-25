"use client";

import Link from "next/link";

interface HeaderProps {
  title: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export default function Header({ title, action }: HeaderProps) {
  return (
    <header
      className="flex items-center justify-between px-4 py-4 md:px-6 md:py-4"
      style={{
        background: "rgba(255,255,255,0.8)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(0,0,0,0.07)",
        position: "sticky",
        top: 0,
        zIndex: 20,
      }}
    >
      <h2 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h2>
      {action && (
        action.href ? (
          <Link
            href={action.href}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-xl transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #4f7cff 0%, #6366f1 100%)",
              boxShadow: "0 2px 8px rgba(79,124,255,0.35)",
            }}
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-xl transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #4f7cff 0%, #6366f1 100%)",
              boxShadow: "0 2px 8px rgba(79,124,255,0.35)",
            }}
          >
            {action.label}
          </button>
        )
      )}
    </header>
  );
}
