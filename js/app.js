
(function(){
  const {esc,showToast,allEntries,uid,downloadText,formatDate}=I2IUtils;
  let state=I2IState.load(),view='mindmap',selectedNodeId='',focusedNodeId='',promptOutput='',connectionMode=false,firstNodeId='',depthFilter=0;
  let savedState=null,isPreviewingExample=false,focusAnimation=null;
  window.I2IApp={
    getSelectedNodeId:() => selectedNodeId,
    getFocusedNodeId:() => focusedNodeId,
    openDiaryForNode:(nodeId)=>{
      const node = state.nodes.find(n => n.id === nodeId);
      if(node){
        selectedNodeId = nodeId;
        view = 'category';
        render();
      }
    },
    openDiaryDetail:(diaryId)=>{
      const allDiaries = allEntries(state);
      const diary = allDiaries.find(d => d.id === diaryId);
      if(diary){
        const node = state.nodes.find(n => n.name === diary.category);
        if(node){
          selectedNodeId = node.id;
          view = 'category';
          render();
        }
      }
    }
  };
  const app=document.getElementById('app');
  const exampleModal=document.getElementById('exampleModal'); const insightModal=document.getElementById('insightModal'); const searchModal=document.getElementById('searchModal');
  function save(){I2IState.save(state)}
  function render(){
    const entries=allEntries(state).sort((a,b)=>new Date(b.date)-new Date(a.date));
    const sidebarContent=`${I2IRender.getMindmapPanel(state,selectedNodeId,connectionMode,depthFilter)||''}<div class="hint" style="margin-top:12px">노드를 클릭해 선택하고 드래그해 이동하세요</div>`;
    const previewBar=isPreviewingExample?'<div id="examplePreviewBar" style="background:#fff3e0;border-bottom:2px solid #ffb74d;padding:12px;text-align:center"><strong>✨ Example 미리보기 중</strong> — 현재 보이는 것은 한서윤 데이터입니다. <button class="primary" style="margin:0 8px" id="confirmExample">이대로 저장</button> <button class="secondary" id="cancelPreview">원래대로 돌아가기</button></div>':'';
    app.innerHTML=previewBar+`<div class="container"><aside class="sidebar"><div class="view-nav">${['mindmap','cards','timeline','category'].map(v=>`<button class="view-btn ${view===v?'active':''}" data-view="${v}">${v==='mindmap'?'맵':v==='cards'?'카드':v==='timeline'?'타임':'상세'}</button>`).join('')}<button class="view-btn" id="searchBtn" title="검색">🔍</button></div><hr>${sidebarContent}<hr><div class="row"><button class="primary" id="openInsight" style="flex:1">✦ Insight</button><button class="secondary" id="loadExample" style="flex:1">Example</button></div></aside><main class="main"><div class="header"><h1>InsideToInsight</h1><small>마인드맵 · 노드 기반 지식관리</small></div>${I2IRender.main(state,view,selectedNodeId,connectionMode,firstNodeId)}</main></div>`;

    // 미리보기 바 이벤트
    const confirmBtn=document.getElementById('confirmExample'); if(confirmBtn)confirmBtn.addEventListener('click',confirmLoadExample);
    const cancelPreviewBtn=document.getElementById('cancelPreview'); if(cancelPreviewBtn)cancelPreviewBtn.addEventListener('click',()=>closeExample());

    app.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.view;render()}));
    const searchBtn=document.getElementById('searchBtn'); if(searchBtn)searchBtn.addEventListener('click',()=>searchModal.classList.add('open'));
    const openInsightBtn=document.getElementById('openInsight'); if(openInsightBtn)openInsightBtn.addEventListener('click',openInsight);
    const loadDefaultBtn=document.getElementById('loadDefault'); if(loadDefaultBtn)loadDefaultBtn.addEventListener('click',()=>{state=I2IState.clone(window.DEFAULT_DATA);selectedNodeId='';view='mindmap';depthFilter=0;save();render();showToast('기본 데이터가 로드되었습니다.');});
    const loadExampleBtn=document.getElementById('loadExample'); if(loadExampleBtn)loadExampleBtn.addEventListener('click',openExample);
    const back=document.getElementById('backToMindmap'); if(back)back.addEventListener('click',()=>{view='mindmap';focusedNodeId='';if(focusAnimation)focusAnimation.stop();focusAnimation=null;render()});
    if(view==='mindmap'){
      const addNodeBtn=document.getElementById('addNodeBtn');
      if(addNodeBtn)addNodeBtn.addEventListener('click',addNode);
      const nodeInput=document.getElementById('nodeNameInput');
      if(nodeInput)nodeInput.addEventListener('keydown',e=>{if(e.key==='Enter')addNode()});
      I2IMindmap.draw(entries,state,selectedNodeId,
        nid=>{
          if(nid===''){selectedNodeId='';focusedNodeId='';if(focusAnimation)focusAnimation.stop();focusAnimation=null;} else if(connectionMode){firstNodeId=nid;showToast('첫 번째 노드 선택됨');} else {
            selectedNodeId=nid;
            // 부모 노드 클릭 시 자식들을 주위에 배치
            const selectedNode = state.nodes.find(n => n.id === nid);
            if(selectedNode){
              const childIds = state.relationships
                .filter(r => r.type === 'parent' && r.sourceNodeId === nid)
                .map(r => r.targetNodeId);
              if(childIds.length > 0){
                // mindmap.js의 arrangeChildNodesAroundParent 사용
                if(window.I2IMindmap.arrangeChildNodes){
                  window.I2IMindmap.arrangeChildNodes(selectedNode, childIds, state.nodes);
                  save();
                }
              }
            }
          }
          render();
        },
        n=>save(),
        (nid,relType,parentId)=>{
          if(relType==='parent'&&parentId){
            createParentChildRelationship(parentId,nid);
          }else{
            createRelationship(nid);
          }
        },
        connectionMode,
        firstNodeId,
        depthFilter,
        (nodeId)=>{
          // 더블클릭: Focus View (선택한 Node + 1촌 Child만 표시)
          const node = state.nodes.find(n => n.id === nodeId);
          if(node){
            // 자식 확인
            const childIds = state.relationships
              .filter(r => r.type === 'parent' && r.sourceNodeId === nodeId)
              .map(r => r.targetNodeId);

            if(childIds.length > 0){
              // 1. 자식 노드 배치
              if(window.I2IMindmap.arrangeChildNodes){
                window.I2IMindmap.arrangeChildNodes(node, childIds, state.nodes);
              }

              // 2. focusedNodeId 설정 (Focus View 활성화)
              focusedNodeId = nodeId;
              save();

              // 3. Physics Animation 시작 및 렌더링 루프
              if(window.I2IMindmap.startFocusAnimation){
                focusAnimation = window.I2IMindmap.startFocusAnimation(node, childIds, state.nodes, state.relationships);

                // Animation 루프: Physics와 Render를 동기화
                let startTime = Date.now();
                const animationLoop = () => {
                  const elapsed = Date.now() - startTime;
                  const isAnimating = focusAnimation && focusAnimation.isRunning && focusAnimation.isRunning();
                  const shouldContinue = isAnimating || elapsed < 300;  // 최소 300ms 애니메이션

                  if(shouldContinue){
                    // Physics tick 실행 (animation 객체 내 simulation 참조)
                    if(focusAnimation.simulation && focusAnimation.simulation.isRunning){
                      focusAnimation.simulation.tick();
                    }
                    render();  // Physics 상태를 반영한 최신 render
                    requestAnimationFrame(animationLoop);
                  } else {
                    // Animation 종료 후 마지막 render
                    if(focusAnimation && focusAnimation.stop){
                      focusAnimation.stop();
                    }
                    render();
                    save();
                  }
                };
                requestAnimationFrame(animationLoop);
              }
            }
          }
          render();
        },
        focusedNodeId
      );
      const updateNodeBtn=document.getElementById('updateNodeBtn');
      if(updateNodeBtn)updateNodeBtn.addEventListener('click',updateNode);
      const deleteNodeBtn=document.getElementById('deleteNodeBtn');
      if(deleteNodeBtn)deleteNodeBtn.addEventListener('click',deleteNode);
      const cancelNodeBtn=document.getElementById('cancelNodeBtn');
      if(cancelNodeBtn)cancelNodeBtn.addEventListener('click',()=>{selectedNodeId='';focusedNodeId='';if(focusAnimation)focusAnimation.stop();focusAnimation=null;render()});
      const connectNodeBtn=document.getElementById('connectNodeBtn');
      if(connectNodeBtn)connectNodeBtn.addEventListener('click',startConnection);
      const cancelConnectBtn=document.getElementById('cancelConnectBtn');
      if(cancelConnectBtn)cancelConnectBtn.addEventListener('click',cancelConnection);
    }else if(view==='category'){
      const newDiaryBtn=document.getElementById('newDiaryBtn');
      const newDiaryBtnEmpty=document.getElementById('newDiaryBtnEmpty');
      if(newDiaryBtn)newDiaryBtn.addEventListener('click',openNewDiary);
      if(newDiaryBtnEmpty)newDiaryBtnEmpty.addEventListener('click',openNewDiary);
    }
    const depthFilterSelect=document.getElementById('depthFilter');
    if(depthFilterSelect){
      depthFilterSelect.value=depthFilter;
      depthFilterSelect.addEventListener('change',e=>{
        depthFilter=parseInt(e.target.value);
        // Layer 변경 시 Layout 재계산
        if(window.I2ILayout && window.I2ILayout.layoutRadial){
          const layerMap = window.I2ILayout.buildLayerMap(state.nodes, state.relationships);
          const maxLayer = window.I2ILayout.getMaxLayer(layerMap);
          const visibleNodeIds = new Set();

          state.nodes.forEach(n => {
            const nodeLayer = layerMap[n.id];
            if(nodeLayer <= depthFilter) visibleNodeIds.add(n.id);
          });

          const positioned = window.I2ILayout.layoutRadial(state.nodes, state.relationships, visibleNodeIds);
          positioned.forEach(n => {
            const original = state.nodes.find(node => node.id === n.id);
            if(original) {
              original.position.x = n.position.x;
              original.position.y = n.position.y;
            }
          });
          save();
        }
        render();
      });
    }

    // 자동정렬 버튼
    const autoLayoutBtn=document.getElementById('autoLayoutBtn');
    if(autoLayoutBtn){
      autoLayoutBtn.addEventListener('click',()=>{
        if(!window.I2IMindmap.autoLayoutAllNodes){
          showToast('자동정렬 기능 로드 중...');
          return;
        }

        showToast('노드 자동정렬 시작...');

        // Auto layout simulation 시작
        const layoutAnimation = window.I2IMindmap.autoLayoutAllNodes(state.nodes, state.relationships);

        // Animation 루프: 최소 500ms는 실행
        let startTime = Date.now();
        const animationLoop = () => {
          const elapsed = Date.now() - startTime;
          const isAnimating = layoutAnimation && layoutAnimation.isRunning();
          const shouldContinue = isAnimating || elapsed < 500;

          if(shouldContinue){
            render();
            requestAnimationFrame(animationLoop);
          } else {
            layoutAnimation.stop();
            save();
            render();
            showToast('자동정렬 완료!');
          }
        };
        requestAnimationFrame(animationLoop);
      });
    }

    // Card 클릭 → Diary 상세 페이지
    if(view==='cards'){
      document.querySelectorAll('[data-diary-id]').forEach(card=>{
        card.addEventListener('click',()=>{
          const diaryId=card.getAttribute('data-diary-id');
          if(window.I2IApp.openDiaryDetail){
            window.I2IApp.openDiaryDetail(diaryId);
          }
        });
      });
    }

    // Timeline 클릭 → Diary 상세 페이지
    if(view==='timeline'){
      document.querySelectorAll('[data-diary-id]').forEach(item=>{
        item.addEventListener('click',()=>{
          const diaryId=item.getAttribute('data-diary-id');
          if(window.I2IApp.openDiaryDetail){
            window.I2IApp.openDiaryDetail(diaryId);
          }
        });
      });
    }
  }

  function addCategory(){const input=document.getElementById('newCategory'),name=input.value.trim();if(!name)return;if(state.categories.includes(name)){showToast('이미 있는 카테고리입니다.');return}state.categories.push(name);state.entries[name]=[];save();selectedCategory=name;render();showToast('카테고리가 추가되었습니다.')}
  function deleteCategory(cat){if(state.categories.length<=1){showToast('카테고리는 최소 1개가 필요합니다.');return}if(!confirm(`'${cat}' 카테고리와 안의 기록을 삭제할까요?`))return;state.categories=state.categories.filter(c=>c!==cat);delete state.entries[cat];save();selectedCategory=state.categories[0];render();showToast('카테고리와 기록이 삭제되었습니다.')}
  function saveDiary(){const cat=document.getElementById('selectedCategory').value,title=document.getElementById('diaryTitle').value.trim(),label=document.getElementById('diaryLabel').value.trim(),content=document.getElementById('diaryContent').value.trim();if(!cat||!title||!content){showToast('카테고리·제목·내용을 입력하세요.');return}state.entries[cat]??=[];state.entries[cat].push({id:uid(),category:cat,title,label,content,date:new Date().toISOString(),createdAt:new Date().toISOString()});save();render();showToast('저장되었습니다.')}
  function addNode(){const input=document.getElementById('nodeNameInput'),name=input?.value.trim();if(!name){showToast('노드 이름을 입력하세요.');return}const nodeRadius=32;const bounds={minX:32+nodeRadius,maxX:868+32,minY:32+nodeRadius,maxY:538+32};const x=Math.random()*(bounds.maxX-bounds.minX)+bounds.minX;const y=Math.random()*(bounds.maxY-bounds.minY)+bounds.minY;state.nodes.push({id:uid(),categoryId:'',name,position:{x,y},linkedDiaries:[],color:'#42a5f5',label:''});save();if(input)input.value='';render();showToast('노드가 추가되었습니다.')}
  function updateNode(){if(!selectedNodeId)return;const nameInput=document.getElementById('nodeNameEdit'),colorInput=document.getElementById('nodeColorEdit');const newName=nameInput?.value.trim(),newColor=colorInput?.value;if(!newName){showToast('노드 이름을 입력하세요.');return}const node=state.nodes.find(n=>n.id===selectedNodeId);if(node){node.name=newName;node.color=newColor;save();render();showToast('노드가 수정되었습니다.')}}
  function deleteNode(){
    if(!selectedNodeId){showToast('삭제할 노드를 선택하세요.');return}
    if(!confirm('정말 삭제할까요? (자식 노드도 함께 삭제됩니다)'))return;

    // 재귀적으로 자식 노드 찾기
    function findAllDescendants(nodeId) {
      const descendants = new Set([nodeId]);
      let toVisit = [nodeId];

      while(toVisit.length > 0) {
        const currentId = toVisit.shift();
        const childIds = state.relationships
          .filter(r => r.type === 'parent' && r.sourceNodeId === currentId)
          .map(r => r.targetNodeId);

        childIds.forEach(childId => {
          if(!descendants.has(childId)) {
            descendants.add(childId);
            toVisit.push(childId);
          }
        });
      }
      return descendants;
    }

    // 삭제할 노드와 모든 자식 노드 ID 수집
    const nodesToDelete = findAllDescendants(selectedNodeId);

    // 노드 삭제
    state.nodes = state.nodes.filter(n => !nodesToDelete.has(n.id));

    // 관계 삭제 (삭제된 노드 관련 모든 관계)
    state.relationships = state.relationships.filter(r =>
      !nodesToDelete.has(r.sourceNodeId) && !nodesToDelete.has(r.targetNodeId)
    );

    // 다이어리도 함께 삭제 (해당 노드 카테고리의 다이어리)
    nodesToDelete.forEach(nodeId => {
      const node = Array.from(nodesToDelete).length > 0 ?
        state.nodes.find(n => n.id === nodeId) : null;
      const nodeToDelete = state.nodes.find(n => n.id === nodeId);
      if (nodeToDelete && state.entries[nodeToDelete.name]) {
        state.entries[nodeToDelete.name] = [];
      }
    });

    save();
    selectedNodeId='';
    render();
    showToast(`${nodesToDelete.size}개의 노드와 자식 노드가 삭제되었습니다.`);
  }
  function startConnection(){if(!selectedNodeId){showToast('연결을 시작할 노드를 선택하세요.');return}connectionMode=true;firstNodeId=selectedNodeId;render();showToast('연결 모드 활성화 - 두 번째 노드를 클릭하세요')}
  function cancelConnection(){connectionMode=false;firstNodeId='';render();showToast('연결이 취소되었습니다.')}
  function createParentChildRelationship(parentId,childId){
    if(!parentId||!childId||parentId===childId)return;
    const exists=state.relationships.find(r=>(r.sourceNodeId===parentId&&r.targetNodeId===childId)||(r.sourceNodeId===childId&&r.targetNodeId===parentId));
    if(exists){showToast('이미 연결된 노드입니다.');return}
    state.relationships.push({id:uid(),sourceNodeId:parentId,targetNodeId:childId,type:'parent',label:''});

    // 자식 노드 위치를 부모 근처로 조정
    const parent=state.nodes.find(n=>n.id===parentId);
    const child=state.nodes.find(n=>n.id===childId);
    if(parent&&child){
      const angle=Math.random()*Math.PI*2;
      const dist=70;
      child.position.x=Math.max(32,Math.min(868,parent.position.x+Math.cos(angle)*dist));
      child.position.y=Math.max(32,Math.min(538,parent.position.y+Math.sin(angle)*dist));
    }

    save();
    render();
    showToast('자식 노드로 편입되었습니다.');
  }
  function createRelationship(targetId){if(!firstNodeId)return;if(firstNodeId===targetId){showToast('같은 노드끼리 연결할 수 없습니다.');return}const exists=state.relationships.find(r=>(r.sourceNodeId===firstNodeId&&r.targetNodeId===targetId)||(r.sourceNodeId===targetId&&r.targetNodeId===firstNodeId));if(exists){showToast('이미 연결된 노드입니다.');connectionMode=false;firstNodeId='';render();return}const types=I2IGraph.RELATIONSHIP_TYPES||{};const typeOpts=Object.entries(types).map(([k,v])=>`<button class="rel-type-btn" data-rel-type="${k}">${v}</button>`).join('');const modal=document.createElement('div');modal.className='relation-modal';modal.innerHTML=`<div class="relation-modal-content"><div class="modal-head"><h3>관계 유형 선택</h3></div><div class="relation-grid">${typeOpts}</div><button class="secondary" style="width:100%;margin-top:12px" id="cancelRelType">취소</button></div>`;document.body.appendChild(modal);modal.querySelectorAll('[data-rel-type]').forEach(btn=>btn.addEventListener('click',()=>{const relType=btn.dataset.relType;state.relationships.push({id:uid(),sourceNodeId:firstNodeId,targetNodeId:targetId,type:relType,label:''});save();connectionMode=false;firstNodeId='';selectedNodeId='';modal.remove();render();showToast(`${types[relType]} 관계로 연결되었습니다.`)}));document.getElementById('cancelRelType').addEventListener('click',()=>{modal.remove()})}
  function openExample(){exampleModal.classList.add('open')}
  function closeExample(){exampleModal.classList.remove('open');if(isPreviewingExample){state=savedState;isPreviewingExample=false;selectedNodeId='';view='mindmap';depthFilter=0;render()}}
  function previewExample(){
    // 새 창에서 Example 환경 완전 독립적으로 열기
    // example.html은 EXAMPLE_DATA_V2를 로드 (기본 페이지 데이터 절대 가져가지 않음)
    const exampleUrl = 'example.html';
    window.open(exampleUrl, 'example_window', 'width=1200,height=800');
    closeExample();
  }
  function confirmLoadExample(){
    if(isPreviewingExample){
      isPreviewingExample=false;
      savedState=null;
      save();
      showToast('한서윤 데이터가 저장되었습니다.');
    }
  }
  function loadExample(){
    previewExample();
  }
  function openInsight(prefill=''){
    insightModal.classList.add('open');
    const q=document.getElementById('questionInput');
    q.value=prefill;
    q.focus();

    // 트리 뷰 생성 (노드 계층 구조 기반)
    const categoryCheckboxes=document.getElementById('categoryCheckboxes');
    if(categoryCheckboxes && window.I2IInsight?.buildCategoryTree){
      categoryCheckboxes.innerHTML='';
      const tree=window.I2IInsight.buildCategoryTree(state);
      const selectedCats=window.I2IInsight?.getSelectedCategories?.() || new Set();

      function renderTreeNode(node, container, level=0){
        const hasChildren=node.children.length>0;

        // 트리 아이템
        const treeItem=document.createElement('div');
        treeItem.className='tree-item';

        // 노드 행
        const treeNode=document.createElement('div');
        treeNode.className='tree-node';
        treeNode.style.paddingLeft=`${level*20}px`;

        // 토글 버튼 (폴더만)
        const toggle=document.createElement('span');
        toggle.className='tree-toggle';
        if(hasChildren){
          toggle.textContent='▼';
          toggle.style.cursor='pointer';
        }else{
          toggle.className+=' hidden';
          toggle.textContent='▶';
        }

        // 체크박스
        const checkbox=document.createElement('input');
        checkbox.type='checkbox';
        checkbox.className='tree-checkbox';
        checkbox.dataset.category=node.name;
        checkbox.checked=selectedCats.size===0 || selectedCats.has(node.name);
        checkbox.disabled=!node.hasEntries;

        // 아이콘
        const icon=document.createElement('span');
        icon.className='tree-icon';
        icon.textContent=hasChildren?'📁':'📄';

        // 라벨
        const label=document.createElement('span');
        label.className='tree-label';
        if(!node.hasEntries)label.className+=' disabled';
        label.textContent=node.name;
        label.title=node.name;

        treeNode.appendChild(toggle);
        treeNode.appendChild(checkbox);
        treeNode.appendChild(icon);
        treeNode.appendChild(label);
        treeItem.appendChild(treeNode);

        // 자식 컨테이너
        let childrenContainer=null;
        if(hasChildren){
          childrenContainer=document.createElement('div');
          childrenContainer.className='tree-children visible';

          // 토글 클릭
          toggle.addEventListener('click',(e)=>{
            e.stopPropagation();
            childrenContainer.classList.toggle('visible');
            toggle.textContent=childrenContainer.classList.contains('visible')?'▼':'▶';
            icon.textContent=childrenContainer.classList.contains('visible')?'📁':'📂';
          });

          // 자식 렌더링
          node.children.forEach(child=>renderTreeNode(child,childrenContainer,level+1));
          treeItem.appendChild(childrenContainer);
        }

        // 체크박스 변경
        checkbox.addEventListener('change',()=>{
          const selected=Array.from(categoryCheckboxes.querySelectorAll('input[type="checkbox"]:checked')).map(el=>el.dataset.category);
          window.I2IInsight.setSelectedCategories(selected);
        });

        container.appendChild(treeItem);
      }

      // 전체 트리 렌더링
      tree.forEach(rootNode=>renderTreeNode(rootNode,categoryCheckboxes));
    }
  }
  function closeInsight(){insightModal.classList.remove('open')}
  function openNewDiary(){
    const selectedNode=state.nodes.find(n=>n.id===selectedNodeId);
    if(!selectedNode)return;
    // Diary 작성 모달 열기 (현재는 없으므로 간단한 UI로)
    const diaryTitle=prompt(`[${selectedNode.name}] 제목을 입력하세요:`,selectedNode.name);
    if(!diaryTitle)return;
    const diaryLabel=prompt(`[${selectedNode.name}] 세부 라벨을 입력하세요:`,'');
    if(diaryLabel===null)return;
    const diaryContent=prompt(`[${selectedNode.name}] 내용을 입력하세요:`,'');
    if(diaryContent===null)return;

    state.entries[selectedNode.name]??=[];
    state.entries[selectedNode.name].push({
      id:uid(),category:selectedNode.name,title:diaryTitle,label:diaryLabel,content:diaryContent,
      date:new Date().toISOString(),createdAt:new Date().toISOString()
    });
    save();
    render();
    showToast('노트가 저장되었습니다.');
  }
  const closeExBtn=document.getElementById('closeExample'); if(closeExBtn)closeExBtn.addEventListener('click',closeExample);const cancelExBtn=document.getElementById('cancelExample'); if(cancelExBtn)cancelExBtn.addEventListener('click',closeExample);exampleModal.addEventListener('click',e=>{if(e.target===exampleModal)closeExample()});
  document.querySelectorAll('.example-query').forEach(btn=>btn.addEventListener('click',()=>{loadExample();openInsight(btn.dataset.q||btn.textContent.trim())}));
  const runExBtn=document.getElementById('runExample'); if(runExBtn)runExBtn.addEventListener('click',loadExample);
  const closeModalBtn=document.getElementById('closeModal'); if(closeModalBtn)closeModalBtn.addEventListener('click',closeInsight);insightModal.addEventListener('click',e=>{if(e.target===insightModal)closeInsight()});
  const selectAllCatsBtn=document.getElementById('selectAllCats'); if(selectAllCatsBtn)selectAllCatsBtn.addEventListener('click',()=>{document.querySelectorAll('#categoryCheckboxes input[type="checkbox"]:not(:disabled)').forEach(cb=>cb.checked=true);const selected=Array.from(document.querySelectorAll('#categoryCheckboxes input[type="checkbox"]:checked')).map(el=>el.dataset.category);window.I2IInsight.setSelectedCategories(selected)});
  const deselectAllCatsBtn=document.getElementById('deselectAllCats'); if(deselectAllCatsBtn)deselectAllCatsBtn.addEventListener('click',()=>{document.querySelectorAll('#categoryCheckboxes input[type="checkbox"]').forEach(cb=>cb.checked=false);window.I2IInsight.setSelectedCategories([])});
  const closeSearchBtn=document.getElementById('closeSearch'); if(closeSearchBtn)closeSearchBtn.addEventListener('click',()=>searchModal.classList.remove('open'));
  searchModal.addEventListener('click',e=>{if(e.target===searchModal)searchModal.classList.remove('open')});
  const searchInput=document.getElementById('searchInput');
  const searchType=document.getElementById('searchType');
  if(searchInput){
    searchInput.addEventListener('keyup',e=>{
      const q=e.target.value.toLowerCase();
      const type=searchType?.value||'node';
      if(q.length===0){document.getElementById('searchResults').innerHTML='';return}

      let results=[];
      if(type==='node'){
        results=state.nodes.filter(n=>n.name.toLowerCase().includes(q)).slice(0,10);
        document.getElementById('searchResults').innerHTML=results.length?results.map(n=>`<div style="padding:8px;border:1px solid var(--border);border-radius:6px;margin:6px 0;cursor:pointer" data-search-node-id="${n.id}"><strong>${esc(n.name)}</strong></div>`).join(''):'<div style="color:var(--text-secondary)">검색 결과 없음</div>';
        document.querySelectorAll('[data-search-node-id]').forEach(el=>el.addEventListener('click',()=>{selectedNodeId=el.dataset.searchNodeId;view='mindmap';searchModal.classList.remove('open');render()}));
      }else if(type==='diary'){
        const entries=allEntries(state);
        const diaryResults=entries.filter(e=>e.content.toLowerCase().includes(q)||e.title.toLowerCase().includes(q)).slice(0,10);
        document.getElementById('searchResults').innerHTML=diaryResults.length?diaryResults.map(d=>`<div style="padding:8px;border:1px solid var(--border);border-radius:6px;margin:6px 0;cursor:pointer" data-search-diary-cat="${esc(d.category)}"><strong>${esc(d.title)}</strong><div style="font-size:11px;color:var(--text-secondary)">${esc(d.category)} · ${formatDate(d.date)}</div></div>`).join(''):'<div style="color:var(--text-secondary)">검색 결과 없음</div>';
        document.querySelectorAll('[data-search-diary-cat]').forEach(el=>el.addEventListener('click',()=>{const cat=el.dataset.searchDiaryCat;const node=state.nodes.find(n=>n.name===cat);if(node){selectedNodeId=node.id;view='category';searchModal.classList.remove('open');render()}}));
      }
    });
  }
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeInsight();closeExample();searchModal.classList.remove('open')}});
  const generateBtn=document.getElementById('generateBtn'); if(generateBtn)generateBtn.addEventListener('click',()=>{
    const q=document.getElementById('questionInput').value.trim();
    if(!q){showToast('질의사항을 입력하세요.');return}
    const selectedCats=window.I2IInsight?.getSelectedCategories?.();
    promptOutput=I2IInsight.buildPrompt(q,state,selectedCats);
    document.getElementById('promptOutput').textContent=promptOutput;

    // GPT 링크와 메시지 표시
    const outputContainer=document.getElementById('promptOutput').parentElement;
    let actionSection=document.getElementById('insightActionSection');
    if(!actionSection){
      actionSection=document.createElement('div');
      actionSection.id='insightActionSection';
      outputContainer.insertBefore(actionSection,document.getElementById('promptOutput').nextSibling);
    }
    actionSection.innerHTML=`
      <div style="margin-top:20px;padding:16px;background:linear-gradient(135deg,rgba(59,130,246,0.1),rgba(59,130,246,0.05));border:1px solid rgba(59,130,246,0.2);border-radius:10px;text-align:center">
        <div style="margin-bottom:12px;font-size:15px;color:var(--text-primary);line-height:1.6">
          <strong>이제 프롬프트를 가지고 AI와 함께 깊이 있는 상담을 나눌 시간입니다.</strong><br>
          <span style="color:var(--text-secondary);font-size:14px">아래 링크를 통해 ChatGPT, Claude, 또는 선호하는 AI로 이동하세요.</span>
        </div>
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
          <a href="https://chatgpt.com" target="_blank" class="primary" style="text-decoration:none;padding:10px 16px;display:inline-flex;align-items:center;gap:6px;border-radius:8px">🤖 ChatGPT로 이동</a>
          <a href="https://claude.ai" target="_blank" class="primary" style="text-decoration:none;padding:10px 16px;display:inline-flex;align-items:center;gap:6px;border-radius:8px">🧠 Claude로 이동</a>
        </div>
        <div style="margin-top:10px;font-size:12px;color:var(--text-secondary)">💡 팁: 위 버튼으로 이동 후 프롬프트 전체를 복사해서 붙여넣으세요.</div>
      </div>
    `;
  });
  const copyBtn=document.getElementById('copyBtn'); if(copyBtn)copyBtn.addEventListener('click',async()=>{if(!promptOutput){showToast('먼저 프롬프트를 생성하세요.');return}try{await navigator.clipboard.writeText(promptOutput)}catch{const ta=document.createElement('textarea');ta.value=promptOutput;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove()}showToast('프롬프트가 복사되었습니다.')});
  const downloadBtn=document.getElementById('downloadBtn'); if(downloadBtn)downloadBtn.addEventListener('click',()=>{if(!promptOutput){showToast('먼저 프롬프트를 생성하세요.');return}downloadText('insight-prompt.txt',promptOutput)});
  render();
})();
