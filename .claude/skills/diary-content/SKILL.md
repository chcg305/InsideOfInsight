---
name: diary-content
description: Create, revise, validate, and organize realistic long-form diary data while preserving character consistency, chronology, metadata, and analytical usefulness.
---

# Diary Content

현실적이고 분석 가능한 다이어리 데이터를 생성/수정한다.

## Required Metadata

```
category   — 대분류 (Work, Life, Relationship 등)
title      — 기록 핵심 주제 (1줄)
label      — Insight 분석용 세부 주제 (태그 형식)
date       — ISO 8601 형식
content    — 실제 일기 본문 (길이 제약 없음)
```

## Content Quality

**현실감**
- 구체적인 상황, 시간, 사람이 나와야 함
- 감정과 생각을 포함 (단순 사건 기록이 아님)
- 실제 사람이 쓴 것처럼 자연스러운 톤

**메타데이터**
- title: 내용을 5단어 이내로 대표
- label: 반복될 수 있는 의미 있는 주제 (Insight 검색용)
- category: 기존과 일관됨

**Insight 활용성**
- label을 통해 패턴 분석 가능해야 함
- 다른 category와 연결 가능한 요소 고려
- 시간 변화를 추적할 수 있게 작성

## Consistency Check

새 기록 추가 전:

1. **시간 흐름** — 날짜 순서, 시간적 모순 없음?
2. **인물 관계** — 기존 관계와 일관성 있음?
3. **성격/톤** — 같은 인물이 일관된 말투/생각 방식?
4. **사건 연속성** — 이전 사건의 인과관계 맞음?
5. **반복 주제** — 기존 label들과 패턴 연결 가능?

## Workflow

1. 기존 다이어리 훑기 (최근 10-20개)
2. 새 기록 작성 (메타데이터 포함)
3. 일관성 확인 (위의 5가지)
4. 조정 & 최종 확인
