(function(){
  // ===== 1. 계층 분석 =====
  function getNodeLayer(nodeId, nodes, rels) {
    // 해당 노드의 Layer 계산 (Root = 1, 1촌 = 2, ...)
    if (!nodeId || !nodes || !rels) return 0;

    const hasParent = rels.some(r => r.type === 'parent' && r.targetNodeId === nodeId);
    if (!hasParent) return 1; // Root node

    let depth = 1;
    let current = nodeId;
    const visited = new Set();

    while (true) {
      if (visited.has(current)) break;
      visited.add(current);

      const parentRel = rels.find(r => r.type === 'parent' && r.targetNodeId === current);
      if (!parentRel) break;

      current = parentRel.sourceNodeId;
      depth++;
    }
    return depth;
  }

  function buildLayerMap(nodes, rels) {
    // 모든 노드의 Layer를 Map으로 반환
    const layerMap = {};
    nodes.forEach(n => {
      layerMap[n.id] = getNodeLayer(n.id, nodes, rels);
    });
    return layerMap;
  }

  function getMaxLayer(layerMap) {
    return Math.max(...Object.values(layerMap), 1);
  }

  function getNodesByLayer(nodes, layerMap, layer) {
    // 특정 Layer의 모든 노드 반환
    return nodes.filter(n => layerMap[n.id] === layer);
  }

  // ===== 2. Radial Layout 알고리즘 =====
  function calculateRadialLayout(nodes, rels) {
    if (!nodes || nodes.length === 0) {
      return nodes.map(n => ({ ...n }));
    }

    const layerMap = buildLayerMap(nodes, rels);
    const maxLayer = getMaxLayer(layerMap);
    const centerX = 450;
    const centerY = 285;
    const nodeRadius = 32;

    // Layer별 반지름 계산
    const radiusPerLayer = {};
    const baseRadius = 60;
    const radiusIncrement = 100;

    for (let layer = 1; layer <= maxLayer; layer++) {
      radiusPerLayer[layer] = baseRadius + (layer - 1) * radiusIncrement;
    }

    // Layer 1은 중앙에
    radiusPerLayer[1] = 20;

    // 계층별로 노드 배치
    const positioned = {};
    const bounds = { minX: 64, maxX: 836, minY: 64, maxY: 506 };

    for (let layer = 1; layer <= maxLayer; layer++) {
      const layerNodes = getNodesByLayer(nodes, layerMap, layer);
      if (layerNodes.length === 0) continue;

      const radius = radiusPerLayer[layer];
      const angleStep = (2 * Math.PI) / Math.max(layerNodes.length, 1);

      layerNodes.forEach((node, index) => {
        // 부모의 위치를 기반으로 자식들의 각도를 결정
        let angle = angleStep * index;

        // 부모가 있으면 부모 방향 기반으로 자식 배치
        if (layer > 1) {
          const parentRel = rels.find(r => r.type === 'parent' && r.targetNodeId === node.id);
          if (parentRel) {
            const parentNode = nodes.find(n => n.id === parentRel.sourceNodeId);
            if (parentNode && positioned[parentNode.id]) {
              const parentX = positioned[parentNode.id].x;
              const parentY = positioned[parentNode.id].y;

              // 부모 방향의 각도 계산
              const toParentAngle = Math.atan2(centerY - parentY, centerX - parentX);

              // 같은 부모의 다른 자식들
              const siblings = layerNodes.filter(n => {
                const rel = rels.find(r => r.type === 'parent' && r.targetNodeId === n.id);
                return rel && rel.sourceNodeId === parentRel.sourceNodeId;
              });
              const siblingIndex = siblings.findIndex(n => n.id === node.id);
              const siblingCount = siblings.length;
              const siblingAngleOffset = ((siblingIndex - (siblingCount - 1) / 2) * Math.PI * 0.3) / Math.max(siblingCount, 1);

              angle = toParentAngle + siblingAngleOffset;
            }
          }
        }

        let x = centerX + Math.cos(angle) * radius;
        let y = centerY + Math.sin(angle) * radius;

        // 경계 제약
        x = Math.max(bounds.minX + nodeRadius, Math.min(bounds.maxX - nodeRadius, x));
        y = Math.max(bounds.minY + nodeRadius, Math.min(bounds.maxY - nodeRadius, y));

        positioned[node.id] = { x, y };
      });
    }

    // 겹침 방지 (Bounding Box 기반)
    resolveCollisions(positioned, nodes, nodeRadius, 20);

    // 결과 반환
    return nodes.map(n => ({
      ...n,
      position: positioned[n.id] || { x: centerX, y: centerY }
    }));
  }

  // ===== 3. 겹침 방지 =====
  function resolveCollisions(positioned, nodes, nodeRadius, minGap) {
    // 반복적으로 겹친 노드들을 분리
    const maxIterations = 10;
    let resolved = 0;

    for (let iter = 0; iter < maxIterations; iter++) {
      let collision = false;

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeA = nodes[i];
          const nodeB = nodes[j];
          const posA = positioned[nodeA.id];
          const posB = positioned[nodeB.id];

          if (!posA || !posB) continue;

          const dx = posB.x - posA.x;
          const dy = posB.y - posA.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = nodeRadius * 2 + minGap;

          if (dist < minDist) {
            collision = true;
            const angle = Math.atan2(dy, dx);
            const moveDistance = (minDist - dist) / 2 + 2;

            posA.x -= Math.cos(angle) * moveDistance;
            posA.y -= Math.sin(angle) * moveDistance;
            posB.x += Math.cos(angle) * moveDistance;
            posB.y += Math.sin(angle) * moveDistance;

            resolved++;
          }
        }
      }

      if (!collision) break;
    }

    // 경계 재조정
    const bounds = { minX: 64, maxX: 836, minY: 64, maxY: 506 };
    const minX = bounds.minX + nodeRadius;
    const maxX = bounds.maxX - nodeRadius;
    const minY = bounds.minY + nodeRadius;
    const maxY = bounds.maxY - nodeRadius;

    Object.values(positioned).forEach(pos => {
      pos.x = Math.max(minX, Math.min(maxX, pos.x));
      pos.y = Math.max(minY, Math.min(maxY, pos.y));
    });
  }

  // ===== 4. Node Scale 계산 =====
  function calculateNodeScale(nodes) {
    if (!nodes || nodes.length === 0) return 1;

    const viewportWidth = 900 - 32 - 32; // SVG viewBox width - margins
    const viewportHeight = 570 - 32 - 32; // SVG viewBox height - margins

    // Bounding box 계산
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    nodes.forEach(n => {
      if (!n.position) return;
      minX = Math.min(minX, n.position.x);
      maxX = Math.max(maxX, n.position.x);
      minY = Math.min(minY, n.position.y);
      maxY = Math.max(maxY, n.position.y);
    });

    const graphWidth = maxX - minX + 64; // Node 반지름 * 2
    const graphHeight = maxY - minY + 64;

    // 화면 점유율 계산
    const widthRatio = graphWidth / viewportWidth;
    const heightRatio = graphHeight / viewportHeight;
    const occupancyRatio = Math.max(widthRatio, heightRatio);

    // Scale 결정
    let scale = 1;
    if (occupancyRatio > 1) {
      scale = Math.min(1, 1 / occupancyRatio);
    }

    // Min/Max 제한
    const minScale = 0.5;
    const maxScale = 1;
    scale = Math.max(minScale, Math.min(maxScale, scale));

    return scale;
  }

  // ===== 5. 전체 Layout 통합 함수 =====
  function layoutRadial(allNodes, allRels, visibleNodeIds = null) {
    if (!allNodes || allNodes.length === 0) {
      return allNodes.map(n => ({ ...n }));
    }

    // Visible nodes 필터링
    const visibleNodes = visibleNodeIds
      ? allNodes.filter(n => visibleNodeIds.has(n.id))
      : allNodes;

    // Visible relationships만 사용
    const visibleRels = allRels.filter(r =>
      visibleNodeIds ? (visibleNodeIds.has(r.sourceNodeId) && visibleNodeIds.has(r.targetNodeId)) : true
    );

    // Radial Layout 계산
    const positioned = calculateRadialLayout(visibleNodes, visibleRels);

    // Node Scale 계산
    const scale = calculateNodeScale(positioned);

    // Scale 적용 (Viewport 중앙 기준)
    const centerX = 450;
    const centerY = 285;

    const scaled = positioned.map(n => ({
      ...n,
      scale: scale
    }));

    // 모든 노드가 화면 내에 들어오도록 전체 위치 조정
    const bounds = { minX: 64, maxX: 836, minY: 64, maxY: 506 };
    const nodeRadius = 32;

    let scaledMinX = Infinity, scaledMaxX = -Infinity;
    let scaledMinY = Infinity, scaledMaxY = -Infinity;

    scaled.forEach(n => {
      if (!n.position) return;
      scaledMinX = Math.min(scaledMinX, n.position.x);
      scaledMaxX = Math.max(scaledMaxX, n.position.x);
      scaledMinY = Math.min(scaledMinY, n.position.y);
      scaledMaxY = Math.max(scaledMaxY, n.position.y);
    });

    // 중앙 정렬
    const graphCenterX = (scaledMinX + scaledMaxX) / 2;
    const graphCenterY = (scaledMinY + scaledMaxY) / 2;
    const offsetX = centerX - graphCenterX;
    const offsetY = centerY - graphCenterY;

    scaled.forEach(n => {
      if (!n.position) return;
      n.position.x += offsetX;
      n.position.y += offsetY;

      // 최종 경계 제약
      const minX = bounds.minX + nodeRadius;
      const maxX = bounds.maxX - nodeRadius;
      const minY = bounds.minY + nodeRadius;
      const maxY = bounds.maxY - nodeRadius;

      n.position.x = Math.max(minX, Math.min(maxX, n.position.x));
      n.position.y = Math.max(minY, Math.min(maxY, n.position.y));
    });

    return scaled;
  }

  window.I2ILayout = {
    layoutRadial,
    calculateNodeScale,
    buildLayerMap,
    getNodeLayer,
    getMaxLayer
  };
})();
