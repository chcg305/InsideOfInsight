---
name: code-review
description: Review InsideToInsight changes for regressions, architectural issues, UI problems, data inconsistencies, and maintainability risks.
---

# Code Review

변경 사항을 검토하여 회귀, 아키텍처 위반, 데이터 불일치, UI 문제를 찾는다.

## Review Order

1. **회귀 리스크**
   - 기존 기능이 깨졌는가?
   - 이벤트/상태 관리가 올바른가?
   - 데이터 로드/필터링 흐름이 변했는가?

2. **아키텍처**
   - 데이터와 UI가 과도하게 강결합되었는가?
   - 새로운 책임이 기존 모듈에 섞였는가?
   - 코드 복제가 있는가?

3. **데이터 정합성**
   - category/title/label/date/content 구조 유지?
   - 기존 다이어리 호환성?
   - Insight 분석에 필요한 메타데이터 보존?

4. **UI/UX**
   - 레이아웃 깨짐?
   - 시각 일관성 유지?
   - 긴 콘텐츠에서 overflow 문제?

5. **반응형**
   - 모바일(375px), 태블릿(768px), 데스크톱(1024px+) 모두 OK?

6. **유지보수성**
   - 명확한 네이밍인가?
   - 불필요한 복잡도는 없는가?

## Output

수정 불가 시 구체적인 파일명, 줄 번호, 이유를 명시한다.
수정 가능한 경우 명시적 요청 후 진행.

참고: `.claude/rules/` 전체 규칙과 대조
