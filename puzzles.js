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

  //  1. 유년기 : 기호 맞추기 자물쇠
  symbol_lock: (puzzle, onComplete) => {
    const symbols = [
      { id: '빈칸', icon: '❔' },
      { id: '닻', icon: '⚓' },
      { id: '갈매기', icon: '🕊️' },
      { id: '물결', icon: '🌊' },
      { id: '달', icon: '🌙' },
      { id: '태양', icon: '☀️' },
      { id: '해파리', icon: '🪼' }
    ];

    let currentSelections = [0, 0, 0]; 

    const ui = `
      <div class="symbol-lock-container">
        <button class="symbol-btn" data-slot="0">${symbols[0].icon}</button>
        <button class="symbol-btn" data-slot="1">${symbols[0].icon}</button>
        <button class="symbol-btn" data-slot="2">${symbols[0].icon}</button>
      </div>
      <p style="font-size: 12px; color: #8d6e63; margin-top: 5px;">버튼을 눌러 그림을 맞추세요</p>
    `;

    const init = () => {
      document.querySelectorAll('.symbol-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const slot = parseInt(e.target.dataset.slot);
          
          currentSelections[slot] = (currentSelections[slot] + 1) % symbols.length;
          
          e.target.innerText = symbols[currentSelections[slot]].icon;
        });
      });

      document.getElementById('submit-puzzle').addEventListener('click', () => {
        const userAnswer = currentSelections.map(idx => symbols[idx].id).join('-');
        
        if (userAnswer === puzzle.answer) {
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
    const iconData = [
      { id: '파도', emoji: '🌊' },
      { id: '검', emoji: '⚔️' },
      { id: '닻', emoji: '⚓' },
      { id: '별', emoji: '⭐' },
      { id: '방패', emoji: '🛡️' },
      { id: '연장', emoji: '🛠️' },
    ];

    let slots = [null, null, null]; 
    let selected = null; 

    const ui = `
      <div class="icon-slot-container">
        <div class="icon-slot" data-slot="0"></div>
        <div class="icon-slot" data-slot="1"></div>
        <div class="icon-slot" data-slot="2"></div>
      </div>
      <div class="icon-pool" id="icon-pool">
        ${iconData.map((item, idx) => `
          <div class="pool-icon" data-id="${item.id}" data-emoji="${item.emoji}" data-idx="${idx}">${item.emoji}</div>
        `).join('')}
      </div>
    `;

    const init = () => {
      const slotEls = document.querySelectorAll('.icon-slot');
      const poolEls = document.querySelectorAll('.pool-icon');

      const updateUI = () => {
        slotEls.forEach((slotEl, i) => {
          if (slots[i]) {
            slotEl.innerText = slots[i].emoji;
            slotEl.classList.add('filled');
          } else {
            slotEl.innerText = '';
            slotEl.classList.remove('filled');
          }
          slotEl.classList.remove('selected');
        });

        const usedIdxs = slots.filter(s => s !== null).map(s => parseInt(s.poolIdx));
        poolEls.forEach((poolEl, i) => {
          if (usedIdxs.includes(i)) {
            poolEl.classList.add('invisible');
          } else {
            poolEl.classList.remove('invisible');
          }
          poolEl.classList.remove('selected');
        });

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

      poolEls.forEach(iconEl => {
        iconEl.addEventListener('click', (e) => {
          const pIdx = parseInt(e.target.dataset.idx);

          if (selected && selected.type === 'slot') {
            const sIdx = selected.index;
            slots[sIdx] = {
              id: iconEl.dataset.id,
              emoji: iconEl.dataset.emoji,
              poolIdx: pIdx
            };
            clearSelection();
          } else if (selected && selected.type === 'pool' && selected.index === pIdx) {
            clearSelection();
          } else {
            selected = { type: 'pool', index: pIdx };
          }
          updateUI();
        });
      });

      slotEls.forEach(slotEl => {
        slotEl.addEventListener('click', (e) => {
          const sIdx = parseInt(e.target.dataset.slot);

          if (selected && selected.type === 'pool') {
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
              if (slots[sIdx]) {
                slots[sIdx] = null;
              }
              clearSelection();
            } else {
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

// 3. 장마철의 악몽 : 찢어진 서류 맞추기 (위치 맞바꾸기 방식)
  jigsaw: (puzzle, onComplete) => {
    let pieces = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => ({ id: n.toString() }));
    pieces.sort(() => Math.random() - 0.5);

    let firstSelectedIndex = null; 

    const ui = `
      <div class="jigsaw-container">
        <div class="jigsaw-board single-grid" id="jigsaw-board">
          ${pieces.map((p, i) => `<div class="jigsaw-piece swap-mode" data-idx="${i}"></div>`).join('')}
        </div>
      </div>
    `;

    const init = () => {
      const pieceEls = document.querySelectorAll('.jigsaw-piece');

      const updateUI = () => {
        pieceEls.forEach((el, i) => {
          const pieceId = parseInt(pieces[i].id) - 1;
          const x = (pieceId % 3) * -50;
          const y = Math.floor(pieceId / 3) * -50;
          
          el.style.backgroundPosition = `${x}px ${y}px`;

          if (firstSelectedIndex === i) {
            el.classList.add('selected');
          } else {
            el.classList.remove('selected');
          }
        });
      };

      pieceEls.forEach(el => {
        el.addEventListener('click', (e) => {
          const clickedIdx = parseInt(e.currentTarget.dataset.idx);

          if (firstSelectedIndex === null) {
            firstSelectedIndex = clickedIdx;
          } else if (firstSelectedIndex === clickedIdx) {
            firstSelectedIndex = null;
          } else {
            const temp = pieces[firstSelectedIndex];
            pieces[firstSelectedIndex] = pieces[clickedIdx];
            pieces[clickedIdx] = temp;
            
            firstSelectedIndex = null; // 선택 초기화
          }
          updateUI();
        });
      });

      document.getElementById('submit-puzzle').addEventListener('click', () => {
        const currentOrder = pieces.map(p => p.id).join('');
        if (currentOrder === "123456789") {
          onComplete();
        } else {
          showModal("<p>서류의 내용이 아직 맞지 않습니다.<br>이미지를 잘 살펴보고 다시 시도해 보세요.</p><button id='retry-btn' class='custom-btn'>다시 풀기</button>", false);
          document.getElementById('retry-btn').addEventListener('click', () => renderPuzzle());
        }
      });

      updateUI(); 
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
        <div class="love-result-box" id="love-result-box">
          <input type="text" class="love-input" id="love-0" maxlength="1">
          <input type="text" class="love-input" id="love-1" maxlength="1">
          <input type="text" class="love-input" id="love-2" maxlength="1">
          <input type="text" class="love-input" id="love-3" maxlength="1">
        </div>
      </div>
    `;

const init = () => {
      const cwInputs = Array.from(document.querySelectorAll('.cw-input:not(.prefilled)'));
      cwInputs.forEach((input, index) => {
        input.addEventListener('input', function() {
          this.value = this.value.toUpperCase();
          if (this.value.length === 1 && index < cwInputs.length - 1) {
            cwInputs[index + 1].focus();
          }
        });

        input.addEventListener('keydown', function(e) {
          if (e.key === 'Backspace' && this.value === '' && index > 0) {
            cwInputs[index - 1].focus();
          }
        });
      });

      const loveInputs = document.querySelectorAll('.love-input');
      loveInputs.forEach((input, index) => {
        input.addEventListener('input', function() {
          this.value = this.value.toUpperCase();
          if (this.value.length === 1 && index < loveInputs.length - 1) {
            loveInputs[index + 1].focus();
          }
        });

        input.addEventListener('keydown', function(e) {
          if (e.key === 'Backspace' && this.value === '' && index > 0) {
            loveInputs[index - 1].focus();
          }
        });
      });

      document.getElementById('submit-puzzle').addEventListener('click', () => {
        const loveAnswer = [0, 1, 2, 3].map(i => document.getElementById(`love-${i}`).value).join('');

        if (loveAnswer === puzzle.answer) {
          onComplete(); 
        } else {
          showModal("<p>의미가 완성되지 않았습니다.<br>조합한 단어가 맞는지 확인해 보세요.</p><button id='retry-btn' class='custom-btn'>다시 풀기</button>", false);
          document.getElementById('retry-btn').addEventListener('click', () => renderPuzzle());
        }
      });
    };

    return { ui, init };
  },

  switch_light: (puzzle, onComplete) => {
    let candles = [true, false, true, true, false]; 

const ui = `
  <div class="shadow-wall shadow-blackout" id="shadow-wall">
    <div class="shadow-silhouette">
      <img src="assets/red_heart_3d.png" alt="heart" style="width: 50px; height: 50px; object-fit: contain;" onerror="this.outerHTML='♥️'">
    </div>
    <div id="dark-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; transition: opacity 0.5s ease-in-out; z-index: 2;"></div>
  </div>
  <div style="font-size: 12px; color: #8d6e63; margin-bottom: 15px;">촛불을 하나 켜면 주변의 불꽃도 함께 흔들립니다</div>
  <div class="candle-container">
    ${[0, 1, 2, 3, 4].map(i => `
      <button class="candle-btn" data-idx="${i}">
        <div class="candle-flame" style="top: -22px;">
          <img src="assets/fire_3d.png" alt="fire" style="width: 28px; height: 28px; object-fit: contain;" onerror="this.outerHTML='🔥'">
        </div>
        <img src="assets/candle_3d.png" alt="candle" style="width: 32px; height: 32px; object-fit: contain;" onerror="this.outerHTML='🕯️'">
      </button>
    `).join('')}
  </div>
`;

    const init = () => {
      const candleBtns = document.querySelectorAll('.candle-btn');
      const wall = document.getElementById('shadow-wall');
      const overlay = document.getElementById('dark-overlay');

      const updateUI = () => {
        let litCount = 0;
        candleBtns.forEach((btn, i) => {
          if (candles[i]) { btn.classList.add('lit'); litCount++; }
          else { btn.classList.remove('lit'); }
        });

        if (litCount === 5) {
          wall.classList.remove('shadow-blackout');
          wall.classList.add('heart-mode');
          overlay.style.opacity = '0.2'; 
        } else {
          wall.classList.add('shadow-blackout');
          wall.classList.remove('heart-mode');
          const darkness = 0.95 - (litCount * 0.15); 
          overlay.style.opacity = darkness.toString();
        }
      };

      candleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.currentTarget.dataset.idx);
          
          candles[idx] = !candles[idx];
          if (idx - 1 >= 0) candles[idx - 1] = !candles[idx - 1];
          if (idx + 1 < 5)  candles[idx + 1] = !candles[idx + 1];
          
          updateUI();
        });
      });

      updateUI(); 

      document.getElementById('submit-puzzle').addEventListener('click', () => {
        const isAllLit = candles.every(state => state === true);
        
        if (isAllLit) {
          onComplete(); 
        } else {
          showModal("<p>아직 방이 완전히 밝아지지 않았습니다.<br>마음이 맞닿는 순간을 찾아보세요.</p><button id='retry-btn' class='custom-btn'>다시 풀기</button>", false);
          document.getElementById('retry-btn').addEventListener('click', () => renderPuzzle());
        }
      });
    };

    return { ui, init };
  },

  compass: (puzzle, onComplete) => {
    let currentDeg = 0; 
    
    const ui = `
      <div class="compass-container">
        <div class="compass-wrapper">
          <div class="compass-dial">
            <div class="compass-mark mark-n">N</div>
            <div class="compass-mark mark-e">E</div>
            <div class="compass-mark mark-s">S</div>
            <div class="compass-mark mark-w">W</div>
          </div>
          <div class="compass-needle-fixed"></div>
          
          <div class="compass-overlay" id="compass-overlay">
            <div class="lubber-line"></div>
          </div>
          
          <div class="compass-center"></div>
        </div>
        <div class="compass-btn-group">
          <button class="compass-btn" id="btn-ccw" title="왼쪽으로 회전">↺</button>
          <button class="compass-btn" id="btn-cw" title="오른쪽으로 회전">↻</button>
        </div>
      </div>
    `;

    const init = () => {
      const overlay = document.getElementById('compass-overlay');
      const updateOverlay = () => { overlay.style.transform = `rotate(${currentDeg}deg)`; };

      document.getElementById('btn-ccw').addEventListener('click', () => { currentDeg -= 45; updateOverlay(); });
      document.getElementById('btn-cw').addEventListener('click', () => { currentDeg += 45; updateOverlay(); });

      document.getElementById('submit-puzzle').addEventListener('click', () => {
        let normalizedDeg = ((currentDeg % 360) + 360) % 360;
        if (normalizedDeg === 270) {
          onComplete();
        } else {
          showModal("<p>배가 엉뚱한 곳을 향하고 있습니다.<br>조준선(▲)을 정확한 방향으로 맞추세요.</p><button id='retry-btn' class='custom-btn'>다시 풀기</button>", false);
          document.getElementById('retry-btn').addEventListener('click', () => renderPuzzle());
        }
      });
    };
    return { ui, init };
  },

// 7. 단골 바의 밤 : 취중 진담 (칵테일 제조기)
  cocktail: (puzzle, onComplete) => {
    const recipes = [
      { name: "사파이어 마티니", seq: ['base', 'syrup', 'syrup'], mayaDesc: "보석처럼 푸른 바다를 한 잔에 담아낸 것 같아요." },
      { name: "선라이즈", seq: ['syrup', 'base', 'soda'], mayaDesc: "수평선 너머로 해가 떠오르는 아침의 설렘이 느껴져요." },
      { name: "오션 브리즈", seq: ['base', 'soda', 'syrup'], mayaDesc: "바다에서 불어오는 시원한 산들바람 같은 맛이에요." },
      { name: "블루 하와이", seq: ['syrup', 'syrup', 'soda'], mayaDesc: "이국적인 섬의 해변가에서 휴식을 취하는 기분이에요." },
      { name: "피치 크러쉬", seq: ['base', 'syrup', 'base'], mayaDesc: "달콤한 복숭아 향이 입안 가득 퍼지는 사랑스러운 맛이에요." },
      { name: "미드나잇 럼", seq: ['base', 'base', 'soda'], mayaDesc: "깊고 고요한 밤바다의 신비로움을 머금은 듯해요." }
    ];

    const shuffled = [...recipes].sort(() => Math.random() - 0.5);
    const targetOrders = shuffled.slice(0, 3);
    
    let currentRound = 0; 
    let currentMix = [];  

const ui = `
  <div class="cocktail-container">
    <div class="recipe-note">
      <strong>바텐더의 레시피</strong>
      <ul style="list-style: none; padding-left: 0; margin-top: 5px; font-size: 11px;">
        ${recipes.map(r => `<li>• <strong>${r.name}</strong> : ${r.seq.map(s => s === 'base' ? '🍾' : s === 'syrup' ? '🍯' : '🫧').join('➔')}</li>`).join('')}
      </ul>
    </div>
    
    <div class="order-board" id="order-board"></div>

    <div class="cocktail-main-area" style="display: flex; justify-content: space-around; align-items: center; width: 100%; margin-top: 15px;">
      
<div class="glass-station" style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
        <div class="cocktail-glass" id="cocktail-glass"></div>
        <button id="clear-glass-btn">[잔 비우기]</button> </div>

      <div class="bottle-group" style="display: flex; flex-direction: column; gap: 8px;">
        <button class="bottle-btn" data-type="base">🍾 베이스</button>
        <button class="bottle-btn" data-type="syrup">🍯 시럽</button>
        <button class="bottle-btn" data-type="soda">🫧 탄산</button>
      </div>
      
    </div>
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
          orderBoard.innerHTML = `<span style="font-style: italic;">"${targetOrders[currentRound].mayaDesc}"</span>`;
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

      submitBtn.addEventListener('click', () => {
        if (submitBtn.disabled) return;

        const target = targetOrders[currentRound];
        const isCorrect = currentMix.join(',') === target.seq.join(',');

        if (isCorrect) {
          currentRound++;
          currentMix = [];
          updateGlass();
          
          if (currentRound >= 3) {
            onComplete();
          } else {
             orderBoard.style.background = 'rgba(76, 175, 80, 0.1)';
             orderBoard.style.color = '#388e3c';
             orderBoard.innerHTML = `<strong>"✨<br>정말 맛있어요, 한 잔 더 주문할래요!"</strong>`;
             
             submitBtn.disabled = true;

             setTimeout(() => {
               orderBoard.style.background = 'rgba(191, 54, 12, 0.05)';
               orderBoard.style.color = '#bf360c';
               updateOrder();
               submitBtn.disabled = false;
             }, 1500);
          }
        } else {
          orderBoard.style.background = 'rgba(244, 67, 54, 0.1)';
          orderBoard.style.color = '#d32f2f';
          orderBoard.innerHTML = `<strong>"💦<br>음... 맛이 좀 이상해요..."</strong>`;

          currentMix = [];
          updateGlass();
          submitBtn.disabled = true;

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
    let currentH = 7;
    let currentM = 20;

    const ui = `
      <div class="clock-container">
        <div class="grandfather-clock">
          저택의 시계
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
      const updateWatch = () => {
        const minuteDeg = currentM * 6;

        const hourDeg = (currentH % 12) * 30 + (currentM * 0.5);

        handHour.style.transform = `rotate(${hourDeg}deg)`;
        handMinute.style.transform = `rotate(${minuteDeg}deg)`;

      };

      updateWatch();

      hourSlider.addEventListener('input', (e) => {
        currentH = parseInt(e.target.value);
        updateWatch();
      });

      minuteSlider.addEventListener('input', (e) => {
        currentM = parseInt(e.target.value);
        updateWatch();
      });

      document.getElementById('submit-puzzle').addEventListener('click', () => {
        if (currentH === 11 && currentM === 45) {
          onComplete();
        } else {
          showModal("<p>시간이 맞지 않습니다.<br>저택의 시계가 가리키는 시간을 다시 확인해 보세요.</p><button id='retry-btn' class='custom-btn'>다시 풀기</button>", false);
          document.getElementById('retry-btn').addEventListener('click', () => renderPuzzle());
        }
      });
    };

    return { ui, init };
  },

// 9. 축제의 밤 : 인파 속 길 찾기 (파이프라인)
  pipeline: (puzzle, onComplete) => {
    const svgI = `<svg viewBox="0 0 100 100"><line x1="50" y1="0" x2="50" y2="100" stroke="#fff9c4" stroke-width="14" stroke-linecap="square"/></svg>`;
    const svgL = `<svg viewBox="0 0 100 100"><path d="M 50 0 L 50 50 L 100 50" fill="none" stroke="#fff9c4" stroke-width="14" stroke-linecap="square" stroke-linejoin="miter"/></svg>`;
    const svgT = `<svg viewBox="0 0 100 100"><path d="M 0 50 L 100 50 M 50 50 L 50 100" fill="none" stroke="#fff9c4" stroke-width="14" stroke-linecap="square" stroke-linejoin="miter"/></svg>`;

    const tiles = [
      { type: 'T' }, { type: 'T' }, { type: 'L' }, { type: 'I' },
      { type: 'L' }, { type: 'T' }, { type: 'L' }, { type: 'T' },
      { type: 'L' }, { type: 'I' }, { type: 'L' }, { type: 'T' },
      { type: 'T' }, { type: 'L' }, { type: 'I' }, { type: 'L' }
    ];

    let currentAngles = tiles.map(() => Math.floor(Math.random() * 4) * 90);

    const ui = `
      <div class="night-sky-box" id="night-sky">
        <div class="path-puzzle-wrapper">
          <div class="path-entrance">➔</div>
          <div class="path-board">
            ${tiles.map((t, i) => {
              let svg = svgI;
              if (t.type === 'L') svg = svgL;
              if (t.type === 'T') svg = svgT;
              return `<div class="path-tile" data-idx="${i}" style="transform: rotate(${currentAngles[i]}deg);">${svg}</div>`;
            }).join('')}
          </div>
          <div class="path-exit">➔</div>
        </div>
      </div>
    `;

    const init = () => {
      const domTiles = document.querySelectorAll('.path-tile');
      const submitBtn = document.getElementById('submit-puzzle');

      domTiles.forEach(tile => {
        tile.addEventListener('click', (e) => {
          const idx = parseInt(e.currentTarget.dataset.idx);
          currentAngles[idx] += 90; 
          e.currentTarget.style.transform = `rotate(${currentAngles[idx]}deg)`;
        });
      });

      const checkPath = () => {
        const getPorts = (type, angle) => {
          let base = type === 'I' ? [1, 0, 1, 0] : type === 'L' ? [1, 1, 0, 0] : [0, 1, 1, 1];
          const rotations = ((angle % 360) + 360) % 360 / 90;
          for (let i = 0; i < rotations; i++) {
            base.unshift(base.pop()); 
          }
          return base;
        };

        const board = tiles.map((t, i) => getPorts(t.type, currentAngles[i]));

        if (!board[0][3]) return false;

        let visited = new Set([0]);
        let queue = [0]; 

        while (queue.length > 0) {
          let curr = queue.shift();
          let r = Math.floor(curr / 4);
          let c = curr % 4;
          let ports = board[curr]; 

          if (ports[0] && r > 0) {
            let next = curr - 4;
            if (board[next][2] && !visited.has(next)) { visited.add(next); queue.push(next); }
          }
          if (ports[1]) {
            if (c < 3) {
              let next = curr + 1;
              if (board[next][3] && !visited.has(next)) { visited.add(next); queue.push(next); }
            } else if (c === 3 && curr === 15) {
              return true;
            }
          }

          if (ports[2] && r < 3) {
            let next = curr + 4;
            if (board[next][0] && !visited.has(next)) { visited.add(next); queue.push(next); }
          }

          if (ports[3] && c > 0) {
            let next = curr - 1;
            if (board[next][1] && !visited.has(next)) { visited.add(next); queue.push(next); }
          }
        }
        return false; 
      };

      submitBtn.addEventListener('click', () => {
        if (checkPath()) {
          submitBtn.disabled = true; 
          setTimeout(() => {
            onComplete();
          }, 500);
        } else {
          showModal("<p>길이 어딘가 끊어져 있습니다.<br>왼쪽 화살표에서 출발해 오른쪽 화살표로 빠져나가야 합니다.</p><button id='retry-btn' class='custom-btn'>다시 풀기</button>", false);
          document.getElementById('retry-btn').addEventListener('click', () => renderPuzzle());
        }
      });
    };

    return { ui, init };
  },

// 10. 청혼 : 영원을 약속하며 (영문 자물쇠)
  letter_lock: (puzzle, onComplete) => {
    let dials = [0, 0, 0, 0]; 

    const getChar = (idx) => String.fromCharCode(65 + idx);

    const ui = `
      <div class="metal-plate">
        <div class="metal-text">ANCHOR AND</div>
        <div class="dial-group">
          ${[0, 1, 2, 3].map(i => `
            <div class="dial-column">
              <button class="dial-btn btn-up" data-idx="${i}">▲</button>
              <div class="dial-letter" id="dial-${i}">A</div>
              <button class="dial-btn btn-down" data-idx="${i}">▼</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    const init = () => {
      const updateUI = () => {
        dials.forEach((val, i) => {
          document.getElementById(`dial-${i}`).innerText = getChar(val);
        });
      };

      document.querySelectorAll('.btn-up').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.currentTarget.dataset.idx);
          dials[idx] = (dials[idx] + 1) % 26;
          updateUI();
        });
      });

      document.querySelectorAll('.btn-down').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.currentTarget.dataset.idx);
          dials[idx] = (dials[idx] - 1 + 26) % 26;
          updateUI();
        });
      });

      document.getElementById('submit-puzzle').addEventListener('click', () => {
        const userAnswer = dials.map(val => getChar(val)).join('');

        if (userAnswer === puzzle.answer) {
          onComplete();
        } else {
          showModal("<p>상자가 열리지 않습니다.<br>다시 시도해 볼까요?</p><button id='retry-btn' class='custom-btn'>다시 풀기</button>", false);
          document.getElementById('retry-btn').addEventListener('click', () => renderPuzzle());
        }
      });
    };

    return { ui, init };
  },
  memory_gem: (puzzle, onComplete) => {
    let currentRound = 1;
    const maxRounds = 3; 
    let sequence = [];   
    let playerStep = 0;  
    let isPlaying = false;    
    let isPlayerTurn = false; 

    const ui = `
      <div class="gem-container">
        <div class="gem-status" id="gem-status">아래의 '세공 시작' 버튼을 눌러주세요</div>
        <div class="gem-board">
          <div class="gem-btn gem-blue" data-idx="0"></div>
          <div class="gem-btn gem-yellow" data-idx="1"></div>
          <div class="gem-btn gem-white" data-idx="2"></div>
          <div class="gem-btn gem-purple" data-idx="3"></div>
        </div>
      </div>
    `;

    const init = () => {
      const submitBtn = document.getElementById('submit-puzzle');
      submitBtn.innerText = "세공 시작 (1라운드)";
      const status = document.getElementById('gem-status');
      const gems = document.querySelectorAll('.gem-btn');

      const generateSequence = () => {
        sequence = [];
        const seqLength = currentRound + 2; 
        const poolSize = currentRound + 1; 

        let allGems = [0, 1, 2, 3];
        for (let i = allGems.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allGems[i], allGems[j]] = [allGems[j], allGems[i]];
        }
        const activePool = allGems.slice(0, poolSize);

        sequence = [...activePool];

        const remaining = seqLength - poolSize;
        for(let i = 0; i < remaining; i++) {
          const randomPick = activePool[Math.floor(Math.random() * activePool.length)];
          sequence.push(randomPick);
        }

        for (let i = sequence.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
        }
      };

      const playSequence = async () => {
        isPlaying = true;
        isPlayerTurn = false;
        
        status.style.color = '#8b6508';
        status.style.background = 'rgba(139, 101, 8, 0.1)';
        status.innerText = `[라운드 ${currentRound}/${maxRounds}] 보석의 빛을 기억하세요...`;

        await new Promise(r => setTimeout(r, 600)); 

        for (let i = 0; i < sequence.length; i++) {
          const gemIdx = sequence[i];
          const gemEl = document.querySelector(`.gem-btn[data-idx="${gemIdx}"]`);

          gemEl.classList.add('active');
          await new Promise(r => setTimeout(r, 450)); 
          
          gemEl.classList.remove('active');
          await new Promise(r => setTimeout(r, 250)); 
        }

        isPlaying = false;
        isPlayerTurn = true;
        playerStep = 0;
        
        status.style.color = '#388e3c';
        status.style.background = 'rgba(76, 175, 80, 0.1)';
        status.innerText = "✨ 기억한 순서대로 보석을 터치하세요!";
      };

      submitBtn.addEventListener('click', () => {
        if (isPlaying || isPlayerTurn) return; 
        
        submitBtn.style.display = 'none'; 
        generateSequence();
        playSequence();
      });

      gems.forEach(gem => {
        gem.addEventListener('click', (e) => {
          if (!isPlayerTurn) return; 

          const idx = parseInt(e.currentTarget.dataset.idx);

          gem.classList.add('active');
          setTimeout(() => gem.classList.remove('active'), 200);

          if (idx === sequence[playerStep]) {
            playerStep++;
            
            if (playerStep === sequence.length) {
              isPlayerTurn = false;
              
              if (currentRound === maxRounds) {
                status.innerText = "💍 완성! 반지가 찬란하게 빛납니다.";
                setTimeout(() => onComplete(), 1200);
              } else {
                currentRound++;
                status.innerText = "성공! 다음 세공을 준비합니다...";
                setTimeout(() => {
                  generateSequence();
                  playSequence();
                }, 1500);
              }
            }
} else {
  isPlayerTurn = false;
  status.style.color = '#d32f2f';
  status.style.background = 'rgba(244, 67, 54, 0.1)';
  status.innerText = "순서가 틀렸습니다. 다시 시도하세요.";

  showModal("<p>보석의 빛이 흐려졌습니다.<br>집중해서 순서를 다시 기억해 볼까요?</p><button id='retry-btn' class='custom-btn'>다시 시도</button>", false);
  document.getElementById('retry-btn').addEventListener('click', () => {
    renderPuzzle(); 
  });
}
        });
      });
    };

    return { ui, init };
  },

// 12. 최종장 : 바다 앞의 서약 (구글 맵 우편번호 찾기)
  finale_map: (puzzle, onComplete) => {
    const ui = `
      <div class="map-container">
        <iframe src="https://maps.google.com/maps?ll=40.1209,9.0129&z=8&t=m&hl=ko&output=embed" frameborder="0" allowfullscreen></iframe>
      </div>
      
      <div class="address-note">
        <div style="color:#8b6508; font-weight:bold; margin-bottom:5px;">📍:  Porto Flavia</div>

        Frazione Masua,<br>
        <div class="postal-group">
          <input type="number" class="postal-input" maxlength="1" oninput="if(this.value.length>1) this.value=this.value.slice(0,1);">
          <input type="number" class="postal-input" maxlength="1" oninput="if(this.value.length>1) this.value=this.value.slice(0,1);">
          <input type="number" class="postal-input" maxlength="1" oninput="if(this.value.length>1) this.value=this.value.slice(0,1);">
          <input type="number" class="postal-input" maxlength="1" oninput="if(this.value.length>1) this.value=this.value.slice(0,1);">
          <input type="number" class="postal-input" maxlength="1" oninput="if(this.value.length>1) this.value=this.value.slice(0,1);">
        </div>
        Masua CI, Italy
      </div>
    `;

    const init = () => {
      const inputs = document.querySelectorAll('.postal-input');
      const submitBtn = document.getElementById('submit-puzzle');
      submitBtn.innerText = "식장으로 향하기"; 

      inputs.forEach((input, index) => {
        input.addEventListener('input', function() {
          if (this.value.length === 1 && index < inputs.length - 1) inputs[index + 1].focus();
        });
        input.addEventListener('keydown', function(e) {
          if (e.key === 'Backspace' && this.value === '' && index > 0) inputs[index - 1].focus();
        });
      });

      submitBtn.addEventListener('click', () => {
        const userAnswer = Array.from(inputs).map(i => i.value).join('');

        if (userAnswer === puzzle.answer) {
          onComplete(); 
        } else {
          showModal("<p>우편번호가 맞지 않습니다.<br>구글 맵에서 Porto Flavia의 정확한 주소를 다시 확인해 보세요.</p><button id='retry-btn' class='custom-btn'>다시 풀기</button>", false);
          document.getElementById('retry-btn').addEventListener('click', () => {
            renderPuzzle(); 
          });
        }
      });
    };

    return { ui, init };
  }
};
