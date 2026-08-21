import { createRoom, joinRoom } from './rooms.js';

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
