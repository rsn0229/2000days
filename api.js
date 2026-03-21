const GAS_URL = "https://script.google.com/macros/s/AKfycbwxpI3sA6_2ZJnFEBvoXURi6Vqd1Lu7klFjL97bV12GNnJChwk7w8qD-RVjxVEWX-y7JQ/exec";

async function saveNickname(nickname) {
  // 몰래 백그라운드에서 실행되도록 await를 강제하지 않음
  fetch(GAS_URL, {
    method: "POST",
    mode: "no-cors", // CORS 우회용. 응답을 읽지 않아도 전송은 됨
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "save", name: nickname })
  }).catch(err => console.error("백그라운드 저장 실패", err));
}

async function getCredits() {
  const res = await fetch(`${GAS_URL}?action=getCredits`);
  return await res.json();
}