# 모바일 레이아웃 분석 보고서

생성일: 2026-05-15

## 높음 (모바일에서 바로 깨짐)

**1. `components/layout/Sidebar.tsx:17` — 사이드바가 모바일에서 항상 고정 렌더링됨**

```
<aside className="w-60 shrink-0 bg-zinc-900 text-white flex flex-col min-h-screen">
```

`w-60` (240px) 고정 너비로 항상 표시되며, 모바일 분기(`md:hidden`, `hidden`)가 전혀 없다. 360px 화면에서 사이드바만으로 화면의 67%를 차지해 콘텐츠 영역이 120px 수준으로 줄어든다. 햄버거 메뉴나 오버레이 방식 없음.

**2. `app/layout.tsx:23-25` — body의 flex 레이아웃에 반응형 분기 없음**

```
<body className="flex h-full bg-zinc-50">
  <Sidebar />
  <main className="flex-1 flex flex-col overflow-auto">
```

`flex`가 항상 가로 방향(`flex-row`)으로 작동한다. `sm:flex-row` 등의 분기가 없으므로 모바일에서도 사이드바+메인이 나란히 배치된다. 전체 앱의 근본 레이아웃 문제.

**3. `app/daily/page.tsx:70-98` — 날짜 헤더 영역이 한 줄에 너무 많은 요소를 배치**

```
<div className="flex items-center justify-between mb-3">
  <div className="flex items-center gap-3">
    {/* 이전 버튼 + date input + 다음 버튼 + 날짜 텍스트 문자열 전체 */}
  </div>
  {/* Progress badge: w-20 바 포함 */}
```

`flex items-center justify-between` 한 줄 안에 "좌측: 좌화살표+날짜picker+우화살표+요일 전체 텍스트", "우측: 완료 숫자+w-20 프로그레스 바"가 들어간다. 모바일 360px에서 overflow가 발생하거나 텍스트가 잘린다.

---

## 중간 (좁은 화면에서 어색함)

**4. `app/monthly/page.tsx:103-126` — 월 버튼 12개가 한 줄 flex에 배치됨**

```
<div className="flex items-center gap-3 mb-6">
  <select ...>  {/* 연도 selector */}
  <div className="flex gap-1 flex-wrap">
    {months.map((m) => ( <button ...>{m}월</button> ))}
```

`flex-wrap`이 있어 줄바꿈은 되지만, `select` 요소와 12개 버튼이 같은 `flex` 행에서 시작한다. 좁은 화면에서 select와 1~2월 버튼만 첫 줄에 들어가고 나머지가 내려가는 불규칙한 레이아웃이 된다. 또한 버튼 하나의 패딩이 `py-1`로 작아 터치 영역이 약 28px 수준이다.

**5. `app/monthly/page.tsx:130-147` — Stats bar의 `flex gap-6`이 좁은 화면에서 넘침**

```
<div className="bg-white border border-zinc-200 rounded-xl p-4 mb-5 flex items-center gap-6 text-sm">
  <span>...</span>
  <div className="flex-1 ...프로그레스 바.../>
  <Link ...>📋 월말 회고 보기 →</Link>
```

`flex items-center gap-6`이 한 줄에 텍스트+바+링크를 배치한다. 모바일에서는 링크 텍스트("📋 월말 회고 보기 →")가 잘리거나 세 요소가 밀집하여 가독성이 떨어진다.

**6. `app/page.tsx:206-219` — 범례 `flex gap-6` 한 줄 배치**

```
<div className="flex gap-6 text-sm">
  <div ...>📌 월간연결 {pct(monthlyLinked)}%</div>
  <div ...>🎯 목표연관 {pct(goalAligned)}%</div>
  <div ...>⬜ 기타 {pct(unrelated)}%</div>
```

세 범례 항목이 `flex gap-6`으로 한 줄에 고정 배치된다. 360px 화면에서 세 항목의 합산 너비가 뷰포트를 초과할 수 있으며 `flex-wrap`이 없다.

**7. `app/review/[year]/[month]/page.tsx:101-125` — 헤더 버튼 영역**

```
<div className="flex items-center justify-between px-6 py-4 ...">
  <div> {/* 제목 + 뒤로가기 링크 */} </div>
  <div className="flex gap-2">
    <button>수정</button>
    <button>재생성 / AI 회고 생성</button>
  </div>
```

`px-6 py-4`의 헤더에서 좌측 제목+링크와 우측 버튼 2개가 `justify-between`으로 배치된다. "AI 회고 생성" 버튼 텍스트가 모바일에서 제목과 겹치거나 버튼이 잘릴 수 있다.

**8. `app/goals/[id]/page.tsx:78-82` — 목표 요약 정보 `flex gap-6`**

```
<div className="flex gap-6 mt-4 text-sm text-zinc-500">
  <span>월간 계획 {goal.monthlyPlans.length}개</span>
  <span>기록 {goal.dailyLogs.length}회</span>
  <span>총 {Math.floor(totalMinutes / 60)}시간 {totalMinutes % 60}분</span>
```

세 항목이 `flex gap-6`으로 한 줄에 나열된다. 텍스트가 길어질 경우 모바일에서 overflow 발생 가능. `flex-wrap`이 없다.

**9. `components/review/ReviewStats.tsx:58-63` — 정렬 범례 `flex gap-4`**

```
<div className="flex gap-4 text-xs text-zinc-500 mt-2">
  <span>📌 {stats.monthlyLinked}회 ({stats.monthlyLinkedPct}%)</span>
  <span>🎯 {stats.goalAligned}회 ({stats.goalAlignedPct}%)</span>
  <span>⬜ {stats.unrelated}회 ({stats.unrelatedPct}%)</span>
```

`flex-wrap` 없이 세 항목을 한 줄에 배치한다. 모바일 화면에서 잘릴 수 있다.

**10. `components/daily/DailyLogForm.tsx:137` — 소요 시간 input 고정 너비**

```
className="w-32 border border-zinc-300 rounded-lg px-3 py-2 ..."
```

`w-32`(128px) 고정 너비. 폼 자체는 `w-full`인데 이 input만 고정이라 시각적으로 일관성이 깨진다.

**11. `app/goals/[id]/page.tsx:64` — content padding**

```
<div className="flex-1 p-6 overflow-auto max-w-3xl">
```

`max-w-3xl`(768px)이 container 자체에 걸려 있어 사이드바(240px) 문제 해결 이후 가용 너비 계산이 변경될 수 있다.

---

## 낮음 (개선 권장)

**12. `components/goals/GoalCard.tsx:60-86` — 카드 액션 버튼 터치 영역 부족**

`py-1`(4px 상하 패딩) + `text-xs`(12px 폰트)로 실제 터치 영역이 약 20px. 모바일 권장 최소 터치 영역(44px)에 크게 못 미친다.

**13. `components/monthly/MonthlyPlanCard.tsx:67-78` — 카드 수정/삭제 버튼 터치 영역 부족**

GoalCard와 동일한 패턴. `py-1`로 터치 영역이 너무 작다.

**14. `components/layout/Header.tsx:16` — Header의 `px-6 py-4`가 작은 화면에서 좌우 여백 낭비**

**15. `components/daily/MorningTab.tsx:118` 및 `components/daily/EveningTab.tsx:146` — Tab 콘텐츠의 `p-6` 패딩 반응형 분기 없음**

**16. `app/daily/page.tsx:78-80` — 날짜 이동 버튼 터치 영역**

`p-1.5`(6px 사방 패딩)로 터치 영역이 약 28px 수준. 권장치(44px)에 미달.

**17. `app/goals/page.tsx:171-192` — 연도 필터 버튼과 카테고리 관리 버튼이 한 줄에 배치**

모바일에서 연도 버튼 3개 + "카테고리 관리" 버튼이 한 줄에 배치된다. 반응형 분기 없음.

---

## 요약 테이블

| 심각도 | 파일 | 줄 | 문제 |
|--------|------|-----|------|
| 높음 | `components/layout/Sidebar.tsx` | 17 | `w-60` 고정 너비, 모바일 숨김/햄버거 없음 |
| 높음 | `app/layout.tsx` | 23-25 | `flex`(가로) 레이아웃에 반응형 분기 전무 |
| 높음 | `app/daily/page.tsx` | 70-98 | 날짜 헤더 한 줄에 과다 요소, 모바일 overflow |
| 중간 | `app/monthly/page.tsx` | 103-126 | 월 선택 12개 버튼 + select 한 줄, `py-1` 터치 영역 |
| 중간 | `app/monthly/page.tsx` | 130-147 | Stats bar `flex gap-6` 한 줄, 링크 잘림 가능 |
| 중간 | `app/page.tsx` | 206-219 | 범례 `flex gap-6` 한 줄, `flex-wrap` 없음 |
| 중간 | `app/review/[year]/[month]/page.tsx` | 101-125 | 헤더 버튼 2개 + 제목 `justify-between`, 모바일 밀집 |
| 중간 | `app/goals/[id]/page.tsx` | 78-82 | 요약 `flex gap-6` 한 줄, `flex-wrap` 없음 |
| 중간 | `components/review/ReviewStats.tsx` | 58-63 | 범례 `flex gap-4` 한 줄, `flex-wrap` 없음 |
| 중간 | `components/daily/DailyLogForm.tsx` | 137 | `w-32` 고정 너비 input |
| 낮음 | `components/goals/GoalCard.tsx` | 60-86 | 버튼 `py-1` 터치 영역 ~20px |
| 낮음 | `components/monthly/MonthlyPlanCard.tsx` | 67-78 | 버튼 `py-1` 터치 영역 ~20px |
| 낮음 | `components/layout/Header.tsx` | 16 | `px-6` 패딩 반응형 분기 없음 |
| 낮음 | `components/daily/MorningTab.tsx` | 118 | `p-6` 패딩 반응형 분기 없음 |
| 낮음 | `components/daily/EveningTab.tsx` | 146 | `p-6` 패딩 반응형 분기 없음 |
| 낮음 | `app/daily/page.tsx` | 78-80 | 날짜 이동 버튼 `p-1.5` 터치 영역 ~28px |
| 낮음 | `app/goals/page.tsx` | 171-192 | 연도 필터+카테고리 관리 버튼 `justify-between`, 반응형 없음 |

---

## 핵심 결론

가장 심각한 문제는 두 가지다.

1. `components/layout/Sidebar.tsx`의 `w-60` 사이드바가 모바일 분기 없이 항상 표시된다. 360px 화면에서 사이드바가 240px를 차지해 콘텐츠 영역이 120px밖에 남지 않는다.

2. `app/layout.tsx`의 `body` 레이아웃이 `flex`(항상 가로)로 고정되어 있어 사이드바 문제를 해결하지 않는 한 나머지 페이지의 모든 반응형 수정이 효과가 없다.

**사이드바와 루트 레이아웃을 먼저 대응하는 것이 전체 모바일 작업의 전제 조건이다.**


