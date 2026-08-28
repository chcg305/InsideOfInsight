
(function(){
  const {esc,showToast,allEntries,uid,downloadText}=I2IUtils;
  const defaultCats=I2IState.DEFAULT_CATEGORIES;
  let state=I2IState.load(),view='mindmap',selectedCategory=state.categories[0]||defaultCats[0],promptOutput='';
  const app=document.getElementById('app');
  const exampleModal=document.getElementById('exampleModal'); const insightModal=document.getElementById('insightModal');
  function save(){I2IState.save(state)}
  function render(){
    const entries=allEntries(state).sort((a,b)=>new Date(b.date)-new Date(a.date));
    if(!state.categories.includes(selectedCategory))selectedCategory=state.categories[0]||'';
    app.innerHTML=`<div class="container"><aside class="sidebar"><div class="view-nav">${['mindmap','cards','timeline','category'].map(v=>`<button class="view-btn ${view===v?'active':''}" data-view="${v}">${v==='mindmap'?'마인드맵':v==='cards'?'카드':v==='timeline'?'타임라인':'상세'}</button>`).join('')}</div><hr><div class="section-label">카테고리 추가</div><div class="row"><input id="newCategory" placeholder="새 카테고리..."/><button class="primary" id="addCategory">+</button></div><div class="section-label">카테고리</div><div class="categories">${state.categories.map(cat=>`<div class="category-tag ${selectedCategory===cat?'active':''}"><span class="cat-select" data-cat="${esc(cat)}" style="cursor:pointer">${esc(cat)}</span><button class="x" data-delete-cat="${esc(cat)}">×</button></div>`).join('')}</div><div class="count">기록 ${entries.length}개 · 제목/세부라벨 포함 · localStorage 저장</div><hr><div class="section-label">다이어리 기록</div><select id="selectedCategory">${state.categories.map(c=>`<option ${selectedCategory===c?'selected':''}>${esc(c)}</option>`).join('')}</select><input id="diaryTitle" placeholder="기록 제목..." style="margin-top:8px"/><input id="diaryLabel" placeholder="세부 라벨..." style="margin-top:8px"/><textarea id="diaryContent" placeholder="오늘의 생각..."></textarea><div style="margin-top:8px"><button class="primary" id="saveDiary" style="width:100%">저장</button></div><hr><div class="row"><button class="primary" id="openInsight" style="flex:1">✦ Insight</button><button class="secondary" id="loadExample" style="flex:1">Example</button></div><div class="hint" style="margin-top:8px">Example을 누르면 7개 카테고리 × 10개 장문 다이어리가 자동 입력됩니다.</div><div class="hint" style="margin-top:5px">Insight는 제목·세부 라벨까지 포함해 AI용 프롬프트를 생성합니다.</div></aside><main class="main"><div class="header"><h1>InsideToInsight</h1><small>Local Mac Edition · Structured Diary Demo</small></div>${I2IRender.main(state,view,selectedCategory)}</main></div>`;
    app.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.view;render()}));
    app.querySelectorAll('.cat-select').forEach(b=>b.addEventListener('click',()=>{selectedCategory=b.dataset.cat;view='category';render()}));
    app.querySelectorAll('[data-delete-cat]').forEach(b=>b.addEventListener('click',()=>deleteCategory(b.dataset.deleteCat)));
    document.getElementById('addCategory').addEventListener('click',addCategory);
    document.getElementById('newCategory').addEventListener('keydown',e=>{if(e.key==='Enter')addCategory()});
    document.getElementById('selectedCategory').addEventListener('change',e=>selectedCategory=e.target.value);
    document.getElementById('saveDiary').addEventListener('click',saveDiary);
    document.getElementById('openInsight').addEventListener('click',openInsight);
    document.getElementById('loadExample').addEventListener('click',openExample);
    const back=document.getElementById('backToMindmap'); if(back)back.addEventListener('click',()=>{view='mindmap';render()});
    if(view==='mindmap')I2IMindmap.draw(entries,state,c=>{selectedCategory=c;view='category';render()});
  }
  function addCategory(){const input=document.getElementById('newCategory'),name=input.value.trim();if(!name)return;if(state.categories.includes(name)){showToast('이미 있는 카테고리입니다.');return}state.categories.push(name);state.entries[name]=[];save();selectedCategory=name;render();showToast('카테고리가 추가되었습니다.')}
  function deleteCategory(cat){if(state.categories.length<=1){showToast('카테고리는 최소 1개가 필요합니다.');return}if(!confirm(`'${cat}' 카테고리와 안의 기록을 삭제할까요?`))return;state.categories=state.categories.filter(c=>c!==cat);delete state.entries[cat];save();selectedCategory=state.categories[0];render();showToast('카테고리와 기록이 삭제되었습니다.')}
  function saveDiary(){const cat=document.getElementById('selectedCategory').value,title=document.getElementById('diaryTitle').value.trim(),label=document.getElementById('diaryLabel').value.trim(),content=document.getElementById('diaryContent').value.trim();if(!cat||!title||!content){showToast('카테고리·제목·내용을 입력하세요.');return}state.entries[cat]??=[];state.entries[cat].push({id:uid(),category:cat,title,label,content,date:new Date().toISOString(),createdAt:new Date().toISOString()});save();render();showToast('저장되었습니다.')}
  function openExample(){exampleModal.classList.add('open')}
  function closeExample(){exampleModal.classList.remove('open')}
  function loadExample(){state=I2IState.clone(window.EXAMPLE_DATA);selectedCategory=state.categories[0];view='mindmap';save();render();closeExample();showToast('한서윤 장문 예제 데이터 70개가 불러와졌습니다.')}
  function openInsight(prefill=''){insightModal.classList.add('open');const q=document.getElementById('questionInput');q.value=prefill;q.focus()}
  function closeInsight(){insightModal.classList.remove('open')}
  document.getElementById('closeExample').addEventListener('click',closeExample);document.getElementById('cancelExample').addEventListener('click',closeExample);exampleModal.addEventListener('click',e=>{if(e.target===exampleModal)closeExample()});
  document.querySelectorAll('.example-query').forEach(btn=>btn.addEventListener('click',()=>{loadExample();openInsight(btn.dataset.q||btn.textContent.trim())}));
  document.getElementById('runExample').addEventListener('click',loadExample);
  document.getElementById('closeModal').addEventListener('click',closeInsight);insightModal.addEventListener('click',e=>{if(e.target===insightModal)closeInsight()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeInsight();closeExample()}});
  document.getElementById('generateBtn').addEventListener('click',()=>{const q=document.getElementById('questionInput').value.trim();if(!q){showToast('질의사항을 입력하세요.');return}promptOutput=I2IInsight.buildPrompt(q,state);document.getElementById('promptOutput').textContent=promptOutput});
  document.getElementById('copyBtn').addEventListener('click',async()=>{if(!promptOutput){showToast('먼저 프롬프트를 생성하세요.');return}try{await navigator.clipboard.writeText(promptOutput)}catch{const ta=document.createElement('textarea');ta.value=promptOutput;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove()}showToast('프롬프트가 복사되었습니다.')});
  document.getElementById('downloadBtn').addEventListener('click',()=>{if(!promptOutput){showToast('먼저 프롬프트를 생성하세요.');return}downloadText('insight-prompt.txt',promptOutput)});
  render();
})();
