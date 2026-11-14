/**
 * Состояние «исполнения» песни: скорость автопрокрутки и размер текста.
 *
 * Док управляет этими значениями, а панель настроек — читает их,
 * поэтому скорость и кегль всегда одинаковы в обоих местах.
 */

export const SPEEDS = [0.15, 0.3, 0.6, 1.2, 2.0, 3.5];
export const SPEED_LABELS = ['0.25×', '0.5×', '1×', '2×', '3×', '5×'];
export const SCALE_STEPS = [0.85, 1, 1.15, 1.3, 1.5];

let speedIndex = 2;
let scaleIndex = 1;
const listeners = new Set();

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function getSpeedIndex() {
  return speedIndex;
}

export function setSpeedIndex(index) {
  speedIndex = clamp(index, 0, SPEEDS.length - 1);
  listeners.forEach(fn => fn({ speedIndex, scaleIndex }));
  return speedIndex;
}

export function getScaleIndex() {
  return scaleIndex;
}

/** Меняет кегль текста песни и сразу применяет его к документу. */
export function setScaleIndex(index) {
  scaleIndex = clamp(index, 0, SCALE_STEPS.length - 1);
  applyScale();
  listeners.forEach(fn => fn({ speedIndex, scaleIndex }));
  return scaleIndex;
}

export function applyScale() {
  document.documentElement.style.setProperty('--sheet-scale', String(SCALE_STEPS[scaleIndex]));
}

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
