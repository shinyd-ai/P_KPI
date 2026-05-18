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
    <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-white md:px-6 md:py-4">
      <h2 className="text-xl font-semibold text-zinc-800">{title}</h2>
      {action && (
        action.href ? (
          <Link
            href={action.href}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            {action.label}
          </button>
        )
      )}
    </header>
  );
}


