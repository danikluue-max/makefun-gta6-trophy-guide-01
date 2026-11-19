// Saved progress for the Leonida Trophy Guide: earned trophy ids and the
// reader's preferences, kept in localStorage only — nothing leaves the browser.
export const EARNED_KEY = 'gta6-trophy-checklist';
export const PREFS_KEY = 'gta6-trophy-prefs';
export const COUNTERS_KEY = 'gta6-trophy-counters';

// loadCounterProgress: the reader's per-trophy counter values, as an object
// of trophy id -> number. Values are clamped to 0..target by the caller.
export function loadCounterProgress() {
  try {
    const raw = JSON.parse(localStorage.getItem(COUNTERS_KEY) ?? '{}');
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    const out = {};
    for (const [id, value] of Object.entries(raw)) {
      const n = Number(id);
      if (Number.isInteger(n) && n >= 1 && n <= 55 && Number.isFinite(value)) {
        out[n] = Math.max(0, Math.floor(value));
      }
    }
    return out;
  } catch {
    return {};
  }
}

// saveCounterProgress: persist counter values after every tap.
export function saveCounterProgress(counters) {
  localStorage.setItem(COUNTERS_KEY, JSON.stringify(counters));
}

// loadEarnedProgress: the earned trophy ids, as a Set of numbers 1-55.
export function loadEarnedProgress() {
  try {
    const raw = JSON.parse(localStorage.getItem(EARNED_KEY) ?? '[]');
    if (!Array.isArray(raw)) return new Set();
    return new Set(raw.filter((id) => Number.isInteger(id) && id >= 1 && id <= 55));
  } catch {
    return new Set();
  }
}

// saveEarnedProgress: persist the earned ids after every tick.
export function saveEarnedProgress(earned) {
  localStorage.setItem(EARNED_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

// loadPreferences: spoiler mode on by default, hide-earned off by default.
export function loadPreferences() {
  try {
    const raw = JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}');
    return {
      spoiler: raw.spoiler !== false,
      hideEarned: raw.hideEarned === true,
    };
  } catch {
    return { spoiler: true, hideEarned: false };
  }
}

// savePreferences: persist spoiler / hide-earned choices.
export function savePreferences(prefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

// exportProgressFile: download the progress as a JSON file the app can import back.
export function exportProgressFile(earned, prefs, counters) {
  const payload = {
    app: 'leonida-trophy-guide',
    version: 2,
    exported: new Date().toISOString(),
    earned: [...earned].sort((a, b) => a - b),
    spoiler: prefs.spoiler,
    hideEarned: prefs.hideEarned,
    counters: counters ?? {},
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'leonida-trophy-progress.json';
  link.click();
  URL.revokeObjectURL(link.href);
}

// parseProgressFile: validate an imported file; throws on anything unusable.
export function parseProgressFile(text) {
  const data = JSON.parse(text);
  const earned = data.earned ?? data;
  if (!Array.isArray(earned)) throw new Error('not a progress file: no earned list');
  const ids = earned.filter((id) => Number.isInteger(id) && id >= 1 && id <= 55);
  if (ids.length === 0 && earned.length > 0) throw new Error('not a progress file: no valid trophy ids');
  const counters = {};
  if (data.counters && typeof data.counters === 'object') {
    for (const [id, value] of Object.entries(data.counters)) {
      const n = Number(id);
      if (Number.isInteger(n) && n >= 1 && n <= 55 && Number.isFinite(value)) {
        counters[n] = Math.max(0, Math.floor(value));
      }
    }
  }
  return {
    earned: new Set(ids),
    counters,
    spoiler: typeof data.spoiler === 'boolean' ? data.spoiler : undefined,
    hideEarned: typeof data.hideEarned === 'boolean' ? data.hideEarned : undefined,
  };
}
