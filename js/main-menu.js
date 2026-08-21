import { createRoom, joinRoom } from './rooms.js';
import {
  signInWithGoogle,
  signOutUser,
  watchAuthState,
  ensureUserProfile,
  updateNickname,
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

const profileAvatar = document.getElementById('profileAvatar');
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

  try {
    const profile = await ensureUserProfile(user);
    profileAvatar.src = user.photoURL || '';
    profileAvatar.alt = profile.nickname || '';
    profileEmail.textContent = user.email || '';
    nicknameInput.value = profile.nickname || '';

    const history = await getMatchHistory(user.uid);
    renderHistory(history);
  } catch (err) {
    console.error('Failed to load profile:', err);
  }
});
