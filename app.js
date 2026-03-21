// 상태 변수
let currentChapterIdx = parseInt(localStorage.getItem("chapter")) || 0;
let currentScriptIdx = 0;
let userNickname = "";
let bgmAudio = new Audio();

// DOM 요소
const DOM = {
  startSection: document.getElementById('start-section'),
  gameSection: document.getElementById('game-section'),
  textBox: document.getElementById('text-box'),
  nextBtn: document.getElementById('next-text-btn'),
  modalOverlay: document.getElementById('custom-modal-overlay'),
  modalContent: document.getElementById('modal-content'),
  modalCloseBtn: document.getElementById('modal-close-btn')
};

// 💡 커스텀 모달 제어 함수 (alert 대체용)
function showModal(htmlContent, showCloseBtn = true) {
  DOM.modalContent.innerHTML = htmlContent;
  DOM.modalCloseBtn.style.display = showCloseBtn ? 'block' : 'none';
  DOM.modalOverlay.classList.add('open');
}

function hideModal() {
  DOM.modalOverlay.classList.remove('open');
}

DOM.modalCloseBtn.addEventListener('click', hideModal);

// 1. 시작 버튼 로직
document.getElementById('start-btn').addEventListener('click', () => {
  userNickname = document.getElementById('nickname-input').value || "여행자";
  
  DOM.startSection.classList.add('hidden');
  DOM.gameSection.classList.remove('hidden');
  
  loadChapter(currentChapterIdx);
});

// 2. 챕터 로드
function loadChapter(idx) {
  const chapterData = STORY_DATA[idx];
  if(!chapterData) {
    showModal("<p>모든 항해를 마쳤습니다.</p><button class='custom-btn' onclick='hideModal()'>엔딩 보기</button>");
    return;
  }
  
  currentScriptIdx = 0;
  
  // BGM 재생 로직
  if (!bgmAudio.src.includes(chapterData.bgm)) {
    bgmAudio.src = chapterData.bgm;
    bgmAudio.loop = true;
    bgmAudio.play().catch(e => console.log("BGM 자동재생 방지됨"));
  }
  
  document.getElementById('chapter-title').innerText = chapterData.title;
  showScript();
}

// 3. 텍스트 타이핑 효과
function showScript() {
  DOM.nextBtn.style.visibility = 'hidden'; // 타이핑 중 버튼 숨김
  const scripts = STORY_DATA[currentChapterIdx].scripts;
  
  if (currentScriptIdx < scripts.length) {
    DOM.textBox.innerText = ""; 
    let text = scripts[currentScriptIdx];
    let i = 0;
    
    let typingInterval = setInterval(() => {
      DOM.textBox.innerText += text.charAt(i);
      i++;
      if(i >= text.length) {
        clearInterval(typingInterval);
        DOM.nextBtn.style.visibility = 'visible'; // 타이핑 끝나면 버튼 표시
      }
    }, 50);

    currentScriptIdx++;
  } else {
    // 텍스트가 끝나면 퍼즐 모달 팝업
    renderPuzzle();
  }
}

DOM.nextBtn.addEventListener('click', showScript);

// 4. 퍼즐 렌더링 (커스텀 모달 사용)
function renderPuzzle() {
  const puzzle = STORY_DATA[currentChapterIdx].puzzle;
  
  const html = `
    <h3 class="tt-title">잠긴 자물쇠</h3>
    <p style="font-size: 14px; margin-bottom: 20px;">${puzzle.question.replace(/\n/g, '<br>')}</p>
    <input type="text" id="puzzle-answer" class="custom-input" placeholder="정답 입력">
    <br>
    <button id="submit-puzzle" class="custom-btn">풀기</button>
  `;
  
  // 퍼즐 창은 임의로 못 닫게 X버튼 숨김 처리 (선택사항)
  showModal(html, true);
  
  document.getElementById('submit-puzzle').addEventListener('click', () => {
    if(document.getElementById('puzzle-answer').value === puzzle.answer) {
      hideModal();
      currentChapterIdx++;
      localStorage.setItem("chapter", currentChapterIdx); // 중간 저장
      
      // 정답 맞춘 후 알림
      setTimeout(() => {
        showModal("<p>자물쇠가 열렸습니다.</p><button id='continue-btn' class='custom-btn'>다음으로</button>", false);
        document.getElementById('continue-btn').addEventListener('click', () => {
          hideModal();
          loadChapter(currentChapterIdx);
        });
      }, 300);

    } else {
      // 오답 시 알림
      const originalHtml = DOM.modalContent.innerHTML;
      showModal("<p>틀렸습니다. 다시 시도해 보세요.</p><button id='retry-btn' class='custom-btn'>확인</button>", false);
      document.getElementById('retry-btn').addEventListener('click', () => {
        renderPuzzle(); // 퍼즐 다시 렌더링
      });
    }
  });
}