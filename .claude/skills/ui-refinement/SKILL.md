---
name: ui-refinement
description: Improve InsideToInsight UI, UX, visual hierarchy, responsive layout, and interaction details without breaking existing functionality.
---

# UI Refinement

기능을 유지하면서 시각 디자인, 정보 계층, 상호작용성을 개선한다.

## Workflow

1. **현재 상태 파악** — 화면 구조 및 사용자 경험의 문제점 정의
2. **범위 결정** — CSS/HTML/JS 중 변경할 부분만 선택
3. **최소 구현** — 해당 부분만 수정, 기존 스타일은 최대한 유지
4. **데스크톱 검증** — 레이아웃, 여백, 텍스트 길이 동작
5. **모바일 검증** — 반응형 레이아웃, 터치 대상 크기
6. **회귀 확인** — 다른 페이지/기능에 영향 없음

## Design Principles

**우선순위**
1. 기능 — 사용자 작업 가능해야 함
2. 가독성 — 긴 다이어리를 읽기 편해야 함
3. 계층 — 정보 구조가 명확해야 함
4. 시각 — 일관된 스타일과 여백
5. 애니메이션 — UX 개선 목적일 때만

**금지 사항**
- 전체 UI 재설계 (부분 개선만)
- 새 라이브러리 추가 (필요 시 명시적 요청 필요)
- 기존 기능 제거
- 과도한 인라인 스타일 추가
