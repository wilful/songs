/**
 * Транспозиция аккордов и общее состояние.
 *
 * Док внизу экрана и полоса-каподастр читают состояние из этого модуля,
 * поэтому показанные аккорды, подпись тональности и положение капо
 * никогда не расходятся.
 */

const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/** Индекс ступени в хроматической шкале (без учёта мажора/минора). */
function noteIndex(note) {
  let n = note;
  if (n === 'H') n = 'B';
  else if (n === 'Hb') n = 'Bb';
  const sharp = SHARPS.indexOf(n);
  if (sharp !== -1) return sharp;
  return FLATS.indexOf(n);
}

/**
 * Транспонирует аккорд. Понимает слэш-аккорды (C/E) и немецкую запись H.
 */
export function transposeChord(chord, steps) {
  if (!chord) return '';

  if (chord.includes('/')) {
    return chord.split('/').map(part => transposeChord(part, steps)).join('/');
  }

  const match = chord.match(/^([A-G][b#]?|H[b#]?)/);
  if (!match) return chord;

  let note = match[1];
  const suffix = chord.slice(note.length);
  const isGerman = note === 'H' || note === 'Hb';

  if (note === 'H') note = 'B';
  else if (note === 'Hb') note = 'Bb';

  const index = noteIndex(note);
  if (index === -1) return chord;

  let next = (index + steps) % 12;
  if (next < 0) next += 12;

  // Вниз по тональности принято называть бемолями: Am -1 -> Abm, а не A#m.
  let name = steps < 0 ? FLATS[next] : SHARPS[next];
  if (isGerman) {
    if (name === 'B') name = 'H';
    else if (name === 'A#' || name === 'Bb') name = 'B';
  }

  return name + suffix;
}

/** Транспонирует название тональности: Am -> Cm при +3. */
export function transposeKey(key, steps) {
  if (!key) return '';
  return key.replace(/^([A-G][b#]?|H[b#]?)/, match => transposeChord(match, steps));
}

/** Ступень тональности (0-11) или -1, если тональность неизвестна. */
export function keyRootIndex(key) {
  const match = (key || '').match(/^([A-G][b#]?|H[b#]?)/);
  if (!match) return -1;
  return noteIndex(match[1]);
}

/**
 * Расстояние в полутонах между двумя тональностями: Am -> C = +3, Am -> F = -4.
 * Берётся короткий путь, чтобы сдвиг вниз не выглядел как «+8».
 */
export function keyDistance(fromKey, toKey) {
  const from = keyRootIndex(fromKey);
  const to = keyRootIndex(toKey);
  if (from === -1 || to === -1) return 0;
  let distance = (to - from + 12) % 12;
  if (distance > 6) distance -= 12;
  return distance;
}

/* ----------------------------- общее состояние ---------------------------- */

let offset = 0;
const listeners = new Set();

export function getOffset() {
  return offset;
}

/**
 * Задаёт сдвиг (в полутонах) и перерисовывает все аккорды на странице.
 * Сдвиг остаётся знаковым: «−1» так и показывается, а не превращается в «+11».
 */
export function setOffset(steps) {
  offset = Math.min(11, Math.max(-11, Math.round(steps)));
  applyChords(offset);
  listeners.forEach(fn => fn(offset));
  return offset;
}

/** Подписка на изменение тональности. Возвращает функцию отписки. */
export function onOffset(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Переписывает текст каждого аккорда от исходного значения. */
export function applyChords(steps) {
  const nodes = document.querySelectorAll('.chord[data-original-chord]');
  nodes.forEach(node => {
    const original = node.getAttribute('data-original-chord');
    if (original) node.textContent = transposeChord(original, steps);
  });
}
