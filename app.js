// 상태 변수
let currentChapterIdx = parseInt(localStorage.getItem("chapter")) || 0;
let currentScriptIdx = 0;
let userNickname = localStorage.getItem("nickname") || ""; // 💡 저장된 닉네임 불러오기
let bgmAudio = new Audio();
let typingInterval;
let isTyping = false;

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

// 💡 커스텀 모달 제어 함수
function showModal(htmlContent, showCloseBtn = true) {
  DOM.modalContent.innerHTML = htmlContent;
  DOM.modalCloseBtn.style.display = showCloseBtn ? 'block' : 'none';
  DOM.modalOverlay.classList.add('open');
}

function hideModal() {
  DOM.modalOverlay.classList.remove('open');
}

DOM.modalCloseBtn.addEventListener('click', hideModal);

// 💡 토스트 팝업 함수
function showToast(msg) {
  const toast = document.getElementById('toast-msg');
  toast.innerText = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000); // 2초 뒤에 스르륵 사라짐
}

// 1. 시작 화면 및 버튼 로직 (BGM 재생을 위한 클릭 유도)
const startBtn = document.getElementById('start-btn');
const nicknameInput = document.getElementById('nickname-input');

if (userNickname !== "") {
  // 💡 이미 저장된 이름이 있다면 입력창을 숨기고 '이어서 하기' 버튼으로 변경
  nicknameInput.style.display = 'none';
  startBtn.innerText = "이어서 항해하기";
  
  startBtn.addEventListener('click', () => {
    DOM.startSection.classList.add('hidden');
    DOM.gameSection.classList.remove('hidden');
    loadChapter(currentChapterIdx); // 클릭과 함께 챕터 로드 (BGM 정상 재생!)
  });
} else {
  // 처음 온 유저
  startBtn.addEventListener('click', () => {
    const inputVal = nicknameInput.value.trim();
    if (!inputVal) {
      showToast("호칭을 입력해 주세요!");
      return; 
    }
    userNickname = inputVal;
    localStorage.setItem("nickname", userNickname);
    
    DOM.startSection.classList.add('hidden');
    DOM.gameSection.classList.remove('hidden');
    loadChapter(currentChapterIdx);
  });
}

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

// 3. 텍스트 타이핑 효과 및 흐름 제어
function showScript() {
  const scripts = STORY_DATA[currentChapterIdx].scripts;

  // 💡 1) 타이핑 중에 본문을 클릭했다면 -> 한 번에 글자 다 띄우고 종료 (스킵 기능)
  if (isTyping) {
    clearInterval(typingInterval);
    DOM.textBox.innerText = scripts[currentScriptIdx - 1].trim(); // 이미 인덱스가 올랐으므로 -1 번째 텍스트를 출력
    DOM.nextBtn.style.display = 'inline-block';
    isTyping = false;
    return;
  }

  // 💡 2) 챕터가 끝났을 때의 처리
  if (currentScriptIdx >= scripts.length) {
    currentChapterIdx++;
    localStorage.setItem("chapter", currentChapterIdx);
    loadChapter(currentChapterIdx);
    return;
  }
  
  let text = scripts[currentScriptIdx].trim(); // 💡 .trim()이 문장 앞뒤의 불필요한 공백을 깔끔하게 제거해 줍니다!
  
  if (text === "[PUZZLE]") {
    renderPuzzle();
    return;
  }
  
  // 💡 3) 일반 텍스트 타이핑 시작
  DOM.textBox.innerText = ""; 
  DOM.nextBtn.style.display = 'none'; // 타이핑 중에는 ▼ 숨김
  isTyping = true; // 타이핑 상태 ON
  let i = 0;
  
  typingInterval = setInterval(() => {
    DOM.textBox.innerText += text.charAt(i);
    i++;
    if(i >= text.length) {
      clearInterval(typingInterval);
      DOM.nextBtn.style.display = 'inline-block'; // 마지막 단어 옆에 ▼ 표시
      isTyping = false; // 타이핑 상태 OFF
    }
  }, 50);

  currentScriptIdx++;
}

// 💡 텍스트 본문이나 ▼ 버튼 중 아무 곳이나 클릭해도 showScript 실행
DOM.textWrapper.addEventListener('click', showScript);

// 4. 퍼즐 렌더링 (커스텀 모달 사용)
function renderPuzzle() {
  const chapterData = STORY_DATA[currentChapterIdx];
  const puzzle = chapterData.puzzle;
  
  const html = `
    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 15px;">
      <h3 class="tt-title" style="margin: 0;">잠긴 자물쇠</h3>
      
      <div style="position: relative;">
        <button id="modal-hint-btn" style="background: none; border: none; color: #8d6e63; cursor: pointer; font-size: 13px; font-family: inherit; font-weight: bold;">[업무 수첩]</button>
        
        <div id="hint-text" class="hidden hint-bubble">
          <strong>업무 수첩:</strong><br><span style="margin-top:5px; display:inline-block;">${chapterData.hint}</span>
        </div>
      </div>
    </div>
    
    <p style="font-size: 14px; margin-bottom: 20px;">${puzzle.question.replace(/\n/g, '<br>')}</p>
    <input type="text" id="puzzle-answer" class="custom-input" placeholder="정답 입력">
    <br>
    <button id="submit-puzzle" class="custom-btn">풀기</button>
  `;
  
  // 🔒 두 번째 인자를 false로 주어 X(닫기) 버튼을 강제로 숨김
  showModal(html, false);
  
// 💡 [업무 수첩] 클릭 시 힌트 열기/닫기 (토글)
  document.getElementById('modal-hint-btn').addEventListener('click', (e) => {
    e.stopPropagation(); // 💡 이벤트 전파를 막아 아래의 '바깥 클릭'이 즉시 발동하지 않게 함
    const hintEl = document.getElementById('hint-text');
    hintEl.classList.toggle('hidden');
  });

  document.getElementById('submit-puzzle').addEventListener('click', () => {
    if(document.getElementById('puzzle-answer').value === puzzle.answer) {
      
      // 정답 맞춘 후 알림
      showModal("<p>자물쇠가 열렸습니다.</p><button id='continue-btn' class='custom-btn'>다음으로</button>", false);
      
      document.getElementById('continue-btn').addEventListener('click', () => {
        hideModal(); // 모달 완전히 닫기
        currentScriptIdx++; // "[PUZZLE]" 텍스트 인덱스를 뛰어넘음
        showScript(); // 남은 스크립트를 마저 진행!
      });

    } else {
      // 오답 시 알림
      showModal("<p>다시 시도해 보세요.</p><button id='retry-btn' class='custom-btn'>확인</button>", false);
      document.getElementById('retry-btn').addEventListener('click', () => {
        renderPuzzle(); // 퍼즐 다시 렌더링 (다시 풀기)
      });
    }
  });
}

// 💡 [신규] 초기화 버튼 로직
document.getElementById('reset-btn').addEventListener('click', () => {
  const resetHtml = `
    <h3 class="tt-title">항해 기록 초기화</h3>
    <p style="font-size: 14px; margin: 20px 0;">진행 상황이 초기화되고 첫 화면으로 돌아갑니다.<br>계속할까요?</p>
    <button id="confirm-reset-btn" class="custom-btn">예</button>
    <button id="cancel-reset-btn" class="custom-btn" style="margin-left: 10px;">아니오</button>
  `;
  showModal(resetHtml, false); // 강제 선택을 위해 X버튼 숨김

  // '예' 클릭 시 데이터 삭제 후 새로고침
  document.getElementById('confirm-reset-btn').addEventListener('click', () => {
    localStorage.removeItem("chapter");
    localStorage.removeItem("nickname");
    location.reload(); 
  });

  // '아니오' 클릭 시 모달 닫기
  document.getElementById('cancel-reset-btn').addEventListener('click', () => {
    hideModal();
  });
});

// 💡 빈 공간(바깥쪽) 클릭 시 힌트 말풍선 닫기
DOM.modalOverlay.addEventListener('click', (e) => {
  const hintEl = document.getElementById('hint-text');
  
  // 힌트 창이 존재하고, 열려있는 상태일 때
  if (hintEl && !hintEl.classList.contains('hidden')) {
    // 클릭한 곳이 힌트 말풍선 내부가 아니라면 닫기
    if (!hintEl.contains(e.target)) {
      hintEl.classList.add('hidden');
    }
  }
});