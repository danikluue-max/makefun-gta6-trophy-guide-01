export const EARNED_KEY = 'gta6-trophy-checklist';
export const PREFS_KEY = 'gta6-trophy-prefs';
export const COUNTERS_KEY = 'gta6-trophy-counters';

function clampCounters(raw) {
  const out = {};
  for (const [id, value] of Object.entries(raw)) {
    const n = Number(id);
    if (Number.isInteger(n) && n >= 1 && n <= 55 && Number.isFinite(value)) {
      out[n] = Math.max(0, Math.floor(value));
    }
  }
  return out;
}

export function loadCounterProgress() {
  try {
    const raw = JSON.parse(localStorage.getItem(COUNTERS_KEY) ?? '{}');
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    return clampCounters(raw);
  } catch {
    return {};
  }
}

export function saveCounterProgress(counters) {
  localStorage.setItem(COUNTERS_KEY, JSON.stringify(counters));
}

export function loadEarnedProgress() {
  try {
    const raw = JSON.parse(localStorage.getItem(EARNED_KEY) ?? '[]');
    if (!Array.isArray(raw)) return new Set();
    return new Set(raw.filter((id) => Number.isInteger(id) && id >= 1 && id <= 55));
  } catch {
    return new Set();
  }
}

export function saveEarnedProgress(earned) {
  localStorage.setItem(EARNED_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

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

export function savePreferences(prefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function exportProgressFile(earned, prefs, counters) {
  const payload = { app: 'leonida-trophy-guide', version: 2, exported: new Date().toISOString(), earned: [...earned].sort((a, b) => a - b), spoiler: prefs.spoiler, hideEarned: prefs.hideEarned, counters: counters ?? {} };
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'leonida-trophy-progress.json';
  link.click();
  URL.revokeObjectURL(link.href);
}

export function parseProgressFile(text) {
  const data = JSON.parse(text);
  const earned = data.earned ?? data;
  if (!Array.isArray(earned)) throw new Error('not a progress file: no earned list');
  const ids = earned.filter((id) => Number.isInteger(id) && id >= 1 && id <= 55);
  if (ids.length === 0 && earned.length > 0) throw new Error('not a progress file: no valid trophy ids');
  const counters = data.counters && typeof data.counters === 'object' ? clampCounters(data.counters) : {};
  return {
    earned: new Set(ids),
    counters,
    spoiler: typeof data.spoiler === 'boolean' ? data.spoiler : undefined,
    hideEarned: typeof data.hideEarned === 'boolean' ? data.hideEarned : undefined,
  };
}
