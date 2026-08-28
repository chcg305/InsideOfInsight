
(function(){
  const {esc,showToast}=I2IUtils;

  const RELATIONSHIP_TYPES={
    parent:'부모',
    child:'자식',
    family:'가족',
    friend:'친구',
    colleague:'동료',
    mentor:'멘토',
    mentee:'멘티',
    spouse:'배우자',
    related:'관련'
  };

  const REL_STYLES={
    parent:{stroke:'#3b82f6',strokeDasharray:'none',lineWidth:'2.5',opacity:0.7},
    child:{stroke:'#3b82f6',strokeDasharray:'none',lineWidth:'2.5',opacity:0.7},
    family:{stroke:'#a855f7',strokeDasharray:'4,4',lineWidth:'2',opacity:0.6},
    friend:{stroke:'#f59e0b',strokeDasharray:'6,2',lineWidth:'2',opacity:0.6},
    colleague:{stroke:'#06b6d4',strokeDasharray:'8,4',lineWidth:'2',opacity:0.6},
    mentor:{stroke:'#10b981',strokeDasharray:'3,3',lineWidth:'2',opacity:0.6},
    mentee:{stroke:'#10b981',strokeDasharray:'3,3',lineWidth:'2',opacity:0.6},
    spouse:{stroke:'#ec4899',strokeDasharray:'none',lineWidth:'3',opacity:0.7},
    related:{stroke:'#6b7280',strokeDasharray:'2,2',lineWidth:'1.5',opacity:0.5}
  };

  const NODE_COLORS={
    default:'#3b82f6',
    selected:'#1e40af'
  };

  function getSVGCoordinates(e,svg){
    const rect=svg.getBoundingClientRect();
    const x=e.clientX-rect.left;
    const y=e.clientY-rect.top;
    const svgRect=svg.getBBox();
    const viewBox=svg.getAttribute('viewBox').split(' ').map(Number);
    return {
      x:(x/rect.width)*viewBox[2],
      y:(y/rect.height)*viewBox[3]
    };
  }

  function draw(nodes,relationships,selectedNodeId,onNodeSelect,onNodeMove,onRelationshipCreate,connectionMode,firstNodeId){
    const container=document.getElementById('graphContainer'); if(!container)return;
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('class','graph-svg');
    svg.setAttribute('viewBox','0 0 1000 600');
    svg.setAttribute('preserveAspectRatio','xMidYMid meet');

    const defs=document.createElementNS('http://www.w3.org/2000/svg','defs');
    defs.innerHTML=`
      <filter id="nodeShadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity=".25"/>
      </filter>
      <filter id="nodeHover" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="8" stdDeviation="8" flood-opacity=".35"/>
      </filter>
      <filter id="selectedGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
        <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    `;
    svg.appendChild(defs);

    const edgesGroup=document.createElementNS('http://www.w3.org/2000/svg','g');
    edgesGroup.setAttribute('class','edges');
    svg.appendChild(edgesGroup);

    const edgeElements=new Map();
    relationships.forEach(rel=>{
      const source=nodes.find(n=>n.id===rel.sourceNodeId);
      const target=nodes.find(n=>n.id===rel.targetNodeId);
      if(!source||!target)return;

      const style=REL_STYLES[rel.type]||REL_STYLES.related;
      const line=document.createElementNS('http://www.w3.org/2000/svg','line');
      line.setAttribute('x1',source.position.x);
      line.setAttribute('y1',source.position.y);
      line.setAttribute('x2',target.position.x);
      line.setAttribute('y2',target.position.y);
      line.setAttribute('stroke',style.stroke);
      line.setAttribute('stroke-width',style.lineWidth);
      line.setAttribute('stroke-dasharray',style.strokeDasharray);
      line.setAttribute('opacity',style.opacity);
      line.setAttribute('data-rel-id',rel.id);
      line.setAttribute('class','rel-line');
      line.setAttribute('data-rel-type',rel.type);
      edgesGroup.appendChild(line);
      edgeElements.set(rel.id,{line,source,target,rel});
    });

    const nodesGroup=document.createElementNS('http://www.w3.org/2000/svg','g');
    nodesGroup.setAttribute('class','nodes');
    svg.appendChild(nodesGroup);

    const nodeElements=new Map();

    nodes.forEach(node=>{
      const g=document.createElementNS('http://www.w3.org/2000/svg','g');
      g.setAttribute('class','node');
      g.setAttribute('data-node-id',node.id);
      g.style.cursor='grab';

      const circle=document.createElementNS('http://www.w3.org/2000/svg','circle');
      circle.setAttribute('cx',node.position.x);
      circle.setAttribute('cy',node.position.y);
      circle.setAttribute('r','36');
      const isSelected=node.id===selectedNodeId;
      const isConnecting=connectionMode&&(node.id===firstNodeId);
      circle.setAttribute('fill',isConnecting?'#ff6f00':node.color||NODE_COLORS.default);
      circle.setAttribute('opacity',isSelected?'1':'.85');
      circle.setAttribute('filter',isSelected?'url(#selectedGlow)':'url(#nodeShadow)');
      circle.setAttribute('class','node-circle');
      circle.setAttribute('data-selected',isSelected?'true':'false');
      if(isSelected){
        circle.setAttribute('stroke','#fff');
        circle.setAttribute('stroke-width','2');
      }
      g.appendChild(circle);

      const text=document.createElementNS('http://www.w3.org/2000/svg','text');
      text.setAttribute('x',node.position.x);
      text.setAttribute('y',node.position.y);
      text.setAttribute('text-anchor','middle');
      text.setAttribute('dy','.3em');
      text.setAttribute('fill','#fff');
      text.setAttribute('font-size','13');
      text.setAttribute('font-weight','700');
      text.setAttribute('pointer-events','none');
      text.textContent=esc(node.name.slice(0,10));
      g.appendChild(text);

      let isDragging=false;

      g.addEventListener('click',(e)=>{
        if(isDragging)return;
        e.stopPropagation();
        if(connectionMode){
          if(onRelationshipCreate)onRelationshipCreate(node.id);
        } else {
          if(onNodeSelect)onNodeSelect(node.id);
        }
      });

      g.addEventListener('mouseenter',()=>{
        if(!isDragging&&!isSelected){
          circle.setAttribute('filter','url(#nodeHover)');
          g.style.cursor='grab';
        }
      });

      g.addEventListener('mouseleave',()=>{
        if(!isDragging&&!isSelected){
          circle.setAttribute('filter','url(#nodeShadow)');
        }
      });

      g.addEventListener('mousedown',(e)=>{
        isDragging=true;
        g.style.cursor='grabbing';
        e.preventDefault();
        e.stopPropagation();

        const startCoord=getSVGCoordinates(e,svg);
        const startNodeX=node.position.x;
        const startNodeY=node.position.y;

        circle.setAttribute('filter','url(#selectedGlow)');
        circle.setAttribute('opacity','1');

        const onMouseMove=(me)=>{
          const currentCoord=getSVGCoordinates(me,svg);
          const dx=currentCoord.x-startCoord.x;
          const dy=currentCoord.y-startCoord.y;

          node.position.x=Math.max(0,Math.min(1000,startNodeX+dx));
          node.position.y=Math.max(0,Math.min(600,startNodeY+dy));

          circle.setAttribute('cx',node.position.x);
          circle.setAttribute('cy',node.position.y);
          text.setAttribute('x',node.position.x);
          text.setAttribute('y',node.position.y);

          edgeElements.forEach(({line,source,target})=>{
            line.setAttribute('x1',source.position.x);
            line.setAttribute('y1',source.position.y);
            line.setAttribute('x2',target.position.x);
            line.setAttribute('y2',target.position.y);
          });
        };

        const onMouseUp=()=>{
          document.removeEventListener('mousemove',onMouseMove);
          document.removeEventListener('mouseup',onMouseUp);
          isDragging=false;
          g.style.cursor='grab';
          circle.setAttribute('filter',isSelected?'url(#selectedGlow)':'url(#nodeShadow)');
          circle.setAttribute('opacity',isSelected?'1':'.85');
          if(onNodeMove)onNodeMove(node);
        };

        document.addEventListener('mousemove',onMouseMove);
        document.addEventListener('mouseup',onMouseUp);
      });

      nodesGroup.appendChild(g);
      nodeElements.set(node.id,{g,circle,text});
    });

    svg.addEventListener('click',(e)=>{
      if(e.target===svg||e.target===edgesGroup){
        if(onNodeSelect)onNodeSelect('');
      }
    });

    container.innerHTML='';
    container.appendChild(svg);
  }

  window.I2IGraph={draw,RELATIONSHIP_TYPES,REL_STYLES,NODE_COLORS};
})();
