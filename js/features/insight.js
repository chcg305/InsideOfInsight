
(function(){
  let selectedCategories = new Set();

  // ===== 핵심 분석 엔진 =====

  function analyzeContext(state, selectedCats) {
    const cats = Array.from(selectedCats);
    const entries = [];

    cats.forEach(cat => {
      (state.entries[cat] || []).forEach(e => {
        entries.push({ ...e, category: cat });
      });
    });

    entries.sort((a, b) => new Date(a.date) - new Date(b.date));

    // 시간 범위 분석
    const timeRange = entries.length > 0 ? {
      start: new Date(entries[0].date),
      end: new Date(entries[entries.length - 1].date),
      days: Math.floor((new Date(entries[entries.length - 1].date) - new Date(entries[0].date)) / (1000 * 60 * 60 * 24))
    } : null;

    // 라벨 분석 - 반복 패턴
    const labelFreq = {};
    entries.forEach(e => {
      if (e.label) {
        labelFreq[e.label] = (labelFreq[e.label] || 0) + 1;
      }
    });

    // 감정/톤 분석 (단어 기반)
    const emotionalWords = {
      긍정: ['좋다', '행복', '즐겁', '성공', '기대', '도움', '감사', '고마', '괜찮', '편하'],
      부정: ['힘들', '피곤', '스트레스', '불안', '두려', '외로', '섭섭', '답답', '좌절', '걱정'],
      혼란: ['고민', '갈등', '미루', '결정', '망설', '어려', '헷갈']
    };

    const emotionCount = { 긍정: 0, 부정: 0, 혼란: 0 };
    entries.forEach(e => {
      Object.keys(emotionalWords).forEach(emotion => {
        emotionalWords[emotion].forEach(word => {
          if (e.content.includes(word)) emotionCount[emotion]++;
        });
      });
    });

    // 카테고리별 초점 변화
    const categoryTimeline = {};
    entries.forEach(e => {
      if (!categoryTimeline[e.category]) categoryTimeline[e.category] = [];
      categoryTimeline[e.category].push(new Date(e.date));
    });

    // 최근과 과거 비교
    const midpoint = Math.floor(entries.length / 2);
    const recentEntries = entries.slice(midpoint);
    const pastEntries = entries.slice(0, midpoint);

    return {
      entries,
      timeRange,
      labelFreq,
      emotionCount,
      categoryTimeline,
      recentEntries,
      pastEntries,
      totalEntries: entries.length,
      selectedCats: cats
    };
  }

  function getSignalsForPrompt(context) {
    // 프롬프트에 포함할 신호 및 가이드라인
    const signals = [];

    // 1. 갈등 신호
    if (context.labelFreq['갈등'] || context.labelFreq['고민'] || context.emotionCount['혼란'] > 3) {
      signals.push('갈등/고민 신호 감지: 사용자의 현재 고민에서 가장 중요한 것이 무엇인지 명확히 하기 위해 필요시 질문을 제시할 수 있습니다.');
    }

    // 2. 반복되는 미루기 패턴
    if (context.labelFreq['미루'] || context.labelFreq['결정'] || context.labelFreq['미루기']) {
      signals.push('결정 지연 패턴 감지: 결정을 미루는 실제 제약(정보 부족, 타이밍, 두려움, 리소스)을 파악하기 위해 필요시 질문을 제시할 수 있습니다.');
    }

    // 3. 타인 기대 신호
    if (context.entries.some(e => e.content.includes('부모') || e.content.includes('기대') || e.content.includes('책임'))) {
      signals.push('타인 기대 신호 감지: 가족/주변인의 기대가 현재 선택에 미치는 영향을 파악하기 위해 필요시 질문을 제시할 수 있습니다.');
    }

    // 4. 가치 충돌
    const hasMultipleCategories = context.selectedCats.length > 2;
    if (hasMultipleCategories && context.emotionCount['혼란'] > 2) {
      signals.push('가치 충돌 신호 감지: 사용자가 가장 원하는 것과 두려운 것을 명확히 하기 위해 필요시 질문을 제시할 수 있습니다.');
    }

    return signals;
  }

  // ===== 프롬프트 빌더 =====

  function buildAnalysisPrompt(question, context, userAnswer = null) {
    let contextText = '===== 기록 분석 =====\n\n';

    contextText += `선택된 범위: ${context.selectedCats.join(', ')}\n`;
    contextText += `기간: ${context.timeRange ? `${I2IUtils.formatDate(context.timeRange.start)} ~ ${I2IUtils.formatDate(context.timeRange.end)} (${context.timeRange.days}일)` : '정보 없음'}\n`;
    contextText += `총 기록: ${context.totalEntries}개\n\n`;

    // 반복되는 주제
    const topLabels = Object.entries(context.labelFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (topLabels.length > 0) {
      contextText += `반복되는 주제:\n`;
      topLabels.forEach(([label, count]) => {
        contextText += `- "${label}" (${count}회)\n`;
      });
      contextText += '\n';
    }

    // 감정 톤
    contextText += `감정 분포: 긍정 ${context.emotionCount['긍정']}회, 부정 ${context.emotionCount['부정']}회, 혼란 ${context.emotionCount['혼란']}회\n\n`;

    // 최근 변화
    if (context.recentEntries.length > 0 && context.pastEntries.length > 0) {
      const recentLabels = {};
      context.recentEntries.forEach(e => {
        if (e.label) recentLabels[e.label] = (recentLabels[e.label] || 0) + 1;
      });

      contextText += `최근 주요 주제: ${Object.keys(recentLabels).join(', ')}\n\n`;
    }

    // 신호 및 질문 가이드라인
    const signals = getSignalsForPrompt(context);
    if (signals.length > 0) {
      contextText += '===== 분석 신호 & 질문 가이드라인 =====\n';
      signals.forEach(signal => {
        contextText += `• ${signal}\n`;
      });
      contextText += '\n💡 힌트: 충분한 정보가 있다면 직접 분석하세요. 필요시에만 사용자에게 추가 질문을 제시하세요. 프롬프트에 있는 신호가 감지되었다면, 해당 신호에 대한 질문을 분석 결과에 포함시킬 수 있습니다.\n\n';
    }

    // 실제 기록
    contextText += '===== 시간 순 기록 =====\n\n';
    context.entries.forEach((e, i) => {
      contextText += `[${i+1}] ${I2IUtils.formatDate(e.date)} - [${e.category}]\n`;
      contextText += `제목: ${e.title || '제목 없음'}\n`;
      contextText += `라벨: ${e.label || '없음'}\n`;
      contextText += `내용: ${e.content.substring(0, 200)}${e.content.length > 200 ? '...' : ''}\n\n`;
    });

    if (userAnswer) {
      contextText += `\n===== 사용자 추가 정보 =====\n${userAnswer}\n`;
    }

    const systemPrompt = `당신은 개인의 기록을 통해 깊이 있는 통찰을 제공하는 AI 코치입니다.

핵심 원칙:
1. 선택된 Node/카테고리의 범위를 존중한다
2. 사실(기록), 해석, 가설을 명확히 구분한다
3. 반복 패턴, 시간적 변화, 감정과 행동의 연결을 분석한다
4. 기록에 없는 사실은 만들어내지 않는다
5. 필요시 심리학, 인지과학, 의사결정 이론 등을 활용한다
6. 사용자를 판단하지 않고 존중하며 분석한다
7. 구체적이고 실행 가능한 제안을 한다
8. 정보 밀도를 높인다 (길이가 아닌 깊이)

출력 구조:
## 핵심 통찰
(가장 중요한 발견)

## 맥락 분석
(선택된 범위 내에서 정보들의 연결)

## 시간적 변화
(과거 vs 최근, 반복 패턴)

## 숨은 연결 및 가설
(사용자가 직접 연결하지 않은 정보 간 의미)

## 심리/의사결정 관점
(관련 전문지식 적용 - 필요시)

## 고려할 관점
(다른 해석 가능성, 놓친 것)

## 생각해볼 질문
(사고 확장을 위한 질문들 - 신호에 기반한 질문 포함 가능)

## 다음 행동
(현실적으로 실행 가능한 구체적 행동)

## 격려
(분석에 기반한 현실적 격려)`;

    return {
      system: systemPrompt,
      context: contextText,
      userQuestion: question
    };
  }

  // ===== 공개 API =====

  function buildPrompt(question, state, selectedCats = null, userAnswer = null) {
    if (!selectedCats || selectedCats.size === 0) {
      selectedCats = new Set(state.categories.filter(c => (state.entries[c] || []).length));
    }

    const context = analyzeContext(state, selectedCats);
    const prompt = buildAnalysisPrompt(question, context, userAnswer);

    return `${prompt.system}\n\n${prompt.context}\n\n===== 사용자 질문 =====\n${prompt.userQuestion}`;
  }

  function setSelectedCategories(categories) {
    selectedCategories = new Set(categories);
  }

  function getSelectedCategories() {
    return selectedCategories;
  }

  function buildCategoryTree(state) {
    const rootNodes = state.nodes.filter(n =>
      !state.relationships.some(r => r.type === 'parent' && r.targetNodeId === n.id)
    );

    function buildBranch(nodeId, depth = 0) {
      const node = state.nodes.find(n => n.id === nodeId);
      if (!node) return null;

      const hasEntries = (state.entries[node.name] || []).length > 0;

      return {
        id: nodeId,
        name: node.name,
        hasEntries: hasEntries,
        depth: depth,
        children: state.relationships
          .filter(r => r.type === 'parent' && r.sourceNodeId === nodeId)
          .map(r => buildBranch(r.targetNodeId, depth + 1))
          .filter(Boolean)
      };
    }

    return rootNodes.map(node => buildBranch(node.id)).filter(Boolean);
  }

  window.I2IInsight = {
    buildPrompt,
    setSelectedCategories,
    getSelectedCategories,
    buildCategoryTree
  };
})();
