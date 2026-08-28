---
name: feature-development
description: Implement a new InsideToInsight feature in a controlled, incremental way while preserving existing architecture and behavior.
---

# Feature Development

새 기능을 작은 단위로 구현하면서 기존 기능과 아키텍처를 보존한다.

## Workflow

1. **현재 분석** — 관련 파일과 데이터 흐름 파악
2. **계획** — 필요한 변경 범위와 영향 범위 정의
3. **구현** — 최소 변경으로 구현, 한 번에 하나의 기능만
4. **검증** — 해당 기능이 의도대로 작동하는지 확인
5. **회귀** — 기존 기능에 부작용이 없는지 확인
6. **테스트** — `.claude/rules/testing.md` 기준 따름

## Key Rules

- 한 번에 하나의 명확한 기능만 구현 (여러 기능 × 불가)
- 기존 데이터 구조 가능하면 유지 (필요한 경우만 확장)
- 데이터 흐름이 복잡하면 먼저 설명한 뒤 구현
- 큰 리팩토링과 새 기능은 분리된 작업으로 진행

## 구현 순서

- 데이터 흐름 확인
- 필요한 상태/로직 추가
- UI/이벤트 연결
- 브라우저 검증
