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
          showWrongAnswer("비밀번호가 맞지 않습니다.");
        }
      });
    };

    return { ui, init };
  },

  //  1. 유년기 : 기호 맞추기 자물쇠
  symbol_lock: (puzzle, onComplete) => {
    // 💡 '빈칸(❔)'을 없애고 훼이크용 '케이크(🍰)'를 추가했습니다!
    const symbols = [
      { id: '케이크', icon: '🍰' },
      { id: '닻', icon: '⚓' },
      { id: '갈매기', icon: '🕊️' },
      { id: '물결', icon: '🌊' },
      { id: '달', icon: '🌙' },
      { id: '태양', icon: '☀️' },
      { id: '해파리', icon: '🪼' }
    ];

    let currentSelections = [0, 0, 0];

    // 💡 초기 상태를 '중복 없고 정답이 아닌 랜덤 기호'로 세팅하는 함수
    const setRandomInitialState = () => {
      while (true) {
        // 0부터 6까지의 인덱스를 무작위로 섞어서 앞의 3개를 가져옵니다.
        let pool = [0, 1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5);
        currentSelections = [pool[0], pool[1], pool[2]];
        
        // 현재 뽑힌 랜덤 기호들이 혹시라도 정답과 우연히 일치하는지 확인합니다.
        const currentAns = currentSelections.map(idx => symbols[idx].id).join('-');
        if (currentAns !== puzzle.answer) {
          break; // 정답이 아니라면 이 랜덤 배열로 확정! (루프 탈출)
        }
      }
    };
    
    // UI를 그리기 전에 랜덤 초기값을 먼저 세팅합니다.
    setRandomInitialState();

    // 💡 하드코딩된 아이콘 대신, 위에서 뽑힌 랜덤 인덱스의 아이콘을 보여줍니다.
    const ui = `
      <div class="symbol-lock-container">
        <button class="symbol-btn" data-slot="0">${symbols[currentSelections[0]].icon}</button>
        <button class="symbol-btn" data-slot="1">${symbols[currentSelections[1]].icon}</button>
        <button class="symbol-btn" data-slot="2">${symbols[currentSelections[2]].icon}</button>
      </div>
    `;

    const init = () => {
      document.querySelectorAll('.symbol-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const slot = parseInt(e.target.dataset.slot);
          
          // 클릭할 때마다 다음 기호로 넘어감
          currentSelections[slot] = (currentSelections[slot] + 1) % symbols.length;
          
          e.target.innerText = symbols[currentSelections[slot]].icon;
        });
      });

      document.getElementById('submit-puzzle').addEventListener('click', () => {
        const userAnswer = currentSelections.map(idx => symbols[idx].id).join('-');
        
        if (userAnswer === puzzle.answer) {
          onComplete();
        } else {
          showWrongAnswer("상자가 열리지 않습니다.<br>기호의 종류와 순서를 확인하세요.");
        }
      });
    };

    return { ui, init };
  },

// 2. 파도 기사단 입단 : 물의 마력 불어넣기 (스크래치 캔버스)
  water_reveal: (puzzle, onComplete) => {
    
    // 💡 깜빡이는 가짜 커서 애니메이션을 위한 스타일 추가!
    const ui = `
      <style>
        @keyframes fake-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .fake-cursor {
          display: inline-block;
          width: 2px;
          height: 18px;
          background-color: #bf360c; /* 포인트 색상 */
          vertical-align: middle;
          animation: fake-blink 1s step-end infinite;
          margin-left: 2px;
        }
      </style>

      <div class="water-reveal-container">
        <div class="hidden-letter">
          <div class="letter-text">
            <p>사관학교를 무사히 졸업하고 <span class="magic-ink m-1">파</span>도 <span class="magic-ink m-4">기</span>사단에 정식으로 발을 들이는 것을 보니 감회가 새롭구나.</p>
            <p>기<span class="magic-ink m-5">사</span>단에 몸담는다는 건 네 짐작보다 훨씬 무겁고 험난한 일일 테지. 하지만 스스로 맹세한 길이니, 거침없이 나아가 사르디나<span class="magic-ink m-3">의</span> 가장 무거운 닻을 지키는 파<span class="magic-ink m-2">도</span>가 되길 바란다.</p>
          </div>
          <div class="letter-code">로잔나 데 메디치로부터</div>
        </div>
        <canvas id="scratch-canvas" class="scratch-canvas"></canvas>
      </div>
      
      <div class="magic-slot-group" style="position: relative;">
        <input type="text" id="hidden-magic-input" maxlength="5" autocomplete="off" spellcheck="false"
               style="position: absolute; top:0; left:0; width: 100%; height: 100%; color: transparent; background: transparent; border: none; outline: none; caret-color: transparent; z-index: 10; font-size: 20px; cursor: pointer;">
        
        <div class="magic-slot fake-slot" style="line-height: 40px; pointer-events: none;"></div>
        <div class="magic-slot fake-slot" style="line-height: 40px; pointer-events: none;"></div>
        <div class="magic-slot fake-slot" style="line-height: 40px; pointer-events: none;"></div>
        <span class="magic-space"></span>
        <div class="magic-slot fake-slot" style="line-height: 40px; pointer-events: none;"></div>
        <div class="magic-slot fake-slot" style="line-height: 40px; pointer-events: none;"></div>
      </div>
    `;

    const init = () => {
      const canvas = document.getElementById('scratch-canvas');
      const ctx = canvas.getContext('2d');
      
      const hiddenInput = document.getElementById('hidden-magic-input');
      const fakeSlots = document.querySelectorAll('.fake-slot');
      const submitBtn = document.getElementById('submit-puzzle');

      canvas.width = 260;
      canvas.height = 160;

      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#ebe8e4'); 
      gradient.addColorStop(1, '#d9d5cc'); 
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let isDrawing = false;

      const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        let clientX = e.clientX;
        let clientY = e.clientY;

        if (e.touches && e.touches.length > 0) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        }

        return {
          x: (clientX - rect.left) * scaleX,
          y: (clientY - rect.top) * scaleY
        };
      };

      const scratch = (e) => {
        if (!isDrawing) return;
        const pos = getPos(e);
        
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        
        const radGrad = ctx.createRadialGradient(pos.x, pos.y, 5, pos.x, pos.y, 25);
        radGrad.addColorStop(0, 'rgba(0,0,0,1)');
        radGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = radGrad;
        
        ctx.arc(pos.x, pos.y, 25, 0, Math.PI * 2);
        ctx.fill();
      };

      const startMouseScratch = (e) => {
        isDrawing = true;
        scratch(e);
        document.addEventListener('mousemove', scratch);
        document.addEventListener('mouseup', stopMouseScratch);
      };

      const stopMouseScratch = () => {
        isDrawing = false;
        document.removeEventListener('mousemove', scratch);
        document.removeEventListener('mouseup', stopMouseScratch);
      };

      canvas.addEventListener('mousedown', startMouseScratch);

      canvas.addEventListener('touchstart', (e) => {
        isDrawing = true;
        scratch(e);
      }, { passive: false });
      
      canvas.addEventListener('touchmove', (e) => {
        if(isDrawing) {
          if (e.cancelable) e.preventDefault();
          scratch(e);
        }
      }, { passive: false });
      
      canvas.addEventListener('touchend', () => { isDrawing = false; });
      canvas.addEventListener('touchcancel', () => { isDrawing = false; });

      // 💡 가짜 슬롯과 깜빡이는 커서 업데이트 로직
      const updateSlots = () => {
        hiddenInput.value = hiddenInput.value.replace(/\s/g, ''); 
        const val = hiddenInput.value;
        const isFocused = document.activeElement === hiddenInput; // 현재 입력창이 선택되었는지 확인
        
        fakeSlots.forEach((slot, index) => {
          let content = val[index] || '';
          
          // 커서가 위치할 칸 판별 (글자가 채워질 다음 칸, 또는 다 찼을 땐 마지막 칸)
          let isCursorHere = false;
          if (isFocused) {
            if (val.length === index) isCursorHere = true;
            if (val.length === 5 && index === 4) isCursorHere = true;
          }

          // 커서가 있는 칸이면 내용물 뒤에 깜빡이는 span 막대기를 붙여줌!
          if (isCursorHere) {
            slot.innerHTML = content + '<span class="fake-cursor"></span>';
            slot.style.borderBottom = '3px solid #bf360c';
            slot.style.backgroundColor = '#fbe9e7';
          } else {
            // 커서가 없으면 그냥 글자만 보여줌
            slot.innerText = content;
            slot.style.borderBottom = '2px solid #a1887f';
            slot.style.backgroundColor = 'transparent';
          }
        });
      };

      // 상태 변화에 맞춰 즉각적으로 커서를 그려줍니다
      hiddenInput.addEventListener('input', updateSlots);
      hiddenInput.addEventListener('focus', updateSlots);
      hiddenInput.addEventListener('blur', updateSlots);

      submitBtn.addEventListener('click', () => {
        const userAnswer = hiddenInput.value; 

        if (userAnswer === puzzle.answer) {
          onComplete();
        } else {
          showWrongAnswer("글자를 다시 조합해 보세요.");
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
          const x = (pieceId % 3) * -60;
          const y = Math.floor(pieceId / 3) * -60;
          
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
          showWrongAnswer("서류의 내용이 아직 맞지 않습니다.<br>이미지를 잘 살펴보고 다시 시도해 보세요.");
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
          // 💡 HTML에 data-r(행), data-c(열) 좌표를 심어줍니다.
          gridHtml += `
            <div class="cw-cell-wrapper ${cellData.circle ? 'cw-circle' : ''}">
              ${cellData.num ? `<span class="cw-number">${cellData.num}</span>` : ''}
              <input type="text" data-ans="${cellData.char}" data-r="${r}" data-c="${c}" maxlength="1" ${isPrefilled} />
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
      const cwInputs = Array.from(document.querySelectorAll('.cw-input'));
      let currentDir = 'right'; // 기본 입력 방향 (가로)

      // 💡 현재 방향을 기준으로 다음 빈칸을 찾아주는 영리한 함수
      const getNext = (r, c, dir, step = 1) => {
        if (step > 6) return null; // 무한루프 방지
        let nr = dir === 'down' ? r + step : r;
        let nc = dir === 'right' ? c + step : c;
        let next = document.querySelector(`.cw-input[data-r="${nr}"][data-c="${nc}"]`);
        if (next) {
          // 이미 채워진 힌트 칸(prefilled)이면 그 너머의 다음 칸을 찾음!
          if (next.classList.contains('prefilled')) return getNext(r, c, dir, step + 1);
          return next;
        }
        return null;
      };

      const getPrev = (r, c, dir, step = 1) => {
        if (step > 6) return null;
        let nr = dir === 'down' ? r - step : r;
        let nc = dir === 'right' ? c - step : c;
        let prev = document.querySelector(`.cw-input[data-r="${nr}"][data-c="${nc}"]`);
        if (prev) {
          if (prev.classList.contains('prefilled')) return getPrev(r, c, dir, step + 1);
          return prev;
        }
        return null;
      };

      cwInputs.forEach(input => {
        if (!input.classList.contains('prefilled')) {
          
          // 💡 1. 겹치는 칸(예: A)을 클릭할 때 가로/세로 방향 토글
          input.addEventListener('click', function() {
            let r = parseInt(this.dataset.r);
            let c = parseInt(this.dataset.c);
            let hasRight = getNext(r, c, 'right');
            let hasDown = getNext(r, c, 'down');
            
            if (hasRight && hasDown) {
              currentDir = currentDir === 'right' ? 'down' : 'right';
            } else if (hasRight) {
              currentDir = 'right';
            } else if (hasDown) {
              currentDir = 'down';
            }
          });

          // 💡 2. 키보드 방향키 및 백스페이스 지원!
          input.addEventListener('keydown', function(e) {
            let r = parseInt(this.dataset.r);
            let c = parseInt(this.dataset.c);
            
            if (e.key === 'ArrowRight') { currentDir = 'right'; let n = getNext(r, c, 'right'); if(n) { n.focus(); e.preventDefault(); } }
            else if (e.key === 'ArrowDown') { currentDir = 'down'; let n = getNext(r, c, 'down'); if(n) { n.focus(); e.preventDefault(); } }
            else if (e.key === 'ArrowLeft') { currentDir = 'right'; let n = getPrev(r, c, 'right'); if(n) { n.focus(); e.preventDefault(); } }
            else if (e.key === 'ArrowUp') { currentDir = 'down'; let n = getPrev(r, c, 'down'); if(n) { n.focus(); e.preventDefault(); } }
            else if (e.key === 'Backspace' && this.value === '') {
              let p = getPrev(r, c, currentDir);
              if (p) { p.focus(); e.preventDefault(); }
            }
          });

          // 💡 3. 타이핑 시 자동 넘어가기 (방향 유지)
          input.addEventListener('input', function() {
            this.value = this.value.toUpperCase();
            if (this.value.length === 1) {
              let r = parseInt(this.dataset.r);
              let c = parseInt(this.dataset.c);
              
              let n = getNext(r, c, currentDir);
              
              // 현재 방향에 다음 칸이 없으면 반대 방향(가로<->세로) 탐색
              if (!n) {
                let altDir = currentDir === 'right' ? 'down' : 'right';
                let altN = getNext(r, c, altDir);
                if (altN) {
                  currentDir = altDir;
                  n = altN;
                }
              }
              if (n) n.focus();
            }
          });
        }
      });

      // 하단 LOVE 슬롯 로직 (변경 없음)
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
          showWrongAnswer("의미가 완성되지 않았습니다.<br>조합한 단어가 맞는지 확인해 보세요.");
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
          showWrongAnswer("아직 방이 완전히 밝아지지 않았습니다.<br>마음이 맞닿는 순간을 찾아보세요.");
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
          showWrongAnswer("배가 엉뚱한 곳을 향하고 있습니다.<br>조준선(▲)을 정확한 방향으로 맞추세요.");
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
          showWrongAnswer("시각을 다시 확인해 보세요.");
        }
      });
    };

    return { ui, init };
  },

// 9. 축제의 밤 : 인파 속 길 찾기 (파이프라인)
  pipeline: (puzzle, onComplete) => {
    const svgI = `<svg viewBox="0 0 100 100" style="width: 100%; height: 100%; display: block;"><line x1="50" y1="0" x2="50" y2="100" stroke="#fff9c4" stroke-width="14" stroke-linecap="square"/></svg>`;
    const svgL = `<svg viewBox="0 0 100 100" style="width: 100%; height: 100%; display: block;"><path d="M 50 0 L 50 50 L 100 50" fill="none" stroke="#fff9c4" stroke-width="14" stroke-linecap="square" stroke-linejoin="miter"/></svg>`;
    const svgT = `<svg viewBox="0 0 100 100" style="width: 100%; height: 100%; display: block;"><path d="M 0 50 L 100 50 M 50 50 L 50 100" fill="none" stroke="#fff9c4" stroke-width="14" stroke-linecap="square" stroke-linejoin="miter"/></svg>`;

    // 🚀 [지름길 차단 5x5 설계]
    // 5번(입구 바로 아래)을 좌우(90도)로 고정하여 수직 낙하를 막고, 
    // 23번(출구 바로 왼쪽)을 상좌(270도)로 고정하여 직진을 막았습니다.
    const tiles = [
      { type: 'L' }, { type: 'I' }, { type: 'L' }, { type: 'I' }, { type: 'L' }, // 0~4
      { type: 'I', fixed: true, angle: 0 }, { type: 'L' }, { type: 'L', fixed: true, angle: 270 }, { type: 'T' }, { type: 'L' }, // 5~9 (5번: 가로 고정 - 수직 차단)
      { type: 'L' }, { type: 'L', fixed: true, angle: 270 }, { type: 'L' }, { type: 'L' }, { type: 'T' }, // 10~14 (11번: 상하좌우 조절용)
      { type: 'I', fixed: true, angle: 0 }, { type: 'L' }, { type: 'T', fixed: true, angle: 0 }, { type: 'I' }, { type: 'L' }, // 15~19
      { type: 'L' }, { type: 'I' }, { type: 'L' }, { type: 'I' }, { type: 'T' }  // 20~24 (23번: 상좌 고정 - 우측 직진 차단)
    ];

    let currentAngles = tiles.map(t => t.fixed ? t.angle : Math.floor(Math.random() * 4) * 90);

    const ui = `
      <div class="night-sky-box" id="night-sky">
        <div class="path-puzzle-wrapper" style="display: flex; align-items: center; justify-content: center; width: 100%;">
          <div class="path-entrance" style="margin-right: 5px;">➔</div>
          
          <div class="path-board" style="
            display: grid; 
            grid-template-columns: repeat(5, 45px); 
            grid-template-rows: repeat(5, 45px); 
            width: 225px; height: 225px;
            background: #1a1a24; 
            border: 2px solid #2a2a3a;
            overflow: hidden;
            line-height: 0;
          ">
            ${tiles.map((t, i) => {
              let svg = (t.type === 'L') ? svgL : (t.type === 'T') ? svgT : svgI;
              let extraClass = t.fixed ? 'fixed-pipe' : '';
              
              return `
                <div class="path-tile ${extraClass}" data-idx="${i}" style="
                  width: 45px; height: 45px; 
                  transform: rotate(${currentAngles[i]}deg); 
                  display: block; box-sizing: border-box; 
                  border: 0.1px solid rgba(255,255,255,0.05);
                ">
                  ${svg}
                </div>`;
            }).join('')}
          </div>
          
          <div class="path-exit" style="margin-left: 5px;">➔</div>
        </div>
      </div>
    `;

    const init = () => {
      const domTiles = document.querySelectorAll('.path-tile');
      const submitBtn = document.getElementById('submit-puzzle');

      domTiles.forEach(tile => {
        tile.addEventListener('click', (e) => {
          const idx = parseInt(e.currentTarget.dataset.idx);
          if (tiles[idx].fixed) {
            e.currentTarget.animate([
              { transform: `rotate(${currentAngles[idx]}deg) scale(1)` },
              { transform: `rotate(${currentAngles[idx]}deg) scale(0.9)` },
              { transform: `rotate(${currentAngles[idx]}deg) scale(1)` }
            ], { duration: 150 });
            return;
          }
          currentAngles[idx] += 90; 
          e.currentTarget.style.transform = `rotate(${currentAngles[idx]}deg)`;
        });
      });

      const checkPath = () => {
        const getPorts = (type, angle) => {
          let base = type === 'I' ? [1, 0, 1, 0] : type === 'L' ? [1, 1, 0, 0] : [0, 1, 1, 1];
          const rotations = ((angle % 360) + 360) % 360 / 90;
          for (let i = 0; i < rotations; i++) { base.unshift(base.pop()); }
          return base;
        };

        const board = tiles.map((t, i) => getPorts(t.type, currentAngles[i]));
        if (!board[0][3]) return false; 

        let visited = new Set([0]);
        let queue = [0]; 

        while (queue.length > 0) {
          let curr = queue.shift();
          let r = Math.floor(curr / 5); 
          let c = curr % 5;             
          let ports = board[curr]; 

          if (ports[0] && r > 0) { // Up
            let next = curr - 5;
            if (board[next][2] && !visited.has(next)) { visited.add(next); queue.push(next); }
          }
          if (ports[1]) { // Right
            if (c < 4) {
              let next = curr + 1;
              if (board[next][3] && !visited.has(next)) { visited.add(next); queue.push(next); }
            } else if (c === 4 && curr === 24) return true; 
          }
          if (ports[2] && r < 4) { // Down
            let next = curr + 5;
            if (board[next][0] && !visited.has(next)) { visited.add(next); queue.push(next); }
          }
          if (ports[3] && c > 0) { // Left
            let next = curr - 1;
            if (board[next][1] && !visited.has(next)) { visited.add(next); queue.push(next); }
          }
        }
        return false; 
      };

      submitBtn.addEventListener('click', () => {
        if (checkPath()) {
          submitBtn.disabled = true; 
          setTimeout(() => { onComplete(); }, 500);
        } else {
          showWrongAnswer("길이 어딘가 끊어져 있습니다.<br>왼쪽 위에서 출발해 오른쪽 아래로 빠져나가야 합니다.");
        }
      });
    };

    return { ui, init };
  },

// 10. 청혼 : 영원을 약속하며 (영문 자물쇠)
  letter_lock: (puzzle, onComplete) => {
    let dials = [0, 0, 0, 0]; 

    const getChar = (idx) => String.fromCharCode(65 + idx);

    // 🚀 수정된 UI: 정방향 상자, 금박 텍스트, 하나의 판으로 된 자물쇠
    const ui = `
      <div class="velvet-box-new">
        <div class="gold-foil-text">ANCHOR AND</div>
        <div class="flat-brass-panel">
          <div class="brass-dial-group">
            ${[0, 1, 2, 3].map(i => `
              <div class="brass-dial-column">
                <button class="brass-dial-btn brass-btn-up" data-idx="${i}">▲</button>
                <div class="brass-dial-value" id="dial-${i}">A</div>
                <button class="brass-dial-btn brass-btn-down" data-idx="${i}">▼</button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    const init = () => {
      const updateUI = () => {
        dials.forEach((val, i) => {
          document.getElementById(`dial-${i}`).innerText = getChar(val);
        });
      };

      document.querySelectorAll('.brass-btn-up').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.currentTarget.dataset.idx);
          dials[idx] = (dials[idx] + 1) % 26;
          updateUI();
        });
      });

      document.querySelectorAll('.brass-btn-down').forEach(btn => {
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
          showWrongAnswer("자물쇠가 열리지 않습니다.<br>우리를 상징하는 단어를 떠올려 보세요.");
        }
      });
    };

    return { ui, init };
  },
  
// 11. 보석 세공
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
      // 💡 라운드 표시를 빼고 심플하게 변경했습니다.
      submitBtn.innerText = "세공 시작"; 
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
        status.innerText = `보석의 빛을 기억하세요...`; // 💡 여기도 라운드 표시 제거!

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
            status.innerText = "아래의 '세공 시작' 버튼을 눌러주세요";
            
// 💡 오답 시 버튼을 다시 살려내고 라운드를 1로 초기화합니다!
            currentRound = 1; 
            submitBtn.style.display = 'inline-block'; // ✨ inline-block으로 바꿔주세요!

            showWrongAnswer("보석의 빛이 흐려졌습니다.<br>집중해서 순서를 다시 기억해 볼까요?");
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
          <input type="number" class="postal-input" maxlength="1">
          <input type="number" class="postal-input" maxlength="1">
          <input type="number" class="postal-input" maxlength="1">
          <input type="number" class="postal-input" maxlength="1">
          <input type="number" class="postal-input" maxlength="1">
        </div>
        Masua CI, Italy
      </div>
    `;

    const init = () => {
      const inputs = document.querySelectorAll('.postal-input');
      const submitBtn = document.getElementById('submit-puzzle');
      submitBtn.innerText = "식장으로 향하기"; 

      inputs.forEach((input, index) => {
        // 💡 12장도 'keyup' 이벤트로 넘어가게 통일!
        input.addEventListener('keyup', function(e) {
          if (e.key === 'Backspace') return;
          if (this.value.length >= 1 && index < inputs.length - 1) {
            inputs[index + 1].focus();
          }
        });
        
        input.addEventListener('input', function(e) {
          if (this.value.length > 1) {
             this.value = this.value.slice(0, 1);
          }
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
          showWrongAnswer("구글 맵에서 Porto Flavia의 정확한 주소를 다시 확인해 보세요."); 
        }
      });
    };

    return { ui, init };
  }
};
