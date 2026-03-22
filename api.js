const GAS_URL = "https://script.google.com/macros/s/AKfycbyPRKkR0kKwC9x7msErQDJLU6yu0BleU1F9ySRBwC6RGlSVmzQJrcUGZ_4-Z45pXYX60A/exec";

async function saveNickname(nickname) {
  
  fetch(GAS_URL, {
    method: "POST",
    mode: "no-cors", 

    headers: { "Content-Type": "text/plain" }, 
    body: JSON.stringify({ action: "save", name: nickname })
  }).catch(err => console.error("백그라운드 저장 실패", err));
}

async function getCredits() {
  const res = await fetch(`${GAS_URL}?action=getCredits`);
  return await res.json();
}
