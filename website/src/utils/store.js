/**
 * Локальное хранилище: избранное и недавние песни.
 */

export const FAVORITES_KEY = 'songbook:favorites';
export const RECENT_KEY = 'songbook:recent';

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    /* приватный режим или повреждённые данные */
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    /* остаётся только в памяти вкладки */
  }
}

export function getFavorites() {
  return readJSON(FAVORITES_KEY, []);
}

export function isFavorite(slug) {
  return getFavorites().includes(slug);
}

/** Переключает песню в избранном и сообщает об этом странице. */
export function toggleFavorite(slug) {
  const favorites = getFavorites();
  const index = favorites.indexOf(slug);
  if (index === -1) favorites.unshift(slug);
  else favorites.splice(index, 1);
  writeJSON(FAVORITES_KEY, favorites);
  window.dispatchEvent(new CustomEvent('songbook:favorites', { detail: { slug, active: index === -1 } }));
  return index === -1;
}

export function getRecent() {
  return readJSON(RECENT_KEY, []);
}

/** Запоминает песню как последнюю открытую. */
export function pushRecent(slug) {
  const recent = getRecent().filter(item => item !== slug);
  recent.unshift(slug);
  writeJSON(RECENT_KEY, recent.slice(0, 12));
}
