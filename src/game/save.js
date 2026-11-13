// Opslaan in de browser (localStorage). Werkt ook op GitHub Pages.

const KEY = 'florerende-buurt-v2';

export function loadGame() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.game?.version !== 2) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveGame(game, clock, settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ game, clock, settings, savedAt: Date.now() }));
    return true;
  } catch {
    return false;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* niets te doen */
  }
}
