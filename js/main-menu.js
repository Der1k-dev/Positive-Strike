import { createRoom, joinRoom, watchRoom, leaveRoom } from './rooms.js';
import {
  signInWithGoogle,
  signOutUser,
  watchAuthState,
  ensureUserProfile,
  updateNickname,
  updateAvatarId,
  getMatchHistory,
} from './auth.js';

// ---------- Автоперехід на карту бою з відліком ----------

const BATTLE_TRANSITION_SECONDS = 3;

/**
 * Показує "Перехід через N…" і за N секунд сама переходить на game.html.
 * Кнопка лишається клікабельною одразу — можна не чекати відліку.
 */
function startBattleTransition({ textEl, code }) {
  let secondsLeft = BATTLE_TRANSITION_SECONDS;
  textEl.textContent = `Перехід на карту бою через ${secondsLeft}…`;

  const intervalId = setInterval(() => {
    secondsLeft -= 1;
    if (secondsLeft <= 0) {
      clearInterval(intervalId);
      window.location.href = `game.html?code=${code}`;
      return;
    }
    textEl.textContent = `Перехід на карту бою через ${secondsLeft}…`;
  }, 1000);

  return () => clearInterval(intervalId);
}

// ---------- Перемикання "Створити / Приєднатися" ----------

const tabCreate = document.getElementById('tabCreate');
const tabJoin = document.getElementById('tabJoin');
const panelCreate = document.getElementById('panelCreate');
const panelJoin = document.getElementById('panelJoin');

function activateTab(tab) {
  const isCreate = tab === 'create';

  tabCreate.classList.toggle('is-active', isCreate);
  tabJoin.classList.toggle('is-active', !isCreate);
  tabCreate.setAttribute('aria-selected', String(isCreate));
  tabJoin.setAttribute('aria-selected', String(!isCreate));

  panelCreate.hidden = !isCreate;
  panelJoin.hidden = isCreate;
}

tabCreate.addEventListener('click', () => activateTab('create'));
tabJoin.addEventListener('click', () => activateTab('join'));

// ---------- Створення кімнати ----------

const generateRoomBtn = document.getElementById('generateRoomBtn');
const roomCodeBox = document.getElementById('roomCodeBox');
const roomCodeValue = document.getElementById('roomCodeValue');
const copyCodeBtn = document.getElementById('copyCodeBtn');
const roomStatus = document.getElementById('roomStatus');
const cancelRoomBtn = document.getElementById('cancelRoomBtn');
const hostBattleTransition = document.getElementById('hostBattleTransition');
const hostBattleCountdown = document.getElementById('hostBattleCountdown');
const hostViewMapLink = document.getElementById('hostViewMapLink');

let activeRoomCode = null;
let stopWatchingRoom = null;
let stopHostCountdown = null;

function stopRoomWatch() {
  if (stopWatchingRoom) {
    stopWatchingRoom();
    stopWatchingRoom = null;
  }
}

function stopHostTransition() {
  if (stopHostCountdown) {
    stopHostCountdown();
    stopHostCountdown = null;
  }
}

generateRoomBtn.addEventListener('click', async () => {
  generateRoomBtn.disabled = true;
  generateRoomBtn.textContent = 'Створення…';
  stopRoomWatch();
  stopHostTransition();

  try {
    const room = await createRoom();
    activeRoomCode = room.code;

    roomCodeValue.textContent = room.code;
    roomCodeBox.hidden = false;
    roomStatus.textContent = 'Очікування другого гравця…';
    roomStatus.classList.remove('room-code-status--ready');
    hostBattleTransition.hidden = true;
    hostViewMapLink.href = `game.html?code=${room.code}`;
    generateRoomBtn.textContent = 'Згенерувати новий код';

    stopWatchingRoom = watchRoom(room.code, (data) => {
      if (!data) {
        // Кімнату видалено (напр. скасовано з іншої вкладки).
        roomStatus.textContent = 'Кімнату скасовано.';
        hostBattleTransition.hidden = true;
        stopHostTransition();
        return;
      }
      if (data.status === 'full' && hostBattleTransition.hidden) {
        roomStatus.textContent = 'Гравець приєднався!';
        roomStatus.classList.add('room-code-status--ready');
        hostBattleTransition.hidden = false;
        stopHostCountdown = startBattleTransition({
          textEl: hostBattleCountdown,
          code: room.code,
        });
      }
    });
  } catch (err) {
    console.error('Room creation failed:', err);
    roomStatus.textContent = 'Не вдалося створити кімнату. Спробуйте ще раз.';
    roomCodeBox.hidden = false;
  } finally {
    generateRoomBtn.disabled = false;
  }
});

cancelRoomBtn.addEventListener('click', async () => {
  if (!activeRoomCode) return;
  cancelRoomBtn.disabled = true;
  try {
    await leaveRoom(activeRoomCode);
  } catch (err) {
    console.error('Failed to cancel room:', err);
  } finally {
    stopRoomWatch();
    stopHostTransition();
    activeRoomCode = null;
    roomCodeBox.hidden = true;
    cancelRoomBtn.disabled = false;
    generateRoomBtn.textContent = 'Згенерувати код кімнати';
  }
});

copyCodeBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(roomCodeValue.textContent);
    const original = copyCodeBtn.textContent;
    copyCodeBtn.textContent = 'Скопійовано';
    setTimeout(() => { copyCodeBtn.textContent = original; }, 1500);
  } catch {
    // Буфер обміну недоступний (напр. без HTTPS) — тихо ігноруємо,
    // код і так видно на екрані.
  }
});

// ---------- Приєднання до кімнати ----------

const joinForm = document.getElementById('joinForm');
const joinCodeInput = document.getElementById('joinCodeInput');
const joinSubmitBtn = document.getElementById('joinSubmitBtn');
const joinError = document.getElementById('joinError');
const joinedBox = document.getElementById('joinedBox');
const guestBattleCountdown = document.getElementById('guestBattleCountdown');
const guestViewMapLink = document.getElementById('guestViewMapLink');

joinCodeInput.addEventListener('input', () => {
  joinCodeInput.value = joinCodeInput.value.toUpperCase();
});

joinForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  joinSubmitBtn.disabled = true;
  joinSubmitBtn.textContent = 'Приєднання…';
  joinError.hidden = true;

  try {
    const result = await joinRoom(joinCodeInput.value);

    if (!result.ok) {
      joinError.textContent = result.error;
      joinError.hidden = false;
      return;
    }

    joinForm.hidden = true;
    joinedBox.hidden = false;
    guestViewMapLink.href = `game.html?code=${result.code}`;
    startBattleTransition({
      textEl: guestBattleCountdown,
      code: result.code,
    });
  } catch (err) {
    console.error('Join room failed:', err);
    joinError.textContent = 'Щось пішло не так. Спробуйте ще раз.';
    joinError.hidden = false;
  } finally {
    joinSubmitBtn.disabled = false;
    joinSubmitBtn.textContent = 'Приєднатися';
  }
});

// ---------- Модалка "Особистий кабінет" ----------

const cabinetBtn = document.getElementById('cabinetBtn');
const cabinetModal = document.getElementById('cabinetModal');
const cabinetModalClose = document.getElementById('cabinetModalClose');

const cabinetSignedOut = document.getElementById('cabinetSignedOut');
const cabinetSignedIn = document.getElementById('cabinetSignedIn');
const googleSignInBtn = document.getElementById('googleSignInBtn');
const authError = document.getElementById('authError');

const profileAvatarSlot = document.getElementById('profileAvatarSlot');
const changeAvatarBtn = document.getElementById('changeAvatarBtn');
const avatarPicker = document.getElementById('avatarPicker');
const profileEmail = document.getElementById('profileEmail');
const nicknameInput = document.getElementById('nicknameInput');
const saveNicknameBtn = document.getElementById('saveNicknameBtn');
const nicknameStatus = document.getElementById('nicknameStatus');
const historyList = document.getElementById('historyList');
const signOutBtn = document.getElementById('signOutBtn');

let currentUser = null;

function openCabinetModal() {
  cabinetModal.hidden = false;
  cabinetModalClose.focus();
}

function closeCabinetModal() {
  cabinetModal.hidden = true;
  cabinetBtn.focus();
}

cabinetBtn.addEventListener('click', openCabinetModal);
cabinetModalClose.addEventListener('click', closeCabinetModal);
cabinetModal.addEventListener('click', (event) => {
  if (event.target === cabinetModal) closeCabinetModal();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !cabinetModal.hidden) closeCabinetModal();
});

// ---------- Google Sign-In ----------

googleSignInBtn.addEventListener('click', async () => {
  authError.hidden = true;
  googleSignInBtn.disabled = true;
  googleSignInBtn.textContent = 'Зʼєднання з Google…';
  try {
    await signInWithGoogle();
    // Подальше оновлення UI відбудеться через watchAuthState нижче.
  } catch (err) {
    console.error('Google sign-in failed:', err);
    authError.textContent = 'Не вдалося увійти через Google. Спробуйте ще раз.';
    authError.hidden = false;
  } finally {
    googleSignInBtn.disabled = false;
    googleSignInBtn.textContent = 'Увійти через Google';
  }
});

signOutBtn.addEventListener('click', async () => {
  await signOutUser();
});

// ---------- Аватар ----------

const AVATAR_OPTIONS = [
  { id: 'pentagon-blue', shape: 'pentagon', color: 'blue' },
  { id: 'hexagon-red', shape: 'hexagon', color: 'red' },
  { id: 'diamond-gold', shape: 'diamond', color: 'gold' },
  { id: 'shield-teal', shape: 'shield', color: 'teal' },
  { id: 'triangle-purple', shape: 'triangle', color: 'purple' },
  { id: 'circle-orange', shape: 'circle', color: 'orange' },
  { id: 'hexagon-blue', shape: 'hexagon', color: 'blue' },
  { id: 'shield-red', shape: 'shield', color: 'red' },
];

function renderAvatarSlot(avatarId, photoURL) {
  profileAvatarSlot.innerHTML = '';
  profileAvatarSlot.className = 'profile-avatar-slot';

  if (!avatarId && photoURL) {
    const img = document.createElement('img');
    img.src = photoURL;
    img.alt = '';
    img.className = 'profile-avatar-img';
    profileAvatarSlot.appendChild(img);
    return;
  }

  const [shape, color] = (avatarId || 'pentagon-blue').split('-');
  profileAvatarSlot.classList.add('avatar-emblem', `avatar-emblem--${shape}`, `avatar-emblem--${color}`);
}

function buildAvatarPicker(photoURL, selectedId) {
  avatarPicker.innerHTML = '';

  if (photoURL) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'avatar-option';
    btn.dataset.avatarId = '';
    if (!selectedId) btn.classList.add('is-selected');
    const img = document.createElement('img');
    img.src = photoURL;
    img.alt = 'Фото Google-акаунта';
    btn.appendChild(img);
    avatarPicker.appendChild(btn);
  }

  for (const opt of AVATAR_OPTIONS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `avatar-option avatar-emblem avatar-emblem--${opt.shape} avatar-emblem--${opt.color}`;
    btn.dataset.avatarId = opt.id;
    btn.setAttribute('aria-label', `Емблема: ${opt.shape}, ${opt.color}`);
    if (selectedId === opt.id) btn.classList.add('is-selected');
    avatarPicker.appendChild(btn);
  }
}

changeAvatarBtn.addEventListener('click', () => {
  avatarPicker.hidden = !avatarPicker.hidden;
  changeAvatarBtn.textContent = avatarPicker.hidden ? 'Змінити аватар' : 'Сховати варіанти';
});

avatarPicker.addEventListener('click', async (event) => {
  const btn = event.target.closest('.avatar-option');
  if (!btn || !currentUser) return;

  const avatarId = btn.dataset.avatarId || null;

  [...avatarPicker.children].forEach((c) => c.classList.remove('is-selected'));
  btn.classList.add('is-selected');
  renderAvatarSlot(avatarId, currentUser.photoURL);

  try {
    await updateAvatarId(currentUser.uid, avatarId);
  } catch (err) {
    console.error('Avatar update failed:', err);
  }
});

// ---------- Зміна нікнейму ----------

saveNicknameBtn.addEventListener('click', async () => {
  if (!currentUser) return;

  const value = nicknameInput.value.trim();
  if (!value) {
    nicknameStatus.textContent = 'Нікнейм не може бути порожнім';
    nicknameStatus.hidden = false;
    return;
  }

  saveNicknameBtn.disabled = true;
  try {
    await updateNickname(currentUser.uid, value);
    nicknameStatus.textContent = 'Збережено';
    nicknameStatus.hidden = false;
    setTimeout(() => { nicknameStatus.hidden = true; }, 1500);
  } catch (err) {
    console.error('Nickname update failed:', err);
    nicknameStatus.textContent = 'Помилка збереження, спробуйте ще раз';
    nicknameStatus.hidden = false;
  } finally {
    saveNicknameBtn.disabled = false;
  }
});

// ---------- Історія матчів ----------

function renderHistory(matches) {
  historyList.innerHTML = '';

  if (!matches.length) {
    const li = document.createElement('li');
    li.className = 'history-empty';
    li.textContent = 'Матчів ще не було.';
    historyList.appendChild(li);
    return;
  }

  for (const match of matches) {
    const li = document.createElement('li');
    const date = match.date ? new Date(match.date).toLocaleDateString('uk-UA') : '—';
    const result = match.result === 'win' ? 'Перемога'
      : match.result === 'loss' ? 'Поразка'
      : 'Матч';
    li.textContent = `${date} · ${result}`;
    historyList.appendChild(li);
  }
}

// ---------- Стан авторизації ----------

watchAuthState(async (user) => {
  currentUser = user;

  if (!user) {
    cabinetSignedOut.hidden = false;
    cabinetSignedIn.hidden = true;
    return;
  }

  cabinetSignedOut.hidden = true;
  cabinetSignedIn.hidden = false;
  avatarPicker.hidden = true;
  changeAvatarBtn.textContent = 'Змінити аватар';

  try {
    const profile = await ensureUserProfile(user);
    renderAvatarSlot(profile.avatarId, user.photoURL);
    buildAvatarPicker(user.photoURL, profile.avatarId);
    profileEmail.textContent = user.email || '';
    nicknameInput.value = profile.nickname || '';

    const history = await getMatchHistory(user.uid);
    renderHistory(history);
  } catch (err) {
    console.error('Failed to load profile:', err);
  }
});
