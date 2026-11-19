// Leonida Trophy Guide — boot: load the data, wire the controls, render.
// State lives in state.js, filtering in filters.js, DOM in render.js and
// roadmap.js. This file only connects them.

import {
  exportProgressFile,
  loadCounterProgress,
  loadEarnedProgress,
  loadPreferences,
  parseProgressFile,
  saveCounterProgress,
  saveEarnedProgress,
  savePreferences,
} from './state.js';
import { applyChecklistFilters } from './filters.js';
import {
  renderAuditStrip,
  renderChecklistRows,
  renderKindChips,
  renderNextUp,
  renderProgressStats,
  renderStageStrip,
  renderTrophyDetail,
} from './render.js';
import {
  renderKeyFacts,
  renderMissableWatchlist,
  renderPlatinumRoadmap,
} from './roadmap.js';

const trophiesDoc = await (await fetch('data/trophies.json')).json();
const roadmapDoc = await (await fetch('data/roadmap.json')).json();
const trophies = trophiesDoc.trophies;

let earned = loadEarnedProgress();
let prefs = loadPreferences();
let counters = loadCounterProgress();
let selectedId = 28; // Positive Mental Attitude — the one missable trophy, first.
let activeKind = 'all';
let activeStage = 'all';
let query = '';

const rowsEl = document.getElementById('rows');
const detailEl = document.getElementById('detail');

function onCounterChange(id, value) {
  const trophy = trophies.find((t) => t.id === id);
  if (!trophy?.counter) return;
  counters = { ...counters, [id]: Math.max(0, Math.min(trophy.counter.target, value)) };
  saveCounterProgress(counters);
  renderAll();
}

function onToggleEarned(id, checked) {
  if (checked) earned.add(id);
  else earned.delete(id);
  saveEarnedProgress(earned);
  renderAll();
}

function renderAll() {
  const filtered = applyChecklistFilters(trophies, {
    query,
    kind: activeKind,
    grade: document.getElementById('grade').value,
    stage: activeStage,
    hideEarned: prefs.hideEarned,
    earned,
  });
  renderProgressStats(trophies, earned);
  renderAuditStrip(trophies);
  renderStageStrip(
    document.getElementById('stageStrip'),
    roadmapDoc.stages,
    trophies,
    earned,
    activeStage,
    (stage) => {
      activeStage = stage;
      renderAll();
    },
  );
  renderNextUp(
    document.getElementById('nextUp'),
    trophies,
    earned,
    (id) => {
      selectedId = id;
      renderAll();
      detailEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },
  );
  renderChecklistRows(rowsEl, {
    list: filtered,
    all: trophies,
    stages: roadmapDoc.stages,
    earned,
    selectedId,
    spoilerOn: prefs.spoiler,
    counters,
    onSelect: (id) => {
      selectedId = id;
      renderAll();
    },
    onToggle: onToggleEarned,
  });
  const selected = trophies.find((t) => t.id === selectedId) ?? null;
  renderTrophyDetail(detailEl, selected, earned, prefs.spoiler, counters, onCounterChange, onToggleEarned);
}

document.getElementById('spoiler').checked = prefs.spoiler;
document.getElementById('hideEarned').checked = prefs.hideEarned;
document.getElementById('spoiler').addEventListener('change', (event) => {
  prefs = { ...prefs, spoiler: event.target.checked };
  savePreferences(prefs);
  renderAll();
});
document.getElementById('hideEarned').addEventListener('change', (event) => {
  prefs = { ...prefs, hideEarned: event.target.checked };
  savePreferences(prefs);
  renderAll();
});
document.getElementById('search').addEventListener('input', (event) => {
  query = event.target.value;
  renderAll();
});
document.getElementById('grade').addEventListener('change', renderAll);
function onKindChange(kind) {
  activeKind = kind;
  renderKindChips(document.getElementById('kindChips'), activeKind, onKindChange);
  renderAll();
}
renderKindChips(document.getElementById('kindChips'), activeKind, onKindChange);
document.getElementById('export').addEventListener('click', () => {
  exportProgressFile(earned, prefs, counters);
});
document.getElementById('import').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const parsed = parseProgressFile(await file.text());
    earned = parsed.earned;
    counters = parsed.counters ?? {};
    if (parsed.spoiler !== undefined) prefs.spoiler = parsed.spoiler;
    if (parsed.hideEarned !== undefined) prefs.hideEarned = parsed.hideEarned;
    document.getElementById('spoiler').checked = prefs.spoiler;
    document.getElementById('hideEarned').checked = prefs.hideEarned;
    saveEarnedProgress(earned);
    saveCounterProgress(counters);
    savePreferences(prefs);
  } catch (error) {
    alert(`Could not import that file: ${error.message}`);
  }
  event.target.value = '';
  renderAll();
});

renderPlatinumRoadmap(document.getElementById('roadmapPanel'), roadmapDoc);
renderMissableWatchlist(document.getElementById('missablePanel'), trophies, roadmapDoc);
renderKeyFacts(document.getElementById('factsPanel'), roadmapDoc);
renderAll();
