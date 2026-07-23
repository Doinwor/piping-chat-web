// Web version — no Electron dependencies

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}
function genRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 20; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return 'PC-' + code;
}
function genGroupCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 20; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return 'PG-' + code;
}
function isValidRoomCode(code) {
  return /^(PC|PG)-[A-Z2-9]{20}$/.test(code);
}
function isGroupCode(code) {
  return code.startsWith('PG-');
}
function xorCode(data, key) {
  let r = '';
  for (let i = 0; i < data.length; i++) r += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  return r;
}
function genId() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 6); }

const AVATAR_COLORS = ['#e74c3c','#e67e22','#f1c40f','#2ecc71','#1abc9c','#3498db','#9b59b6','#e91e63','#00bcd4','#8bc34a'];
function getAvatarColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

const BASE = 'https://ppng.io';
let myUuid, myName, activeRoom, myPath, announcePath, joinPath;
let peers = {};
let connected = false;
let timers = [];
let typingTimers = {};
let chats = {};
let history = {};
let receivedIds = new Set();
let ctxTarget = null;
let replyTo = null;
let forwardTarget = null;
let unreadCounts = {};
let isLightTheme = false;
let appPin = null;
let autoDeleteTimers = {};
let pendingDeletes = {};

const loginModal = document.getElementById('login-modal');
const inputName = document.getElementById('input-name');
const loginBtn = document.getElementById('login-btn');
const chatList = document.getElementById('chat-list');
const newChatBtn = document.getElementById('new-chat-btn');
const joinInput = document.getElementById('join-input');
const joinBtn = document.getElementById('join-btn');
const sidebarFooter = document.getElementById('sidebar-footer');
const groupName = document.getElementById('group-name');
const groupSubtitle = document.getElementById('group-subtitle');
const clockEl = document.getElementById('clock');
const participantsToggle = document.getElementById('participants-toggle');
const participantsPanel = document.getElementById('participants-panel');
const participantsList = document.getElementById('participants-list');
const mc = document.getElementById('messages');
const typingArea = document.getElementById('typing-area');
const textInput = document.getElementById('textInput');
const sendBtn = document.getElementById('sendBtn');
const fileBtn = document.getElementById('fileBtn');
const fileInput = document.getElementById('fileInput');
const ctxMenu = document.getElementById('ctx-menu');
const replyBar = document.getElementById('reply-bar');
const rbName = document.getElementById('rb-name');
const rbText = document.getElementById('rb-text');
const replyClose = document.getElementById('reply-close');
const settingsPage = document.getElementById('settings-page');
const settingsBtn = document.getElementById('settings-btn');
const settingsBack = document.getElementById('settings-back');
const settingsAvatar = document.getElementById('settings-avatar');
const settingsNameDisplay = document.getElementById('settings-name-display');
const settingsUuidDisplay = document.getElementById('settings-uuid-display');
const settingsChatsCount = document.getElementById('settings-chats-count');
const settingsRenameBtn = document.getElementById('settings-rename-btn');
const settingsRenameArea = document.getElementById('settings-rename-area');
const settingsRenameInput = document.getElementById('settings-rename-input');
const settingsRenameOk = document.getElementById('settings-rename-ok');
const settingsThemeSelect = document.getElementById('settings-theme-select');
const settingsPinBtn = document.getElementById('settings-pin-btn');
const settingsPinStatus = document.getElementById('settings-pin-status');
const settingsExportBtn = document.getElementById('settings-export-btn');
const settingsResetBtn = document.getElementById('settings-reset-btn');
const settingsUuidVal = document.getElementById('settings-uuid-val');
const settingsAutoLockSelect = document.getElementById('settings-autolock-select');
const footerAvatar = document.getElementById('footer-avatar');
const footerName = document.getElementById('footer-name');
const themeToggle = document.getElementById('theme-toggle');
const emojiBtn = document.getElementById('emojiBtn');
const emojiPicker = document.getElementById('emoji-picker');
const emojiGrid = document.getElementById('emoji-grid');
const voiceBtn = document.getElementById('voiceBtn');
const searchBtn = document.getElementById('search-btn');
const searchPanel = document.getElementById('search-panel');
const searchInput = document.getElementById('search-input');
const searchCount = document.getElementById('search-count');
const searchClose = document.getElementById('search-close');
const forwardModal = document.getElementById('forward-modal');
const forwardList = document.getElementById('forward-list');
const dropOverlay = document.getElementById('drop-overlay');
const pinModal = document.getElementById('pin-modal');
const pinInput = document.getElementById('pin-input');
const pinOkBtn = document.getElementById('pin-ok-btn');
const pinError = document.getElementById('pin-error');
const exportModal = document.getElementById('export-modal');
const groupManageBtn = document.getElementById('group-manage-btn');
const groupModal = document.getElementById('group-modal');
const groupMembersList = document.getElementById('group-members-list');
const groupAddInput = document.getElementById('group-add-input');
const groupAddBtn = document.getElementById('group-add-btn');
const createGroupModal = document.getElementById('create-group-modal');
const newGroupBtn = document.getElementById('new-group-btn');
const cgName = document.getElementById('cg-name');
const cgLimit = document.getElementById('cg-limit');
const cgLimitVal = document.getElementById('cg-limit-val');
const cgCancel = document.getElementById('cg-cancel');
const cgCreate = document.getElementById('cg-create');

// ---------- ONBOARDING ----------
const onboardingContainer = document.getElementById('onboarding');
const onboardingSteps = document.querySelectorAll('.onboarding-step');
let currentStep = 0;
let selectedLanguage = 'ru';
let selectedTheme = 'dark';
const languages = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
];
function initOnboarding() {
  const langContainer = document.getElementById('onboarding-languages');
  langContainer.innerHTML = '';
  languages.forEach(lang => {
    const btn = document.createElement('button');
    btn.className = 'lang-option' + (selectedLanguage === lang.code ? ' selected' : '');
    btn.dataset.code = lang.code;
    btn.innerHTML = lang.flag + ' ' + lang.name;
    btn.onclick = () => {
      selectedLanguage = lang.code;
      document.querySelectorAll('.lang-option').forEach(b => { b.classList.remove('selected'); b.style.borderColor = 'var(--border)'; });
      btn.classList.add('selected');
      btn.style.borderColor = 'var(--accent)';
    };
    langContainer.appendChild(btn);
  });
  document.querySelectorAll('.theme-option').forEach(el => {
    el.onclick = () => {
      selectedTheme = el.dataset.theme;
      document.querySelectorAll('.theme-option').forEach(e => e.style.borderColor = 'var(--border)');
      el.style.borderColor = 'var(--accent)';
    };
    if (el.dataset.theme === selectedTheme) el.style.borderColor = 'var(--accent)';
  });
  document.querySelectorAll('.onboarding-next').forEach(btn => {
    btn.onclick = () => goToStep(currentStep + 1);
  });
  document.querySelectorAll('.onboarding-back').forEach(btn => {
    btn.onclick = () => goToStep(currentStep - 1);
  });
  document.getElementById('onboarding-finish').onclick = finishOnboarding;
  goToStep(0);
}
function goToStep(step) {
  const steps = document.querySelectorAll('.onboarding-step');
  if (step < 0 || step >= steps.length) return;
  if (step > currentStep && currentStep === 3) {
    const nameInput = document.getElementById('onboarding-name');
    const name = nameInput.value.trim();
    if (!name) { document.getElementById('onboarding-name-error').textContent = 'Пожалуйста, введите имя'; return; }
    document.getElementById('onboarding-name-error').textContent = '';
  }
  currentStep = step;
  steps.forEach((el, i) => {
    el.style.display = i === step ? 'flex' : 'none';
    el.classList.toggle('active', i === step);
  });
}
function finishOnboarding() {
  const nameInput = document.getElementById('onboarding-name');
  const name = nameInput.value.trim();
  if (!name) { document.getElementById('onboarding-name-error').textContent = 'Пожалуйста, введите имя'; return; }
  myName = name;
  if (!myUuid) myUuid = uuidv4();
  applyTheme(selectedTheme === 'light');
  localStorage.setItem(localStorageKey('state'), JSON.stringify({ uuid: myUuid, name: myName, chats: {}, theme: selectedTheme === 'light', unread: {}, pin: null, onboardingDone: true, autoLockMinutes: 0 }));
  onboardingContainer.style.display = 'none';
  onboardingContainer.classList.remove('show');
  loginModal.classList.add('hidden');
  updateFooter();
  renderChatList();
  updateWindowTitle();
  showToast('Добро пожаловать! Создайте или присоединитесь к чату.');
}

// === Theme ===
function applyTheme(light) {
  isLightTheme = light;
  document.body.classList.toggle('light', light);
  themeToggle.textContent = light ? '☾' : '☀';
  if (settingsThemeSelect) settingsThemeSelect.value = light ? 'light' : 'dark';
}

themeToggle.onclick = () => {
  applyTheme(!isLightTheme);
  saveState();
};

// === Emoji picker ===
const EMOJIS = ['😀','😂','🥰','😎','🤔','👍','👎','❤️','🔥','✨','🎉','💪','😢','😡','🙏','🤝','👋','🥳','😏','😢','🤣','😍','😘','😭','😱','🤔','🤗','😴','🤮','👻','💀','🙈','🙉','🙊','🐱','🐶','🦊','🐻','🐼','🐸','🌟','⭐','🌈','☀️','🌙','⚡','💧','🎵','🎶','💡','📌','🏆','🎯','🚀','✈️','💻','📱','☕','🍕','🍔','🎂','🍰','🍎','🍓','🥑','🌽','🥕'];

EMOJIS.forEach(e => {
  const span = document.createElement('span');
  span.className = 'emoji-item';
  span.textContent = e;
  span.onclick = () => { textInput.value += e; textInput.focus(); };
  emojiGrid.appendChild(span);
});

emojiBtn.onclick = (ev) => { ev.stopPropagation(); emojiPicker.classList.toggle('show'); };
document.addEventListener('click', e => { if (!emojiPicker.contains(e.target) && e.target !== emojiBtn) emojiPicker.classList.remove('show'); });

// === Voice recording ===
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

voiceBtn.onclick = async (ev) => {
  ev.stopPropagation();
  if (!connected) return;
  if (isRecording) {
    if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop();
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioChunks = [];
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
    mediaRecorder.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      isRecording = false;
      voiceBtn.classList.remove('recording');
      voiceBtn.textContent = '🎤';
      if (audioChunks.length === 0) return;
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      audioChunks = [];
      const reader = new FileReader();
      reader.onload = () => sendVoiceMsg(reader.result);
      reader.readAsDataURL(blob);
    };
    mediaRecorder.start();
    isRecording = true;
    voiceBtn.classList.add('recording');
    voiceBtn.textContent = '⏹';
  } catch (e) {
    showToast('Не удалось получить доступ к микрофону');
  }
};

function sendVoiceMsg(audioSrc) {
  if (!connected || !audioSrc) return;
  const offlineNames = [];
  for (const [uuid, p] of Object.entries(peers)) {
    if (p.online === false) offlineNames.push(p.name);
  }
  if (offlineNames.length > 0) {
    showToast(`${offlineNames.join(', ')} ${offlineNames.length === 1 ? 'не в сети' : 'не в сети'} — голосовое будет доставлено при подключении`);
  }
  const msg = { id: genId(), type: 'audio', from: myName, fromUuid: myUuid, src: audioSrc, timestamp: Date.now(), status: 'sending' };
  createMsgEl(msg, true);
  receivedIds.add(msg.id);
  if (history[activeRoom]) { history[activeRoom].push(msg); saveHistory(activeRoom); }
  updateChatLastMsg(activeRoom, myName, '[голосовое]');
  const encMsg = { ...msg, src: xorCode(audioSrc, activeRoom) };
  for (const p of Object.values(peers)) post(p.path, encMsg);
  setTimeout(() => {
    const m = history[activeRoom]?.find(x => x.id === msg.id);
    if (m && m.status === 'sending') { m.status = 'sent'; saveHistory(activeRoom); updateMessageStatusUI(msg.id); }
  }, 1500);

}

// === Search ===
const searchFiltersToggle = document.getElementById('search-filters-toggle');
const searchFilters = document.getElementById('search-filters');
const searchSender = document.getElementById('search-sender');
const searchDateFrom = document.getElementById('search-date-from');
const searchDateTo = document.getElementById('search-date-to');

searchBtn.onclick = () => {
  searchPanel.classList.toggle('show');
  if (searchPanel.classList.contains('show')) {
    searchInput.value = ''; searchInput.focus(); searchCount.textContent = ''; clearSearchHighlights();
    updateSenderAutocomplete();
    searchSender.value = ''; searchDateFrom.value = ''; searchDateTo.value = '';
    searchFilters.classList.remove('show');
  }
};
searchClose.onclick = () => { searchPanel.classList.remove('show'); searchInput.value = ''; searchCount.textContent = ''; clearSearchHighlights(); searchFilters.classList.remove('show'); };
searchFiltersToggle.onclick = () => searchFilters.classList.toggle('show');
searchInput.oninput = () => performSearch();
searchSender.oninput = () => performSearch();
searchDateFrom.onchange = () => performSearch();
searchDateTo.onchange = () => performSearch();

function updateSenderAutocomplete() {
  const list = document.getElementById('sender-list');
  list.innerHTML = '';
  if (!history[activeRoom]) return;
  const names = [...new Set(history[activeRoom].filter(m => m.type === 'text' && m.from).map(m => m.from))];
  names.forEach(n => { const o = document.createElement('option'); o.value = n; list.appendChild(o); });
}

function performSearch() {
  clearSearchHighlights();
  const q = searchInput.value.trim().toLowerCase();
  const senderFilter = searchSender.value.trim().toLowerCase();
  const fromDate = searchDateFrom.value ? new Date(searchDateFrom.value) : null;
  const toDate = searchDateTo.value ? new Date(searchDateTo.value + 'T23:59:59') : null;
  if ((!q && !senderFilter && !fromDate && !toDate) || !history[activeRoom]) { searchCount.textContent = ''; return; }
  let count = 0;
  mc.querySelectorAll('.message').forEach(el => {
    const id = el.dataset.id;
    const msg = history[activeRoom].find(m => m.id === id);
    if (!msg || msg.type !== 'text') return;
    if (q && msg.text && !msg.text.toLowerCase().includes(q)) return;
    if (senderFilter && (!msg.from || !msg.from.toLowerCase().includes(senderFilter))) return;
    if (fromDate && new Date(msg.timestamp) < fromDate) return;
    if (toDate && new Date(msg.timestamp) > toDate) return;
    el.style.outline = '2px solid var(--accent)';
    el.style.outlineOffset = '2px';
    count++;
  });
  searchCount.textContent = count > 0 ? `${count} найдено` : 'Ничего';
}
function clearSearchHighlights() {
  mc.querySelectorAll('.message').forEach(el => { el.style.outline = ''; el.style.outlineOffset = ''; });
}

// === Unread counters ===
function incrementUnread(room) {
  if (room === activeRoom) return;
  unreadCounts[room] = (unreadCounts[room] || 0) + 1;
  renderChatList();
  updateWindowTitle();
}
function clearUnread(room) {
  unreadCounts[room] = 0;
  renderChatList();
  updateWindowTitle();
}
function updateWindowTitle() {
  let total = 0;
  for (const v of Object.values(unreadCounts)) total += v;
  const title = total > 0 ? `(${total}) Piping Chat` : 'Piping Chat';
  document.title = title;
  if (titlebarText) titlebarText.textContent = title;
}

// === Notification sound ===
let audioCtx;
function playNotifSound() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.3);
  } catch (e) {}
}

// === LocalStorage ===
function localStorageKey(key) { return 'pc_' + key; }
let autoLockMinutes = 0;
let autoLockTimer = null;

function saveState() {
  try { localStorage.setItem(localStorageKey('state'), JSON.stringify({ uuid: myUuid, name: myName, chats, theme: isLightTheme, unread: unreadCounts, pin: appPin, autoLockMinutes, onboardingDone: !!myName })); } catch (e) { console.error('saveState error:', e); }
}
function loadState() {
  try {
    const raw = localStorage.getItem(localStorageKey('state'));
    if (!raw) { if (!myUuid) myUuid = uuidv4(); return false; }
    const s = JSON.parse(raw);
    if (s.uuid) myUuid = s.uuid;
    if (s.name) myName = s.name;
    if (s.chats) chats = s.chats;
    if (s.theme !== undefined) applyTheme(s.theme);
    if (s.unread) unreadCounts = s.unread;
    if (s.pin) appPin = s.pin;
    if (s.autoLockMinutes !== undefined) autoLockMinutes = s.autoLockMinutes;
    if (s.onboardingDone && s.name) {
      if (!myUuid) { myUuid = uuidv4(); }
      for (const room of Object.keys(chats)) {
        if (!chats[room].name) chats[room].name = '';
      }
      return true;
    }
  } catch (e) { chats = {}; }
  if (!myUuid) myUuid = uuidv4();
  for (const room of Object.keys(chats)) {
    if (!chats[room].name) chats[room].name = '';
  }
  return false;
}
function historyKey(room) { return localStorageKey('hist_' + room.replace(/[^a-zA-Z0-9]/g, '_')); }
function saveHistory(room) {
  if (!history[room]) return;
  try { localStorage.setItem(historyKey(room), JSON.stringify(history[room])); } catch (e) { console.error('saveHistory error:', e); }
}
function loadHistory(room) {
  try { history[room] = JSON.parse(localStorage.getItem(historyKey(room))); } catch (e) { history[room] = []; }
}

const titlebarText = document.getElementById('titlebar-text');

// === Clock ===
setInterval(() => { clockEl.textContent = new Date().toLocaleTimeString(); }, 1000);
clockEl.textContent = new Date().toLocaleTimeString();

// === Network ===
function post(targetPath, data) {
  return fetch(BASE + targetPath, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).catch(e => console.error('POST error:', e.message));
}
async function get(targetPath, timeout) {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), timeout);
    const r = await fetch(BASE + targetPath, { method: 'GET', signal: c.signal });
    clearTimeout(t);
    if (r.ok) { const txt = await r.text(); return txt.length > 2 ? JSON.parse(txt) : null; }
  } catch (e) {}
  return null;
}

function sendAck(targetUuid, targetMsgId, status) {
  if (!connected) return;
  const p = peers[targetUuid];
  if (!p) return;
  post(p.path, { type: 'ack', from: myName, fromUuid: myUuid, targetId: targetMsgId, status, timestamp: Date.now() });
}
function getMsgStatusText(status) {
  switch (status) {
    case 'sending': return '⏳';
    case 'sent': return '✓';
    case 'delivered': return '✓✓';
    case 'read': return '✓✓';
    default: return '';
  }
}
function getMsgStatusColor(status) {
  switch (status) {
    case 'read': return isLightTheme ? '#1976d2' : '#4fc3f7';
    case 'delivered': return isLightTheme ? '#1976d2' : '#4fc3f7';
    case 'sent': return isLightTheme ? '#888' : 'rgba(255,255,255,0.5)';
    default: return isLightTheme ? '#aaa' : 'rgba(255,255,255,0.3)';
  }
}

// === Notifications ===
function notify(from, text) {
  if (document.hasFocus()) return;
  playNotifSound();
  try { new Notification(from, { body: text }); } catch (e) {}
}

// === Chat display name ===
function getChatDisplayName(room) {
  if (chats[room] && chats[room].name) return chats[room].name;
  if (!isGroupCode(room)) {
    if (chats[room] && chats[room].peerName) return chats[room].peerName;
    for (const p of Object.values(peers)) return p.name;
  }
  const peerNames = [];
  for (const p of Object.values(peers)) peerNames.push(p.name);
  if (peerNames.length > 0) return peerNames.join(', ');
  return room;
}
function getChatPreview(room) {
  if (chats[room] && chats[room].lastMsg) return chats[room].lastMsg;
  return '';
}
function getChatTime(room) {
  if (chats[room] && chats[room].lastMsgTime) {
    const d = new Date(chats[room].lastMsgTime);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
  }
  return '';
}

// === Markdown ===
function renderMarkdown(text) {
  if (!text) return '';
  let s = escapeHtml(text);
  s = s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  s = s.replace(/\*(.+?)\*/g, '<i>$1</i>');
  s = s.replace(/`(.+?)`/g, '<code>$1</code>');
  return s;
}

// === UI: Messages ===
function createMsgEl(msg, isMe, skipAvatar) {
  if (msg.type === 'system') {
    const d = document.createElement('div');
    d.className = 'system-msg';
    d.dataset.id = msg.id;
    d.textContent = msg.text;
    mc.appendChild(d);
    mc.scrollTop = mc.scrollHeight;
    return;
  }
  const d = document.createElement('div');
  d.className = `message ${isMe ? 'you' : 'other'}`;
  d.dataset.id = msg.id;
  d.dataset.from = msg.fromUuid;
  d.dataset.senderName = msg.from;

  let html = '';
  const color = getAvatarColor(msg.from);
  const initial = (msg.from || '?')[0].toUpperCase();

  if (!isMe && !skipAvatar) {
    html += `<span class="avatar-sm" style="background:${color};color:#fff;">${initial}</span>`;
  }

  html += `<div class="msg-header"><span class="sender" style="color:${isMe ? 'rgba(255,255,255,0.8)' : color};">${msg.from}</span>`;
  html += ` <span class="time">${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>`;
  if (msg.edited) html += ` <span class="edited">(изм.)</span>`;
  html += `</div>`;

  if (msg.replyTo) {
    html += `<div class="reply-ref" data-scroll-to="${msg.replyTo.id}">`;
    html += `<div class="ref-name">${msg.replyTo.from}</div>`;
    const rt = msg.replyTo.text || '[изображение]';
    html += `<div class="ref-text">${rt.substring(0, 80)}${rt.length > 80 ? '...' : ''}</div>`;
    html += `</div>`;
  }

  if (msg.type === 'image') {
    html += `<img src="${msg.src}">`;
  } else if (msg.type === 'audio') {
    html += `<div class="audio-msg-wrap"><span class="audio-icon">🎙</span><audio controls preload="none" src="${msg.src}"></audio></div>`;
  } else {
    html += `<div class="msg-text">${renderMarkdown(msg.text)}</div>`;
  }

  if (isMe && msg.status) {
    const st = getMsgStatusText(msg.status);
    const clr = getMsgStatusColor(msg.status);
    html += `<div class="msg-status" style="text-align:right;font-size:11px;margin-top:2px;color:${clr};">${st}</div>`;
  }

  d.innerHTML = html;
  d.oncontextmenu = e => showCtx(e, msg, isMe, d);

  const imgEl = d.querySelector('img');
  if (imgEl) {
    imgEl.style.cursor = 'zoom-in';
    imgEl.onclick = () => openImageViewer(msg.src, msg.from, new Date(msg.timestamp).toLocaleString());
  }

  if (msg.replyTo) {
    const ref = d.querySelector('.reply-ref');
    if (ref) ref.onclick = () => {
      const target = mc.querySelector(`[data-id="${msg.replyTo.id}"]`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.style.boxShadow = '0 0 16px 3px rgba(0,132,255,0.5)';
        setTimeout(() => { target.style.boxShadow = ''; }, 1500);
      }
    };
  }

  mc.appendChild(d);
  mc.scrollTop = mc.scrollHeight;
}

function escapeHtml(t) {
  if (!t) return '';
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// === Image Viewer ===
const imgViewer = document.getElementById('img-viewer');
const imgViewerImg = document.getElementById('img-viewer-img');
const imgViewerClose = document.getElementById('img-viewer-close');
const imgViewerInfo = document.getElementById('img-viewer-info');
let imgZoomed = false;

function openImageViewer(src, from, time) {
  imgViewerImg.src = src;
  imgViewerInfo.textContent = `${from} — ${time}`;
  imgViewer.style.display = 'flex';
  imgViewer.style.pointerEvents = 'auto';
  imgViewerImg.style.transform = 'scale(1)';
  imgZoomed = false;
}
imgViewerClose.onclick = () => { imgViewer.style.display = 'none'; imgViewer.style.pointerEvents = 'none'; };
imgViewer.onclick = e => {
  if (e.target === imgViewer) { imgViewer.style.display = 'none'; imgViewer.style.pointerEvents = 'none'; }
};
imgViewerImg.onclick = e => {
  e.stopPropagation();
  imgZoomed = !imgZoomed;
  imgViewerImg.style.transform = imgZoomed ? 'scale(2)' : 'scale(1)';
  imgViewerImg.style.cursor = imgZoomed ? 'zoom-out' : 'zoom-in';
};
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && imgViewer.style.display === 'flex') { imgViewer.style.display = 'none'; imgViewer.style.pointerEvents = 'none'; }
});

function updateMessageStatusUI(msgId) {
  const msg = history[activeRoom] ? history[activeRoom].find(m => m.id === msgId) : null;
  if (!msg) return;
  const el = mc.querySelector(`[data-id="${msgId}"]`);
  if (!el) return;
  const old = el.querySelector('.msg-status');
  if (old) old.remove();
  if (msg.status) {
    const st = getMsgStatusText(msg.status);
    const clr = getMsgStatusColor(msg.status);
    if (st) {
      const span = document.createElement('div');
      span.className = 'msg-status';
      span.style.cssText = `text-align:right;font-size:11px;margin-top:2px;color:${clr};`;
      span.textContent = st;
      el.appendChild(span);
    }
  }
}

function addSystem(text) {
  const d = document.createElement('div');
  d.className = 'system-msg';
  d.textContent = text;
  mc.appendChild(d);
  mc.scrollTop = mc.scrollHeight;
}
function addRoomCodeMsg(code) {
  const d = document.createElement('div');
  d.className = 'room-code-msg';
  d.innerHTML = `Код комнаты: <b>${code}</b><br><span style="font-size:12px;opacity:0.7;">Скопируйте и отправьте собеседнику</span>`;
  mc.appendChild(d);
  mc.scrollTop = mc.scrollHeight;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' Б';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' КБ';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' МБ';
  return (bytes / 1073741824).toFixed(2) + ' ГБ';
}

function addSystemMessage(text) {
  const msg = { id: genId(), type: 'system', from: 'Система', fromUuid: 'system', text, timestamp: Date.now(), status: 'delivered' };
  const d = document.createElement('div');
  d.className = 'system-msg';
  d.textContent = msg.text;
  mc.appendChild(d);
  mc.scrollTop = mc.scrollHeight;
  receivedIds.add(msg.id);
  if (history[activeRoom]) { history[activeRoom].push(msg); saveHistory(activeRoom); }
  showToast(text);
}

function showToast(text) {
  const container = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = '<span class="toast-icon">⚠️</span> ' + text;
  container.appendChild(t);
  setTimeout(() => { if (t.parentNode) t.remove(); }, 5000);
}

function updateTypingArea() {
  const names = [];
  for (const p of Object.values(peers)) {
    if (p.typing) names.push(p.name);
  }
  if (names.length > 0) {
    typingArea.innerHTML = `<div class="typing-indicator">${names.join(', ')} ${names.length === 1 ? 'печатает' : 'печатают'}...</div>`;
  } else {
    typingArea.innerHTML = '';
  }
}

// === UI: Reply Bar ===
function showReplyBar(msg) {
  replyTo = msg;
  rbName.textContent = msg.from;
  rbText.textContent = (msg.text || '[изображение]').substring(0, 60);
  replyBar.classList.add('show');
  textInput.focus();
}
function hideReplyBar() {
  replyTo = null;
  replyBar.classList.remove('show');
}
replyClose.onclick = hideReplyBar;

// === UI: Settings Page ===
function updateFooter() {
  footerAvatar.style.background = getAvatarColor(myName);
  footerAvatar.textContent = myName[0].toUpperCase();
  footerName.textContent = myName;
}

function showSettings() {
  settingsNameDisplay.textContent = myName;
  settingsUuidDisplay.textContent = myUuid;
  settingsChatsCount.textContent = Object.keys(chats).length;
  settingsUuidVal.textContent = myUuid;
  settingsAvatar.style.background = getAvatarColor(myName);
  settingsAvatar.textContent = myName[0].toUpperCase();
  settingsThemeSelect.value = isLightTheme ? 'light' : 'dark';
  settingsPinStatus.textContent = appPin ? 'Установлен' : 'Не установлен';
  settingsAutoLockSelect.value = autoLockMinutes;
  settingsRenameArea.classList.remove('show');
  settingsPage.classList.add('show');
  document.getElementById('topbar').style.display = 'none';
  document.getElementById('search-panel').style.display = 'none';
  document.getElementById('participants-panel').style.display = 'none';
  document.getElementById('typing-area').style.display = 'none';
  document.getElementById('reply-bar').style.display = 'none';
  document.getElementById('input-area').style.display = 'none';
  mc.style.display = 'none';
}

function showChat() {
  settingsPage.classList.remove('show');
  document.getElementById('topbar').style.display = '';
  mc.style.display = '';
  document.getElementById('typing-area').style.display = '';
  document.getElementById('input-area').style.display = '';
  if (activeRoom) {
    document.getElementById('reply-bar').style.display = '';
  }
}

settingsBtn.onclick = (e) => { e.stopPropagation(); showSettings(); };
settingsBack.onclick = () => showChat();

settingsRenameBtn.onclick = () => {
  settingsRenameArea.classList.toggle('show');
  if (settingsRenameArea.classList.contains('show')) {
    settingsRenameInput.value = myName;
    settingsRenameInput.focus();
  }
};
settingsRenameOk.onclick = () => {
  const newName = settingsRenameInput.value.trim();
  if (!newName || newName === myName) return;
  myName = newName;
  saveState();
  updateFooter();
  settingsNameDisplay.textContent = myName;
  settingsAvatar.textContent = myName[0].toUpperCase();
  settingsRenameArea.classList.remove('show');
};
settingsRenameInput.onkeypress = e => { if (e.key === 'Enter') settingsRenameOk.click(); };

settingsThemeSelect.onchange = (e) => {
  const light = e.target.value === 'light';
  applyTheme(light);
  saveState();
};

settingsPinBtn.onclick = () => {
  const current = appPin || '';
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:10000;display:flex;align-items:center;justify-content:center;';
  modal.innerHTML = `
    <div style="background:var(--bg-login);border:1px solid var(--border);padding:30px;border-radius:16px;width:320px;text-align:center;">
      <h3 style="margin-bottom:12px;color:var(--text);">${current ? 'Изменить PIN' : 'Установить PIN'}</h3>
      <p style="font-size:13px;color:var(--text-dim);margin-bottom:12px;">Введите 4-6 цифр</p>
      <input id="modal-pin-input" type="password" maxlength="6" placeholder="PIN" style="width:100%;padding:12px;border:1px solid var(--border-focus);border-radius:10px;background:var(--bg-input);color:var(--text);font-size:24px;text-align:center;letter-spacing:8px;outline:none;">
      <div id="modal-pin-error" style="color:#e74c3c;font-size:12px;margin-top:8px;min-height:18px;"></div>
      <div style="margin-top:16px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
        <button id="modal-pin-save" style="background:var(--accent);color:#fff;border:none;padding:8px 24px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;">${current ? 'Изменить' : 'Установить'}</button>
        <button id="modal-pin-cancel" style="background:var(--bg-msg-other);color:var(--text-dim);border:1px solid var(--border);padding:8px 20px;border-radius:8px;cursor:pointer;font-size:13px;">Отмена</button>
        ${current ? '<button id="modal-pin-remove" style="background:#c0392b;color:#fff;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:13px;">Удалить</button>' : ''}
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  const input = modal.querySelector('#modal-pin-input');
  const errorEl = modal.querySelector('#modal-pin-error');
  setTimeout(() => input.focus(), 50);

  const savePin = () => {
    const val = input.value.trim();
    if (val === '') { errorEl.textContent = 'Введите PIN'; return; }
    if (val.length < 4 || val.length > 6) { errorEl.textContent = 'PIN должен быть 4-6 цифр'; return; }
    appPin = val;
    settingsPinStatus.textContent = 'Установлен';
    saveState();
    showToast('PIN установлен');
    modal.remove();
  };
  modal.querySelector('#modal-pin-save').onclick = savePin;
  modal.querySelector('#modal-pin-cancel').onclick = () => modal.remove();
  const removeBtn = modal.querySelector('#modal-pin-remove');
  if (removeBtn) removeBtn.onclick = () => {
    appPin = null;
    settingsPinStatus.textContent = 'Не установлен';
    saveState();
    showToast('PIN удалён');
    modal.remove();
  };
  input.onkeydown = e => { if (e.key === 'Enter') savePin(); };
};

settingsAutoLockSelect.value = autoLockMinutes;
settingsAutoLockSelect.onchange = () => {
  autoLockMinutes = parseInt(settingsAutoLockSelect.value);
  saveState();
  resetAutoLockTimer();
};

function resetAutoLockTimer() {
  if (autoLockTimer) clearTimeout(autoLockTimer);
  autoLockTimer = null;
  if (autoLockMinutes <= 0 || !appPin) return;
  autoLockTimer = setTimeout(() => {
    const ls = document.getElementById('lock-screen');
    if (ls && ls.style.display !== 'none') return;
    lockApp();
  }, autoLockMinutes * 60 * 1000);
}

function lockApp() {
  if (!appPin) return;
  let ls = document.getElementById('lock-screen');
  if (!ls) {
    ls = document.createElement('div');
    ls.id = 'lock-screen';
    ls.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:9000;display:flex;align-items:center;justify-content:center;flex-direction:column;';
    ls.innerHTML = `
      <div style="background:var(--bg-login);border:1px solid var(--border);padding:40px;border-radius:16px;text-align:center;width:320px;">
        <div style="font-size:48px;margin-bottom:12px;">🔒</div>
        <h2 style="margin-bottom:8px;color:var(--text);">Приложение заблокировано</h2>
        <p style="color:var(--text-dim);font-size:13px;margin-bottom:20px;">Введите PIN для разблокировки</p>
        <input id="lock-pin-input" type="password" maxlength="6" placeholder="PIN" style="width:100%;padding:12px;border:1px solid var(--border-focus);border-radius:10px;background:var(--bg-input);color:var(--text);font-size:24px;text-align:center;letter-spacing:8px;outline:none;">
        <div id="lock-error" style="color:#e74c3c;font-size:13px;margin-top:8px;min-height:20px;"></div>
        <button id="lock-unlock-btn" style="margin-top:16px;width:100%;padding:12px;background:var(--accent);color:#fff;border:none;border-radius:10px;cursor:pointer;font-size:15px;font-weight:700;">Разблокировать</button>
      </div>
    `;
    document.body.appendChild(ls);
    const pinInput = document.getElementById('lock-pin-input');
    const unlockBtn = document.getElementById('lock-unlock-btn');
    const errorEl = document.getElementById('lock-error');
    const unlock = () => {
      if (pinInput.value.trim() === appPin) {
        ls.style.display = 'none';
        pinInput.value = '';
        errorEl.textContent = '';
        resetAutoLockTimer();
      } else {
        errorEl.textContent = 'Неверный PIN';
        pinInput.value = '';
        pinInput.focus();
      }
    };
    unlockBtn.onclick = unlock;
    pinInput.onkeydown = e => { if (e.key === 'Enter') unlock(); };
    setTimeout(() => pinInput.focus(), 100);
  } else {
    ls.style.display = 'flex';
    const pinInput = document.getElementById('lock-pin-input');
    if (pinInput) { pinInput.value = ''; setTimeout(() => pinInput.focus(), 100); }
  }
}

const lockBtn = document.getElementById('lock-btn');
lockBtn.onclick = () => {
  if (!appPin) { showToast('Сначала установите PIN в настройках'); return; }
  lockApp();
};

const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
activityEvents.forEach(evt => document.addEventListener(evt, resetAutoLockTimer));

settingsExportBtn.onclick = () => {
  if (!activeRoom || !history[activeRoom] || history[activeRoom].length === 0) {
    showToast('Нет истории для экспорта');
    return;
  }
  exportModal.classList.add('show');
};
exportModal.onclick = e => { if (e.target === exportModal) exportModal.classList.remove('show'); };
exportModal.querySelectorAll('.export-opt').forEach(btn => {
  btn.onclick = () => {
    const format = btn.dataset.format;
    exportModal.classList.remove('show');
    if (format === 'txt') exportTxt();
    else if (format === 'json') exportJson();
    else if (format === 'html') exportHtml();
  };
});
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a);
  a.click(); setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}
function exportTxt() {
  const data = history[activeRoom].map(m => {
    const t = new Date(m.timestamp).toLocaleString();
    if (m.type === 'system') return `[${t}] Система: ${m.text}`;
    if (m.type === 'image') return `[${t}] ${m.from}: [изображение]`;
    if (m.type === 'audio') return `[${t}] ${m.from}: [голосовое]`;
    return `[${t}] ${m.from}: ${m.text}`;
  }).join('\n');
  downloadBlob(new Blob([data], { type: 'text/plain;charset=utf-8' }), `chat_${activeRoom}_${Date.now()}.txt`);
  showToast('Экспортирован TXT');
}
function exportJson() {
  const data = JSON.stringify(history[activeRoom], null, 2);
  downloadBlob(new Blob([data], { type: 'application/json;charset=utf-8' }), `chat_${activeRoom}_${Date.now()}.json`);
  showToast('Экспортирован JSON');
}
function exportHtml() {
  const msgs = history[activeRoom] || [];
  let html = `<html><head><meta charset="UTF-8"><title>Chat ${activeRoom}</title>
<style>body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:20px;background:#f5f5f5;}
.msg{margin:8px 0;padding:10px 14px;border-radius:10px;max-width:80%;}
.you{background:#d4edda;margin-left:auto;text-align:right;}
.other{background:#fff;}
.system{background:#e8e8e8;text-align:center;font-style:italic;font-size:13px;color:#666;}
.time{color:#888;font-size:0.8em;}
.img-msg img{max-width:300px;border-radius:8px;}
.audio-msg{font-style:italic;}</style></head><body>
<h2 style="text-align:center;color:#333;">История чата</h2>`;
  for (const m of msgs) {
    const t = new Date(m.timestamp).toLocaleString();
    if (m.type === 'system') {
      html += `<div class="msg system">${escapeHtml(m.text)} <span class="time">${t}</span></div>`;
    } else if (m.type === 'image') {
      const cls = m.fromUuid === myUuid ? 'you' : 'other';
      html += `<div class="msg ${cls}"><strong>${escapeHtml(m.from)}</strong> <span class="time">${t}</span><div class="img-msg"><img src="${m.src}"></div></div>`;
    } else if (m.type === 'audio') {
      const cls = m.fromUuid === myUuid ? 'you' : 'other';
      html += `<div class="msg ${cls}"><strong>${escapeHtml(m.from)}</strong> <span class="time">${t}</span><div class="audio-msg">[голосовое сообщение]</div></div>`;
    } else {
      const cls = m.fromUuid === myUuid ? 'you' : 'other';
      html += `<div class="msg ${cls}"><strong>${escapeHtml(m.from)}</strong> <span class="time">${t}</span><br>${escapeHtml(m.text || '')}</div>`;
    }
  }
  html += '</body></html>';
  downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), `chat_${activeRoom}_${Date.now()}.html`);
  showToast('Экспортирован HTML');
}

// === Group Management ===
groupManageBtn.onclick = () => {
  if (!activeRoom || !chats[activeRoom] || !chats[activeRoom].group) return;
  groupModal.classList.add('show');
  renderGroupMembers();
};
groupModal.onclick = e => { if (e.target === groupModal) groupModal.classList.remove('show'); };
function renderGroupMembers() {
  const group = chats[activeRoom] && chats[activeRoom].group;
  if (!group) return;
  groupMembersList.innerHTML = '';
  group.members.forEach(uuid => {
    const isMe = uuid === myUuid;
    const isAdmin = uuid === group.admin;
    const nameEl = document.createElement('div');
    nameEl.className = 'group-member-item';
    nameEl.innerHTML = `<span class="avatar-sm" style="background:${getAvatarColor(uuid)};color:#fff;width:28px;height:28px;font-size:11px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;">${uuid[0].toUpperCase()}</span><span>${escapeHtml(isMe ? myName + ' (вы)' : uuid.substring(0,8))}${isAdmin ? ' 👑' : ''}</span>${!isMe && myUuid === group.admin ? `<span class="remove-member" data-uuid="${uuid}">&times;</span>` : ''}`;
    groupMembersList.appendChild(nameEl);
  });
  groupMembersList.querySelectorAll('.remove-member').forEach(btn => {
    btn.onclick = () => removeGroupMember(btn.dataset.uuid);
  });
}
function addGroupMember(name) {
  if (!activeRoom || !chats[activeRoom] || !chats[activeRoom].group) return;
  const fakeUuid = 'manual-' + name.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (chats[activeRoom].group.members.includes(fakeUuid)) { showToast('Уже в группе'); return; }
  chats[activeRoom].group.members.push(fakeUuid);
  chats[activeRoom].group.updatedAt = Date.now();
  saveState();
  renderGroupMembers();
  renderParticipants();
  for (const p of Object.values(peers)) {
    post(p.path, { type: 'group_add', from: myName, fromUuid: myUuid, targetUuid: fakeUuid, timestamp: Date.now() });
  }
  addSystem(`Вы добавили ${name} в группу`);
}
function removeGroupMember(uuid) {
  if (!activeRoom || !chats[activeRoom] || !chats[activeRoom].group) return;
  if (uuid === chats[activeRoom].group.admin) { showToast('Нельзя удалить админа'); return; }
  const idx = chats[activeRoom].group.members.indexOf(uuid);
  if (idx >= 0) chats[activeRoom].group.members.splice(idx, 1);
  chats[activeRoom].group.updatedAt = Date.now();
  saveState();
  renderGroupMembers();
  renderParticipants();
  for (const p of Object.values(peers)) {
    post(p.path, { type: 'group_remove', from: myName, fromUuid: myUuid, targetUuid: uuid, timestamp: Date.now() });
  }
  addSystem(`Вы удалили участника ${uuid.substring(0,8)}`);
}
groupAddBtn.onclick = () => {
  const name = groupAddInput.value.trim();
  if (!name) return;
  addGroupMember(name);
  groupAddInput.value = '';
};
groupAddInput.onkeypress = e => { if (e.key === 'Enter') groupAddBtn.click(); };

// === Create Group Modal ===
newGroupBtn.onclick = () => {
  cgName.value = '';
  cgLimit.value = 10;
  cgLimitVal.textContent = '10';
  createGroupModal.classList.add('show');
  setTimeout(() => cgName.focus(), 100);
};
createGroupModal.onclick = e => { if (e.target === createGroupModal) createGroupModal.classList.remove('show'); };
cgCancel.onclick = () => createGroupModal.classList.remove('show');
cgLimit.oninput = () => { cgLimitVal.textContent = cgLimit.value; };
cgCreate.onclick = () => {
  const name = cgName.value.trim();
  const limit = parseInt(cgLimit.value);
  if (!name) { cgName.focus(); return; }
  if (connected) disconnect();
  const code = genGroupCode();
  chats[code] = { created: Date.now(), name: name, lastMsg: '', lastMsgTime: 0, group: { admin: myUuid, members: [myUuid], maxMembers: limit } };
  activeRoom = code;
  saveState();
  renderChatList();
  connect();
  createGroupModal.classList.remove('show');
  showToast(`Группа «${name}» создана. Код: ${code}`);
};

settingsResetBtn.onclick = () => {
  if (!confirm('Удалить все данные? Имя, чаты и история будут удалены.')) return;
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('pc_')) keysToRemove.push(k);
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
  chats = {}; history = {}; myName = ''; myUuid = '';
  connected = false;
  timers.forEach(t => clearInterval(t));
  timers = []; peers = {}; activeRoom = '';
  unreadCounts = {};
  showChat();
  groupName.textContent = 'Выберите чат';
  groupSubtitle.textContent = '';
  mc.innerHTML = '';
  textInput.disabled = true; sendBtn.disabled = true; fileBtn.disabled = true;
  footerName.textContent = '';
  footerAvatar.textContent = '';
  footerAvatar.style.background = '';
  renderChatList();
  loginModal.classList.remove('hidden');
  inputName.value = '';
  inputName.disabled = false;
  setTimeout(() => inputName.focus(), 100);
};

// === UI: Participants ===
function renderParticipants() {
  participantsList.innerHTML = '';
  const group = chats[activeRoom] && chats[activeRoom].group;
  const isAdmin = group && group.admin === myUuid;
  groupManageBtn.style.display = (group && isAdmin) ? '' : 'none';
  const me = document.createElement('div');
  me.className = 'participant';
  me.innerHTML = `<div class="dot" style="background:#2ecc71;"></div> ${myName} <span style="color:var(--text-dimmer);font-size:11px;">(вы)${isAdmin ? ' 👑' : ''}</span>`;
  participantsList.appendChild(me);
  for (const p of Object.values(peers)) {
    const d = document.createElement('div');
    d.className = 'participant';
    const st = p.peerStatus || (p.online !== false ? 'in_chat' : 'offline');
    let dotColor, label;
    if (st === 'in_chat') { dotColor = '#2ecc71'; label = ''; }
    else if (st === 'in_app') { dotColor = 'transparent'; label = '<span style="color:var(--text-dimmer);font-size:11px;">в приложении</span>'; }
    else { dotColor = '#555'; label = '<span style="color:var(--text-dimmer);font-size:11px;">офлайн</span>'; }
    const borderStyle = st === 'in_app' ? 'border:2px solid #2ecc71;' : '';
    d.innerHTML = `<div class="dot" style="background:${dotColor};${borderStyle}"></div> ${p.name} ${label}`;
    participantsList.appendChild(d);
  }
  participantsToggle.textContent = `Участники (${Object.keys(peers).length + 1})`;
}

// === UI: Chat list ===
function getPeerStatusForChat(room) {
  if (room === activeRoom && connected) {
    for (const p of Object.values(peers)) return p.peerStatus || 'in_chat';
  }
  if (chats[room] && chats[room].peerStatus) return chats[room].peerStatus;
  return 'offline';
}
function renderChatList() {
  chatList.innerHTML = '';
  const sorted = Object.keys(chats).sort((a, b) => (chats[b].lastMsgTime || 0) - (chats[a].lastMsgTime || 0));
  for (const room of sorted) {
    const d = document.createElement('div');
    d.className = `chat-item ${room === activeRoom ? 'active' : ''}`;
    const displayName = getChatDisplayName(room);
    const isGrp = isGroupCode(room);
    const initial = isGrp ? '👥' : displayName[0].toUpperCase();
    const color = isGrp ? '#8e44ad' : getAvatarColor(displayName);
    const preview = getChatPreview(room);
    const time = getChatTime(room);
    const unread = unreadCounts[room] || 0;

    let statusDot = '';
    if (!isGrp) {
      const st = getPeerStatusForChat(room);
      if (st === 'in_chat') statusDot = '<span class="status-dot-online"></span>';
      else if (st === 'in_app') statusDot = '<span class="status-dot-app"></span>';
      else statusDot = '<span class="status-dot-offline"></span>';
    }

    d.innerHTML = `
      <div class="chat-avatar" style="background:${color};color:#fff;font-size:${isGrp ? '18px' : '16px'};">${initial}</div>
      <div class="chat-info">
        <div class="chat-top">
          <span class="chat-name">${statusDot}${isGrp ? '<span style="font-size:11px;opacity:0.6;">👥</span> ' : ''}${escapeHtml(displayName)}</span>
          <span class="chat-time">${time}</span>
        </div>
        <div class="chat-preview">${escapeHtml(preview).substring(0, 45)}${preview.length > 45 ? '...' : ''}</div>
      </div>
      ${unread > 0 ? `<span class="unread-badge">${unread}</span>` : ''}
      <span class="del-chat" title="Удалить">&times;</span>`;

    d.querySelector('.chat-name').onclick = () => switchChat(room);
    d.querySelector('.chat-preview').onclick = () => switchChat(room);
    d.querySelector('.chat-avatar').onclick = () => switchChat(room);
    d.querySelector('.del-chat').onclick = e => { e.stopPropagation(); deleteChat(room); };
    d.ondblclick = (e) => {
      e.preventDefault();
      if (isGroupCode(room)) {
        const newName = prompt('Переименовать группу:', getChatDisplayName(room));
        if (newName && newName.trim()) {
          chats[room].name = newName.trim();
          saveState();
          if (room === activeRoom) groupName.textContent = getChatDisplayName(room);
          renderChatList();
        }
      }
    };
    chatList.appendChild(d);
  }
}
function switchChat(room) {
  if (room === activeRoom && connected) return;
  if (connected) disconnect();
  activeRoom = room;
  clearUnread(room);
  groupName.textContent = getChatDisplayName(room);
  if (isGroupCode(room) && chats[room] && chats[room].group) {
    groupSubtitle.textContent = `Группа • лимит: ${chats[room].group.maxMembers || '—'}`;
  } else {
    groupSubtitle.textContent = `${Object.keys(peers).length} участник(ов)`;
  }
  renderChatList();
  connect();
  if (typeof closeSidebar === 'function') closeSidebar();
}
function deleteChat(room) {
  delete chats[room];
  delete unreadCounts[room];
  try { localStorage.removeItem(historyKey(room)); } catch (e) {}
  if (activeRoom === room) {
    activeRoom = '';
    disconnect();
    groupName.textContent = 'Выберите чат';
    groupSubtitle.textContent = '';
    mc.innerHTML = '';
    textInput.disabled = true; sendBtn.disabled = true; fileBtn.disabled = true;
  }
  renderChatList();
  saveState();
}

// === Context Menu ===
function showCtx(e, msg, isMe, el) {
  e.preventDefault();
  ctxTarget = { msg, el };
  ctxMenu.querySelector('[data-action="edit"]').style.display = (isMe && msg.type === 'text') ? '' : 'none';
  ctxMenu.querySelector('[data-action="delete"]').style.display = isMe ? '' : 'none';
  ctxMenu.querySelector('[data-action="delete-self"]').style.display = (!isMe || msg.type === 'system') ? 'none' : 'none';
  ctxMenu.style.left = e.clientX + 'px';
  ctxMenu.style.top = e.clientY + 'px';
  ctxMenu.classList.add('show');
}
document.addEventListener('click', () => ctxMenu.classList.remove('show'));
ctxMenu.querySelectorAll('.ctx-item').forEach(item => {
  item.onclick = () => {
    const action = item.dataset.action;
    if (!ctxTarget) return;
    const { msg, el } = ctxTarget;
    if (action === 'copy') {
      navigator.clipboard.writeText(msg.text || '').catch(() => {});
    } else if (action === 'reply') {
      showReplyBar(msg);
    } else if (action === 'forward') {
      showForwardModal(msg);
    } else if (action === 'edit') {
      textInput.value = msg.text;
      textInput.focus();
      textInput.dataset.editId = msg.id;
      textInput.placeholder = 'Редактирование... (Enter — сохранить, Esc — отмена)';
    } else if (action === 'delete') {
      requestDeleteForAll(msg.id);
    } else if (action === 'delete-self') {
      const idx = history[activeRoom] ? history[activeRoom].findIndex(m => m.id === msg.id) : -1;
      if (idx >= 0) history[activeRoom].splice(idx, 1);
      saveHistory(activeRoom);
      el.remove();
    } else if (action === 'autodelete') {
      scheduleAutoDelete(msg.id, activeRoom);
      showToast('Сообщение будет удалено через 5 минут');
    }
    ctxMenu.classList.remove('show');
  };
});

// === Forward ===
function showForwardModal(msg) {
  forwardTarget = msg;
  forwardList.innerHTML = '';
  const sorted = Object.keys(chats).filter(r => r !== activeRoom);
  if (sorted.length === 0) {
    forwardList.innerHTML = '<div class="system-msg">Нет других чатов</div>';
  } else {
    for (const room of sorted) {
      const d = document.createElement('div');
      d.className = 'forward-chat-item';
      const name = getChatDisplayName(room);
      const color = getAvatarColor(name);
      d.innerHTML = `<div class="chat-avatar" style="background:${color};color:#fff;width:36px;height:36px;font-size:14px;">${name[0].toUpperCase()}</div><span>${escapeHtml(name)}</span>`;
      d.onclick = () => { forwardMessage(room); forwardModal.classList.remove('show'); };
      forwardList.appendChild(d);
    }
  }
  forwardModal.classList.add('show');
}
forwardModal.onclick = e => { if (e.target === forwardModal) forwardModal.classList.remove('show'); };

function forwardMessage(targetRoom) {
  if (!forwardTarget) return;
  const msg = forwardTarget;
  const savedRoom = activeRoom;
  if (connected) disconnect();
  activeRoom = targetRoom;
  if (!chats[targetRoom]) chats[targetRoom] = { created: Date.now(), name: '', lastMsg: '', lastMsgTime: 0 };
  saveState();
  connect();
  if (msg.type === 'text') {
    const localMsg = { id: genId(), type: 'text', from: myName, fromUuid: myUuid, text: msg.text, timestamp: Date.now(), replyTo: null, status: 'sending' };
    createMsgEl(localMsg, true);
    receivedIds.add(localMsg.id);
    if (history[activeRoom]) { history[activeRoom].push(localMsg); saveHistory(activeRoom); }
    updateChatLastMsg(activeRoom, myName, msg.text);
    const encMsg = { ...localMsg, text: xorCode(msg.text, activeRoom) };
    for (const p of Object.values(peers)) post(p.path, encMsg);
  } else if (msg.type === 'image') {
    const localMsg = { id: genId(), type: 'image', from: myName, fromUuid: myUuid, src: msg.src, timestamp: Date.now(), replyTo: null, status: 'sending' };
    createMsgEl(localMsg, true);
    receivedIds.add(localMsg.id);
    if (history[activeRoom]) { history[activeRoom].push(localMsg); saveHistory(activeRoom); }
    updateChatLastMsg(activeRoom, myName, '[изображение]');
    const encMsg = { ...localMsg, src: xorCode(msg.src, activeRoom) };
    for (const p of Object.values(peers)) post(p.path, encMsg);
  } else if (msg.type === 'audio') {
    const localMsg = { id: genId(), type: 'audio', from: myName, fromUuid: myUuid, src: msg.src, timestamp: Date.now(), status: 'sending' };
    createMsgEl(localMsg, true);
    receivedIds.add(localMsg.id);
    if (history[activeRoom]) { history[activeRoom].push(localMsg); saveHistory(activeRoom); }
    updateChatLastMsg(activeRoom, myName, '[голосовое]');
    const encMsg = { ...localMsg, src: xorCode(msg.src, activeRoom) };
    for (const p of Object.values(peers)) post(p.path, encMsg);
  }
  forwardTarget = null;
}

// === Connection ===
async function listen() {
  while (connected) {
    const data = await get(myPath, 10000);
    if (!data) { if (!connected) break; await new Promise(r => setTimeout(r, 300)); continue; }
    if (data.fromUuid === myUuid) continue;

    if (data.type === 'ack') {
      if (history[activeRoom]) {
        const m = history[activeRoom].find(x => x.id === data.targetId);
        if (m && m.fromUuid === myUuid) {
          const priority = { 'read': 4, 'delivered': 3, 'sent': 2, 'sending': 0 };
          const cur = priority[m.status] || 0;
          const incoming = priority[data.status] || 0;
          if (incoming > cur) {
            m.status = data.status;
            saveHistory(activeRoom);
            updateMessageStatusUI(data.targetId);
          }
        }
      }
      continue;
    }

    if (data.type === 'typing') {
      if (peers[data.fromUuid]) {
        peers[data.fromUuid].typing = true;
        updateTypingArea();
        if (typingTimers[data.fromUuid]) clearTimeout(typingTimers[data.fromUuid]);
        typingTimers[data.fromUuid] = setTimeout(() => {
          if (peers[data.fromUuid]) peers[data.fromUuid].typing = false;
          updateTypingArea();
        }, 3000);
      }
      continue;
    }

    if (data.type === 'hello') {
      if (!peers[data.fromUuid]) {
        peers[data.fromUuid] = { name: data.from, path: data.personalPath, online: true, lastSeen: Date.now(), peerStatus: 'in_chat' };
        if (!isGroupCode(activeRoom) && chats[activeRoom]) { chats[activeRoom].peerName = data.from; chats[activeRoom].peerStatus = 'in_chat'; saveState(); }
        addSystem(`${data.from} присоединился к чату`);
        renderParticipants();
        renderChatList();
        groupSubtitle.textContent = `${Object.keys(peers).length} участник(ов)`;
        groupName.textContent = getChatDisplayName(activeRoom);
        post(data.personalPath, { type: 'hello', from: myName, fromUuid: myUuid, personalPath: myPath });
      }
    } else if (data.type === 'status') {
      if (peers[data.fromUuid]) {
        const wasOnline = peers[data.fromUuid].online;
        peers[data.fromUuid].online = data.online;
        peers[data.fromUuid].lastSeen = Date.now();
        if (data.online && peers[data.fromUuid].peerStatus !== 'in_chat') {
          peers[data.fromUuid].peerStatus = 'in_app';
          if (!isGroupCode(activeRoom) && chats[activeRoom]) chats[activeRoom].peerStatus = 'in_app';
        }
        renderParticipants();
        renderChatList();
        if (!wasOnline && data.online) {
          addSystem(`${data.from} в сети`);
          showToast(`${data.from} в сети`);
        } else if (wasOnline && !data.online) {
          peers[data.fromUuid].peerStatus = 'offline';
          if (!isGroupCode(activeRoom) && chats[activeRoom]) chats[activeRoom].peerStatus = 'offline';
          addSystem(`${data.from} не в сети`);
          showToast(`${data.from} не в сети — сообщения будут доставлены при подключении`);
        }
      }
    } else if (data.type === 'delete' || data.type === 'delete_request') {
      if (history[activeRoom]) {
        const idx = history[activeRoom].findIndex(m => m.id === data.targetId);
        if (idx >= 0) history[activeRoom].splice(idx, 1);
        saveHistory(activeRoom);
      }
      const el = mc.querySelector(`[data-id="${data.targetId}"]`);
      if (el) el.remove();
      if (data.type === 'delete_request' && data.fromUuid && peers[data.fromUuid]) {
        post(peers[data.fromUuid].path, { type: 'delete_ack', deleteId: data.deleteId, from: myName, fromUuid: myUuid, targetId: data.targetId, timestamp: Date.now() });
      }
    } else if (data.type === 'delete_ack') {
      const pending = pendingDeletes[data.deleteId];
      if (pending) {
        pending.acks.add(data.fromUuid);
        if (pending.acks.size >= pending.targets.length) {
          clearTimeout(pending.timer);
          applyDeleteLocally(pending.msgId, pending.room);
          delete pendingDeletes[data.deleteId];
          savePendingDeletes();
        }
      }
    } else if (data.type === 'text') {
      if (!receivedIds.has(data.id)) {
        try { data.text = xorCode(data.text, activeRoom); } catch (e) {}
        receivedIds.add(data.id);
        if (history[activeRoom]) { history[activeRoom].push(data); saveHistory(activeRoom); }
        createMsgEl(data, false);
        notify(data.from, data.text);
        updateChatLastMsg(activeRoom, data.from, data.text);
        sendAck(data.fromUuid, data.id, 'delivered');
        if (document.hasFocus()) sendAck(data.fromUuid, data.id, 'read');
        if (!document.hasFocus()) incrementUnread(activeRoom);
      }
    } else if (data.type === 'text_edit') {
      try { data.text = xorCode(data.text, activeRoom); } catch (e) {}
      if (history[activeRoom]) {
        const m = history[activeRoom].find(x => x.id === data.id);
        if (m) { m.text = data.text; m.edited = true; }
        saveHistory(activeRoom);
      }
      const el = mc.querySelector(`[data-id="${data.id}"]`);
      if (el) {
        const textDiv = el.querySelector('.msg-text');
        if (textDiv) textDiv.innerHTML = renderMarkdown(data.text);
        const senderDiv = el.querySelector('.sender');
        if (senderDiv && !el.querySelector('.edited')) {
          const ed = document.createElement('span');
          ed.className = 'edited';
          ed.textContent = ' (изм.)';
          senderDiv.parentNode.appendChild(ed);
        }
      }
    } else if (data.type === 'image') {
      if (!receivedIds.has(data.id)) {
        try { data.src = xorCode(data.src, activeRoom); } catch (e) {}
        receivedIds.add(data.id);
        if (history[activeRoom]) { history[activeRoom].push(data); saveHistory(activeRoom); }
        createMsgEl(data, false);
        notify(data.from, '[изображение]');
        updateChatLastMsg(activeRoom, data.from, '[изображение]');
        sendAck(data.fromUuid, data.id, 'delivered');
        if (document.hasFocus()) sendAck(data.fromUuid, data.id, 'read');
        if (!document.hasFocus()) incrementUnread(activeRoom);
      }
    } else if (data.type === 'audio') {
      if (!receivedIds.has(data.id)) {
        try { data.src = xorCode(data.src, activeRoom); } catch (e) {}
        receivedIds.add(data.id);
        if (history[activeRoom]) { history[activeRoom].push(data); saveHistory(activeRoom); }
        createMsgEl(data, false);
        notify(data.from, '[голосовое]');
        updateChatLastMsg(activeRoom, data.from, '[голосовое]');
        sendAck(data.fromUuid, data.id, 'delivered');
        if (document.hasFocus()) sendAck(data.fromUuid, data.id, 'read');
        if (!document.hasFocus()) incrementUnread(activeRoom);
      }
    } else if (data.type === 'chat_reject') {
      showToast(`Вход запрещён: это личная переписка`);
      addSystem('Это личная переписка. Подключиться нельзя.');
      if (connected) disconnect();
    } else if (data.type === 'group_info') {
      if (!chats[activeRoom]) chats[activeRoom] = { created: Date.now(), name: '', lastMsg: '', lastMsgTime: 0, group: null };
      if (data.groupData && (!chats[activeRoom].group || data.timestamp > (chats[activeRoom].group.updatedAt || 0))) {
        chats[activeRoom].group = { ...data.groupData, updatedAt: data.timestamp };
        if (!chats[activeRoom].group.members.includes(myUuid)) {
          chats[activeRoom].group.members.push(myUuid);
        }
        saveState();
        renderParticipants();
      }
    } else if (data.type === 'group_add') {
      if (chats[activeRoom] && chats[activeRoom].group) {
        if (!chats[activeRoom].group.members.includes(data.targetUuid)) {
          chats[activeRoom].group.members.push(data.targetUuid);
          chats[activeRoom].group.updatedAt = Date.now();
          saveState();
          renderParticipants();
          addSystem(`${data.from} добавил участника`);
        }
      }
    } else if (data.type === 'group_remove') {
      if (chats[activeRoom] && chats[activeRoom].group) {
        const idx = chats[activeRoom].group.members.indexOf(data.targetUuid);
        if (idx >= 0) {
          chats[activeRoom].group.members.splice(idx, 1);
          chats[activeRoom].group.updatedAt = Date.now();
          saveState();
          renderParticipants();
          addSystem(`${data.from} удалил участника`);
          if (data.targetUuid === myUuid) {
            showToast('Вы были удалены из группы');
            disconnect();
          }
        }
      }
    } else if (data.type === 'system') {
      if (!receivedIds.has(data.id)) {
        receivedIds.add(data.id);
        if (history[activeRoom]) { history[activeRoom].push(data); saveHistory(activeRoom); }
        createMsgEl(data, false);
      }
    }
  }
}

function updateChatLastMsg(room, from, text) {
  if (!chats[room]) return;
  chats[room].lastMsg = `${from}: ${text || '[фото]'}`;
  chats[room].lastMsgTime = Date.now();
  saveState();
  if (room === activeRoom) renderChatList();
}

async function pollAnnounce() {
  const data = await get(announcePath, 2000);
  if (!data || data.fromUuid === myUuid) return;
  if (data.type === 'status') {
    if (peers[data.fromUuid]) {
      const wasOnline = peers[data.fromUuid].online;
      peers[data.fromUuid].online = data.online;
      peers[data.fromUuid].lastSeen = Date.now();
      renderParticipants();
      if (!wasOnline && data.online) addSystem(`${data.from} в сети`);
    }
    return;
  }
  if (!peers[data.fromUuid]) {
    peers[data.fromUuid] = { name: data.from, path: data.personalPath, online: true, lastSeen: Date.now() };
    addSystem(`${data.from} присоединился к чату`);
    renderParticipants();
    groupSubtitle.textContent = `${Object.keys(peers).length} участник(ов)`;
    post(data.personalPath, { type: 'hello', from: myName, fromUuid: myUuid, personalPath: myPath });
  }
}

async function pollJoin() {
  const data = await get(joinPath, 2000);
  if (!data || data.fromUuid === myUuid) return;
  if (!peers[data.fromUuid]) {
    if (isGroupCode(activeRoom) || Object.keys(peers).length < 2) {
      peers[data.fromUuid] = { name: data.from, path: data.personalPath, online: true, lastSeen: Date.now(), peerStatus: 'in_chat' };
      if (!isGroupCode(activeRoom) && chats[activeRoom]) chats[activeRoom].peerName = data.from;
      addSystem(`${data.from} присоединился к чату`);
      renderParticipants();
      renderChatList();
      groupSubtitle.textContent = `${Object.keys(peers).length} участник(ов)`;
      groupName.textContent = getChatDisplayName(activeRoom);
      saveState();
      post(data.personalPath, { type: 'hello', from: myName, fromUuid: myUuid, personalPath: myPath });
    } else {
      post(data.personalPath, { type: 'chat_reject', from: myName, fromUuid: myUuid, reason: 'personal', timestamp: Date.now() });
      showToast(`${data.from} попытался войти — личная переписка`);
    }
  }
}

function sendPing() {
  if (!connected) return;
  for (const p of Object.values(peers)) {
    post(p.path, { type: 'status', from: myName, fromUuid: myUuid, online: true, timestamp: Date.now() });
  }
}
function sendTyping() {
  if (!connected) return;
  for (const p of Object.values(peers)) post(p.path, { type: 'typing', from: myName, fromUuid: myUuid });
}

function checkStale() {
  const now = Date.now();
  let changed = false;
  for (const [uuid, p] of Object.entries(peers)) {
    if (p.online && (now - p.lastSeen) > 25000) {
      p.online = false;
      p.peerStatus = 'offline';
      if (!isGroupCode(activeRoom) && chats[activeRoom]) chats[activeRoom].peerStatus = 'offline';
      changed = true;
      addSystem(`${p.name} не в сети`);
      showToast(`${p.name} не в сети — сообщения будут доставлены при подключении`);
    }
  }
  if (changed) { renderParticipants(); renderChatList(); }
}


function connect() {
  myPath = `/room/${activeRoom}/${myUuid}`;
  announcePath = `/room/${activeRoom}/announce`;
  joinPath = `/room/${activeRoom}/join`;

  connected = true;
  peers = {};
  receivedIds = new Set();
  loadHistory(activeRoom);
  mc.innerHTML = '';
  hideReplyBar();
  textInput.disabled = false;
  sendBtn.disabled = false;
  fileBtn.disabled = false;
  groupName.textContent = getChatDisplayName(activeRoom);
  if (isGroupCode(activeRoom) && chats[activeRoom] && chats[activeRoom].group) {
    groupSubtitle.textContent = `Группа • лимит: ${chats[activeRoom].group.maxMembers || '—'}`;
    participantsToggle.style.display = '';
  } else {
    groupSubtitle.textContent = '';
    participantsToggle.style.display = 'none';
    participantsPanel.classList.remove('show');
  }
  renderParticipants();
  renderChatList();

  if (history[activeRoom]) {
    history[activeRoom].forEach(m => {
      receivedIds.add(m.id);
      createMsgEl(m, m.fromUuid === myUuid);
    });
  }

  addRoomCodeMsg(activeRoom);
  addSystem(`Вы: ${myName}. Ожидание собеседника...`);

  post(joinPath, { type: 'join', from: myName, fromUuid: myUuid, personalPath: myPath });
  sendPing();
  listen();
  timers.push(setInterval(pollAnnounce, 3000));
  timers.push(setInterval(pollJoin, 2000));
  timers.push(setInterval(sendPing, 5000));
  timers.push(setInterval(checkStale, 5000));
  timers.push(setInterval(() => {
    if (connected) post(announcePath, { type: 'announce', from: myName, fromUuid: myUuid, personalPath: myPath });
  }, 8000));
  setTimeout(() => {
    if (connected && chats[activeRoom] && chats[activeRoom].group) {
      for (const p of Object.values(peers)) {
        post(p.path, { type: 'group_info', from: myName, fromUuid: myUuid, groupData: chats[activeRoom].group, timestamp: Date.now() });
      }
    }
  }, 2000);

  sendBtn.onclick = sendMsg;
  let typingTimeout;
  textInput.oninput = () => {
    if (typingTimeout) clearTimeout(typingTimeout);
    sendTyping();
    typingTimeout = setTimeout(() => {}, 2000);
  };
  textInput.onkeypress = e => {
    if (e.key === 'Enter') {
      if (textInput.dataset.editId) finishEdit();
      else sendMsg();
    } else if (e.key === 'Escape') {
      if (textInput.dataset.editId) cancelEdit();
      else if (replyTo) hideReplyBar();
    }
  };

  // Ctrl+F search
  textInput.onkeydown = e => {
    if (e.ctrlKey && e.key === 'f') { e.preventDefault(); searchBtn.click(); }
  };

  // Ctrl+V paste image
  document.onpaste = e => {
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) processImageFile(file);
        return;
      }
    }
  };

  fileBtn.onclick = () => fileInput.click();
  fileInput.onchange = () => {
    if (!fileInput.files.length) return;
    const files = Array.from(fileInput.files);
    fileInput.value = '';
    for (const file of files) processImageFile(file);
  };

  // Drag & drop
  const mainEl = document.getElementById('main');
  let dragCounter = 0;
  mainEl.ondragenter = e => { e.preventDefault(); dragCounter++; dropOverlay.classList.add('show'); };
  mainEl.ondragover = e => e.preventDefault();
  mainEl.ondragleave = e => { dragCounter--; if (dragCounter <= 0) { dragCounter = 0; dropOverlay.classList.remove('show'); } };
  mainEl.ondrop = e => {
    e.preventDefault();
    dragCounter = 0;
    dropOverlay.classList.remove('show');
    if (!connected) return;
    const files = e.dataTransfer.files;
    for (const file of files) processImageFile(file);
  };
}

function processImageFile(file) {
  if (!connected) return;
  if (!file.type.startsWith('image/')) {
    addSystemMessage('⚠️ Файл "' + file.name + '" (' + formatFileSize(file.size) + ') не может быть отправлен. Только изображения.');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      let src = reader.result;
      if (img.width > 1280 || img.height > 1280) {
        const canvas = document.createElement('canvas');
        const ratio = Math.min(1280 / img.width, 1280 / img.height);
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        src = canvas.toDataURL('image/jpeg', 0.8);
      }
      const rpl = replyTo ? { id: replyTo.id, from: replyTo.from, text: replyTo.text || null } : null;
      const encRpl = rpl ? { id: rpl.id, from: rpl.from, text: rpl.text ? xorCode(rpl.text, activeRoom) : null } : null;
      const msg = { id: genId(), type: 'image', from: myName, fromUuid: myUuid, src, timestamp: Date.now(), replyTo: rpl, status: 'sending' };
      createMsgEl(msg, true);
      receivedIds.add(msg.id);
      if (history[activeRoom]) { history[activeRoom].push(msg); saveHistory(activeRoom); }
      updateChatLastMsg(activeRoom, myName, '[изображение]');
      const encMsg = { ...msg, src: xorCode(src, activeRoom), replyTo: encRpl };
      for (const p of Object.values(peers)) post(p.path, encMsg);
      hideReplyBar();
      setTimeout(() => {
        const m = history[activeRoom]?.find(x => x.id === msg.id);
        if (m && m.status === 'sending') { m.status = 'sent'; saveHistory(activeRoom); updateMessageStatusUI(msg.id); }
      }, 1500);
    
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function sendMsg() {
  const text = textInput.value.trim();
  if (!text || !connected) return;

  const offlineNames = [];
  for (const [uuid, p] of Object.entries(peers)) {
    if (p.online === false) offlineNames.push(p.name);
  }
  if (offlineNames.length > 0) {
    showToast(`${offlineNames.join(', ')} ${offlineNames.length === 1 ? 'не в сети' : 'не в сети'} — сообщение будет доставлено при подключении`);
  }

  const rpl = replyTo ? { id: replyTo.id, from: replyTo.from, text: replyTo.text || null } : null;
  const msg = { id: genId(), type: 'text', from: myName, fromUuid: myUuid, text, timestamp: Date.now(), replyTo: rpl, status: 'sending' };
  createMsgEl(msg, true);
  receivedIds.add(msg.id);
  if (history[activeRoom]) { history[activeRoom].push(msg); saveHistory(activeRoom); }
  updateChatLastMsg(activeRoom, myName, text);
  textInput.value = '';
  hideReplyBar();
  textInput.placeholder = 'Сообщение...';
  const encRpl = rpl ? { id: rpl.id, from: rpl.from, text: rpl.text ? xorCode(rpl.text, activeRoom) : null } : null;
  const encMsg = { ...msg, text: xorCode(text, activeRoom), replyTo: encRpl };
  for (const p of Object.values(peers)) post(p.path, encMsg);
  setTimeout(() => {
    if (history[activeRoom]) {
      const m = history[activeRoom].find(x => x.id === msg.id);
      if (m && m.status === 'sending') { m.status = 'sent'; saveHistory(activeRoom); updateMessageStatusUI(msg.id); }
    }
  }, 1500);

}

function finishEdit() {
  const text = textInput.value.trim();
  const editId = textInput.dataset.editId;
  if (!text || !editId) { cancelEdit(); return; }
  if (history[activeRoom]) {
    const m = history[activeRoom].find(x => x.id === editId);
    if (m) { m.text = text; m.edited = true; }
    saveHistory(activeRoom);
  }
  const el = mc.querySelector(`[data-id="${editId}"]`);
  if (el) {
    const textDiv = el.querySelector('.msg-text');
    if (textDiv) textDiv.innerHTML = renderMarkdown(text);
    const senderDiv = el.querySelector('.sender');
    if (senderDiv && !el.querySelector('.edited')) {
      const ed = document.createElement('span');
      ed.className = 'edited';
      ed.textContent = ' (изм.)';
      senderDiv.parentNode.appendChild(ed);
    }
  }
  for (const p of Object.values(peers)) post(p.path, { type: 'text_edit', id: editId, from: myName, fromUuid: myUuid, text: xorCode(text, activeRoom), timestamp: Date.now() });
  cancelEdit();
}

function cancelEdit() {
  delete textInput.dataset.editId;
  textInput.value = '';
  textInput.placeholder = 'Сообщение...';
}

function disconnect() {
  connected = false;
  timers.forEach(t => clearInterval(t));
  Object.values(typingTimers).forEach(t => clearTimeout(t));
  timers = []; typingTimers = {};
  peers = {};
  textInput.disabled = true; sendBtn.disabled = true; fileBtn.disabled = true;
  cancelEdit(); hideReplyBar();
  typingArea.innerHTML = '';
}

// === New chat ===
newChatBtn.onclick = () => {
  if (connected) disconnect();
  const code = genRoomCode();
  chats[code] = { created: Date.now(), name: '', lastMsg: '', lastMsgTime: 0, group: { admin: myUuid, members: [myUuid] } };
  activeRoom = code;
  saveState();
  renderChatList();
  connect();
};

// === Join by code ===
function joinByCode(code) {
  code = code.trim().toUpperCase();
  if (!code) return;
  if (!isValidRoomCode(code)) {
    showToast('Неверный формат кода. Пример: PC-X7F9G2LPQRTY4K8WQ3MZ');
    return;
  }
  if (connected) disconnect();
  if (!chats[code]) chats[code] = { created: Date.now(), name: '', lastMsg: '', lastMsgTime: 0, group: null };
  activeRoom = code;
  joinInput.value = '';
  saveState();
  renderChatList();
  connect();
}
joinBtn.onclick = () => joinByCode(joinInput.value);
joinInput.onkeypress = e => { if (e.key === 'Enter') joinBtn.click(); };

// === Login ===
loginBtn.onclick = () => {
  const name = inputName.value.trim();
  if (!name) return;
  myName = name;
  if (!myUuid) myUuid = uuidv4();
  saveState();
  updateFooter();
  loginModal.classList.add('hidden');
  resetAutoLockTimer();
};
inputName.onkeypress = e => { if (e.key === 'Enter') loginBtn.click(); };

// === Participants toggle ===
document.addEventListener('click', e => {
  if (!participantsPanel.contains(e.target) && e.target !== participantsToggle) participantsPanel.classList.remove('show');
});
participantsToggle.onclick = () => participantsPanel.classList.toggle('show');

// === Window focus → read receipts ===
window.addEventListener('focus', () => {
  if (!connected || !activeRoom || !history[activeRoom]) return;
  history[activeRoom].filter(m => m.fromUuid !== myUuid && m.type !== 'ack' && m.type !== 'text_edit' && m.type !== 'delete' && m.type !== 'system').forEach(m => sendAck(m.fromUuid, m.id, 'read'));
});

// === Profile: PIN === (handled in settings page)

// === PIN modal ===
pinOkBtn.onclick = () => checkPin();
pinInput.onkeypress = e => { if (e.key === 'Enter') checkPin(); };

function checkPin() {
  if (pinInput.value === appPin) {
    pinModal.classList.remove('show');
    pinInput.value = '';
    pinError.textContent = '';
  } else {
    pinError.textContent = 'Неверный PIN';
    pinInput.value = '';
    pinInput.focus();
  }
}

function showPinIfNeeded() {
  if (appPin && myName) {
    pinModal.classList.add('show');
    setTimeout(() => pinInput.focus(), 100);
  }
}

// === Auto-delete messages ===
// === Delete for all with confirmation ===
function applyDeleteLocally(msgId, room) {
  if (history[room]) {
    const idx = history[room].findIndex(m => m.id === msgId);
    if (idx >= 0) history[room].splice(idx, 1);
    saveHistory(room);
  }
  if (room === activeRoom) {
    const el = mc.querySelector(`[data-id="${msgId}"]`);
    if (el) el.remove();
  }
}
function requestDeleteForAll(msgId) {
  const deleteId = genId();
  const targets = Object.keys(peers);
  if (targets.length === 0) {
    applyDeleteLocally(msgId, activeRoom);
    return;
  }
  const pending = { deleteId, msgId, room: activeRoom, targets, acks: new Set(), timer: null };
  pendingDeletes[deleteId] = pending;
  for (const uuid of targets) {
    post(peers[uuid].path, { type: 'delete_request', deleteId, targetId: msgId, from: myName, fromUuid: myUuid, timestamp: Date.now() });
  }
  pending.timer = setTimeout(() => {
    const failed = targets.filter(u => !pending.acks.has(u));
    if (failed.length) showToast(`Не удалось удалить у ${failed.length} участников`);
    applyDeleteLocally(msgId, activeRoom);
    delete pendingDeletes[deleteId];
    savePendingDeletes();
  }, 15000);
  savePendingDeletes();
}
function savePendingDeletes() {
  try {
    const data = {};
    for (const [k, v] of Object.entries(pendingDeletes)) {
      data[k] = { deleteId: v.deleteId, msgId: v.msgId, room: v.room, targets: v.targets, acks: [...v.acks] };
    }
    localStorage.setItem(localStorageKey('pending_deletes'), JSON.stringify(data));
  } catch (e) {}
}
function loadPendingDeletes() {
  try {
    const raw = localStorage.getItem(localStorageKey('pending_deletes'));
    if (!raw) return;
    const data = JSON.parse(raw);
    for (const [k, v] of Object.entries(data)) {
      const targets = v.targets.filter(u => !v.acks.includes(u));
      if (targets.length > 0) {
        const pending = { deleteId: v.deleteId, msgId: v.msgId, room: v.room, targets, acks: new Set(v.acks), timer: null };
        pending.timer = setTimeout(() => {
          applyDeleteLocally(v.msgId, v.room);
          delete pendingDeletes[v.deleteId];
          savePendingDeletes();
        }, 15000);
        pendingDeletes[k] = pending;
      }
    }
    localStorage.setItem(localStorageKey('pending_deletes'), '{}');
  } catch (e) {}
}

function scheduleAutoDelete(msgId, room) {
  if (autoDeleteTimers[msgId]) clearTimeout(autoDeleteTimers[msgId]);
  autoDeleteTimers[msgId] = setTimeout(() => {
    const idx = history[room] ? history[room].findIndex(m => m.id === msgId) : -1;
    if (idx >= 0) {
      history[room].splice(idx, 1);
      saveHistory(room);
      if (room === activeRoom) {
        const el = mc.querySelector(`[data-id="${msgId}"]`);
        if (el) el.remove();
      }
      requestDeleteForAll(msgId);
    }
    delete autoDeleteTimers[msgId];
  }, 5 * 60 * 1000);
}

// === Custom Titlebar & Close ===
// Web version — no titlebar, no closing modal
function showTitlebar(show) { /* no-op in web */ }

window.addEventListener('beforeunload', () => {
  if (connected && myName && myUuid) {
    const msg = { type: 'status', from: myName, fromUuid: myUuid, online: false, timestamp: Date.now() };
    for (const p of Object.values(peers)) {
      try { navigator.sendBeacon(BASE + p.path, JSON.stringify(msg)); } catch (e) {}
    }
  }
});

// === Visibility API — faster online/offline detection ===
let hiddenPingTimer = null;
function sendOfflineStatus() {
  if (!connected || !myName || !myUuid) return;
  const msg = { type: 'status', from: myName, fromUuid: myUuid, online: false, timestamp: Date.now() };
  for (const p of Object.values(peers)) {
    try { navigator.sendBeacon(BASE + p.path, JSON.stringify(msg)); } catch (e) {}
    try { post(p.path, msg); } catch (e) {}
  }
}
function sendOnlineStatus() {
  if (!connected || !myName || !myUuid) return;
  const msg = { type: 'status', from: myName, fromUuid: myUuid, online: true, timestamp: Date.now() };
  for (const p of Object.values(peers)) {
    try { post(p.path, msg); } catch (e) {}
  }
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    sendOfflineStatus();
    if (hiddenPingTimer) clearInterval(hiddenPingTimer);
    hiddenPingTimer = setInterval(() => {
      if (document.hidden && connected) sendOfflineStatus();
    }, 5000);
  } else {
    if (hiddenPingTimer) { clearInterval(hiddenPingTimer); hiddenPingTimer = null; }
    sendOnlineStatus();
  }
});
window.addEventListener('pagehide', sendOfflineStatus);

// === Mobile sidebar ===
const menuToggle = document.getElementById('menu-toggle');
const sidebarEl = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
function openSidebar() { sidebarEl.classList.add('open'); sidebarOverlay.classList.add('show'); }
function closeSidebar() { sidebarEl.classList.remove('open'); sidebarOverlay.classList.remove('show'); }
if (menuToggle) menuToggle.onclick = (e) => { e.stopPropagation(); sidebarEl.classList.contains('open') ? closeSidebar() : openSidebar(); };
if (sidebarOverlay) sidebarOverlay.onclick = closeSidebar;
if (sidebarEl) sidebarEl.addEventListener('click', (e) => e.stopPropagation());
document.getElementById('main').addEventListener('click', closeSidebar);
let touchStartX = 0;
document.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; });
document.addEventListener('touchmove', e => {
  const diff = e.touches[0].clientX - touchStartX;
  if (diff > 80 && touchStartX < 30) openSidebar();
});

// === Init ===
const onboardingDone = loadState();
loadPendingDeletes();
if ('Notification' in window && Notification.permission === 'default') {
  try { Notification.requestPermission(); } catch (e) {}
}
if (onboardingDone && myName) {
  updateFooter();
  loginModal.classList.add('hidden');
  showPinIfNeeded();
  resetAutoLockTimer();
} else {
  loginModal.classList.add('hidden');
  onboardingContainer.style.display = 'flex';
  onboardingContainer.classList.add('show');
  initOnboarding();
  if (myName) document.getElementById('onboarding-name').value = myName;
}
renderChatList();
updateWindowTitle();



