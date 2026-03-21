// puzzles.js
const PuzzleHandlers = {
  
  // 0. 프롤로그 : 숫자 자물쇠
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
          onComplete(); 
        } else {
          showModal("<p>비밀번호가 맞지 않습니다.</p><button id='retry-btn' class='custom-btn'>다시 풀기</button>", false);
          document.getElementById('retry-btn').addEventListener('click', () => renderPuzzle());
        }
      });
    };

    return { ui, init };
  },

  // 🚀 1. 유년기 : 기호 맞추기 자물쇠
  symbol_lock: (puzzle, onComplete) => {
    // 💡 다이얼에 들어갈 기호 배열 (오답용 더미 데이터 포함)
    const symbols = [
      { id: '빈칸', icon: '❔' },
      { id: '태양', icon: '☀️' },
      { id: '물결', icon: '🌊' },
      { id: '달', icon: '🌙' },
      { id: '갈매기', icon: '🕊️' },
      { id: '닻', icon: '⚓' },
      { id: '해파리', icon: '🪼' },
    ];

    let currentSelections = [0, 0, 0]; // 3개의 버튼 상태(인덱스) 저장

    // 💡 화면에 그려질 UI (3개의 버튼)
    const ui = `
      <div class="symbol-lock-container">
        <button class="symbol-btn" data-slot="0">${symbols[0].icon}</button>
        <button class="symbol-btn" data-slot="1">${symbols[0].icon}</button>
        <button class="symbol-btn" data-slot="2">${symbols[0].icon}</button>
      </div>
      <p style="font-size: 12px; color: #8d6e63; margin-top: 5px;">버튼을 눌러 그림을 맞추세요</p>
    `;

    const init = () => {
      // 각 버튼을 누를 때마다 다음 기호로 변경
      document.querySelectorAll('.symbol-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const slot = parseInt(e.target.dataset.slot);
          
          // 인덱스를 1씩 더하되, 배열 끝에 도달하면 다시 0으로 순환
          currentSelections[slot] = (currentSelections[slot] + 1) % symbols.length;
          
          // 변경된 이모지를 화면에 반영
          e.target.innerText = symbols[currentSelections[slot]].icon;
        });
      });

      // 💡 풀기 버튼 클릭 시 정답 확인
      document.getElementById('submit-puzzle').addEventListener('click', () => {
        // 유저가 선택한 3개의 기호 id를 '태양-갈매기-물결' 형태로 변환
        const userAnswer = currentSelections.map(idx => symbols[idx].id).join('-');
        
        if (userAnswer === puzzle.answer) { // data.js의 answer와 비교
          onComplete();
        } else {
          showModal("<p>상자가 열리지 않습니다.<br>기호의 종류와 순서가 맞을까요?</p><button id='retry-btn' class='custom-btn'>다시 풀기</button>", false);
          document.getElementById('retry-btn').addEventListener('click', () => renderPuzzle());
        }
      });
    };

    return { ui, init };
  },

// 2. 기사단 입단 : 아이콘 슬롯 맞추기
  icon_slot: (puzzle, onComplete) => {
    // 정답 데이터와 매칭될 아이콘 풀 (페이크 아이콘 포함)
    const iconData = [
      { id: '닻', emoji: '⚓' },
      { id: '방패', emoji: '🛡️' },
      { id: '파도', emoji: '🌊' },
      { id: '검', emoji: '⚔️' },
      { id: '별', emoji: '⭐' }
    ];

    let slots = [null, null, null]; // 3개의 빈 슬롯 상태 관리
    let selected = null; // 현재 선택된 요소 상태 저장 { type: 'slot' | 'pool', index: number }

    // UI 구성: 3개의 슬롯 영역과 하단 아이콘 풀 영역
    const ui = `
      <div style="font-size: 13px; color: #8d6e63; margin-bottom: 10px;">클릭하여 인장을 선택하고 빈 칸에 넣으세요</div>
      <div class="icon-slot-container">
        <div class="icon-slot" data-slot="0"></div>
        <div class="icon-slot" data-slot="1"></div>
        <div class="icon-slot" data-slot="2"></div>
      </div>
      <div style="font-size: 13px; color: #8d6e63; margin-bottom: 10px;">사용 가능한 인장 조각</div>
      <div class="icon-pool" id="icon-pool">
        ${iconData.map((item, idx) => `
          <div class="pool-icon" data-id="${item.id}" data-emoji="${item.emoji}" data-idx="${idx}">${item.emoji}</div>
        `).join('')}
      </div>
    `;

    const init = () => {
      const slotEls = document.querySelectorAll('.icon-slot');
      const poolEls = document.querySelectorAll('.pool-icon');

      // 화면 업데이트 함수 (데이터에 맞게 렌더링)
      const updateUI = () => {
        // 1. 슬롯 업데이트
        slotEls.forEach((slotEl, i) => {
          if (slots[i]) {
            slotEl.innerText = slots[i].emoji;
            slotEl.classList.add('filled');
          } else {
            slotEl.innerText = '';
            slotEl.classList.remove('filled');
          }
          slotEl.classList.remove('selected'); // 강조 초기화
        });

// 2. 풀 업데이트 (사용된 아이콘 숨기기)
        const usedIdxs = slots.filter(s => s !== null).map(s => parseInt(s.poolIdx));
        poolEls.forEach((poolEl, i) => {
          if (usedIdxs.includes(i)) {
            poolEl.classList.add('invisible'); // 💡 hidden 대신 invisible 사용
          } else {
            poolEl.classList.remove('invisible');
          }
          poolEl.classList.remove('selected');
        });

        // 3. 선택된 요소 다시 강조
        if (selected) {
          if (selected.type === 'slot') {
            slotEls[selected.index].classList.add('selected');
          } else if (selected.type === 'pool') {
            poolEls[selected.index].classList.add('selected');
          }
        }
      };

      const clearSelection = () => {
        selected = null;
      };

      // 하단 인장 조각(풀) 클릭 이벤트
      poolEls.forEach(iconEl => {
        iconEl.addEventListener('click', (e) => {
          const pIdx = parseInt(e.target.dataset.idx);

          if (selected && selected.type === 'slot') {
            // 이미 위쪽 슬롯이 선택되어 있다면, 해당 슬롯으로 이동
            const sIdx = selected.index;
            slots[sIdx] = {
              id: iconEl.dataset.id,
              emoji: iconEl.dataset.emoji,
              poolIdx: pIdx
            };
            clearSelection();
          } else if (selected && selected.type === 'pool' && selected.index === pIdx) {
            // 자기 자신을 두 번 클릭하면 선택 해제
            clearSelection();
          } else {
            // 이 조각을 선택
            selected = { type: 'pool', index: pIdx };
          }
          updateUI();
        });
      });

      // 위쪽 빈 칸(슬롯) 클릭 이벤트
      slotEls.forEach(slotEl => {
        slotEl.addEventListener('click', (e) => {
          const sIdx = parseInt(e.target.dataset.slot);

          if (selected && selected.type === 'pool') {
            // 아래쪽 조각이 선택되어 있다면, 이 빈 칸으로 이동
            const pIdx = selected.index;
            const poolTarget = document.querySelector(`.pool-icon[data-idx="${pIdx}"]`);
            slots[sIdx] = {
              id: poolTarget.dataset.id,
              emoji: poolTarget.dataset.emoji,
              poolIdx: pIdx
            };
            clearSelection();
          } else if (selected && selected.type === 'slot') {
            const sIdx2 = selected.index;
            if (sIdx === sIdx2) {
              // 자기 자신(채워진 칸)을 한 번 더 누르면 조각을 원래 자리로 돌려보냄
              if (slots[sIdx]) {
                slots[sIdx] = null;
              }
              clearSelection();
            } else {
              // 다른 칸이 선택되어 있었다면 둘의 내용물을 맞바꿈(Swap)
              const temp = slots[sIdx];
              slots[sIdx] = slots[sIdx2];
              slots[sIdx2] = temp;
              clearSelection();
            }
          } else {
            // 아무것도 선택 안 된 상태에서 빈 칸/채워진 칸을 선택
            selected = { type: 'slot', index: sIdx };
          }
          updateUI();
        });
      });

      // 풀기(제출) 버튼 로직
      document.getElementById('submit-puzzle').addEventListener('click', () => {
        const userAnswer = slots.map(s => s ? s.id : '').join('-');
        
        if (userAnswer === puzzle.answer) {
          onComplete();
        } else {
          showModal("<p>인장이 맞춰지지 않았습니다.<br>의미와 순서를 다시 생각해 볼까요?</p><button id='retry-btn' class='custom-btn'>다시 풀기</button>", false);
          document.getElementById('retry-btn').addEventListener('click', () => renderPuzzle());
        }
      });
    };

    return { ui, init };
  },

// 3. 장마철의 악몽 : 찢어진 서류 맞추기 (직소 퍼즐)
  jigsaw: (puzzle, onComplete) => {
    // 1~9번 조각 데이터 (초기 풀에는 섞어서 배치할 예정)
    const pieceData = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => ({ id: n.toString(), text: n }));
    
    // 조각을 무작위로 섞음 (셔플)
    const shuffledPieces = [...pieceData].sort(() => Math.random() - 0.5);

    let slots = Array(9).fill(null); // 3x3 보드의 9칸
    let selected = null; // { type: 'slot' | 'pool', index: number }

    const ui = `
      <div class="jigsaw-container">
        <div class="jigsaw-board" id="jigsaw-board">
          ${Array(9).fill(0).map((_, i) => `<div class="jigsaw-slot" data-slot="${i}"></div>`).join('')}
        </div>
        <div style="font-size: 12px; color: #8d6e63;">조각을 클릭하여 보드에 맞추세요</div>
        <div class="jigsaw-pool" id="jigsaw-pool">
          ${shuffledPieces.map((p, i) => `
            <div class="jigsaw-piece" data-id="${p.id}" data-idx="${i}">${p.text}</div>
          `).join('')}
        </div>
      </div>
    `;

    const init = () => {
      const slotEls = document.querySelectorAll('.jigsaw-slot');
      const poolEls = document.querySelectorAll('.jigsaw-piece');

      const updateUI = () => {
        // 1. 슬롯 업데이트
        slotEls.forEach((slotEl, i) => {
          slotEl.innerHTML = ''; // 안쪽 비우기
          slotEl.classList.remove('selected');
          if (slots[i]) {
            // 슬롯 안에 조각 UI를 복제해서 넣어줌
            const pieceHtml = `<div class="jigsaw-piece" style="cursor: pointer;">${slots[i].text}</div>`;
            slotEl.innerHTML = pieceHtml;
          }
        });

// 2. 풀 업데이트 (사용된 아이콘 숨기기)
        const usedIdxs = slots.filter(s => s !== null).map(s => parseInt(s.poolIdx));
        poolEls.forEach((poolEl, i) => {
          if (usedIdxs.includes(i)) poolEl.classList.add('invisible'); // 💡 여기도 invisible
          else poolEl.classList.remove('invisible');
          poolEl.classList.remove('selected');
        });

        // 3. 선택된 요소 강조
        if (selected) {
          if (selected.type === 'slot') slotEls[selected.index].classList.add('selected');
          else if (selected.type === 'pool') poolEls[selected.index].classList.add('selected');
        }
      };

      const clearSelection = () => selected = null;

      // 풀 조각 클릭
      poolEls.forEach(pieceEl => {
        pieceEl.addEventListener('click', (e) => {
          const pIdx = parseInt(e.target.dataset.idx);

          if (selected && selected.type === 'slot') {
            const sIdx = selected.index;
            slots[sIdx] = { id: pieceEl.dataset.id, text: pieceEl.innerText, poolIdx: pIdx };
            clearSelection();
          } else if (selected && selected.type === 'pool' && selected.index === pIdx) {
            clearSelection();
          } else {
            selected = { type: 'pool', index: pIdx };
          }
          updateUI();
        });
      });

      // 슬롯 클릭
      slotEls.forEach(slotEl => {
        slotEl.addEventListener('click', (e) => {
          // 이벤트 위임 처리 (자식인 piece를 클릭해도 부모 slot의 인덱스를 찾도록)
          const targetSlot = e.target.closest('.jigsaw-slot');
          if (!targetSlot) return;
          const sIdx = parseInt(targetSlot.dataset.slot);

          if (selected && selected.type === 'pool') {
            const pIdx = selected.index;
            const poolTarget = document.querySelector(`.jigsaw-pool .jigsaw-piece[data-idx="${pIdx}"]`);
            slots[sIdx] = { id: poolTarget.dataset.id, text: poolTarget.innerText, poolIdx: pIdx };
            clearSelection();
          } else if (selected && selected.type === 'slot') {
            const sIdx2 = selected.index;
            if (sIdx === sIdx2) {
              if (slots[sIdx]) slots[sIdx] = null; // 원래 자리로 빼기
              clearSelection();
            } else {
              // 두 슬롯 내용물 스왑
              const temp = slots[sIdx];
              slots[sIdx] = slots[sIdx2];
              slots[sIdx2] = temp;
              clearSelection();
            }
          } else {
            selected = { type: 'slot', index: sIdx };
          }
          updateUI();
        });
      });

      // 정답 확인 로직
      document.getElementById('submit-puzzle').addEventListener('click', () => {
        // 1번부터 9번까지 순서대로 채워졌는지 확인 ("123456789")
        const userAnswer = slots.map(s => s ? s.id : '').join('');
        
        if (userAnswer === "123456789") { // 프로토타입 임시 정답
          onComplete();
        } else {
          showModal("<p>서류가 아직 다 맞춰지지 않았습니다.<br>내용이 자연스럽게 이어지는지 확인해 보세요.</p><button id='retry-btn' class='custom-btn'>다시 시도</button>", false);
          document.getElementById('retry-btn').addEventListener('click', () => renderPuzzle());
        }
      });
    };

    return { ui, init };
  },

// 4. 보좌관의 일상 : 영문 크로스워드 (십자말풀이)
  crossword: (puzzle, onComplete) => {
    const cells = [
      { r: 0, c: 3, char: 'O', num: 1, circle: true }, 
      { r: 1, c: 3, char: 'C', prefilled: true },      
      { r: 2, c: 0, char: 'B', num: 2 },               
      { r: 2, c: 1, char: 'L', circle: true },
      { r: 2, c: 2, char: 'U' },
      { r: 2, c: 3, char: 'E' },                       
      { r: 2, c: 5, char: 'S', num: 3 },               
      { r: 3, c: 2, char: 'W', num: 4, prefilled: true },
      { r: 3, c: 3, char: 'A' },                       
      { r: 3, c: 4, char: 'V', circle: true },
      { r: 3, c: 5, char: 'E', circle: true },         
      { r: 4, c: 3, char: 'N' },
      { r: 4, c: 5, char: 'A' }
    ];

    let gridHtml = '';
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 6; c++) {
        const cellData = cells.find(cell => cell.r === r && cell.c === c);
        if (cellData) {
          const isPrefilled = cellData.prefilled ? `value="${cellData.char}" readonly class="cw-input prefilled"` : `class="cw-input"`;
          gridHtml += `
            <div class="cw-cell-wrapper ${cellData.circle ? 'cw-circle' : ''}">
              ${cellData.num ? `<span class="cw-number">${cellData.num}</span>` : ''}
              <input type="text" data-ans="${cellData.char}" maxlength="1" ${isPrefilled} />
            </div>
          `;
        } else {
          gridHtml += `<div class="cw-cell-wrapper cw-empty"></div>`;
        }
      }
    }

    const ui = `
      <div class="crossword-container">
        <div class="crossword-board">${gridHtml}</div>
        <div style="font-size: 12px; color: #8d6e63; margin-top: 15px;">동그라미 친 알파벳을 조합해 단어를 완성하세요</div>
        <div class="love-result-box" id="love-result-box">
          <input type="text" class="love-input" id="love-0" maxlength="1">
          <input type="text" class="love-input" id="love-1" maxlength="1">
          <input type="text" class="love-input" id="love-2" maxlength="1">
          <input type="text" class="love-input" id="love-3" maxlength="1">
        </div>
      </div>
    `;

    const init = () => {
      const allInputs = document.querySelectorAll('.cw-input, .love-input');
      allInputs.forEach(input => {
        input.addEventListener('input', function() {
          this.value = this.value.toUpperCase();
        });
      });

      // 💡 정답 제출 로직 (하단 LOVE 슬롯만 검사하도록 단순화됨!)
      document.getElementById('submit-puzzle').addEventListener('click', () => {
        
        // 하단 4칸의 입력값을 모아서 하나의 문자열로 만듦
        const loveAnswer = [0, 1, 2, 3].map(i => document.getElementById(`love-${i}`).value).join('');

        if (loveAnswer === puzzle.answer) {
          onComplete(); // 하단 단어만 맞으면 바로 통과!
        } else {
          showModal("<p>의미가 완성되지 않았습니다.<br>조합한 단어가 맞는지 확인해 보세요.</p><button id='retry-btn' class='custom-btn'>확인</button>", false);
          document.getElementById('retry-btn').addEventListener('click', () => renderPuzzle());
        }
      });
    };

    return { ui, init };
  },

// 5. 한밤중의 고백 : 빛과 그림자 (스위치 퍼즐)
  switch_light: (puzzle, onComplete) => {
    // 💡 5개의 촛불. 2번, 4번 촛불만 미리 켜진 상태로 시작
    let candles = [false, true, false, true, false];

    const ui = `
      <div class="shadow-wall" id="shadow-wall">
        <span id="wall-emoji" style="z-index: 1;">👥</span>
        <div id="dark-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: black; pointer-events: none; transition: opacity 0.5s ease-in-out; z-index: 2;"></div>
      </div>
      <div style="font-size: 12px; color: #8d6e63; margin-bottom: 15px;">촛불을 하나 켜면 주변의 불꽃도 함께 흔들립니다</div>
      <div class="candle-container">
        ${[0, 1, 2, 3, 4].map(i => `
          <button class="candle-btn" data-idx="${i}">
            <div class="candle-flame">🔥</div>
            🕯️
          </button>
        `).join('')}
      </div>
    `;

    const init = () => {
      const candleBtns = document.querySelectorAll('.candle-btn');
      const wall = document.getElementById('shadow-wall');
      const emoji = document.getElementById('wall-emoji');
      const overlay = document.getElementById('dark-overlay');

      // 💡 화면 업데이트 및 실시간 덮개(밝기) 조절 함수
      const updateUI = () => {
        let litCount = 0;
        
        candleBtns.forEach((btn, i) => {
          if (candles[i]) {
            btn.classList.add('lit');
            litCount++;
          } else {
            btn.classList.remove('lit');
          }
        });

        // 5개가 모두 켜졌을 때
        if (litCount === 5) {
          emoji.innerHTML = '❤️';
          wall.classList.add('heart-mode');
          overlay.style.opacity = '0'; // 덮개를 완전히 치워서 제일 밝게!
        } else {
          emoji.innerHTML = '👥'; 
          wall.classList.remove('heart-mode');
          
          // 💡 촛불이 0개면 덮개 투명도 0.9 (거의 암흑)
          // 촛불이 켜질 때마다 덮개가 점점 투명해짐 (방이 밝아짐)
          const darkness = 0.9 - (litCount * 0.18); 
          overlay.style.opacity = darkness.toString();
        }
      };

      // 촛불 클릭 이벤트
      candleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.currentTarget.dataset.idx);
          
          candles[idx] = !candles[idx];
          if (idx - 1 >= 0) candles[idx - 1] = !candles[idx - 1];
          if (idx + 1 < 5)  candles[idx + 1] = !candles[idx + 1];
          
          updateUI();
        });
      });

      // 초기 화면 렌더링
      updateUI();

      // 풀기 버튼
      document.getElementById('submit-puzzle').addEventListener('click', () => {
        const isAllLit = candles.every(state => state === true);
        
        if (isAllLit) {
          onComplete(); 
        } else {
          showModal("<p>아직 방이 완전히 밝혀지지 않았습니다.<br>마음이 맞닿는 순간을 찾아보세요.</p><button id='retry-btn' class='custom-btn'>확인</button>", false);
          document.getElementById('retry-btn').addEventListener('click', () => hideModal());
        }
      });
    };

    return { ui, init };
  },

// 6. 첫 데이트 : 바다 위의 입맞춤 (나침반 돌리기)
  compass: (puzzle, onComplete) => {
    let currentDeg = 0; // 초기 각도 (0도 = N)
    
    // 💡 45도 단위로 8방위 매핑
    const directions = {
      0: 'N', 45: 'NE', 90: 'E', 135: 'SE',
      180: 'S', 225: 'SW', 270: 'W', 315: 'NW'
    };

    const ui = `
      <div class="compass-container">
        <div class="compass-wrapper">
          <div class="compass-mark mark-n">N</div>
          <div class="compass-mark mark-e">E</div>
          <div class="compass-mark mark-s">S</div>
          <div class="compass-mark mark-w">W</div>
          <div class="compass-needle" id="compass-needle"></div>
          <div class="compass-center"></div>
        </div>
        <div style="font-size: 12px; color: #8d6e63; margin-bottom: 15px;">버튼을 눌러 뱃머리의 방향을 맞추세요</div>
        <div class="compass-btn-group">
          <button class="compass-btn" id="btn-ccw">↺</button>
          <button class="compass-btn" id="btn-cw">↻</button>
        </div>
      </div>
    `;

    const init = () => {
      const needle = document.getElementById('compass-needle');

      const updateNeedle = () => {
        needle.style.transform = `rotate(${currentDeg}deg)`;
      };

      // 왼쪽(반시계)으로 45도 회전
      document.getElementById('btn-ccw').addEventListener('click', () => {
        currentDeg -= 45;
        updateNeedle();
      });

      // 오른쪽(시계)으로 45도 회전
      document.getElementById('btn-cw').addEventListener('click', () => {
        currentDeg += 45;
        updateNeedle();
      });

      // 풀기 버튼 클릭
      document.getElementById('submit-puzzle').addEventListener('click', () => {
        // 현재 각도를 0~315 사이의 값으로 정규화 (ex. -45도는 315도(NW)로 변환)
        let normalizedDeg = ((currentDeg % 360) + 360) % 360;
        const userDir = directions[normalizedDeg];

        // 💡 data.js의 정답이 'S' 같은 알파벳이든, '180' 같은 각도든 둘 다 통과되도록 유연하게 검사
        if (userDir === puzzle.answer || normalizedDeg.toString() === puzzle.answer) {
          onComplete();
        } else {
          showModal("<p>배가 엉뚱한 곳을 향하고 있습니다.<br>도착해야 할 곳의 방향을 다시 떠올려보세요.</p><button id='retry-btn' class='custom-btn'>확인</button>", false);
          document.getElementById('retry-btn').addEventListener('click', () => {
            hideModal(); // 모달만 닫고 나침반 각도는 그대로 유지
          });
        }
      });
    };

    return { ui, init };
  },

// 7. 단골 바의 밤 : 취중 진담 (칵테일 제조기)
  cocktail: (puzzle, onComplete) => {
    // 💡 6개의 레시피 데이터 (필요한 재료의 '순서' 배열)
    const recipes = [
      { name: "사파이어 마티니", seq: ['base', 'syrup', 'syrup'], desc: "베이스 ➔ 시럽 ➔ 시럽" },
      { name: "선라이즈", seq: ['syrup', 'base', 'soda'], desc: "시럽 ➔ 베이스 ➔ 탄산" },
      { name: "오션 브리즈", seq: ['base', 'soda', 'syrup'], desc: "베이스 ➔ 탄산 ➔ 시럽" },
      { name: "블루 하와이", seq: ['syrup', 'syrup', 'soda'], desc: "시럽 ➔ 시럽 ➔ 탄산" },
      { name: "피치 크러쉬", seq: ['base', 'syrup', 'base'], desc: "베이스 ➔ 시럽 ➔ 베이스" },
      { name: "미드나잇 럼", seq: ['base', 'base', 'soda'], desc: "베이스 ➔ 베이스 ➔ 탄산" }
    ];

    // 마야가 순서대로 주문할 3잔의 칵테일
    const targetOrders = [recipes[0], recipes[1], recipes[2]];
    let currentRound = 0; 
    let currentMix = [];  

    const ui = `
      <div class="cocktail-container">
        <div class="recipe-note">
          <strong>📝 바텐더의 비밀 레시피</strong>
          <ul>
            ${recipes.map(r => `<li><strong>${r.name}</strong> : ${r.desc}</li>`).join('')}
          </ul>
        </div>
        
        <div class="order-board" id="order-board">
          마야의 주문 (1/3) : [${targetOrders[0].name}]
        </div>

        <div class="glass-station">
          <div class="cocktail-glass" id="cocktail-glass"></div>
        </div>

        <div class="bottle-group">
          <button class="bottle-btn" data-type="base">🍾 베이스</button>
          <button class="bottle-btn" data-type="syrup">🍯 시럽</button>
          <button class="bottle-btn" data-type="soda">🫧 탄산</button>
        </div>
        
        <button id="clear-glass-btn" style="background:transparent; border:none; text-decoration:underline; color:#a1887f; cursor:pointer; font-size:12px; margin-top:5px; font-family:inherit;">잔 비우기</button>
      </div>
    `;

    const init = () => {
      const submitBtn = document.getElementById('submit-puzzle');
      submitBtn.innerText = "제공하기";
      
      const glass = document.getElementById('cocktail-glass');
      const orderBoard = document.getElementById('order-board');
      
      const updateGlass = () => {
        glass.innerHTML = currentMix.map(type => `<div class="liquid-drop drop-${type}"></div>`).join('');
      };

      const updateOrder = () => {
        if(currentRound < 3) {
          orderBoard.innerText = `마야의 주문 (${currentRound + 1}/3) : [${targetOrders[currentRound].name}]`;
        }
      };

      document.querySelectorAll('.bottle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const type = e.target.dataset.type;
          if (currentMix.length < 3) { 
            currentMix.push(type);
            updateGlass();
          }
        });
      });

      document.getElementById('clear-glass-btn').addEventListener('click', () => {
        currentMix = [];
        updateGlass();
      });

      // 정답(제공하기) 확인 로직
      submitBtn.addEventListener('click', () => {
        // 💡 메시지가 떠 있는 1.5초 동안은 중복 클릭 방지
        if (submitBtn.disabled) return;

        const target = targetOrders[currentRound];
        const isCorrect = currentMix.join(',') === target.seq.join(',');

        if (isCorrect) {
          currentRound++;
          currentMix = [];
          updateGlass();
          
          if (currentRound >= 3) {
            // 3잔 모두 성공 시 모달을 닫으며 통과!
            onComplete();
          } else {
             // 💡 모달 대신 주문 현황판 글씨를 초록색으로 변경!
             orderBoard.style.background = 'rgba(76, 175, 80, 0.1)';
             orderBoard.style.color = '#388e3c';
             orderBoard.innerHTML = `"맛있어요 통령님!"<br><span style="font-size:11px;">(다음 잔 준비 중...)</span>`;
             
             submitBtn.disabled = true;

             // 1.5초 뒤에 다음 주문으로 변경
             setTimeout(() => {
               orderBoard.style.background = 'rgba(191, 54, 12, 0.05)';
               orderBoard.style.color = '#bf360c';
               updateOrder();
               submitBtn.disabled = false;
             }, 1500);
          }
        } else {
          // 💡 실패 시 주문 현황판 글씨를 붉은색으로 변경!
          orderBoard.style.background = 'rgba(244, 67, 54, 0.1)';
          orderBoard.style.color = '#d32f2f';
          orderBoard.innerHTML = `"맛이 조금 이상해요..."<br><span style="font-size:11px;">(다시 만들기)</span>`;

          currentMix = []; // 잔 강제 비우기
          updateGlass();
          submitBtn.disabled = true;

          // 1.5초 뒤에 원래 주문으로 복구
          setTimeout(() => {
            orderBoard.style.background = 'rgba(191, 54, 12, 0.05)';
            orderBoard.style.color = '#bf360c';
            updateOrder();
            submitBtn.disabled = false;
          }, 1500);
        }
      });

      updateOrder();
    };

    return { ui, init };
  },

// 8. 메디치 저택 : 함께하는 삶 (시계 태엽 맞추기)
  clock: (puzzle, onComplete) => {
    // 💡 초기 시간 설정 (오전 9시 15분)
    let currentH = 9;
    let currentM = 15;

    const ui = `
      <div class="clock-container">
        <div class="grandfather-clock">
          🕰️ 저택의 괘종시계
          <span class="gf-time">11 : 45</span>
        </div>
        
        <div class="watch-face">
          <div class="watch-mark mark-12">12</div>
          <div class="watch-mark mark-3">3</div>
          <div class="watch-mark mark-6">6</div>
          <div class="watch-mark mark-9">9</div>
          <div class="hand-hour" id="hand-hour"></div>
          <div class="hand-minute" id="hand-minute"></div>
          <div class="watch-center"></div>
        </div>

        <div class="digital-time" id="digital-time">09:15</div>
        
        <div style="font-size: 12px; color: #8d6e63; margin-bottom: 15px;">슬라이더를 움직여 시간을 맞추세요</div>

        <div style="width: 90%;">
          <div class="slider-row">
            <span class="slider-label">시침</span>
            <input type="range" class="time-slider" id="hour-slider" min="1" max="12" step="1" value="${currentH}">
          </div>
          <div class="slider-row">
            <span class="slider-label">분침</span>
            <input type="range" class="time-slider" id="minute-slider" min="0" max="55" step="5" value="${currentM}">
          </div>
        </div>
      </div>
    `;

    const init = () => {
      const hourSlider = document.getElementById('hour-slider');
      const minuteSlider = document.getElementById('minute-slider');
      const handHour = document.getElementById('hand-hour');
      const handMinute = document.getElementById('hand-minute');
      const digitalTime = document.getElementById('digital-time');

      // 시계 바늘과 텍스트 업데이트 함수
      const updateWatch = () => {
        // 💡 분침: 1분에 6도씩 회전
        const minuteDeg = currentM * 6;
        
        // 💡 시침: 1시간에 30도씩 회전 + 분침이 지나간 만큼(1분당 0.5도) 추가 이동 (디테일!)
        const hourDeg = (currentH % 12) * 30 + (currentM * 0.5);

        handHour.style.transform = `rotate(${hourDeg}deg)`;
        handMinute.style.transform = `rotate(${minuteDeg}deg)`;

        // 디지털 시간 텍스트 포맷
        const formattedH = currentH.toString().padStart(2, '0');
        const formattedM = currentM.toString().padStart(2, '0');
        digitalTime.innerText = `${formattedH}:${formattedM}`;
      };

      // 초기 렌더링
      updateWatch();

      // 시침 슬라이더 조작
      hourSlider.addEventListener('input', (e) => {
        currentH = parseInt(e.target.value);
        updateWatch();
      });

      // 분침 슬라이더 조작
      minuteSlider.addEventListener('input', (e) => {
        currentM = parseInt(e.target.value);
        updateWatch();
      });

      // 정답 확인 (11시 45분)
      document.getElementById('submit-puzzle').addEventListener('click', () => {
        if (currentH === 11 && currentM === 45) {
          onComplete();
        } else {
          showModal("<p>시간이 맞지 않습니다.<br>저택의 괘종시계가 가리키는 시간을 다시 확인해 보세요.</p><button id='retry-btn' class='custom-btn'>확인</button>", false);
          document.getElementById('retry-btn').addEventListener('click', () => hideModal());
        }
      });
    };

    return { ui, init };
  },

// 9. 축제의 밤 : 불꽃놀이 (별자리 회전하기)
  constellation: (puzzle, onComplete) => {
    // 초기 각도: 정답(0도)이 되지 않도록 90, 270, 180도로 섞어둠
    let angles = [90, 270, 180];
    
    // CSS 없이 그리는 순수 SVG 별자리 3개 (카시오페이아, 백조, 북두칠성 모티브)
    const svgs = [
      // 1번: W 모양 별자리
      `<svg viewBox="0 0 100 100"><polyline points="15,25 35,65 50,40 65,65 85,25" stroke="rgba(255,255,255,0.6)" stroke-width="2" fill="none"/><circle cx="15" cy="25" r="5" fill="#fff9c4"/><circle cx="35" cy="65" r="5" fill="#fff9c4"/><circle cx="50" cy="40" r="5" fill="#fff9c4"/><circle cx="65" cy="65" r="5" fill="#fff9c4"/><circle cx="85" cy="25" r="5" fill="#fff9c4"/></svg>`,
      // 2번: 십자가 모양 별자리
      `<svg viewBox="0 0 100 100"><polyline points="50,15 50,85" stroke="rgba(255,255,255,0.6)" stroke-width="2" fill="none"/><polyline points="20,40 80,40" stroke="rgba(255,255,255,0.6)" stroke-width="2" fill="none"/><circle cx="50" cy="15" r="5" fill="#fff9c4"/><circle cx="50" cy="40" r="5" fill="#fff9c4"/><circle cx="50" cy="85" r="5" fill="#fff9c4"/><circle cx="20" cy="40" r="5" fill="#fff9c4"/><circle cx="80" cy="40" r="5" fill="#fff9c4"/></svg>`,
      // 3번: 국자 모양 별자리
      `<svg viewBox="0 0 100 100"><polyline points="10,80 40,70 60,40 90,20" stroke="rgba(255,255,255,0.6)" stroke-width="2" fill="none"/><circle cx="10" cy="80" r="5" fill="#fff9c4"/><circle cx="40" cy="70" r="5" fill="#fff9c4"/><circle cx="60" cy="40" r="5" fill="#fff9c4"/><circle cx="90" cy="20" r="5" fill="#fff9c4"/></svg>`
    ];

    const ui = `
      <div class="night-sky-box" id="night-sky">
        <div style="font-size: 13px; color: #cfd8dc; margin-bottom: 5px;">밤하늘의 별자리를 터치해 수평을 맞추세요</div>
        <div class="constellation-wrapper">
          ${svgs.map((svg, i) => `
            <div class="constellation-item" id="const-${i}" data-idx="${i}" style="transform: rotate(${angles[i]}deg);">
              ${svg}
            </div>
          `).join('')}
        </div>
      </div>
    `;

    const init = () => {
      const items = document.querySelectorAll('.constellation-item');
      const sky = document.getElementById('night-sky');
      const submitBtn = document.getElementById('submit-puzzle');

      // 별자리 터치 시 90도 회전
      items.forEach(item => {
        item.addEventListener('click', (e) => {
          const idx = parseInt(e.currentTarget.dataset.idx);
          angles[idx] += 90; // 시계 방향으로 90도 누적 회전
          e.currentTarget.style.transform = `rotate(${angles[idx]}deg)`;
        });
      });

      // 정답 확인
      submitBtn.addEventListener('click', () => {
        // 모든 각도가 360으로 나누어 떨어지면(0도, 360도, 720도...) 정답
        const isCorrect = angles.every(a => a % 360 === 0);

        if (isCorrect) {
          // 중복 클릭 방지
          submitBtn.disabled = true; 
          
          // 폭죽 생성기 함수
          const createFirework = (emoji, left, top, delay) => {
            setTimeout(() => {
              const fw = document.createElement('div');
              fw.className = 'firework-emoji';
              fw.innerText = emoji;
              fw.style.left = left;
              fw.style.top = top;
              sky.appendChild(fw);
            }, delay);
          };

          // 시간차를 두고 펑! 펑! 터지는 연출
          createFirework('🎇', '15%', '30%', 0);
          createFirework('🎆', '65%', '40%', 300);
          createFirework('🎇', '40%', '10%', 600);
          createFirework('🎆', '25%', '50%', 900);
          createFirework('✨', '70%', '20%', 1200);

          // 불꽃놀이 감상 후 2.2초 뒤에 클리어 및 다음 챕터 이동
          setTimeout(() => {
            onComplete();
          }, 2200);

        } else {
          showModal("<p>별자리들이 아직 제자리를 찾지 못한 것 같습니다.<br>수평과 수직이 바르게 맞는지 확인해 보세요.</p><button id='retry-btn' class='custom-btn'>확인</button>", false);
          document.getElementById('retry-btn').addEventListener('click', () => hideModal());
        }
      });
    };

    return { ui, init };
  }
};