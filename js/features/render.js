
(function(){
  const {esc,formatDate,formatDateTime,allEntries}=I2IUtils;
  function main(state,view,selectedNodeId,connectionMode,firstNodeId){
    const entries=allEntries(state).sort((a,b)=>new Date(b.date)-new Date(a.date));
    const selectedNode=state.nodes.find(n=>n.id===selectedNodeId);
    const nodeDiaries=selectedNode?entries.filter(e=>e.category===selectedNode.name).sort((a,b)=>new Date(a.date)-new Date(b.date)):[];
    if(view==='category'){
      const items=nodeDiaries.length?nodeDiaries:[];
      const title=selectedNode?selectedNode.name:'선택된 노드 없음';
      return `<div class="category-detail"><div class="detail-header"><div><h2>${esc(title)} 다이어리</h2><div class="detail-sub">저장된 기록 ${items.length}개</div></div><button class="secondary" id="backToMindmap">← 마인드맵</button></div><div class="row" style="margin-bottom:12px"><button class="primary" id="newDiaryBtn" style="flex:1">+ 새 노트</button></div>${items.length?items.map((e,i)=>`<article class="detail-entry"><div class="detail-entry-head"><div><div class="detail-entry-no">기록 ${i+1} · ${esc(e.category)}</div><h3 class="detail-entry-title">${esc(e.title||'제목 없음')}</h3><span class="detail-entry-label">${esc(e.label||'세부 라벨 없음')}</span></div><div class="detail-entry-date">${formatDateTime(e.date)}</div></div><div class="detail-entry-content">${esc(e.content)}</div></article>`).join(''):`<div class="empty">아직 기록이 없습니다.<br><button class="primary" id="newDiaryBtnEmpty">+ 새 노트</button></div>`}</div>`;
    }
    if(view==='cards') return `<div class="header" style="margin-top:-2px"><h1 style="font-size:18px">모든 다이어리 (${entries.length})</h1></div><div class="cards">${entries.length?entries.map(e=>`<article class="card" data-diary-id="${esc(e.id)}" style="cursor:pointer"><div class="card-cat">${esc(e.category)}</div><div class="card-title">${esc(e.title||'제목 없음')}</div><div class="card-label">${esc(e.label||'세부 라벨 없음')}</div><div class="card-content">${esc(e.content.slice(0,200))}${e.content.length>200?'…':''}</div><div class="card-date">${formatDateTime(e.date)}</div></article>`).join(''):`<div class="empty">아직 기록이 없습니다.<br>마인드맵에서 노드를 선택한 후 기록해보세요.</div>`}</div>`;
    if(view==='timeline'){
      const groups={}; entries.forEach(e=>{const d=formatDate(e.date);(groups[d]??=[]).push(e)});
      return `<div class="timeline">${entries.length?Object.entries(groups).map(([d,items])=>`<div class="timeline-group"><div class="timeline-date">${d}</div>${items.map(e=>`<div class="timeline-item" data-diary-id="${esc(e.id)}" style="cursor:pointer"><div class="timeline-cat">${esc(e.category)} · ${esc(e.label||'')}</div><div class="timeline-title">${esc(e.title||'제목 없음')}</div><div class="timeline-content">${esc(e.content.slice(0,150))}${e.content.length>150?'…':''}</div></div>`).join('')}</div>`).join(''):`<div class="empty">아직 기록이 없습니다.</div>`}</div>`;
    }
    return `<div class="mindmap-shell"><div id="mindmap"><svg id="mindmapSvg" viewBox="0 0 900 570" preserveAspectRatio="xMidYMid meet"></svg></div></div>`;
  }
  function getMindmapPanel(state,selectedNodeId,connectionMode,depthFilter){
    const selectedNode=state.nodes.find(n=>n.id===selectedNodeId);
    let html='';
    if(connectionMode){
      html=`<div class="section-label" style="background:#fff3e0;border:1px solid #ffe0b2;border-radius:6px;padding:8px;margin-bottom:10px">🔗 연결 모드</div><div class="hint" style="margin-bottom:10px">연결 대상 노드를 클릭하세요</div><button class="secondary" id="cancelConnectBtn" style="width:100%">취소</button>`;
    }else if(selectedNode){
      html=`<div class="section-label">선택된 노드</div><div style="background:#e3f2fd;border:1px solid #90caf9;border-radius:8px;padding:10px;margin-bottom:10px"><strong>${esc(selectedNode.name)}</strong><div class="hint" style="margin-top:6px;font-size:11px">중앙 맵에서 자식 노드와 다이어리를 확인하세요</div></div><input id="nodeNameEdit" placeholder="노드 이름" value="${esc(selectedNode.name)}" style="margin-bottom:8px"/><div class="row" style="margin-bottom:8px"><input id="nodeColorEdit" type="color" value="${selectedNode.color||'#42a5f5'}" style="flex:1;height:40px;padding:2px"/><button class="secondary" id="updateNodeBtn">수정</button></div><div class="row" style="margin-bottom:8px"><button class="danger" id="deleteNodeBtn" style="flex:1">삭제</button><button class="secondary" id="cancelNodeBtn" style="flex:1">취소</button></div><button class="secondary" id="connectNodeBtn" style="width:100%">🔗 연결</button>`;
    }else{
      html=`<div class="section-label">노드 추가</div><div class="row"><input id="nodeNameInput" placeholder="노드 이름..." style="flex:1"/><button class="primary" id="addNodeBtn">+</button></div>`;
    }
    // 동적 Layer 생성 (실제 Graph 깊이 기준)
    let maxLayer = 0;
    if (state.nodes.length > 0) {
      // 최대 깊이 계산
      const calcLayer = (nodeId, visited = new Set()) => {
        if (visited.has(nodeId)) return 0;
        visited.add(nodeId);

        const children = state.relationships
          .filter(r => r.type === 'parent' && r.sourceNodeId === nodeId)
          .map(r => r.targetNodeId);

        if (children.length === 0) return 1;
        return 1 + Math.max(...children.map(c => calcLayer(c, visited)));
      };

      state.nodes.forEach(n => {
        const hasParent = state.relationships.some(r => r.type === 'parent' && r.targetNodeId === n.id);
        if (!hasParent) {
          const depth = calcLayer(n.id);
          maxLayer = Math.max(maxLayer, depth);
        }
      });
    }

    let layerOptions = '';
    for (let i = 1; i <= Math.max(maxLayer, 1); i++) {
      layerOptions += `<option value="${i}">Layer ${i}</option>`;
    }

    html+=`<div class="section-label" style="margin-top:14px">표시 레이어</div><select id="depthFilter" style="width:100%;margin-bottom:10px">${layerOptions}</select>`;
    html+=`<button class="primary" id="autoLayoutBtn" style="width:100%;margin-bottom:10px">✨ 자동정렬</button>`;
    return html;
  }
  window.I2IRender={main,getMindmapPanel};
})();
