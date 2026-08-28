
(function(){
  const STORAGE_KEY='insideToInsight.local.v4';
  const LEGACY_KEYS=['insideToInsight.local.v3','insideToInsight.local.v2'];
  const DEFAULT_CATEGORIES=['경력','공부','인생','가족','관계','친구','연애'];
  function clone(obj){return JSON.parse(JSON.stringify(obj));}
  function normalizeEntries(entries){
    const out={};
    Object.entries(entries||{}).forEach(([cat,rows])=>{
      out[cat]=(Array.isArray(rows)?rows:[]).map((e,i)=>({
        id:e.id||(`${cat}-${Date.now()}-${i}`), category:cat,
        title:e.title||('기록 '+(i+1)), label:e.label||'',
        content:String(e.content||''), date:e.date||e.createdAt||new Date().toISOString(),
        createdAt:e.createdAt||e.date||new Date().toISOString()
      }));
    });
    return out;
  }
  function enforceNodeBoundary(node) {
    const r = 32; // nodeRadius
    const bounds = { minX: 32 + r, maxX: 900 - r, minY: 32 + r, maxY: 570 - r };
    if (node.position) {
      node.position.x = Math.max(bounds.minX, Math.min(bounds.maxX, node.position.x));
      node.position.y = Math.max(bounds.minY, Math.min(bounds.maxY, node.position.y));
    }
    return node;
  }

  function normalizeNodes(nodes){
    if(Array.isArray(nodes)){
      return nodes.map((n,i)=>{
        const normalized = {
          id:n.id||(`node-${Date.now()}-${i}`),
          categoryId:n.categoryId||'', name:n.name||('노드 '+(i+1)),
          position:n.position||{x:Math.random()*600+150,y:Math.random()*300+100},
          linkedDiaries:Array.isArray(n.linkedDiaries)?n.linkedDiaries:[],
          color:n.color||'#42a5f5', label:n.label||''
        };
        return enforceNodeBoundary(normalized);
      });
    }
    const out=[];
    Object.entries(nodes||{}).forEach(([cat,items])=>{
      (Array.isArray(items)?items:[]).forEach((n,i)=>{
        const normalized = {
          id:n.id||(`node-${cat}-${Date.now()}-${i}`),
          categoryId:cat, name:n.name||('노드 '+(i+1)),
          position:n.position||{x:Math.random()*600+150,y:Math.random()*300+100},
          linkedDiaries:Array.isArray(n.linkedDiaries)?n.linkedDiaries:[],
          color:n.color||'#42a5f5', label:n.label||''
        };
        out.push(enforceNodeBoundary(normalized));
      });
    });
    return out;
  }
  function normalizeRelationships(rels){
    return (Array.isArray(rels)?rels:[]).map((r,i)=>({
      id:r.id||(`rel-${Date.now()}-${i}`),
      sourceNodeId:r.sourceNodeId||'', targetNodeId:r.targetNodeId||'',
      type:r.type||'related',
      relationKind:r.relationKind||'general',
      label:r.label||''
    }));
  }
  function load(){
    try{
      let raw=localStorage.getItem(STORAGE_KEY);
      if(!raw){ for(const key of LEGACY_KEYS){raw=localStorage.getItem(key); if(raw) break;} }
      if(!raw) return {categories:[...DEFAULT_CATEGORIES],entries:DEFAULT_CATEGORIES.reduce((acc,cat)=>(acc[cat]=[],acc),{}),nodes:[],relationships:[]};
      const parsed=JSON.parse(raw);
      const cats=Array.isArray(parsed.categories)&&parsed.categories.length?parsed.categories:[...DEFAULT_CATEGORIES];
      const rawNodes=parsed.nodes||{};
      return {
        categories:cats,
        entries:normalizeEntries(parsed.entries||{}),
        nodes:normalizeNodes(Array.isArray(rawNodes)?rawNodes:rawNodes),
        relationships:normalizeRelationships(parsed.relationships||[])
      };
    }catch{return {categories:[...DEFAULT_CATEGORIES],entries:{},nodes:[],relationships:[]};}
  }
  function save(state){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
  window.I2IState={STORAGE_KEY,DEFAULT_CATEGORIES,clone,load,save,normalizeEntries,normalizeNodes,normalizeRelationships};
})();
