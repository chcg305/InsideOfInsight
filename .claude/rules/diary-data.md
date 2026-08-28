# Diary Data Rules

## Structure

다이어리 항목의 필수 필드:

```
{
  category: string     // 카테고리 (예: Work, Life, Relationship)
  title: string        // 기록의 핵심 주제 (1줄 요약)
  label: string        // Insight 분석용 세부 주제 (태그 형식)
  date: string         // ISO 8601 형식
  content: string      // 실제 일기 본문 (길이 제약 없음)
}
```

## Semantics

**category vs label**
- category: 기록의 대분류 (변경 불가, 일관성 유지)
- label: 기록의 의미 있는 세부 주제 (Insight 검색, 패턴 분석 용도)

**title:** 내용을 한 줄로 대표할 수 있어야 함

**content:** 구체적인 상황과 생각을 포함, 길이 제약 없음

## 데이터 검증 (상세는 diary-content Skill 참고)

새 기록 추가 전 기존 데이터와 다음을 확인한다:

- 시간 흐름 — 날짜 순서, 시간적 모순 없음?
- 인물 관계 — 기존 관계와 일관성 있음?
- 성격 — 같은 인물이 일관된 말투/생각 방식?
- 사건 연속성 — 이전 사건의 인과관계 맞음?
- 반복 주제 — 기존 label들과 패턴 연결 가능?

**참고:** 작업 절차는 `/diary-content` skill에 상세히 기술.
