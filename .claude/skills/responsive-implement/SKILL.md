---
name: responsive-implement
description: Tailwind CSS 4 기반 Next.js 프로젝트에서 반응형 클래스를 안전하게 적용할 때 사용한다.
---

# Responsive Implement Skill

## 목적

이 Skill은 responsive-implementer가 계획서대로 코드를 수정할 때 실수를 줄이도록 돕는다.

## P_KPI2 프로젝트 주의사항

- Tailwind CSS 4 사용: `tailwind.config.ts` 없음, `globals.css` 에 `@import "tailwindcss"` 방식
- Next.js App Router: `"use client"` 필요한 컴포넌트 확인
- 기존 PC 레이아웃 (`md:` 이상)을 건드리지 않는 것이 원칙

## 절차

1. 계획서에서 변경 우선순위 1번 항목을 확인한다
2. 해당 파일을 Read로 읽는다
3. 변경할 클래스 또는 구조를 Edit으로 정확히 수정한다
4. 수정 후 파일을 다시 Read로 읽어 의도대로 됐는지 확인한다
5. 구현 로그에 완료로 기록하고 다음 항목으로 넘어간다

## 안전 수칙

- 한 번에 하나의 파일만 수정한다
- 기존 클래스를 제거할 때는 제거 이유를 로그에 남긴다
- `className` 문자열이 길어지면 줄바꿈으로 가독성을 유지한다
- 신규 파일 생성 시 기존 컴포넌트 스타일 패턴을 먼저 참고한다

## 하단 탭 바 표준 구조 (BottomNav)

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/",        icon: "📊", label: "대시보드" },
  { href: "/goals",   icon: "🎯", label: "목표" },
  { href: "/monthly", icon: "📅", label: "월간" },
  { href: "/daily",   icon: "📋", label: "일간" },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-200 md:hidden">
      <div className="flex">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
              pathname === item.href ? "text-blue-600" : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
```

## 품질 기준

- 수정 전후 Read로 확인한다
- 구현 로그에 변경 내용을 빠뜨리지 않는다
- 브라우저 실행 없이 "동작 확인됨"이라고 쓰지 않는다


