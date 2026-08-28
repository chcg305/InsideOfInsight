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

---

## 6. Development Protocol

### Verification First

테스트하지 않은 기능은 완료된 기능으로 간주하지 않는다.

### No Premature Completion

검증되지 않은 상태에서 완료라고 보고하지 않는다.

### Self-QA

오류가 발견되면 사용자에게 QA를 떠넘기지 말고 원인을 분석하고 수정한 뒤 다시 검증한다.

### Regression Testing

새로운 기능을 추가하거나 수정한 뒤 기존 기능이 깨지지 않았는지 확인한다.

### Integration Testing

개별 기능뿐만 아니라 기능 간 충돌과 실제 사용자 플로우를 테스트한다.

### Browser Verification

가능한 경우 실제 브라우저에서 사용자 행동을 재현하여 검증한다.

### Console / Network Verification

Console error와 Network error를 확인한다.

### Data Verification

UI뿐만 아니라 실제 데이터 상태와 저장 상태를 확인한다.

### Progress Reporting

장시간 작업에서는 요구사항을 세분화하고 완료율을 중간보고한다.
완료율은 추측하지 않고 완료된 요구사항 / 전체 요구사항 기준으로 계산한다.

### Completion Criteria

구현 + 검증 + 회귀 테스트가 완료된 기능만 완료된 기능으로 판단한다.

---

## 7. Domain Rules (Permanent)

### Category = Node

프로젝트에서 Category는 독립적인 도메인 객체가 아니다.
Category는 사용자 관점에서 Node를 의미한다.

### Graph = Internal Engine

Graph는 내부적인 데이터 구조 및 기술적 구현 개념이다.
사용자에게 Graph라는 별도의 기능/페이지/메뉴를 제공하지 않는다.

### Mindmap = Primary User Interface

Mindmap은 Graph Editor이며 프로젝트의 핵심 작업 공간이다.
Node, Relationship, Diary, Insight, Search, View 설정은 가능한 한 Mindmap을 중심으로 동작한다.

### No Duplicate State

Graph와 Mindmap이 서로 다른 상태나 데이터를 가지면 안 된다.
하나의 Graph Data를 공유한다.

### No Category Navigation

Category 목록을 별도의 탐색 구조로 만들지 않는다.
사용자는 Mindmap의 Node를 직접 선택한다.

### Search as Node Discovery

Search는 Node 및 관련 Diary를 찾기 위한 기능이며,
검색 결과에서 해당 Node를 Mindmap으로 Focus할 수 있다.

---

## 8. 2026-08-28 구조 통합 개선 (Phase 1)

### Graph / Mindmap 초기 통합
- 노드 데이터 구조: 객체 → 글로벌 배열로 변경
- Mindmap을 Graph 에디터로 전환 (원형 뷰 제거, 노드 기반 뷰 추가)
- 각 노드에 categoryId로 카테고리 정보 유지

### UI 정리
- 좌측 사이드바: Mindmap 뷰에서만 노드 관리 UI 표시
- Graph 뷰: 간단한 패널만 표시
- 불필요한 카테고리/다이어리 입력 폼 제거

### 고급 기능
- 촌수 기반 View 필터 추가 (1촌/2촌/3촌/전체)
- 깊이 필터는 부모-자식 관계 기반으로 동작

### 디자인
- MacBook Chrome 한글 텍스트 최적화
- 버튼 패딩/폰트 조정으로 줄바꿈 방지
- letter-spacing 추가로 한글 가독성 개선

### 개발 프로토콜
- 검증 우선: 테스트하지 않은 기능은 완료로 간주하지 않음
- Self-QA: 사용자에게 QA를 떠넘기지 않음
- 진행률 추적: 요구사항 기반 명확한 진행률 보고

---

## 9. 2026-08-28 Category/Graph/Mindmap 완전 통합 (Phase 2)

### 제거된 UI
- ❌ 좌측 Category 목록 (선택 드롭다운)
- ❌ 우측 하단 Graph 버튼
- ❌ view='graph' 로직

### 통합된 기능
- ✅ Category = Node 개념 통일
- ✅ Mindmap이 유일한 작업 공간
- ✅ 모든 Node/Relationship/View 설정은 Mindmap 중심
- ✅ 검색 기능 추가 (Node 탐색 → Mindmap Focus)
- ✅ 선택된 노드의 다이어리를 '상세' 뷰에서 표시

### 최종 구조
```
                    MINDMAP
                       │
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
       NODE        RELATION         VIEW
    (Category)   부모/자식        표시 깊이
    생성/이동/삭제 가족/친구      Layout
        │            │
        └──────────────┼──────────────┘
                       │
              ┌────────┴────────┐
              ↓                 ↓
            DIARY            INSIGHT
         노트 작성         Node 선택
              │                 │
              └────────┬────────┘
                       ↓
                     SEARCH
                  Node 탐색/Focus
```

### 검증 완료
- ✅ 앱 로드 (console 오류 없음)
- ✅ 빈 마인드맵 초기 상태
- ✅ 노드 생성/선택/이동
- ✅ 검색으로 노드 찾기 및 Focus
- ✅ 데이터 저장/로드
