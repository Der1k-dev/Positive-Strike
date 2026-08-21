import { createRoom, joinRoom } from './rooms.js';
import {
  signInWithGoogle,
  signOutUser,
  watchAuthState,
  ensureUserProfile,
  updateNickname,
  updateAvatarId,
  getMatchHistory,
} from './auth.js';

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

generateRoomBtn.addEventListener('click', () => {
  const room = createRoom();
  roomCodeValue.textContent = room.code;
  roomCodeBox.hidden = false;
  generateRoomBtn.textContent = 'Згенерувати новий код';
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
const joinError = document.getElementById('joinError');

joinCodeInput.addEventListener('input', () => {
  joinCodeInput.value = joinCodeInput.value.toUpperCase();
});

joinForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const result = joinRoom(joinCodeInput.value);

  if (!result.ok) {
    joinError.textContent = result.error;
    joinError.hidden = false;
    return;
  }

  joinError.hidden = true;
  // TODO(крок 3+): перехід у game.html з реальним roomId після підключення Firebase.
  alert(`Заглушка: приєднання до кімнати ${result.code} буде реалізовано, коли підʼєднаємо Firebase (крок 3).`);
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
