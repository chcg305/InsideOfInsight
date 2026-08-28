
(function(){
  function buildPrompt(question,state){
    let context='===== PERSONAL DIARY CONTEXT =====\n\n';
    const cats=state.categories.filter(c=>(state.entries[c]||[]).length);
    if(!cats.length)context+='(기록 없음)\n';
    cats.forEach(cat=>{
      context+=`--------------------------------------------------\n[${cat}]\n--------------------------------------------------\n\n`;
      const rows=[...(state.entries[cat]||[])].sort((a,b)=>new Date(a.date)-new Date(b.date));
      rows.forEach((e,i)=>{
        context+=`${i+1}. 날짜: ${I2IUtils.formatDate(e.date)}\n세부라벨: ${e.title||'제목 없음'}\n주제 라벨: ${e.label||'없음'}\n${e.content}\n\n`;
      });
    });
    return `당신은 사용자의 개인 기록을 장기적인 맥락으로 읽고 분석하는 AI 코치입니다.\n\n아래는 한 사람이 직접 기록한 개인 다이어리입니다. 기록에 없는 사실은 만들어내지 말고, 추정이 필요한 경우 추정임을 분명하게 밝히세요. 서로 다른 카테고리의 기록을 연결하고, 반복되는 패턴, 변화, 가치관, 감정, 목표, 갈등, 행동 경향을 근거와 함께 분석하세요. 단순 요약보다 질문에 대한 실질적인 통찰을 제공하세요.\n\n${context}===== USER QUERY =====\n${question.trim()}\n\n===== RESPONSE INSTRUCTIONS =====\n1. 기록에서 직접 확인되는 근거를 중심으로 답하세요.\n2. 서로 다른 카테고리에서 연결되는 맥락이 있으면 함께 설명하세요.\n3. 과거와 최근 기록 사이의 변화가 있다면 구분하세요.\n4. 사실, 해석, 추정을 섞지 마세요.\n5. 사용자가 실행할 수 있는 다음 행동이 필요하다면 구체적으로 제안하세요.`;
  }
  window.I2IInsight={buildPrompt};
})();
