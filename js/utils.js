
(function(){
  function uid(){return (window.crypto&&crypto.randomUUID)?crypto.randomUUID():String(Date.now())+Math.random().toString(16).slice(2);}
  function esc(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function formatDate(date){return new Date(date).toLocaleDateString('ko-KR');}
  function formatDateTime(date){return new Date(date).toLocaleString('ko-KR');}
  function showToast(msg){const t=document.getElementById('toast'); if(!t)return; t.textContent=msg; t.classList.add('show'); clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>t.classList.remove('show'),1600);}
  function allEntries(state){return state.categories.flatMap(cat=>(state.entries[cat]||[]).map(e=>({...e,category:cat})));}
  function downloadText(filename,text){const blob=new Blob([text],{type:'text/plain;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),0);}
  window.I2IUtils={uid,esc,formatDate,formatDateTime,showToast,allEntries,downloadText};
})();
