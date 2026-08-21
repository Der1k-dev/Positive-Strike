// rooms.js
// ЕТАП 1: локальна заглушка без бекенду.
// На кроці 3 функції createRoom/joinRoom буде переписано так,
// щоб вони писали/читали кімнати у Firebase Realtime Database,
// а не просто генерували код на клієнті.

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // без 0/O/1/I, щоб не плутати
const CODE_LENGTH = 6;

/**
 * Генерує локальний код кімнати.
 * TODO(крок 3): замінити на запис у Firebase і повернення реального roomId.
 */
export function generateRoomCode() {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

/**
 * Створити кімнату (поки що суто локально, без збереження на сервері).
 * TODO(крок 3): Firebase set() у rooms/{code} з полями host/status/mapSeed.
 */
export function createRoom() {
  const code = generateRoomCode();
  return { code, createdAt: Date.now() };
}

/**
 * Перевірка формату коду перед спробою приєднання.
 * Реальна перевірка існування кімнати з'явиться разом із Firebase.
 */
export function isValidCodeFormat(code) {
  return typeof code === 'string' && code.trim().length === CODE_LENGTH;
}

/**
 * Приєднатися до кімнати за кодом.
 * TODO(крок 3): реальний пошук кімнати у Firebase, помилка "кімнату не знайдено".
 */
export function joinRoom(code) {
  if (!isValidCodeFormat(code)) {
    return { ok: false, error: 'Код має складатися з 6 символів' };
  }
  // Поки немає бекенду — приєднання завжди "успішне" локально.
  return { ok: true, code: code.trim().toUpperCase() };
}
