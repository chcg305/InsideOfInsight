(function(){
  // 모달 스타일 및 구조
  const setupModalStyles = () => {
    const styleId = 'i2i-modal-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .i2i-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      }
      .i2i-modal-content {
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
      }
      .i2i-modal-title {
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 16px 0;
        color: #1a1a1a;
      }
      .i2i-modal-message {
        font-size: 14px;
        color: #666;
        margin-bottom: 12px;
        line-height: 1.5;
      }
      .i2i-modal-relation {
        background: #f5f5f5;
        padding: 12px;
        border-radius: 6px;
        margin-bottom: 16px;
        font-size: 13px;
        color: #333;
        font-family: monospace;
      }
      .i2i-modal-buttons {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
      }
      .i2i-modal-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        font-size: 13px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s;
      }
      .i2i-modal-btn-no {
        background: #f0f0f0;
        color: #333;
      }
      .i2i-modal-btn-no:hover {
        background: #e0e0e0;
      }
      .i2i-modal-btn-yes {
        background: #42a5f5;
        color: white;
      }
      .i2i-modal-btn-yes:hover {
        background: #1976d2;
      }
    `;
    document.head.appendChild(style);
  };

  // 확인 모달 표시
  const confirmRelationship = (draggedNode, parentNode, onConfirm) => {
    setupModalStyles();

    const overlay = document.createElement('div');
    overlay.className = 'i2i-modal-overlay';

    const content = document.createElement('div');
    content.className = 'i2i-modal-content';

    content.innerHTML = `
      <div class="i2i-modal-title">자식 노드로 편입하시겠습니까?</div>
      <div class="i2i-modal-message">선택한 노드를 다음 노드의 자식으로 연결합니다:</div>
      <div class="i2i-modal-relation">
        "<strong>${I2IUtils.esc(draggedNode.name)}</strong>" →
        "<strong>${I2IUtils.esc(parentNode.name)}</strong>"의 자식
      </div>
      <div class="i2i-modal-buttons">
        <button class="i2i-modal-btn i2i-modal-btn-no" id="i2i-modal-no">아니오</button>
        <button class="i2i-modal-btn i2i-modal-btn-yes" id="i2i-modal-yes">예</button>
      </div>
    `;

    overlay.appendChild(content);
    document.body.appendChild(overlay);

    const closeModal = () => {
      overlay.remove();
    };

    const yesBtn = content.querySelector('#i2i-modal-yes');
    const noBtn = content.querySelector('#i2i-modal-no');

    yesBtn.addEventListener('click', () => {
      closeModal();
      onConfirm();
    });

    noBtn.addEventListener('click', () => {
      closeModal();
    });

    // ESC 키로 취소
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    // 클릭으로 닫기 방지 (모달 외부 클릭 시에만)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    });
  };

  window.I2IMindmapUI = {
    confirmRelationship
  };
})();
