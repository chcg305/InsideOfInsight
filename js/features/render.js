
(function(){
  const {esc,formatDate,formatDateTime,allEntries}=I2IUtils;
  function main(state,view,selectedCategory){
    const entries=allEntries(state).sort((a,b)=>new Date(b.date)-new Date(a.date));
    if(view==='category'){
      const items=[...(state.entries[selectedCategory]||[])].sort((a,b)=>new Date(a.date)-new Date(b.date));
      return `<div class="category-detail"><div class="detail-header"><div><h2>${esc(selectedCategory)}</h2><div class="detail-sub">이 카테고리에 저장된 장문 다이어리 ${items.length}개</div></div><button class="secondary" id="backToMindmap">← 마인드맵</button></div>${items.length?items.map((e,i)=>`<article class="detail-entry"><div class="detail-entry-head"><div><div class="detail-entry-no">기록 ${i+1} · ${esc(e.category)}</div><h3 class="detail-entry-title">${esc(e.title||'제목 없음')}</h3><span class="detail-entry-label">${esc(e.label||'세부 라벨 없음')}</span></div><div class="detail-entry-date">${formatDateTime(e.date)}</div></div><div class="detail-entry-content">${esc(e.content)}</div></article>`).join(''):`<div class="empty">이 카테고리에는 아직 기록이 없습니다.</div>`}</div>`;
    }
    if(view==='cards') return `<div class="header" style="margin-top:-2px"><h1 style="font-size:18px">모든 다이어리 (${entries.length})</h1></div><div class="cards">${entries.length?entries.map(e=>`<article class="card"><div class="card-cat">${esc(e.category)}</div><div class="card-title">${esc(e.title||'제목 없음')}</div><div class="card-label">${esc(e.label||'세부 라벨 없음')}</div><div class="card-content">${esc(e.content)}</div><div class="card-date">${formatDateTime(e.date)}</div></article>`).join(''):`<div class="empty">아직 기록이 없습니다.<br>왼쪽에서 첫 다이어리를 저장해보세요.</div>`}</div>`;
    if(view==='timeline'){
      const groups={}; entries.forEach(e=>{const d=formatDate(e.date);(groups[d]??=[]).push(e)});
      return `<div class="timeline">${entries.length?Object.entries(groups).map(([d,items])=>`<div class="timeline-group"><div class="timeline-date">${d}</div>${items.map(e=>`<div class="timeline-item"><div class="timeline-cat">${esc(e.category)} · ${esc(e.label||'')}</div><div class="timeline-title">${esc(e.title||'제목 없음')}</div><div class="timeline-content">${esc(e.content.slice(0,360))}${e.content.length>360?'…':''}</div></div>`).join('')}</div>`).join(''):`<div class="empty">아직 기록이 없습니다.</div>`}</div>`;
    }
    return `<div class="mindmap-shell"><div id="mindmap"><svg id="mindmapSvg" viewBox="0 0 900 570" preserveAspectRatio="xMidYMid meet"></svg></div></div>`;
  }
  window.I2IRender={main};
})();
