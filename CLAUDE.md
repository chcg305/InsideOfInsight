# InsideToInsight

## 1. Project

InsideToInsight는 개인의 다이어리를 구조화하고, 카테고리와 세부 라벨을 기반으로 기록을 탐색한 뒤, 기록 간의 패턴과 관계를 분석하여 Insight를 제공하는 웹 애플리케이션이다.

개발 목표: 기본 구현을 유지하면서 UI/UX 완성도, 시각 디자인, 탐색 경험, 세부 기능, 데이터 구조, Insight 품질, 코드 유지보수성을 단계적으로 개선한다.

---

## 2. Tech Stack

- HTML, CSS, Vanilla JavaScript
- No frontend framework (unless explicitly needed)
- No unnecessary third-party dependency

---

## 3. Core Philosophy

**분석 먼저, 변경 나중:** 구조를 먼저 읽고 의존성을 파악한 뒤 수정한다.

**작은 단위:** 한 번의 작업에서 변경 범위를 불필요하게 넓히지 않는다.

**기능 우선:** 기존 기능을 우선 유지하고, 부작용을 검증한다.

**역할 분리:** 데이터, 상태, 렌더링, 이벤트, 분석 로직을 가능한 한 분리한다.

---

## 4. Development Reference

- **Architecture:** `.claude/rules/architecture.md` — 데이터-UI 분리, 의존성 관리
- **Frontend:** `.claude/rules/frontend.md` — CSS/HTML/JS, 반응형
- **Diary Data:** `.claude/rules/diary-data.md` — 데이터 필드, 정합성
- **Insight Analysis:** `.claude/rules/insight-analysis.md` — 분석 논리, 근거 기준
- **Insight Development:** `.claude/rules/insight-development.md` — Insight 구현 패턴 (새로 추가)
- **Testing:** `.claude/rules/testing.md` — 검증, 회귀 방지

---

## 5. Work Modes (Skills)

- **/code-review** — Regression/architecture/UX issues
- **/feature-development** — New features
- **/ui-refinement** — UI/UX improvements
- **/diary-content** — Diary data creation & validation
