---
name: responsive-orchestrator
description: P_KPI2 앱의 모바일 반응형 작업을 분석→설계→구현→검증 순서로 실행할 때 사용한다.
---

# Responsive Orchestrator

## 목적

이 Orchestrator는 반응형 작업 전체를 4단계로 나누고, 각 단계의 산출물을 다음 단계로 이어준다.

## 입력

- 사용자의 요청 (예: "모바일 대응해줘", "특정 페이지만 모바일 고쳐줘")
- 범위 지정이 없으면 `app/`, `components/` 전체를 대상으로 한다

## 실행 흐름

### Step 1. 분석 (responsive-analyzer)

```
responsive-analyzer subagent를 사용해서
app/ 과 components/ 전체의 모바일 레이아웃 문제를 찾아
.claude/artifacts/analysis-report.md 에 저장해줘
```

산출물: `.claude/artifacts/analysis-report.md`

---

### Step 2. 설계 (responsive-designer)

Step 1 완료 후 실행.

```
responsive-designer subagent를 사용해서
.claude/artifacts/analysis-report.md 를 읽고
모바일 반응형 변경 계획서를
.claude/artifacts/design-plan.md 에 저장해줘
```

산출물: `.claude/artifacts/design-plan.md`

**사람 확인 포인트**: 계획서를 보고 범위가 너무 크거나 빠진 게 있으면 이 단계에서 조정한다.

---

### Step 3. 구현 (responsive-implementer)

Step 2 승인 후 실행.

```
responsive-implementer subagent를 사용해서
.claude/artifacts/design-plan.md 를 읽고
실제 파일들을 수정한 뒤
.claude/artifacts/implementation-log.md 에 로그를 남겨줘
```

산출물: 수정된 파일들 + `.claude/artifacts/implementation-log.md`

---

### Step 4. 검증 (responsive-verifier)

Step 3 완료 후 실행.

```
responsive-verifier subagent를 사용해서
.claude/artifacts/implementation-log.md 를 읽고
각 수정 파일을 검토해서
.claude/artifacts/verification-report.md 를 만들어줘
```

산출물: `.claude/artifacts/verification-report.md`

---

## 실패 처리

| 상황 | 대응 |
|------|------|
| 분석 보고서가 비어있음 | 대상 경로 재확인 후 Step 1 재실행 |
| 설계 계획이 PC 레이아웃을 깨뜨림 | 사람이 계획서 수정 후 Step 3 진행 |
| 구현 후 검증 실패 항목 있음 | 실패 항목만 골라 Step 3 재실행 |

## 부분 실행

특정 페이지만 고칠 때는 각 Agent를 직접 호출해도 된다.

```
responsive-analyzer subagent를 사용해서
app/monthly/page.tsx 만 분석해줘
```

## 테스트 프롬프트

| 유형 | 프롬프트 | 기대 결과 |
|------|---------|-----------|
| 정상 | "모바일 반응형 전체 작업 시작해줘" | 4단계 순서대로 실행, 각 artifacts 파일 생성 |
| 애매함 | "모바일 좀 고쳐줘" | 전체 범위 기준으로 Step 1부터 진행 |
| 실패 위험 | "사이드바만 빨리 숨겨줘" | 분석 없이 바로 구현 요청 → 분석 먼저 제안 |


