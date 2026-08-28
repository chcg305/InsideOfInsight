# Insight Development Rules

새로운 Insight 기능을 개발할 때 따라야 할 규칙.

## Insight 생성 알고리즘

Insight 분석은 label을 기반으로 패턴을 찾는다.

### 기본 흐름

1. **데이터 준비**
   - 모든 다이어리 항목 로드 (상태에서)
   - category, label, date, content 추출
   - 시간순으로 정렬

2. **패턴 인식**
   - 같은 label 반복 감지
   - 다른 category 간 label 연결 찾기
   - 시간대별 label 변화 추적

3. **분석**
   - 패턴이 의미 있는가? (2개 이상 근거)
   - 인과관계가 있는가?
   - 시간적 변화가 있는가?

4. **출력**
   - 제목, 근거, 해석, 변화, 신뢰도 형식
   - 구체적인 기록 인용 (날짜, title, label)

## 구현 패턴

### insight.js 구조

```js
// Insight 생성 함수 구조
window.I2IInsight = {
  // 1. 데이터 전처리
  normalizeForAnalysis(state) { ... },
  
  // 2. 패턴 감지
  detectLabelPatterns(entries) { ... },
  detectCategoryConnections(entries) { ... },
  detectTimelineChanges(entries) { ... },
  
  // 3. Insight 생성
  generateInsight(pattern, entries) { ... },
  
  // 4. 통합 분석
  analyze(state) {
    return [
      { type: "label-pattern", data: ... },
      { type: "category-connection", data: ... },
      { type: "timeline-change", data: ... }
    ];
  }
};
```

### 분석 타입별 구현

**공통 주제 (Label Pattern)**
```
입력: 같은 label의 다중 기록
출력: 반복되는 주제와 패턴 분석
예: label="스트레스"인 Work 기록 3개
```

**카테고리 영향 (Category Connection)**
```
입력: 다른 category의 연관 label 기록
출력: 카테고리 간 인과관계
예: Work 스트레스 → Life/Relationship 기록 변화
```

**시간 변화 (Timeline Change)**
```
입력: 시간대별 label 분포 변화
출력: 최근 변화와 과거 패턴 비교
예: 지난 1개월 vs 3개월 전 label 변화
```

## 검증 체크리스트

새 Insight 유형 추가 시:

- [ ] Insight가 사실을 기반하는가? (추측 아님)
- [ ] 구체적인 근거 2개 이상 제시되는가?
- [ ] 날짜와 label이 명시되는가?
- [ ] 시간적 흐름이 명확한가?
- [ ] 신뢰도("확실함" or "추정")가 구분되는가?
- [ ] 다른 Insight와 중복되지 않는가?

## 테스트

### Unit Test

```js
// 패턴 감지 테스트
const entries = [
  { label: "스트레스", category: "Work", date: "2026-08-01" },
  { label: "스트레스", category: "Work", date: "2026-08-05" },
  { label: "스트레스", category: "Work", date: "2026-08-10" }
];
const patterns = I2IInsight.detectLabelPatterns(entries);
// 동일 label 3개 반복 감지 확인
```

### Integration Test

1. Example data 로드
2. `/openInsight` 실행
3. Insight 생성 확인
4. 각 Insight가 데이터와 일치하는지 검증
5. 반응형 화면에서 Insight 표시 검증

## 성능 고려사항

- 100개 기록: 계산 < 100ms
- 1000개 기록: 계산 < 500ms
- 10000개 기록: 계산 < 2s

필요시 분석을 비동기(setTimeout)로 분리.

## 문서화

새 Insight 유형 추가 시:

```js
/**
 * 새로운 Insight 분석
 * @param {Array} entries - 정규화된 다이어리 항목들
 * @returns {Object} { type, title, evidence, interpretation, change, confidence }
 * 
 * 예: label "운동"의 반복 패턴
 */
function analyzeNewInsightType(entries) { ... }
```

참고: `.claude/rules/insight-analysis.md` (분석 논리)
