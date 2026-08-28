
(function(){
  function calculateOverlap(p1, p2, r) {
    const dist = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
    const overlap = Math.max(0, 2 * r - dist) / (2 * r);
    return overlap;
  }

  function isRootNode(nodeId, nodes, rels) {
    // Parent/Child 관계만 확인 (type='parent')
    const hasParent = rels.some(r => r.type === 'parent' && r.targetNodeId === nodeId);
    return !hasParent;
  }

  function isLeafNode(nodeId, nodes, rels) {
    // 직접 자식이 없는 노드 (Leaf Node)
    const hasChild = rels.some(r => r.type === 'parent' && r.sourceNodeId === nodeId);
    return !hasChild;
  }

  function getChildNodeIds(nodeId, rels) {
    // 해당 노드의 직접 자식 ID 목록
    return rels
      .filter(r => r.type === 'parent' && r.sourceNodeId === nodeId)
      .map(r => r.targetNodeId);
  }

  function arrangeChildNodesAroundParent(parentNode, childIds, childNodes) {
    // 부모 노드 주위에 자식들을 원형으로 배치
    // 자식이 많을수록 반지름을 증가시켜 겹침 방지
    const childCount = childIds.length;
    const baseRadius = 100;
    const radiusPerChild = 10;
    const radius = baseRadius + (childCount - 1) * radiusPerChild;
    const nodeRadius = 32;
    const bounds = { minX: 32 + nodeRadius, maxX: 868 + 32, minY: 32 + nodeRadius, maxY: 538 + 32 };

    const angleStep = (2 * Math.PI) / Math.max(childCount, 1);

    childIds.forEach((childId, index) => {
      const child = childNodes.find(n => n.id === childId);
      if (child) {
        const angle = angleStep * index;
        let x = parentNode.position.x + Math.cos(angle) * radius;
        let y = parentNode.position.y + Math.sin(angle) * radius;

        // 경계 내에서 배치 (노드 반지름 고려)
        x = Math.max(bounds.minX, Math.min(bounds.maxX, x));
        y = Math.max(bounds.minY, Math.min(bounds.maxY, y));

        child.position.x = x;
        child.position.y = y;
      }
    });
  }

  function getNodeLayer(nodeId, nodes, rels) {
    // 해당 노드가 Root부터 몇 번째 Layer인지 계산 (깊이 기반)
    if (isRootNode(nodeId, nodes, rels)) return 1;

    let depth = 1;
    let current = nodeId;
    const visited = new Set();

    while (!isRootNode(current, nodes, rels)) {
      if (visited.has(current)) break; // 순환 방지
      visited.add(current);

      const parentRel = rels.find(r => r.type === 'parent' && r.targetNodeId === current);
      if (!parentRel) break; // Parent 없음

      current = parentRel.sourceNodeId;
      depth++;
    }
    return depth;
  }

  function getLayerNodes(nodes, rels, layer) {
    // layer 번째까지의 모든 노드 반환 (Root부터 layer까지)
    if (layer <= 0) return [];

    const result = new Set();
    nodes.forEach(n => {
      const nodeLayer = getNodeLayer(n.id, nodes, rels);
      if (nodeLayer <= layer) {
        result.add(n.id);
      }
    });

    return nodes.filter(n => result.has(n.id));
  }

  function calculateMaxLayer(nodes, rels) {
    // 그래프의 최대 깊이 계산
    if (nodes.length === 0) return 0;

    let maxLayer = 1;
    nodes.forEach(n => {
      const layer = getNodeLayer(n.id, nodes, rels);
      maxLayer = Math.max(maxLayer, layer);
    });
    return maxLayer;
  }

  function getDepthNodes(nodes, rels, depthLayer) {
    // depthLayer: 표시할 최대 깊이 (Layer 몇까지 보여줄 것인가)
    if (depthLayer <= 0) return nodes;
    return getLayerNodes(nodes, rels, depthLayer);
  }
  function draw(entries,state,selectedNodeId,onNodeSelect,onNodeMove,onDropRelationship,connectionMode,firstNodeId,depthFilter,onNodeDoubleClick,focusedNodeId){
    const svg=document.getElementById('mindmapSvg'); if(!svg)return;
    let categoryNodes=state.nodes;
    const categoryRels=state.relationships;

    // Focus View: focusedNodeId가 있으면 해당 노드 + 1촌 Child만 표시
    if(focusedNodeId){
      const focusedNode = state.nodes.find(n => n.id === focusedNodeId);
      if(focusedNode){
        const childIds = state.relationships
          .filter(r => r.type === 'parent' && r.sourceNodeId === focusedNodeId)
          .map(r => r.targetNodeId);

        const visibleNodeIds = new Set([focusedNodeId, ...childIds]);
        categoryNodes = state.nodes.filter(n => visibleNodeIds.has(n.id));
      }
    }
    // Layer 필터 적용 (focusedNodeId가 없을 때만, depthFilter > 0이면 해당 Layer까지의 노드만 표시)
    else if(depthFilter>0){
      categoryNodes=getDepthNodes(categoryNodes,categoryRels,depthFilter);
    }

    const viewBox='0 0 900 570';
    svg.setAttribute('viewBox',viewBox);

    // 배경 클릭 선택 해제
    svg.removeEventListener('click',svg._bgClickHandler);
    svg._bgClickHandler=e=>{
      if(e.target===svg||e.target.tagName==='svg')if(onNodeSelect)onNodeSelect('');
    };
    svg.addEventListener('click',svg._bgClickHandler);

    // 드래그 셀렉트 박스
    let isDraggingSelection=false;
    let selectionStart={x:0,y:0};
    const selectionRect=document.createElementNS('http://www.w3.org/2000/svg','rect');
    selectionRect.setAttribute('fill','rgba(59,130,246,0.1)');
    selectionRect.setAttribute('stroke','#3b82f5');
    selectionRect.setAttribute('stroke-width','2');
    selectionRect.setAttribute('stroke-dasharray','5,5');
    selectionRect.setAttribute('pointer-events','none');
    selectionRect.setAttribute('display','none');
    svg.appendChild(selectionRect);

    svg.addEventListener('mousedown',e=>{
      if(e.target!==svg&&e.target.tagName!=='svg')return;
      isDraggingSelection=true;
      const viewBox=svg.getAttribute('viewBox').split(' ').map(Number);
      const rect=svg.getBoundingClientRect();
      selectionStart.x=(e.clientX-rect.x)/(rect.width)*viewBox[2];
      selectionStart.y=(e.clientY-rect.y)/(rect.height)*viewBox[3];
      selectionRect.setAttribute('display','block');
    });

    document.addEventListener('mousemove',e=>{
      if(!isDraggingSelection)return;
      const viewBox=svg.getAttribute('viewBox').split(' ').map(Number);
      const rect=svg.getBoundingClientRect();
      const currentX=(e.clientX-rect.x)/(rect.width)*viewBox[2];
      const currentY=(e.clientY-rect.y)/(rect.height)*viewBox[3];

      const x=Math.min(selectionStart.x,currentX);
      const y=Math.min(selectionStart.y,currentY);
      const width=Math.abs(currentX-selectionStart.x);
      const height=Math.abs(currentY-selectionStart.y);

      selectionRect.setAttribute('x',x);
      selectionRect.setAttribute('y',y);
      selectionRect.setAttribute('width',width);
      selectionRect.setAttribute('height',height);
    });

    document.addEventListener('mouseup',e=>{
      if(!isDraggingSelection)return;
      isDraggingSelection=false;
      selectionRect.setAttribute('display','none');
    });

    let s='<defs><filter id="mmShadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity=".25"/></filter><filter id="mmHover" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="8" stdDeviation="8" flood-opacity=".35"/></filter><filter id="mmGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';

    const edgeGroup=`<g class="mm-edges">`;
    let edgesSvg='';
    categoryRels.forEach(rel=>{
      const src=categoryNodes.find(n=>n.id===rel.sourceNodeId);
      const tgt=categoryNodes.find(n=>n.id===rel.targetNodeId);
      if(src&&tgt){
        // 선택된 노드가 부모인 경우 자식과의 연결선 강조
        const isSelectedParentChild = selectedNodeId && rel.type==='parent' && rel.sourceNodeId===selectedNodeId;
        const style={
          stroke: isSelectedParentChild ? '#ff6f00' : '#3b82f5',
          strokeDasharray: 'none',
          opacity: isSelectedParentChild ? 1 : 0.6,
          strokeWidth: isSelectedParentChild ? 3 : 2
        };
        edgesSvg+=`<line x1="${src.position.x}" y1="${src.position.y}" x2="${tgt.position.x}" y2="${tgt.position.y}" stroke="${style.stroke}" stroke-width="${style.strokeWidth}" stroke-dasharray="${style.strokeDasharray}" opacity="${style.opacity}" data-rel-id="${rel.id}"/>`;
      }
    });
    s+=edgeGroup+edgesSvg+'</g>';

    s+='<g class="mm-nodes">';
    categoryNodes.forEach(node=>{
      const isSelected=node.id===selectedNodeId;
      const isConnecting=connectionMode&&node.id===firstNodeId;
      s+=`<g class="mm-node" data-node-id="${node.id}" style="cursor:grab"><circle cx="${node.position.x}" cy="${node.position.y}" r="32" fill="${isConnecting?'#ff6f00':node.color||'#3b82f5'}" opacity="${isSelected?1:.8}" filter="${isSelected?'url(#mmGlow)':'url(#mmShadow)'}"/>`;
      if(isSelected)s+=`<circle cx="${node.position.x}" cy="${node.position.y}" r="32" fill="none" stroke="#fff" stroke-width="2"/>`;
      s+=`<text x="${node.position.x}" y="${node.position.y}" text-anchor="middle" dy=".3em" fill="#fff" font-size="12" font-weight="700" pointer-events="none">${I2IUtils.esc(node.name.slice(0,12))}</text></g>`;
    });
    s+='</g>';

    // 선택된 노드가 부모 노드인 경우, 자식 노드를 표시하는 추가 UI
    if(selectedNodeId){
      const selectedNode = categoryNodes.find(n => n.id === selectedNodeId);
      if(selectedNode){
        const childIds = categoryRels
          .filter(r => r.type === 'parent' && r.sourceNodeId === selectedNodeId)
          .map(r => r.targetNodeId);

        // 자식 노드들을 방사형으로 배치한 경우 이미 categoryNodes에 포함되어 있으므로
        // Diary 버튼만 추가로 표시
        if(childIds.length > 0){
          const diaryBtnY = selectedNode.position.y + 70;
          s+=`<g class="mm-diary-btn" style="cursor:pointer" data-diary-node-id="${selectedNodeId}">`;
          s+=`<rect x="${selectedNode.position.x - 50}" y="${diaryBtnY - 16}" width="100" height="32" rx="6" fill="#fff" stroke="#90caf9" stroke-width="2"/>`;
          s+=`<text x="${selectedNode.position.x}" y="${diaryBtnY + 4}" text-anchor="middle" font-size="11" fill="#1976d2" pointer-events="none" font-weight="600">📓 ${I2IUtils.esc(selectedNode.name.slice(0,8))}</text>`;
          s+=`</g>`;
        }
      }
    }

    svg.innerHTML=s;

    // Diary 버튼 클릭 이벤트
    svg.querySelectorAll('[data-diary-node-id]').forEach(diaryBtnEl=>{
      diaryBtnEl.addEventListener('click',e=>{
        e.stopPropagation();
        const nodeId=diaryBtnEl.getAttribute('data-diary-node-id');
        if(window.I2IApp.openDiaryForNode){
          window.I2IApp.openDiaryForNode(nodeId);
        }
      });
    });

    svg.querySelectorAll('[data-node-id]').forEach(nodeEl=>{
      const nodeId=nodeEl.getAttribute('data-node-id');
      const node=categoryNodes.find(n=>n.id===nodeId);
      if(!node)return;

      let isDragging=false;
      nodeEl.addEventListener('click',e=>{
        if(isDragging)return;
        e.stopPropagation();
        if(connectionMode){
          if(onDropRelationship)onDropRelationship(nodeId);
        }else{
          // 말단 Node 클릭 → Diary 페이지로 이동
          const isLeaf = isLeafNode(nodeId, categoryNodes, categoryRels);
          if(isLeaf && window.I2IApp.openDiaryForNode){
            window.I2IApp.openDiaryForNode(nodeId);
          }else{
            if(onNodeSelect)onNodeSelect(nodeId);
          }
        }
      });

      nodeEl.addEventListener('dblclick',e=>{
        if(isDragging)return;
        e.stopPropagation();
        if(!connectionMode){
          // 더블클릭: 자식 노드 배치 + Layer 자동 조정
          if(onNodeDoubleClick)onNodeDoubleClick(nodeId);
        }
      });

      nodeEl.addEventListener('mouseenter',()=>{
        if(!isDragging&&selectedNodeId!==nodeId){
          nodeEl.querySelector('circle').setAttribute('filter','url(#mmHover)');
        }
      });

      nodeEl.addEventListener('mouseleave',()=>{
        if(!isDragging&&selectedNodeId!==nodeId){
          nodeEl.querySelector('circle').setAttribute('filter','url(#mmShadow)');
        }
      });

      nodeEl.addEventListener('mousedown',e=>{
        isDragging=true;
        nodeEl.style.cursor='grabbing';
        e.preventDefault();
        e.stopPropagation();

        const rect=svg.getBoundingClientRect();
        const startX=e.clientX;const startY=e.clientY;
        const startNodeX=node.position.x;const startNodeY=node.position.y;
        const vbW=900;const vbH=570;
        const nodeRadius=32;
        const bounds={minX:32+nodeRadius,maxX:vbW-nodeRadius,minY:32+nodeRadius,maxY:vbH-nodeRadius};

        let dropTargetId='';
        const onMouseMove=me=>{
          const dx=(me.clientX-startX)/(rect.width)*vbW;
          const dy=(me.clientY-startY)/(rect.height)*vbH;
          node.position.x=Math.max(bounds.minX,Math.min(bounds.maxX,startNodeX+dx));
          node.position.y=Math.max(bounds.minY,Math.min(bounds.maxY,startNodeY+dy));

          // Drop Zone 감지
          dropTargetId='';
          categoryNodes.forEach(n=>{
            if(n.id===nodeId)return;
            const overlap=calculateOverlap(node.position,n.position,32);
            if(overlap>0.3)dropTargetId=n.id;
          });

          nodeEl.querySelector('circle').setAttribute('cx',node.position.x);
          nodeEl.querySelector('circle').setAttribute('cy',node.position.y);
          nodeEl.querySelector('text').setAttribute('x',node.position.x);
          nodeEl.querySelector('text').setAttribute('y',node.position.y);

          // Drop target 시각적 피드백
          svg.querySelectorAll('[data-node-id] circle').forEach(c=>{
            const n=categoryNodes.find(n=>n.id===c.parentElement.getAttribute('data-node-id'));
            if(n&&n.id===dropTargetId){
              c.setAttribute('filter','url(#mmGlow)');
              c.setAttribute('stroke','#ff6f00');
              c.setAttribute('stroke-width','3');
            }else{
              c.removeAttribute('stroke');
              c.removeAttribute('stroke-width');
              if(n&&n.id!==nodeId)c.setAttribute('filter','url(#mmShadow)');
            }
          });

          svg.querySelectorAll('.mm-edges line').forEach(line=>{
            const relId=line.getAttribute('data-rel-id');
            const rel=categoryRels.find(r=>r.id===relId);
            if(rel){
              const s=categoryNodes.find(n=>n.id===rel.sourceNodeId);
              const t=categoryNodes.find(n=>n.id===rel.targetNodeId);
              if(s&&t){
                line.setAttribute('x1',s.position.x);
                line.setAttribute('y1',s.position.y);
                line.setAttribute('x2',t.position.x);
                line.setAttribute('y2',t.position.y);
              }
            }
          });
        };

        const onMouseUp=()=>{
          document.removeEventListener('mousemove',onMouseMove);
          document.removeEventListener('mouseup',onMouseUp);
          isDragging=false;
          nodeEl.style.cursor='grab';

          // Drop 시 자식 편입 확인 (관계 생성 전 확인창)
          if(dropTargetId&&dropTargetId!==nodeId){
            const draggedNode=categoryNodes.find(n=>n.id===nodeId);
            const parentNode=categoryNodes.find(n=>n.id===dropTargetId);
            if(draggedNode&&parentNode){
              // 확인창 표시 (데이터 변경 아직 X)
              if(window.I2IMindmapUI&&window.I2IMindmapUI.confirmRelationship){
                window.I2IMindmapUI.confirmRelationship(draggedNode,parentNode,()=>{
                  // YES 콜백: 실제 관계 생성
                  if(onDropRelationship)onDropRelationship(nodeId,'parent',dropTargetId);
                });
              }else if(onDropRelationship){
                // Fallback
                onDropRelationship(nodeId,'parent',dropTargetId);
              }
            }
          }

          if(onNodeMove)onNodeMove(node);
        };

        document.addEventListener('mousemove',onMouseMove);
        document.addEventListener('mouseup',onMouseUp);
      });
    });
  }
  let globalSimulation = null;

  // 전체 노드 자동정렬 (계층 기반 Radial Layout)
  function autoLayoutAllNodes(allNodes, allRels) {
    if (allNodes.length === 0) return { isRunning: () => false, stop: () => {} };

    if (!window.I2ILayout || !window.I2ILayout.layoutRadial) {
      console.error('Layout module not loaded');
      return { isRunning: () => false, stop: () => {} };
    }

    // 계층 기반 Layout 적용 (모든 노드 대상)
    const positioned = window.I2ILayout.layoutRadial(allNodes, allRels, null);

    // 새로운 위치 적용
    positioned.forEach(n => {
      const original = allNodes.find(node => node.id === n.id);
      if (original) {
        original.position.x = n.position.x;
        original.position.y = n.position.y;
      }
    });

    // 즉시 완료 (Animation 효과를 위해 짧은 지연)
    let isRunning = true;
    setTimeout(() => { isRunning = false; }, 100);

    return {
      isRunning: () => isRunning,
      stop: () => { isRunning = false; }
    };
  }

  // Focus View 진입 시 Physics Animation 시작
  function startFocusAnimation(parentNode, childIds, allNodes, allRels) {
    // 기존 simulation 종료
    if (globalSimulation) {
      globalSimulation.stop();
      globalSimulation = null;
    }

    // 부모를 중앙으로 이동 (smooth transition은 physics에서 처리)
    // 경계 고려: viewBox 0-900 x 0-570, 노드 반지름 32
    const bounds = { minX: 64, maxX: 836, minY: 64, maxY: 506 };
    const centerX = 450;  // SVG 중심
    const centerY = 285;
    const currentX = parentNode.position.x;
    const currentY = parentNode.position.y;

    // 부모를 이미 중앙으로 배치하기 (Animation 동안 움직일 것)
    const distToCenter = Math.sqrt((centerX - currentX) ** 2 + (centerY - currentY) ** 2);

    // 중앙으로 이동할 초기 velocity 설정
    const moveSpeed = Math.min(12, distToCenter / 3);  // ✅ 더 빠른 이동
    const dx = centerX - currentX;
    const dy = centerY - currentY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    const moveVelocity = {
      x: (dx / dist) * moveSpeed,
      y: (dy / dist) * moveSpeed
    };

    // Animation을 위한 subgraph 생성 (원본 노드 직접 사용)
    const visibleNodeIds = new Set([parentNode.id, ...childIds]);
    const visibleNodes = allNodes.filter(n => visibleNodeIds.has(n.id));  // ✅ 원본 참조

    const visibleRels = allRels.filter(r => visibleNodeIds.has(r.sourceNodeId) && visibleNodeIds.has(r.targetNodeId));

    // Physics simulation 생성 - 안정적인 Floating 파라미터
    globalSimulation = new I2IPhysics.PhysicsSimulation(visibleNodes, visibleRels, {
      repulsionStrength: -100,  // 약간 약함 (진동 방지)
      linkDistance: 120,        // 부모-자식 거리 유지
      damping: 0.7,             // 높음 (에너지 빠른 감소)
      alphaMin: 0.001,          // 적절한 최소값
      alphaDecay: 0.03,         // 빠른 decay
      velocityMax: 1.5          // 낮음 (부드러운 이동)
    });

    // 부모 노드에 초기 이동 velocity 설정
    globalSimulation.velocities.set(parentNode.id, moveVelocity);

    // Simulation 시작
    globalSimulation.start();

    // Simulation 업데이트 콜백 반환
    return {
      isRunning: () => globalSimulation && globalSimulation.isRunning,
      stop: () => {
        if (globalSimulation) {
          globalSimulation.stop();
          globalSimulation = null;
        }
      },
      simulation: globalSimulation  // ← app.js에서 직접 tick() 호출 가능
    };
  }

  window.I2IMindmap={
    draw,
    arrangeChildNodes:arrangeChildNodesAroundParent,
    getNodeLayer:getNodeLayer,
    startFocusAnimation:startFocusAnimation,
    autoLayoutAllNodes:autoLayoutAllNodes
  };
})();
