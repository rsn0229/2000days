💡 [수정] 복사한 GAS 웹 앱 URL을 아래에 붙여넣으세요!
const GAS_URL = "https://script.google.com/macros/s/AKfycbyPRKkR0kKwC9x7msErQDJLU6yu0BleU1F9ySRBwC6RGlSVmzQJrcUGZ_4-Z45pXYX60A/exec";

async function saveNickname(nickname) {
  // 몰래 백그라운드에서 실행되도록 await를 강제하지 않음
  fetch(GAS_URL, {
    method: "POST",
    mode: "no-cors", // CORS 우회용. 응답을 읽지 않아도 전송은 됨
    // 💡 [수정] application/json 대신 text/plain을 써야 브라우저가 보안 검열(Preflight) 없이 바로 데이터를 쏴줍니다!
    headers: { "Content-Type": "text/plain" }, 
    body: JSON.stringify({ action: "save", name: nickname })
  }).catch(err => console.error("백그라운드 저장 실패", err));
}

async function getCredits() {
  const res = await fetch(`${GAS_URL}?action=getCredits`);
  return await res.json();
}