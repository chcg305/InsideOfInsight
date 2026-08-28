(function(){
  class PhysicsSimulation {
    constructor(nodes, relationships, options = {}) {
      this.nodes = nodes;
      this.relationships = relationships;

      // 설정
      this.options = {
        repulsionStrength: options.repulsionStrength ?? -120,
        linkDistance: options.linkDistance ?? 100,
        damping: options.damping ?? 0.4,
        alphaMin: options.alphaMin ?? 0.001,
        alphaDecay: options.alphaDecay ?? 0.0228,
        velocityMax: options.velocityMax ?? 2,
        ...options
      };

      // 상태
      this.velocities = new Map();
      this.forces = new Map();
      this.alpha = 1;
      this.alphaTarget = 0;
      this.isRunning = false;
      this.simulationEnded = false;
      this.animationFrameId = null;

      // 초기화
      this.nodes.forEach(node => {
        this.velocities.set(node.id, { x: 0, y: 0 });
        this.forces.set(node.id, { x: 0, y: 0 });
      });
    }

    // Repulsion 계산 (Node 간 상호 밀어냄) - Soft falloff 적용
    applyRepulsion() {
      const minSeparation = 80; // Node가 멀어져야 하는 최소 거리 (radius 32 * 2 + padding)
      const strength = this.options.repulsionStrength;

      for (let i = 0; i < this.nodes.length; i++) {
        for (let j = i + 1; j < this.nodes.length; j++) {
          const a = this.nodes[i];
          const b = this.nodes[j];
          const dx = b.position.x - a.position.x;
          const dy = b.position.y - a.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          // Soft repulsion: 최소 거리보다 가까우면 힘 증가, 멀면 힘 감소
          if (dist < minSeparation) {
            // Smooth falloff: 거리가 가까워질수록 더 강한 force
            const error = minSeparation - dist;
            const force = (error * strength / minSeparation) * this.alpha;

            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            const forceA = this.forces.get(a.id);
            const forceB = this.forces.get(b.id);

            forceA.x -= fx;
            forceA.y -= fy;
            forceB.x += fx;
            forceB.y += fy;
          }
        }
      }
    }

    // Link Force 계산 (Parent-Child 거리 유지)
    applyLinkForce() {
      const linkDistance = this.options.linkDistance;
      const strength = 0.5; // Link force 강도

      this.relationships.forEach(rel => {
        if (rel.type !== 'parent') return;

        const source = this.nodes.find(n => n.id === rel.sourceNodeId);
        const target = this.nodes.find(n => n.id === rel.targetNodeId);

        if (!source || !target) return;

        const dx = target.position.x - source.position.x;
        const dy = target.position.y - source.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        // Spring-like force
        const error = dist - linkDistance;
        const force = error * strength * this.alpha;

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        const forceSource = this.forces.get(source.id);
        const forceTarget = this.forces.get(target.id);

        forceSource.x += fx;
        forceSource.y += fy;
        forceTarget.x -= fx;
        forceTarget.y -= fy;
      });
    }

    // Center force (선택사항: 전체 중심 유지)
    applyCenter(centerX = 450, centerY = 285) {
      const strength = 0.1; // Center force 약함

      this.nodes.forEach(node => {
        const dx = centerX - node.position.x;
        const dy = centerY - node.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        const force = strength * this.alpha;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        const nodeForce = this.forces.get(node.id);
        nodeForce.x += fx;
        nodeForce.y += fy;
      });
    }

    // Velocity 업데이트 및 Node 위치 이동
    updateVelocities() {
      const bounds = { minX: 64, maxX: 836, minY: 64, maxY: 506 };
      const velocityMax = this.options.velocityMax;
      const damping = this.options.damping;
      const nodeRadius = 32;

      this.nodes.forEach(node => {
        const force = this.forces.get(node.id);
        const velocity = this.velocities.get(node.id);

        // F = ma → a = F/m (m=1로 단순화)
        velocity.x += force.x;
        velocity.y += force.y;

        // Damping 적용 (에너지 점진 감소)
        velocity.x *= damping;
        velocity.y *= damping;

        // 속도가 너무 작으면 0으로 설정 (마이크로 움직임 제거)
        if (Math.abs(velocity.x) < 0.1) velocity.x = 0;
        if (Math.abs(velocity.y) < 0.1) velocity.y = 0;

        // 속도 제한
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        if (speed > velocityMax) {
          velocity.x = (velocity.x / speed) * velocityMax;
          velocity.y = (velocity.y / speed) * velocityMax;
        }

        // Position 업데이트
        node.position.x += velocity.x;
        node.position.y += velocity.y;

        // 경계 제약 (노드 반지름 고려)
        const minX = bounds.minX + nodeRadius;
        const maxX = bounds.maxX - nodeRadius;
        const minY = bounds.minY + nodeRadius;
        const maxY = bounds.maxY - nodeRadius;

        if (node.position.x < minX) {
          node.position.x = minX;
          velocity.x *= -0.3; // 약한 반동
        }
        if (node.position.x > maxX) {
          node.position.x = maxX;
          velocity.x *= -0.3;
        }
        if (node.position.y < minY) {
          node.position.y = minY;
          velocity.y *= -0.3;
        }
        if (node.position.y > maxY) {
          node.position.y = maxY;
          velocity.y *= -0.3;
        }
      });
    }

    // Simulation tick
    tick() {
      // Force 초기화
      this.forces.forEach((force, nodeId) => {
        force.x = 0;
        force.y = 0;
      });

      // Forces 계산
      this.applyRepulsion();
      this.applyLinkForce();
      // this.applyCenter(); // 중심점 끌어당김 (부모 Focus 시에만 사용)

      // Velocity & Position 업데이트
      this.updateVelocities();

      // Alpha decay (Energy 감소)
      this.alpha += (this.alphaTarget - this.alpha) * this.options.alphaDecay;

      // Convergence check
      const totalEnergy = this.calculateEnergy();
      if (this.alpha < this.options.alphaMin && totalEnergy < 0.01) {
        this.stop();
        this.simulationEnded = true;
      }
    }

    // 전체 에너지 계산
    calculateEnergy() {
      let totalEnergy = 0;
      this.velocities.forEach((velocity) => {
        totalEnergy += Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
      });
      return totalEnergy / this.nodes.length;
    }

    // Animation Loop 시작 (자체 루프 제거 - app.js에서 관리)
    start() {
      if (this.isRunning) return;

      this.isRunning = true;
      this.simulationEnded = false;
      this.alpha = 1;
      this.alphaTarget = 0;
    }

    // Animation Loop 중지
    stop() {
      this.isRunning = false;
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
    }

    // Alpha 값 설정 (강도 조절)
    setAlpha(value) {
      this.alpha = Math.max(0, Math.min(1, value));
    }
  }

  window.I2IPhysics = { PhysicsSimulation };
})();
