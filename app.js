(function() {
  document.addEventListener('contextmenu', function(e) {
    if (e.target.tagName === 'INPUT') return; 
    e.preventDefault();
  });

  document.addEventListener('dragstart', function(e) {
    if (e.target.tagName === 'INPUT') return; 
    e.preventDefault();
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
    }

    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
      e.preventDefault();
    }

    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
      e.preventDefault();
    }

    if ((e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u')) {
      e.preventDefault();
    }

    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
      e.preventDefault();
    }
  });
})();


let currentChapterIdx = parseInt(localStorage.getItem("chapter")) || 0;
let currentScriptIdx = 0;
let userNickname = localStorage.getItem("nickname") || ""; 
let isStoryMode = localStorage.getItem("storyMode") === "true"; // 💡 스토리모드 상태 저장
let bgmAudio = new Audio();
let typingInterval;
let isTyping = false;
let fadeInterval = null; 
let onModalCloseCallback = null; // 💡 모달 X버튼 클릭 시 실행할 콜백

const DOM = {
  startSection: document.getElementById('start-section'),
  gameSection: document.getElementById('game-section'),
  textWrapper: document.getElementById('text-wrapper'),
  textBox: document.getElementById('text-box'),
  nextBtn: document.getElementById('next-text-btn'),
  modalOverlay: document.getElementById('custom-modal-overlay'),
  modalContent: document.getElementById('modal-content'),
  modalCloseBtn: document.getElementById('modal-close-btn')
};

document.addEventListener('click', async (e) => {
  if (e.target && e.target.id === 'credit-btn') {
    const creditBtn = e.target;
    const creditOverlay = document.getElementById('ending-credit-overlay');
    const nameListContainer = document.getElementById('player-names-list');
    
    creditBtn.disabled = true;
    let dotCount = 0;
    const loadingInterval = setInterval(() => {
      dotCount = (dotCount + 1) % 4;
      const dots = ".".repeat(dotCount);
      creditBtn.innerText = `준비하는 중${dots}`;
    }, 400); 

    try {
      const data = await getCredits();

      if (data && data.length > 0) {
        // 일반 모드일 때만 내 닉네임을 찾아 맨 뒤로 재배치
        if (!isStoryMode) {
          let myIndex = -1;

          for (let i = data.length - 1; i >= 0; i--) {
            if (data[i] === userNickname || data[i].startsWith(userNickname + " (")) {
              myIndex = i;
              break;
            }
          }

          if (myIndex !== -1) {
            data.splice(myIndex, 1); 
          } 
        }

        // 💡 스토리모드일 때는 소중한 분 대신 강조색이 적용된 YOU 출력
        const creditTarget = isStoryMode ? "YOU" : userNickname;
        data.push(`and <span class="gold-name">${creditTarget}</span>`);
        
        nameListContainer.innerHTML = data.map(name => `<div class="credit-name">${name}</div>`).join('');
      } else {
        nameListContainer.innerHTML = "<p style='color:#888;'>첫 번째 클리어가 되어주셔서 감사합니다.</p>";
      }

    } catch (error) {
      console.error(error);
      nameListContainer.innerHTML = "<p style='color:#888;'>기록을 불러오지 못했습니다.</p>";
    } finally {
      clearInterval(loadingInterval);
      creditBtn.innerText = "🎬 엔딩 크레딧"; 
    }

    // 💡 엔딩 크레딧 화면 표시 및 스크롤 애니메이션 시작 함수
    const startEndingCredits = () => {
      if (creditOverlay) creditOverlay.classList.add('show');

      setTimeout(() => {
        const creditContent = document.getElementById('credit-content');
        const restartBtn = document.getElementById('restart-btn');
        
        if (creditContent && restartBtn) {
          
          const scrollAnim = creditContent.animate([
            { transform: 'translateY(0)' },
            { transform: 'translateY(-100%)' }
          ], {
            duration: 19000,
            fill: 'forwards',
            easing: 'linear'
          });

          const btnAnim = restartBtn.animate([
            { opacity: 0 },
            { opacity: 1 }
          ], {
            duration: 2000,
            delay: 19000,
            fill: 'forwards',
            easing: 'ease-in-out'
          });

          btnAnim.finished.then(() => {
            restartBtn.style.pointerEvents = 'all';
          });

          scrollAnim.finished.then(() => {
            bgmAudio.loop = false;
          });

          let isFast = false;
          const updateSpeed = () => {
            const rate = isFast ? 4.0 : 1.0;
            
            if (typeof scrollAnim.updatePlaybackRate === 'function') {
              scrollAnim.updatePlaybackRate(rate);
              btnAnim.updatePlaybackRate(rate);
            } else {
              scrollAnim.playbackRate = rate;
              btnAnim.playbackRate = rate;
            }
          };

          creditOverlay.addEventListener('mousedown', () => { isFast = true; updateSpeed(); });
          creditOverlay.addEventListener('mouseup', () => { isFast = false; updateSpeed(); });
          creditOverlay.addEventListener('mouseleave', () => { isFast = false; updateSpeed(); });
          
          creditOverlay.addEventListener('touchstart', () => { isFast = true; updateSpeed(); }, { passive: true });
          creditOverlay.addEventListener('touchend', () => { isFast = false; updateSpeed(); }, { passive: true });
          creditOverlay.addEventListener('touchcancel', () => { isFast = false; updateSpeed(); }, { passive: true });
        }
      }, 1500);
    };

    // 💡 이미 스토리모드인 경우 코드 안내 모달을 띄우지 않고 바로 엔딩 크레딧으로 이동
    if (isStoryMode) {
      startEndingCredits();
    } else {
      const codeNoticeHtml = `
        <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 220px; text-align: center;">
          <div style="font-family: 'Courier New', monospace; font-size: 22px; font-weight: bold; color: #bf360c; letter-spacing: 3px; background: rgba(141, 110, 99, 0.12); padding: 10px 20px; border-radius: 6px; border: 1px dashed #a1887f; margin-bottom: 20px;">
            STORY1221
          </div>
          <p style="font-size: 14px; color: #3e2723; line-height: 1.6; margin: 0; word-break: keep-all;">
            퍼즐 없이 스토리만 감상하고 싶다면<br>위 코드를 호칭란에 입력하세요
          </p>
        </div>
      `;

      onModalCloseCallback = startEndingCredits;
      showModal(codeNoticeHtml, true);
    }
  }
});

function showModal(htmlContent, showCloseBtn = true) {

  if (htmlContent.trim().startsWith('<p>')) {
    htmlContent = `
      <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 220px; text-align: center;">
        ${htmlContent}
      </div>
    `;
  }

  DOM.modalContent.innerHTML = htmlContent;
  DOM.modalCloseBtn.style.display = showCloseBtn ? 'block' : 'none';
  DOM.modalOverlay.classList.add('open');
}

// 💡 퍼즐 상태를 유지하면서 오답을 알려주는 미니 모달창 함수
function showWrongAnswer(textHtml) {
  const existing = document.getElementById('wrong-overlay');
  if (existing) existing.remove();

  const hintBtn = document.getElementById('modal-hint-btn');
  if (hintBtn) {
    hintBtn.style.opacity = '1';
    hintBtn.style.pointerEvents = 'auto';
  }

  const overlay = document.createElement('div');
  overlay.id = 'wrong-overlay';
  
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0, 0, 0, 0.6); 
    backdrop-filter: blur(5px); 
    -webkit-backdrop-filter: blur(5px);
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    z-index: 999999; 
  `;
  
  overlay.innerHTML = `
    <div style="
      width: 80%; max-width: 320px; 
      background: rgba(253, 251, 247, 0.98);
      display: flex; flex-direction: column; justify-content: center; align-items: center;
      border-radius: 12px; text-align: center; padding: 40px 20px; box-sizing: border-box;
      box-shadow: 0 15px 40px rgba(0,0,0,0.5);
    ">
      <div style="color: #5d4037; font-size: 15px; margin-bottom: 25px; font-weight: bold; line-height: 1.5;">
        ${textHtml}
      </div>
      <button id="close-wrong-btn" class="custom-btn">다시 풀기</button>
    </div>
  `;
  
  document.body.appendChild(overlay);

  document.getElementById('close-wrong-btn').addEventListener('click', () => {
    overlay.remove();
  });
}

function hideModal() {
  DOM.modalOverlay.classList.remove('open');
  if (typeof onModalCloseCallback === 'function') {
    const callback = onModalCloseCallback;
    onModalCloseCallback = null;
    callback();
  }
}

DOM.modalCloseBtn.addEventListener('click', hideModal);

function showToast(msg) {
  const toast = document.getElementById('toast-msg');
  toast.innerText = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000); 
}

function changeBGM(newSrc) {

  if (bgmAudio.src.includes(newSrc)) return;

  if (fadeInterval) clearInterval(fadeInterval);

  if (!bgmAudio.paused && bgmAudio.volume > 0) {
    fadeInterval = setInterval(() => {
      let newVol = bgmAudio.volume - 0.05;
      if (newVol <= 0) {
        bgmAudio.volume = 0;
        clearInterval(fadeInterval);
        playNewBGM(newSrc);
      } else {
        bgmAudio.volume = newVol;
      }
    }, 50);
  } else {
    playNewBGM(newSrc);
  }
}

function playNewBGM(newSrc) {
  bgmAudio.src = newSrc;
  bgmAudio.loop = true;
  bgmAudio.volume = 0; 
  bgmAudio.play().catch(e => console.log("BGM 자동재생 방지됨"));

  fadeInterval = setInterval(() => {
    let newVol = bgmAudio.volume + 0.05;
    if (newVol >= 1) {
      bgmAudio.volume = 1;
      clearInterval(fadeInterval);
    } else {
      bgmAudio.volume = newVol;
    }
  }, 50); 
}

const startBtn = document.getElementById('start-btn');
const nicknameInput = document.getElementById('nickname-input');

if (userNickname !== "") {

  nicknameInput.style.display = 'none';
  startBtn.innerText = "일지 이어보기";
  
  startBtn.addEventListener('click', () => {
    DOM.startSection.classList.add('hidden');
    DOM.gameSection.classList.remove('hidden');
    loadChapter(currentChapterIdx); 
  });
} else {

  startBtn.addEventListener('click', () => {
    const inputVal = nicknameInput.value.trim();
    if (!inputVal) {
      showToast("호칭을 입력해 주세요!");
      return; 
    }

    // 💡 첫 진입 시 호칭란에 STORY1221 입력 시 스토리모드 확인 모달 표시
    if (inputVal.toUpperCase() === "STORY1221") {
      const storyModeHtml = `
        <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 220px; text-align: center;">
          <h3 class="tt-title">스토리모드</h3>
          <p style="font-size: 14px; margin: 20px 0; line-height: 1.6;">퍼즐 없이 스크립트만 감상합니다.<br>계속할까요?</p>
          <div>
            <button id="confirm-story-btn" class="custom-btn">네</button>
            <button id="cancel-story-btn" class="custom-btn" style="margin-left: 10px;">아니오</button>
          </div>
        </div>
      `;
      showModal(storyModeHtml, false);

      document.getElementById('confirm-story-btn').addEventListener('click', () => {
        hideModal();
        isStoryMode = true;
        localStorage.setItem("storyMode", "true");
        userNickname = "소중한 분";
        localStorage.setItem("nickname", userNickname);

        DOM.startSection.classList.add('hidden');
        DOM.gameSection.classList.remove('hidden');
        loadChapter(currentChapterIdx);
      });

      document.getElementById('cancel-story-btn').addEventListener('click', () => {
        hideModal();
      });
      return;
    }

    userNickname = inputVal;
    localStorage.setItem("nickname", userNickname);
    
    DOM.startSection.classList.add('hidden');
    DOM.gameSection.classList.remove('hidden');
    loadChapter(currentChapterIdx);
  });
}

function loadChapter(idx) {
  const chapterData = STORY_DATA[idx];

  if(!chapterData) { 
    const endHtml = `
      <h3 class="tt-title">모든 항해 완료</h3>
      <p style="font-size: 14px; margin: 20px 0;">이미 모든 기록을 읽었습니다.<br>어디로 이동할까요?</p>
      <button id="go-finale-btn" class="custom-btn">청첩장 화면으로</button>
      <button id="go-reset-btn" class="custom-btn" style="margin-left: 10px;">처음부터 다시</button>
    `;
    showModal(endHtml, false);

    document.getElementById('go-finale-btn').addEventListener('click', () => {
      hideModal();
      document.querySelector('.header-group').style.display = 'none';
      document.querySelector('.text-area-wrapper').style.display = 'none';
      showFinale();
    });

    document.getElementById('go-reset-btn').addEventListener('click', () => {
      localStorage.removeItem("chapter");
      localStorage.removeItem("nickname");
      localStorage.removeItem("isSaved");
      localStorage.removeItem("storyMode");
      location.reload(); 
    });
    return;
  }
  
  currentScriptIdx = 0;
  changeBGM(chapterData.bgm); 

  const headerGroup = document.querySelector('.header-group');
  const textAreaWrapper = document.querySelector('.text-area-wrapper');
  const transitionBox = document.getElementById('chapter-transition');
  const transitionTitle = document.getElementById('transition-title');

  headerGroup.style.opacity = '0';
  textAreaWrapper.style.opacity = '0';
  textAreaWrapper.style.pointerEvents = 'none';

  transitionTitle.innerText = chapterData.title;
  transitionBox.classList.remove('hidden');

  setTimeout(() => {
    transitionBox.classList.add('show');
  }, 50);

  setTimeout(() => {
    transitionBox.classList.remove('show');

    setTimeout(() => {
      transitionBox.classList.add('hidden');
      document.getElementById('chapter-title').innerText = chapterData.title;
      
      headerGroup.style.opacity = '1';
      textAreaWrapper.style.opacity = '1';
      textAreaWrapper.style.pointerEvents = 'auto'; 
      
      showScript();
    }, 1000); 
  }, 2000); 
}

function showScript() {
  const scripts = STORY_DATA[currentChapterIdx].scripts;

  if (isTyping) {
    clearInterval(typingInterval);
    let prevText = scripts[currentScriptIdx - 1].trim();

    DOM.textBox.style.fontStyle = prevText.includes("<i>") ? 'italic' : 'normal';
    DOM.textBox.innerText = prevText.replace(/<\/?i>/g, ""); 
    
    DOM.nextBtn.style.display = 'inline-block';
    isTyping = false;
    return;
  }

  if (currentScriptIdx >= scripts.length) {
    if (currentChapterIdx === 12) {
      localStorage.setItem("chapter", 13);
      showFinale();
      return; 
    }
    currentChapterIdx++;
    localStorage.setItem("chapter", currentChapterIdx);
    loadChapter(currentChapterIdx);
    return;
  }

  let rawText = scripts[currentScriptIdx].trim(); 

  // 💡 스토리모드일 때 첫 챕터(0)와 마지막 챕터(12)의 퍼즐 직전 안내 문구 건너뛰기
  if (
    isStoryMode &&
    (currentChapterIdx === 0 || currentChapterIdx === 12) &&
    scripts[currentScriptIdx + 1] &&
    scripts[currentScriptIdx + 1].trim() === "[PUZZLE]"
  ) {
    currentScriptIdx += 2;
    showScript();
    return;
  }
  
  if (rawText === "[PUZZLE]") {
    if (isStoryMode) {
      currentScriptIdx++;
      showScript();
      return;
    }
    renderPuzzle();
    return;
  }

  let isItalic = rawText.includes("<i>");
  let text = rawText.replace(/<\/?i>/g, ""); 

  DOM.textBox.style.fontStyle = isItalic ? 'italic' : 'normal';

  DOM.textBox.innerText = ""; 
  DOM.nextBtn.style.display = 'none'; 
  isTyping = true; 
  let i = 0;
  
  typingInterval = setInterval(() => {
    DOM.textBox.innerText += text.charAt(i);
    i++;
    if(i >= text.length) {
      clearInterval(typingInterval);
      DOM.nextBtn.style.display = 'inline-block'; 
      isTyping = false; 
    }
  }, 50);

  currentScriptIdx++;
}

document.querySelector('.text-area-wrapper').addEventListener('click', showScript);

function renderPuzzle() {
  const chapterData = STORY_DATA[currentChapterIdx];
  const puzzle = chapterData.puzzle;
  
  const handler = PuzzleHandlers[puzzle.type];
  
  if (!handler) {
    console.error(`${puzzle.type} 핸들러가 없습니다.`);
    return;
  }

  const onComplete = () => {

    const successHtml = `
      <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 220px;">
        <p style="font-size: 18px; font-weight: bold; color: #5d4037; margin-bottom: 20px;">퍼즐을 풀었습니다!</p>
        <button id='continue-btn' class='custom-btn'>다음으로</button>
      </div>
    `;
    
    showModal(successHtml, false);
    
    document.getElementById('continue-btn').addEventListener('click', () => {
      hideModal();
      currentScriptIdx++;
      showScript();
    });
  };

  const { ui, init } = handler(puzzle, onComplete);

  const hintHtml = chapterData.hint ? `
    <div style="position: relative;">
      <button id="modal-hint-btn" style="opacity: 0; pointer-events: none; transition: opacity 0.8s ease-in-out; background: none; border: none; color: #8d6e63; cursor: pointer; font-size: 13px; font-family: inherit; font-weight: bold;">[도움말]</button>
      <div id="hint-text" class="hidden hint-bubble">
        <strong>도움말:</strong><br><span style="margin-top:5px; display:inline-block;">${chapterData.hint}</span>
      </div>
    </div>
  ` : "";

  const clueHtml = puzzle.question ? `
    <div class="clue-box">${puzzle.question.replace(/\n/g, '<br>')}</div>
  ` : "";

  const html = `
    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 15px;">
      <h3 class="tt-title" style="margin: 0;"></h3>
      ${hintHtml}
    </div>
    ${clueHtml}
    <div id="puzzle-body">${ui}</div> <br>
    <button id="submit-puzzle" class="custom-btn">확인</button>
  `;
  
  showModal(html, false);
  
  init();

  const hintBtn = document.getElementById('modal-hint-btn');
  if (hintBtn) {
    hintBtn.addEventListener('click', (e) => {
      e.stopPropagation(); 
      document.getElementById('hint-text').classList.toggle('hidden');
    });
  }
}

document.getElementById('reset-btn').addEventListener('click', () => {
  const resetHtml = `
    <h3 class="tt-title">기록 초기화</h3>
    <p style="font-size: 14px; margin: 20px 0;">진행 상황이 초기화되고<br>첫 화면으로 돌아갑니다.<br>계속할까요?</p>
    <button id="confirm-reset-btn" class="custom-btn">예</button>
    <button id="cancel-reset-btn" class="custom-btn" style="margin-left: 10px;">아니오</button>
  `;
  showModal(resetHtml, false); 

  document.getElementById('confirm-reset-btn').addEventListener('click', () => {
    localStorage.removeItem("chapter");
    localStorage.removeItem("nickname");
    localStorage.removeItem("isSaved");
    localStorage.removeItem("storyMode");
    location.reload(); 
  });

  document.getElementById('cancel-reset-btn').addEventListener('click', () => {
    hideModal();
  });
});

document.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'restart-btn') {

    e.target.disabled = true;
    e.target.innerText = "항해 일지를 덮는 중...";

    if (fadeInterval) clearInterval(fadeInterval);

    fadeInterval = setInterval(() => {
      let newVol = bgmAudio.volume - 0.05;
      if (newVol <= 0) {
        bgmAudio.volume = 0;
        clearInterval(fadeInterval);
        
        localStorage.removeItem("chapter");
        localStorage.removeItem("nickname");
        localStorage.removeItem("isSaved"); 
        localStorage.removeItem("storyMode");
        location.reload(); 
      } else {
        bgmAudio.volume = newVol;
      }
    }, 50); 
  }
});

function showFinale() {
  changeBGM("assets/bgm7.mp3");

  const overlay = document.getElementById('finale-overlay');
  if (overlay) overlay.classList.add('blackout');

  // 💡 스토리모드일 때는 볼드체 없이 '소중한 분을'로 출력하고, 일반 모드일 때는 볼드체 + '님을' 출력
  const invitationTextEl = document.querySelector('.invitation-text');
  if (invitationTextEl) {
    if (isStoryMode) {
      invitationTextEl.innerHTML = `
        닻과 파도가 서로의 곁에 스며든 날,<br>
        소중한 분을<br>
        뜻깊은 자리에 초대합니다.<br>
        항해의 마침표를 함께해 주세요.
      `;
    } else {
      invitationTextEl.innerHTML = `
        닻과 파도가 서로의 곁에 스며든 날,<br>
        <strong id="finale-player-name">${userNickname || '소중한 분'}</strong> 님을<br>
        뜻깊은 자리에 초대합니다.<br>
        항해의 마침표를 함께해 주세요.
      `;
    }
  }

  if (typeof saveNickname === 'function' && userNickname && !isStoryMode) {
    if (!localStorage.getItem('isSaved')) {
      saveNickname(userNickname);
      localStorage.setItem('isSaved', 'true');
    }
  }

  const downloadBtn = document.getElementById('download-btn');
  if (downloadBtn) {
    downloadBtn.onclick = async () => {
      const inviteCard = document.querySelector('.wedding-invitation');
      const btnGroup = document.getElementById('finale-btn-group');

      btnGroup.style.display = 'none';

      window.scrollTo(0, 0);

      await document.fonts.ready;

      html2canvas(inviteCard, {
        scale: window.devicePixelRatio > 1 ? window.devicePixelRatio : 2, 
        backgroundColor: "#ffffff",
        useCORS: true,   
        allowTaint: true,
        scrollY: -window.scrollY, 
        x: 0,
        y: 0
      }).then(canvas => {
        try {
          const imageUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = '닻과_파도의_청첩장.png'; 
          link.href = imageUrl;
          link.click(); 
        } catch (err) {
          console.error("이미지 추출 중 보안 에러 발생:", err);
          showToast("다운로드에 실패했습니다. 화면을 직접 캡처해 주세요!");
        }
        btnGroup.style.display = 'flex';
      });
    };
  }
}
