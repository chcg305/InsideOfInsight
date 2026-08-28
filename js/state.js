
(function(){
  const STORAGE_KEY='insideToInsight.local.v3';
  const LEGACY_KEYS=['insideToInsight.local.v2'];
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
  function load(){
    try{
      let raw=localStorage.getItem(STORAGE_KEY);
      if(!raw){ for(const key of LEGACY_KEYS){raw=localStorage.getItem(key); if(raw) break;} }
      if(!raw) return {categories:[...DEFAULT_CATEGORIES],entries:{}};
      const parsed=JSON.parse(raw);
      const cats=Array.isArray(parsed.categories)&&parsed.categories.length?parsed.categories:[...DEFAULT_CATEGORIES];
      return {categories:cats,entries:normalizeEntries(parsed.entries||{})};
    }catch{return {categories:[...DEFAULT_CATEGORIES],entries:{}};}
  }
  function save(state){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
  window.I2IState={STORAGE_KEY,DEFAULT_CATEGORIES,clone,load,save,normalizeEntries};
})();
