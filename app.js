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

// 💡 엔딩 크레딧 버튼 로직 (에러 방지를 위해 이벤트 위임 방식으로 변경!)
document.addEventListener('click', async (e) => {
  // 클릭한 요소의 ID가 'credit-btn'일 때만 아래 로직을 실행합니다.
  if (e.target && e.target.id === 'credit-btn') {
    const creditOverlay = document.getElementById('ending-credit-overlay');
    const nameListContainer = document.getElementById('player-names-list');
    const creditContent = document.getElementById('credit-content');

    // 1. 화면을 완전히 까맣게 전환
    if (creditOverlay) creditOverlay.classList.add('show');

    // 💡 2. 구글 앱스 스크립트(GAS) Web App URL (여기에 본인의 배포 URL을 넣으세요!)
    const GAS_URL = "https://script.google.com/macros/s/본인의_GAS_URL/exec";

    try {
       // GAS에서 데이터 불러오기 (배열 형태로 이름 목록을 리턴한다고 가정)
       // const response = await fetch(GAS_URL);
       // const data = await response.json(); 
       
       // 테스트용 더미 데이터 (실제 GAS 연동 시 이 부분 지우고 위 주석을 해제하세요!)
       const data = ["헬가", "발터", "비앙카", "리카르도", "소중한 분", userNickname];

       // 3. 불러온 이름들을 HTML로 만들어서 삽입
       if (data && data.length > 0) {
         nameListContainer.innerHTML = data.map(name => `<div class="credit-name">${name}</div>`).join('');
       } else {
         nameListContainer.innerHTML = "<p style='color:#888;'>첫 번째 클리어가 되어주셔서 감사합니다.</p>";
       }

    } catch (error) {
       console.error(error);
       nameListContainer.innerHTML = "<p style='color:#888;'>기록을 불러오지 못했습니다.</p>";
    }

    // 4. 화면이 까매진 후 1.5초 뒤에 크레딧 텍스트를 위로 올리기 시작!
    setTimeout(() => {
      if (creditContent) creditContent.classList.add('scroll-up');
    }, 1500);
  }
});

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
    // 최종장(12장)의 마지막 스크립트까지 모두 읽었다면?
    if (currentChapterIdx === 12) {
      // 💡 1. 극적인 BGM 전환! (청첩장 등장과 함께 bgm7.mp3 재생)
      bgmAudio.src = "assets/bgm7.mp3";
      bgmAudio.loop = true;
      bgmAudio.play().catch(e => console.log("BGM 자동재생 방지됨"));

      // 💡 2. 암전 및 청첩장 연출 트리거 발동!
      const overlay = document.getElementById('finale-overlay');
      if (overlay) overlay.classList.add('blackout');

      // 청첩장에 유저 이름 넣기
      const finaleNameEl = document.getElementById('finale-player-name');
      if (finaleNameEl) finaleNameEl.innerText = userNickname || '소중한 분';

      // 💡 3. 실제 다운로드 버튼 기능 연결
      const downloadBtn = document.getElementById('download-btn');
      if (downloadBtn) {
        downloadBtn.onclick = () => {
          const inviteCard = document.querySelector('.wedding-invitation');
          const btnGroup = document.getElementById('finale-btn-group');
          
          btnGroup.style.display = 'none';

          // 💡 html2canvas 옵션에 useCORS와 allowTaint 추가
          html2canvas(inviteCard, {
            scale: 2, 
            backgroundColor: "#ffffff",
            useCORS: true,   // 💡 교차 출처 이미지 사용 허용
            allowTaint: true // 💡 오염된 캔버스라도 렌더링 허용
          }).then(canvas => {
            try {
              const imageUrl = canvas.toDataURL('image/png');
              const link = document.createElement('a');
              link.download = '로잔나_마야_청첩장.png'; 
              link.href = imageUrl;
              link.click(); 
            } catch (err) {
              console.error("이미지 추출 중 보안 에러 발생:", err);
              alert("로컬 환경(file://)에서는 보안 정책상 다운로드가 제한될 수 있습니다. 서버(Live Server 등)를 통해 실행해 주세요.");
            }

            btnGroup.style.display = 'flex';
          });
        };
      }
      return; // 일반 챕터처럼 다음으로 넘어가지 않고 여기서 진행을 멈춤!
    }

    // 일반 챕터일 경우 평소처럼 다음 챕터로 넘어감
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

// 4. 퍼즐 렌더링 (puzzles.js의 핸들러를 호출)
function renderPuzzle() {
  const chapterData = STORY_DATA[currentChapterIdx];
  const puzzle = chapterData.puzzle;
  
  const handler = PuzzleHandlers[puzzle.type];
  
  if (!handler) {
    console.error(`${puzzle.type} 핸들러가 없습니다.`);
    return;
  }

  const onComplete = () => {
    showModal("<p>퍼즐을 풀었습니다.</p><button id='continue-btn' class='custom-btn'>다음으로</button>", false);
    document.getElementById('continue-btn').addEventListener('click', () => {
      hideModal();
      currentScriptIdx++;
      showScript();
    });
  };

  const { ui, init } = handler(puzzle, onComplete);

  // 💡 힌트가 있을 때만 [도움말] 버튼 생성
  const hintHtml = chapterData.hint ? `
    <div style="position: relative;">
      <button id="modal-hint-btn" style="background: none; border: none; color: #8d6e63; cursor: pointer; font-size: 13px; font-family: inherit; font-weight: bold;">[도움말]</button>
      <div id="hint-text" class="hidden hint-bubble">
        <strong>도움말:</strong><br><span style="margin-top:5px; display:inline-block;">${chapterData.hint}</span>
      </div>
    </div>
  ` : "";

  // 💡 설명(question)이 있을 때만 흰색 박스(.clue-box) 생성
  const clueHtml = puzzle.question ? `
    <div class="clue-box">${puzzle.question.replace(/\n/g, '<br>')}</div>
  ` : "";

  const html = `
    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 15px;">
      <h3 class="tt-title" style="margin: 0;">잠긴 자물쇠</h3>
      ${hintHtml}
    </div>
    ${clueHtml}
    <div id="puzzle-body">${ui}</div> <br>
    <button id="submit-puzzle" class="custom-btn">풀기</button>
  `;
  
  showModal(html, false);
  
  init();

  // 💡 버튼이 존재할 때만 이벤트 리스너 연결 (에러 방지)
  const hintBtn = document.getElementById('modal-hint-btn');
  if (hintBtn) {
    hintBtn.addEventListener('click', (e) => {
      e.stopPropagation(); 
      document.getElementById('hint-text').classList.toggle('hidden');
    });
  }
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

// 💡 [수정] 엔딩 크레딧의 '처음으로 돌아가기' 버튼 전용 리스너
document.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'restart-btn') {
    // 1. 저장된 데이터 삭제
    localStorage.removeItem("chapter");
    localStorage.removeItem("nickname");
    
    // 2. 페이지 새로고침하여 초기 화면(이름 입력)으로 이동
    location.reload(); 
  }
});

// (기존 모달 닫기 로직은 힌트 기능만 남겨두세요)
DOM.modalOverlay.addEventListener('click', (e) => {
  const hintEl = document.getElementById('hint-text');
  if (hintEl && !hintEl.classList.contains('hidden')) {
    if (!hintEl.contains(e.target)) {
      hintEl.classList.add('hidden');
    }
  }
});

