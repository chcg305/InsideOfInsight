
(function(){
  function draw(entries,state,onCategory){
    const svg=document.getElementById('mindmapSvg'); if(!svg)return;
    const w=900,h=570,cx=w/2,cy=h/2,r=195,cats=state.categories;
    let s='<defs><filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity=".18"/></filter></defs>';
    const counts=Object.fromEntries(cats.map(c=>[c,(state.entries[c]||[]).length]));
    cats.forEach((cat,i)=>{const a=-Math.PI/2+i*2*Math.PI/Math.max(cats.length,1),x=cx+r*Math.cos(a),y=cy+r*Math.sin(a); s+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#d9dfdc" stroke-width="2"/>`; s+=`<g data-mindcat="${I2IUtils.esc(cat)}" style="cursor:pointer"><circle cx="${x}" cy="${y}" r="42" fill="#2196F3" opacity=".86" filter="url(#shadow)"/><text x="${x}" y="${y-3}" text-anchor="middle" fill="#fff" font-weight="700" font-size="13">${I2IUtils.esc(cat)}</text><text x="${x}" y="${y+15}" text-anchor="middle" fill="#ecf5ff" font-size="10">${counts[cat]}개</text></g>`});
    s+=`<circle cx="${cx}" cy="${cy}" r="54" fill="#4CAF50" opacity=".96" filter="url(#shadow)"/><text x="${cx}" y="${cy+6}" text-anchor="middle" fill="#fff" font-weight="800" font-size="18">나</text>`;
    svg.innerHTML=s; svg.querySelectorAll('[data-mindcat]').forEach(node=>node.addEventListener('click',()=>onCategory(node.getAttribute('data-mindcat'))));
  }
  window.I2IMindmap={draw};
})();
