// rooms.js
// Кімнати зберігаються в Realtime Database: rooms/{code}.
// Гра можлива без Google-акаунта — ensureAnonymousSession() (з auth.js)
// непомітно видає анонімний uid, якщо людина не залогінена.

import { db } from './firebase-config.js';
import { ensureAnonymousSession } from './auth.js';
import {
  ref,
  get,
  set,
  update,
  remove,
  onValue,
  onDisconnect,
  off,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // без 0/O/1/I, щоб не плутати
const CODE_LENGTH = 6;
const CODE_GENERATION_ATTEMPTS = 5;

function generateCode() {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export function isValidCodeFormat(code) {
  return typeof code === 'string' && code.trim().length === CODE_LENGTH;
}

/**
 * Створює кімнату в базі даних і повертає { code, uid }.
 * Кімнату буде автоматично прибрано, якщо хост закриє вкладку
 * до того, як приєднається другий гравець (onDisconnect).
 */
export async function createRoom() {
  const user = await ensureAnonymousSession();

  let code = null;
  for (let attempt = 0; attempt < CODE_GENERATION_ATTEMPTS; attempt++) {
    const candidate = generateCode();
    const snapshot = await get(ref(db, `rooms/${candidate}`));
    if (!snapshot.exists()) {
      code = candidate;
      break;
    }
  }
  if (!code) {
    throw new Error('Не вдалося згенерувати унікальний код, спробуйте ще раз');
  }

  const roomRef = ref(db, `rooms/${code}`);
  await set(roomRef, {
    hostId: user.uid,
    guestId: null,
    status: 'waiting', // waiting -> full
    createdAt: Date.now(),
  });

  onDisconnect(roomRef).remove();

  return { code, uid: user.uid };
}

/**
 * Приєднання до існуючої кімнати за кодом.
 * Повертає { ok: true, code, uid } або { ok: false, error }.
 */
export async function joinRoom(rawCode) {
  if (!isValidCodeFormat(rawCode)) {
    return { ok: false, error: 'Код має складатися з 6 символів' };
  }

  const code = rawCode.trim().toUpperCase();
  const user = await ensureAnonymousSession();
  const roomRef = ref(db, `rooms/${code}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) {
    return { ok: false, error: 'Кімнату не знайдено' };
  }

  const room = snapshot.val();

  if (room.hostId === user.uid) {
    return { ok: false, error: 'Не можна приєднатися до власної кімнати' };
  }
  if (room.status !== 'waiting') {
    return { ok: false, error: 'Кімната вже заповнена' };
  }

  await update(roomRef, { guestId: user.uid, status: 'full' });
  return { ok: true, code, uid: user.uid };
}

/**
 * Підписка на зміни кімнати в реальному часі.
 * callback(roomData | null) — null означає, що кімнату видалено.
 * Повертає функцію відписки.
 */
export function watchRoom(code, callback) {
  const roomRef = ref(db, `rooms/${code}`);
  onValue(roomRef, (snapshot) => callback(snapshot.exists() ? snapshot.val() : null));
  return () => off(roomRef);
}

/**
 * Хост вручну скасовує/закриває свою кімнату очікування.
 */
export async function leaveRoom(code) {
  await remove(ref(db, `rooms/${code}`));
}
