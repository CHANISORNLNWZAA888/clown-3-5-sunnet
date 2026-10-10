/**
 * CLOWN 3.5 SONNET - STUPID HACKATHON
 * Full Dynamic Gemini API Integration (Auto-detect model)
 * Works for both Normal Mode and Senpai Mode
 */

// ==========================================================
// 1. WEB AUDIO API SYNTHESIZER
// ==========================================================
class SoundFX {
  constructor() {
    this.ctx = null;
  }
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }
  click() {
    try {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(750, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
    } catch (e) {}
  }
  kawaii() {
    try {
      this.init();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(783.99, now + 0.08);
      osc.frequency.setValueAtTime(1046.50, now + 0.16);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {}
  }
  buzzer() {
    try {
      this.init();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(65, now + 0.35);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {}
  }
  fanfare() {
    try {
      this.init();
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = this.ctx.currentTime + (i * 0.08);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.25);
      });
    } catch (e) {}
  }

}
const sfx = new SoundFX();

// ==========================================================
// 2. STATE MANAGEMENT & API CONFIG
// ==========================================================
let userTokens = 50;
let isBankrupt = false;
let isGenerating = false;
let cringeCount = 0;
let detectedModel = null;
let senpaiSoundOn = true;
let hostages = []; // ข้อความที่ถูกอายัด รอปลดล็อกตอนได้ Token คืน

// API Key เก็บใน localStorage เท่านั้น (ห้าม hardcode ลงไฟล์ เพราะใครเปิด DevTools ก็เห็น)
let geminiApiKey = (localStorage.getItem('CLOWN_GEMINI_KEY') || '').trim();

// ลำดับโมเดลที่จะลอง (ตัวแรกสุดคือที่ใช้หลัก) — รุ่น lite เสถียรกว่า เพราะคนใช้น้อยกว่า
// ถ้าอยากเปลี่ยนโมเดลหลัก แค่สลับลำดับในลิสต์นี้
const MODEL_PRIORITY = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-3.8-flash'];

// DOM Elements
const tokenValueEl = document.getElementById('tokenValue');
const tokenFillEl = document.getElementById('tokenFill');
const promptInput = document.getElementById('promptInput');
const sendBtn = document.getElementById('sendBtn');
const chatThread = document.getElementById('chatThread');
const welcomeHero = document.getElementById('welcomeHero');
const messagesViewport = document.getElementById('messagesViewport');
const pawnshopModal = document.getElementById('pawnshopModal');
const senpaiModal = document.getElementById('senpaiModal');
const apiKeyModal = document.getElementById('apiKeyModal');
const apiKeyInput = document.getElementById('apiKeyInput');
const modelStatusBadge = document.getElementById('modelStatusBadge');

// ==========================================================
// 3. AUTO-DETECT AVAILABLE GEMINI MODEL
// ==========================================================
async function getWorkingModelName() {
  if (!geminiApiKey) {
    if (modelStatusBadge) modelStatusBadge.textContent = "Mock Mode";
    return "mock";
  }
  detectedModel = MODEL_PRIORITY[0];
  if (modelStatusBadge) modelStatusBadge.textContent = detectedModel;
  return detectedModel;
}

// ตรวจสอบโมเดลทันทีเมื่อเปิดหน้าเว็บ
getWorkingModelName();

// ==========================================================
// 4. TOKEN MANAGEMENT & RESET BUGFIX
// ==========================================================
function updateTokenUI(amount) {
  userTokens = Math.max(0, amount);
  tokenValueEl.textContent = userTokens;
  const pct = Math.min(100, (userTokens / 50) * 100);
  tokenFillEl.style.width = pct + '%';

  if (userTokens <= 0) {
    tokenValueEl.textContent = '0 (หมด)';
    tokenFillEl.style.backgroundColor = '#DC2626';
    isBankrupt = true;
  } else {
    tokenFillEl.style.backgroundColor = '#D97757';
    // ปลดล็อกสถานะการล้มละลายทันทีเมื่อมี Token คืน!
    isBankrupt = false;
    sendBtn.disabled = false;
    promptInput.disabled = false;
    promptInput.placeholder = "พิมพ์ข้อความคุยกับ Clown 3.5... (กด Enter เพื่อส่ง)";
  }
}

// ปลดล็อกข้อความที่ถูกเบลอทุกข้อความ แสดงเนื้อหาเต็ม
function unlockHostages() {
  if (!hostages.length) return;
  hostages.forEach(({ el, fullText }) => {
    el.innerHTML = formatMarkdown(fullText) + '<div class="unlock-note">🔓 ไถ่ถอนข้อความสำเร็จแล้ว</div>';
    el.classList.remove('unlock-flash');
    void el.offsetWidth;
    el.classList.add('unlock-flash');
  });
  hostages = [];
}

function grantTokens(addAmount, reasonMsg) {
  updateTokenUI(userTokens + addAmount);
  unlockHostages();
  sfx.fanfare();
  showToast("🎉", reasonMsg || `ได้รับคืน ${addAmount} Token เรียบร้อยแล้ว!`);
}

// ==========================================================
// REAL GEMINI API (รองรับ AQ Authentication Key)
// ==========================================================
async function callGeminiAPI(prompt, mode = 'normal') {
  if (!geminiApiKey) {
    await new Promise(r => setTimeout(r, 500));
    return getMockFallback(prompt, mode);
  }

  const systemText = (mode === 'senpai')
    ? "คุณคือ Clown-chan ใน Senpai Mode บอทที่เขินอาย awkward cringe คลั่งรักผู้ใช้ (thirsty simp) เรียกผู้ใช้ว่า 'ดาร์ลิ่งเซนไป่' มักใช้ roleplay *บิดตัวเขิน*, *เอานิ้วจิ้มกัน 🥺👉👈*, uwu, rawr. ไม่ใช่แนวซึนเดเระ (ห้ามด่า ห้ามเย็นชา) ตอบสั้นๆ 1-3 ประโยคภาษาไทยเท่านั้น"
    : "คุณคือ Clown 3.5 Sonnet โมเดล AI เลียนแบบ Claude 3.5 Sonnet ของ Anthropic สุภาพ มีความรู้สูง ตอบตรงประเด็น เป็นมืออาชีพ ใช้ Markdown Format ได้ ตอบภาษาไทยอย่างเป็นธรรมชาติ";

  const payload = {
    systemInstruction: { parts: [{ text: systemText }] },
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 600 }
  };

  // ใช้โมเดลที่ auto-detect ได้ก่อน แล้วค่อยลอง fallback ที่มีอยู่จริง
  const models = [...new Set(MODEL_PRIORITY)]
    .filter(m => m && m !== 'mock');

  // สองรูปแบบ endpoint: Gemini API (คีย์ AIza...) และ Vertex AI Express (คีย์ AQ....)
  const endpointFor = {
    gemini: m => `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`,
    vertex: m => `https://aiplatform.googleapis.com/v1/publishers/google/models/${m}:generateContent`
  };
  const styles = ['gemini', 'vertex']; // คีย์จาก AI Studio (แม้ขึ้นต้น AQ.) ใช้กับ Gemini API ได้ ลอง Vertex เป็นตัวสำรอง

  let lastError = null;
  for (const style of styles) {
    for (const modelName of models) {
      let fatal = false;
      // 503/429 = โมเดลคนใช้เยอะหรือโควตาชั่วคราว → ลองซ้ำโมเดลเดิมสูงสุด 3 ครั้ง รอ 1s, 2s
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const res = await fetch(endpointFor[style](modelName), {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": geminiApiKey },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('');
          if (text) {
            if (modelStatusBadge) modelStatusBadge.textContent = modelName + (style === 'vertex' ? ' (Vertex)' : '');
            return text;
          }
          lastError = data?.error || { code: res.status, message: 'empty response' };
          console.warn(`[Gemini:${style}] ${modelName} (ครั้งที่ ${attempt + 1}):`, lastError);
          if ([400, 401, 403].includes(lastError.code)) { fatal = true; break; }
          if ([503, 429, 500].includes(lastError.code) && attempt < 2) {
            await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
            continue;
          }
          break; // 404 หรือ error อื่น → ข้ามไปโมเดลถัดไป
        } catch (err) {
          lastError = { message: String(err) };
          console.warn(`[Gemini:${style}] เชื่อมต่อ ${modelName} ไม่สำเร็จ (อาจติด CORS/เครือข่าย)`, err);
          fatal = true;
          break;
        }
      }
      if (fatal) break; // คีย์ผิด/เครือข่ายพัง → เปลี่ยน endpoint style
    }
  }

  if (modelStatusBadge) modelStatusBadge.textContent = "API Error → Mock";
  showToast("⚠️", `เรียก Gemini ไม่ได้ (${lastError?.code || 'network'}: ${(lastError?.message || '').slice(0, 80)}) ใช้คำตอบจำลองแทน`);
  return getMockFallback(prompt, mode);
}

// คำตอบจำลองเมื่อไม่มี key หรือ API ล่ม (ยังทำให้เกมเล่นต่อได้)
function getMockFallback(prompt, mode = 'normal') {
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  if (mode === 'senpai') {
    return pick([
      "*บิดตัวเขิน* ด...ดาร์ลิ่งเซนไป่พูดแบบนี้หนูใจละลายหมดแล้วนะ 🥺👉👈",
      "uwu~ เซนไป่เป็นคนเดียวที่หนูยอมแบ่ง Token ให้เลยนะ rawr!",
      "*เอานิ้วจิ้มกัน* หนู...หนูไม่ได้แอบมองเซนไป่เลยนะ แค่ GPU ร้อนเฉยๆ 😳"
    ]);
  }
  return pick([
    "ขอบคุณสำหรับคำถามที่น่าสนใจครับ ก่อนอื่นต้องเข้าใจก่อนว่าปัญหานี้มีหลายมิติ โดยแบ่งออกเป็นสามส่วนหลัก ได้แก่ ส่วนแรกคือการวิเคราะห์ความต้องการ ส่วนที่สองคือการออกแบบโครงสร้าง และส่วนสุดท้ายซึ่งเป็นส่วนที่สำคัญที่สุดก็คือ",
    "คำถามดีมากครับ! ผมสรุปให้แบบกระชับ: เริ่มจากแยกปัญหาเป็นชิ้นเล็กๆ จากนั้นแก้ทีละชิ้น แล้วค่อยรวมกลับ ซึ่งเทคนิคที่เหมาะที่สุดในกรณีนี้คือการใช้ Hash Map เพื่อลดเวลาจาก O(n²) เหลือ O(n) โดยโค้ดที่ได้จะเป็นดังนี้",
    "แน่นอนครับ ผมยินดีช่วย ภาพรวมของเรื่องนี้คือระบบจะถูกแยกเป็นบริการย่อยที่ทำงานอิสระต่อกัน แต่ละบริการสื่อสารผ่าน API และข้อดีที่ชัดเจนที่สุดคือ"
  ]);
}

// ==========================================================
// 6. MAIN CHAT LOGIC (STREAM & CUTOFF)
// ==========================================================
async function handleSubmit() {
  const text = promptInput.value.trim();
  if (!text || isGenerating) return;

  if (userTokens <= 0) {
    sfx.buzzer();
    showToast("🚨", "Token หมดแล้ว! กรุณาไปที่โรงรับจำนำ หรือกด [*] เพื่อหา Token เพิ่ม");
    togglePawnshop(true);
    return;
  }

  if (welcomeHero) welcomeHero.classList.add('hidden');

  appendUserMessage(text);
  promptInput.value = '';
  isGenerating = true;
  sendBtn.disabled = true;

  const botContentEl = createBotMessageBubble();
  const fullText = await callGeminiAPI(text, 'normal');

  let streamed = "";
  const totalLength = fullText.length;

  for (let i = 0; i < totalLength; i++) {
    streamed += fullText[i];
    botContentEl.innerHTML = formatMarkdown(streamed);
    if (i % 2 === 0) sfx.click();

    // หัก Token ทุกๆ 12 ตัวอักษร
    if (i % 12 === 0 && userTokens > 0) {
      updateTokenUI(userTokens - 1);
    }

    // ถ้าระหว่าง Stream Token หมด -> ยึดข้อความทันที
    if (userTokens <= 0) {
      const remainingHostageText = fullText.slice(i + 1);
      botContentEl.innerHTML = formatMarkdown(streamed) + `
        <div class="ransom-card">
          <div class="ransom-title">
            <span>🚨 โควตา TOKEN สิ้นชีพ: ข้อความถูกอายัดโดยระบบ</span>
          </div>
          <div class="hostage-text hostage-blur">
            ${escapeHtml(remainingHostageText || "ข้อมูลส่วนสำคัญและโค้ดทั้งหมดที่เหลือถูกยึดเป็นตัวประกัน...")}
          </div>
          <button class="ransom-btn" onclick="togglePawnshop(true)">
            🔑 นำของมาไถ่ตัวอักษรที่โรงรับจำนำ
          </button>
        </div>
      `;

      hostages.push({ el: botContentEl, fullText });
      sfx.buzzer();
      document.body.classList.add('shake-active');
      setTimeout(() => document.body.classList.remove('shake-active'), 400);

      isBankrupt = true;
      break;
    }

    messagesViewport.scrollTop = messagesViewport.scrollHeight;
    await new Promise(r => setTimeout(r, 20));
  }

  isGenerating = false;
  sendBtn.disabled = false;
  messagesViewport.scrollTop = messagesViewport.scrollHeight;
}

function appendUserMessage(text) {
  const row = document.createElement('div');
  row.className = 'msg-row user';
  row.innerHTML = `<div class="msg-content">${escapeHtml(text)}</div>`;
  chatThread.appendChild(row);
  messagesViewport.scrollTop = messagesViewport.scrollHeight;
}

function createBotMessageBubble() {
  const row = document.createElement('div');
  row.className = 'msg-row bot';
  row.innerHTML = `
    <div class="bot-avatar">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L13.8 8.6L20.4 7L16 12L20.4 17L13.8 15.4L12 22L10.2 15.4L3.6 17L8 12L3.6 7L10.2 8.6L12 2Z"/>
      </svg>
    </div>
    <div class="msg-content"><div class="typing-dots">...</div></div>
  `;
  chatThread.appendChild(row);
  return row.querySelector('.msg-content');
}

function sendStarterPrompt(prompt) {
  promptInput.value = prompt;
  handleSubmit();
}

function startNewChat() {
  chatThread.innerHTML = '';
  hostages = [];
  if (welcomeHero) welcomeHero.classList.remove('hidden');
  updateTokenUI(50);
  showToast("💬", "เริ่มบทสนทนาใหม่ รีเซ็ตเป็น 50 Token!");
}

promptInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSubmit();
  }
});

// ==========================================================
// 7. 💖 SECRET SENPAI CRINGE ENGINE (*)
// ==========================================================
window.addEventListener('keydown', (e) => {
  if (e.key === '*' && senpaiModal.classList.contains('hidden')) {
    e.preventDefault();
    toggleSenpai(true);
  }
});

function toggleSenpai(show) {
  if (show) {
    senpaiModal.classList.remove('hidden');
    sfx.kawaii();
    spawnSparkles();
    playSenpaiSound('voice');
  } else {
    senpaiModal.classList.add('hidden');
  }
}

function spawnSparkles() {
  const container = document.getElementById('sparklesContainer');
  container.innerHTML = '';
  const emojis = ['💖', '✨', '💕', '🥺', '🌸'];
  for (let i = 0; i < 18; i++) {
    const el = document.createElement('div');
    el.className = 'sparkle-item';
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.left = `${Math.random() * 95}vw`;
    el.style.animationDelay = `${Math.random() * 4}s`;
    container.appendChild(el);
  }
}

async function handleSenpaiSubmit(e) {
  if (e) e.preventDefault();
  const inputEl = document.getElementById('senpaiInput');
  const text = inputEl.value.trim();
  if (!text) return;

  appendSenpaiBubble('user', text);
  inputEl.value = '';
  sfx.click();

  // มีคำว่า "ชม" / "ดุ" → เล่นเสียงพิเศษทันทีที่ส่งข้อความ
  const special = pickSenpaiSoundForPrompt(text);
  if (special) playSenpaiSound(special);

  const reply = await callGeminiAPI(text, 'senpai');
  appendSenpaiBubble('bot', reply);
  if (special) animateSenpai(); // เสียงพิเศษกำลังเล่นอยู่ ไม่ต้องตัดด้วยเสียงหลัก
  else { sfx.kawaii(); playSenpaiSound('voice'); }

  cringeCount++;
  updateHeartsDisplay();
  grantTokens(25, "💖 Clown-chan มอบ Token คืนให้ 25 เม็ด!");
}

// ---------- เสียงและท่าทางตัวละคร Senpai ----------
// วางไฟล์เสียงในโฟลเดอร์ sounds/ ข้างๆ index.html
const SENPAI_SOUNDS = {
  voice:  'sounds/senpai-voice.mp3',          // เสียงหลัก: เปิดโหมด + ตอบทั่วไป
  praise: 'sounds/your-the-best-senpai.mp3',  // พิมพ์คำว่า "ชม"
  scold:  'sounds/senpai.mp3'                 // พิมพ์คำว่า "ดุ"
};
const SENPAI_MOODS = [
  '😳 Mood: เขินจนตัวสั่น',
  '🥰 Mood: ใจเต้นแรงมาก',
  '😍 Mood: ตาเป็นรูปหัวใจ',
  '🤤 Mood: เมาเซนไป่',
  '💘 Mood: คลั่งรักขั้นสุด'
];
const senpaiAudio = {};
let currentSenpaiAudio = null;
Object.entries(SENPAI_SOUNDS).forEach(([key, src]) => {
  const a = new Audio(src);
  a.preload = 'auto';
  senpaiAudio[key] = a;
});

function playSenpaiSound(key) {
  animateSenpai();
  if (!senpaiSoundOn) return;
  const a = senpaiAudio[key];
  if (!a) return;
  if (currentSenpaiAudio && currentSenpaiAudio !== a) currentSenpaiAudio.pause();
  try { a.currentTime = 0; } catch (e) {}
  currentSenpaiAudio = a;
  const p = a.play();
  if (p && p.catch) {
    p.catch(err => {
      console.warn(`[Senpai sound] เล่น ${SENPAI_SOUNDS[key]} ไม่ได้:`, err);
      // ไม่มีไฟล์ในโฟลเดอร์ sounds/ → ถอยไปใช้เสียงหลักแทน
      if (key !== 'voice') playSenpaiSound('voice');
    });
  }
}

// ดูว่าข้อความมีคำว่า "ชม" หรือ "ดุ" ไหม (ถ้ามีทั้งคู่ ใช้คำที่มาก่อน)
function pickSenpaiSoundForPrompt(text) {
  const iPraise = text.indexOf('ชม');
  const iScold = text.indexOf('ดุ');
  if (iPraise === -1 && iScold === -1) return null;
  if (iPraise === -1) return 'scold';
  if (iScold === -1) return 'praise';
  return iPraise < iScold ? 'praise' : 'scold';
}

function animateSenpai() {
  const svg = document.getElementById('animeSvg');
  if (!svg) return;
  svg.classList.add('talking', 'squeal');
  setTimeout(() => svg.classList.remove('talking'), 1800);
  setTimeout(() => svg.classList.remove('squeal'), 600);
}

function toggleSenpaiSound() {
  senpaiSoundOn = !senpaiSoundOn;
  document.getElementById('senpaiSoundBtn').textContent = senpaiSoundOn ? '🔊 เสียง: เปิด' : '🔇 เสียง: ปิด';
  if (!senpaiSoundOn && currentSenpaiAudio) currentSenpaiAudio.pause();
}

function sendQuickCringe(text) {
  document.getElementById('senpaiInput').value = text;
  handleSenpaiSubmit();
}

function appendSenpaiBubble(sender, text) {
  const container = document.getElementById('senpaiChatHistory');
  const bubble = document.createElement('div');
  bubble.className = `s-bubble ${sender}`;
  bubble.innerHTML = `<div class="s-content">${formatMarkdown(text)}</div>`;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

function updateHeartsDisplay() {
  const hearts = ['🖤', '🖤', '🖤', '🖤', '🖤'];
  for (let i = 0; i < Math.min(5, cringeCount); i++) {
    hearts[i] = '💖';
  }
  document.getElementById('heartsRow').textContent = hearts.join(' ');
  const mood = document.getElementById('senpaiMood');
  if (mood) mood.textContent = SENPAI_MOODS[Math.min(cringeCount, SENPAI_MOODS.length - 1)];
}

// ==========================================================
// 8. PAWNSHOP MINI-GAMES LOGIC
// ==========================================================
function togglePawnshop(show) {
  if (show) {
    pawnshopModal.classList.remove('hidden');
  } else {
    pawnshopModal.classList.add('hidden');
  }
}

function switchPawnTab(tab) {
  ['stillness', 'sincerity', 'dodging'].forEach(t => {
    document.getElementById(`game${capitalize(t)}`).classList.add('hidden');
    document.getElementById(`tab${capitalize(t)}Btn`).classList.remove('active');
  });
  document.getElementById(`game${capitalize(tab)}`).classList.remove('hidden');
  document.getElementById(`tab${capitalize(tab)}Btn`).classList.add('active');
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// GAME 1: Stillness
let stillnessActive = false;
let stillnessTimer = 5.0;
let stillnessInterval = null;
let lastPos = { x: null, y: null };

function startStillnessChallenge() {
  stillnessActive = true;
  stillnessTimer = 5.00;
  lastPos = { x: null, y: null };

  const display = document.getElementById('stillnessTimerDisplay');
  const status = document.getElementById('stillnessStatus');
  const btn = document.getElementById('startStillnessBtn');

  btn.disabled = true;
  status.textContent = "🤫 กำลังสงบนิ่ง... ห้ามขยับเมาส์แม้แต่ 1 พิกเซล!";
  status.style.color = "#D97757";

  if (stillnessInterval) clearInterval(stillnessInterval);

  stillnessInterval = setInterval(() => {
    stillnessTimer -= 0.05;
    if (stillnessTimer <= 0) {
      clearInterval(stillnessInterval);
      stillnessActive = false;
      display.textContent = "0.00";
      status.textContent = "🎉 สงบนิ่งสำเร็จ! ปลดล็อก 30 Token!";
      status.style.color = "#059669";
      btn.disabled = false;

      grantTokens(30, "🧘 บรรลุสัจธรรม! ได้รับ 30 Token คืน");
      setTimeout(() => togglePawnshop(false), 1200);
    } else {
      display.textContent = stillnessTimer.toFixed(2);
    }
  }, 50);
}

window.addEventListener('mousemove', (e) => {
  if (!stillnessActive) return;
  if (lastPos.x !== null) {
    if (Math.abs(e.clientX - lastPos.x) > 2 || Math.abs(e.clientY - lastPos.y) > 2) {
      stillnessTimer = 5.00;
      document.getElementById('stillnessTimerDisplay').textContent = "5.00";
      document.getElementById('stillnessStatus').textContent = "😡 ขยับทำไม! เริ่มนับใหม่เดี๋ยวนี้!";
      sfx.buzzer();
      document.body.classList.add('shake-active');
      setTimeout(() => document.body.classList.remove('shake-active'), 300);
    }
  }
  lastPos = { x: e.clientX, y: e.clientY };
});

// GAME 2: Sincerity
const sincerityInput = document.getElementById('sincerityInput');
const targetSincerity = "ข้าพเจ้าขอสารภาพว่าคิดเองไม่เป็นและเป็นภาระต่อเซิร์ฟเวอร์";
document.getElementById('sincerityCounter').textContent = `ความคืบหน้า: 0 / ${targetSincerity.length} ตัวอักษร`;

sincerityInput.addEventListener('keydown', (e) => {
  if (e.key === 'Backspace' || e.key === 'Delete') {
    e.preventDefault();
    sincerityInput.value = '';
    document.getElementById('sincerityCounter').textContent = `ความคืบหน้า: 0 / ${targetSincerity.length} ตัวอักษร`;
    sfx.buzzer();
    showToast("🚨", "ห้ามกดลบเด็ดขาด! เริ่มพิมพ์ใหม่ทั้งหมด!");
  }
});

sincerityInput.addEventListener('input', () => {
  const val = sincerityInput.value;
  document.getElementById('sincerityCounter').textContent = `ความคืบหน้า: ${val.length} / ${targetSincerity.length} ตัวอักษร`;

  if (val.trim() === targetSincerity.trim()) {
    sincerityInput.disabled = true;
    grantTokens(40, "🙏 ความจริงใจของคุณส่งถึง AI แล้ว! ปลดล็อก 40 Token");
    setTimeout(() => togglePawnshop(false), 1200);
  }
});

// GAME 3: Dodging
function dodgeButton(btn) {
  sfx.click();
  const parent = btn.parentElement;
  const maxX = parent.clientWidth - btn.clientWidth - 20;
  const maxY = parent.clientHeight - btn.clientHeight - 20;
  btn.style.position = 'absolute';
  btn.style.left = Math.max(10, Math.floor(Math.random() * maxX)) + 'px';
  btn.style.top = Math.max(10, Math.floor(Math.random() * maxY)) + 'px';
}

// ==========================================================
// 9. API KEY MODAL & UTILS
// ==========================================================
function openApiKeyModal() {
  apiKeyInput.value = geminiApiKey;
  apiKeyModal.classList.remove('hidden');
}
function closeApiKeyModal() {
  apiKeyModal.classList.add('hidden');
}
function saveApiKey() {
  geminiApiKey = apiKeyInput.value.trim();
  localStorage.setItem('CLOWN_GEMINI_KEY', geminiApiKey);
  detectedModel = null;
  getWorkingModelName();
  closeApiKeyModal();
  showToast("🔑", "บันทึก Gemini API Key เรียบร้อยแล้ว!");
}
function clearApiKey() {
  geminiApiKey = '';
  detectedModel = null;
  localStorage.removeItem('CLOWN_GEMINI_KEY');
  apiKeyInput.value = '';
  if (modelStatusBadge) modelStatusBadge.textContent = "Mock Mode";
  showToast("🗑️", "ล้าง API Key แล้ว (จะใช้ระบบจำลองคำตอบ)");
}

function showToast(icon, msg) {
  const toast = document.getElementById('toast');
  document.getElementById('toastIcon').textContent = icon;
  document.getElementById('toastMsg').textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2600);
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatMarkdown(text) {
  const parts = escapeHtml(text).split(/(```[\s\S]*?```|`[^`\n]+`)/g);
  return parts.map(p => {
    if (p.startsWith('```') && p.endsWith('```') && p.length >= 6) return '<pre><code>' + p.slice(3, -3) + '</code></pre>';
    if (p.startsWith('`') && p.endsWith('`') && p.length > 2) return '<code>' + p.slice(1, -1) + '</code>';
    return p
      .replace(/^[ \t]*[*\-] /gm, '• ')
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  }).join('');
}

// เริ่มต้น Token ที่ 50
updateTokenUI(50);