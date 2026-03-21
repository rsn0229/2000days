// puzzles.js
const PuzzleHandlers = {
  // 0. 프롤로그 : 숫자 자물쇠 [cite: 4]
  number_lock: (puzzle, onComplete) => {
    let dialValues = [0, 0, 0, 0];
    const ui = `
      <div class="dial-lock-container">
        ${[0, 1, 2, 3].map(i => `
          <div class="dial-digit">
            <button class="dial-btn up" data-index="${i}">▲</button>
            <div class="dial-value" id="dial-val-${i}">0</div>
            <button class="dial-btn down" data-index="${i}">▼</button>
          </div>
        `).join('')}
      </div>
    `;

    // UI 렌더링 후 이벤트 바인딩을 위한 함수 반환
    const init = () => {
      document.querySelectorAll('.dial-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const isUp = e.target.classList.contains('up');
          const idx = parseInt(e.target.dataset.index);
          dialValues[idx] = isUp ? (dialValues[idx] + 1) % 10 : (dialValues[idx] - 1 + 10) % 10;
          document.getElementById(`dial-val-${idx}`).innerText = dialValues[idx];
        });
      });

      document.getElementById('submit-puzzle').addEventListener('click', () => {
        if (dialValues.join('') === puzzle.answer) {
          onComplete(); // 정답 시 콜백 실행 [cite: 9]
        } else {
          showModal("<p>비밀번호가 맞지 않습니다.</p><button id='retry-btn' class='custom-btn'>다시 확인</button>", false);
          document.getElementById('retry-btn').addEventListener('click', () => renderPuzzle());
        }
      });
    };

    return { ui, init };
  },

  // 1. 유년기 : 기호 맞추기 (이런 식으로 함수를 계속 추가하세요!) [cite: 10, 14, 15]
  symbol_lock: (puzzle, onComplete) => {
    // ... 기호 퍼즐 로직 구현 ...
    return { ui: `<div>기호 퍼즐 준비 중...</div>`, init: () => {} };
  }
};