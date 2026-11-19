// DOM rendering for the Leonida Trophy Guide: progress, audit strip, kind
// chips, the checklist rows and the open trophy guide. Rendering reads state
// and never writes it — app.js owns the state.

import { isStoryHidden, KIND_LABELS, kindGroup } from './filters.js';

// Stage hours for the "hours left" estimate: ~80 h of story (17 trophies),
// ~100 h of 100% cleanup (33 trophies), ~10 h of final sweep (5 trophies).
const STAGE_HOURS = { 1: 80 / 17, 2: 100 / 33, 3: 10 / 5 };
const RING_CIRCUMFERENCE = 326.7;

// formatCounterValue: plain numbers as-is, money as $125,000 (or $125k short).
export function formatCounterValue(value, counter, short) {
  if (!counter || counter.unit !== '$') return String(value);
  if (short && value >= 1000) return `$${Math.round(value / 1000)}k`;
  return `$${value.toLocaleString('en-US')}`;
}

// formatCounterText: "9/18" or "$125,000/$250,000" for a trophy's counter.
export function formatCounterText(value, counter, short) {
  return `${formatCounterValue(value, counter, short)}/${formatCounterValue(counter.target, counter, short)}`;
}

// citeSuperscripts: [1][2] markers linking to the numbered sources below.
function citeSuperscripts(cites) {
  const sup = document.createElement('sup');
  sup.className = 'cites';
  for (const [index, cite] of cites.entries()) {
    if (index > 0) sup.append(document.createTextNode(' '));
    const link = document.createElement('a');
    link.href = `#source-${cite}`;
    link.textContent = `[${cite}]`;
    sup.append(link);
  }
  return sup;
}

// renderProgressStats: ring, earned count, per-grade counts, hours left.
export function renderProgressStats(trophies, earned) {
  const total = trophies.length;
  const done = earned.size;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  document.getElementById('ringFill').style.strokeDashoffset = String(
    RING_CIRCUMFERENCE * (1 - done / total),
  );
  document.getElementById('ringPct').textContent = `${pct}%`;
  document.getElementById('progressCount').textContent = `${done} / ${total}`;
  const byGrade = {};
  for (const grade of ['platinum', 'gold', 'silver', 'bronze']) {
    const have = trophies.filter((t) => t.grade === grade && earned.has(t.id)).length;
    const all = trophies.filter((t) => t.grade === grade).length;
    byGrade[grade] = `${have}/${all}`;
  }
  document.getElementById('gradeBars').textContent =
    `Platinum ${byGrade.platinum} · Gold ${byGrade.gold} · Silver ${byGrade.silver} · Bronze ${byGrade.bronze}`;
  const hoursLeft = trophies
    .filter((t) => !earned.has(t.id))
    .reduce((sum, t) => sum + (STAGE_HOURS[t.stage] ?? 0), 0);
  document.getElementById('hoursLeft').textContent =
    done === total
      ? 'Platinum earned — 0 h left'
      : `≈ ${Math.round(hoursLeft)} h left to the platinum (estimate)`;
}

// renderAuditStrip: the proof line, counted from the data itself.
export function renderAuditStrip(trophies) {
  const named = trophies.filter((t) => t.name).length;
  const guided = trophies.filter((t) => t.guide && t.guide.trim()).length;
  const cited = trophies.filter((t) => t.sources && t.sources.length > 0).length;
  const counters = trophies.filter((t) => t.counter).length;
  const sources = new Set(trophies.flatMap((t) => (t.sources ?? []).map((s) => s.name))).size;
  const missable = trophies.filter((t) => t.missable).length;
  const unverified = trophies.filter((t) => t.verified === false).length;
  document.getElementById('auditStrip').innerHTML =
    `Audit: <strong>${named}/${trophies.length} named</strong> · ` +
    `<strong>${guided}/${trophies.length} guided</strong> · ` +
    `<strong>${cited}/${trophies.length} cited</strong> · ` +
    `<strong>${counters} progress counters</strong> · ` +
    `<strong>${sources} sources</strong> · ` +
    `<strong>${missable} possibly missable (unconfirmed)</strong> · ` +
    `<strong>${unverified} unverified</strong> · sources checked 19 Nov 2026`;
}

// renderStageStrip: one chip per roadmap stage with earned/total counts.
// Clicking a chip filters the checklist to that stage (click again for all).
export function renderStageStrip(container, stages, trophies, earned, activeStage, onChange) {
  container.replaceChildren();
  const label = document.createElement('span');
  label.className = 'stage-strip-label';
  label.textContent = 'Roadmap:';
  container.append(label);
  for (const stage of stages) {
    const inStage = trophies.filter((t) => t.stage === stage.n);
    const done = inStage.filter((t) => earned.has(t.id)).length;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'stage-chip';
    button.setAttribute('aria-pressed', String(activeStage === stage.n));
    button.innerHTML = '';
    const num = document.createElement('span');
    num.className = 'stage-chip-num';
    num.textContent = `S${stage.n}`;
    button.append(num);
    button.append(document.createTextNode(` ${stage.title} ${done}/${inStage.length}`));
    button.addEventListener('click', () => onChange(activeStage === stage.n ? 'all' : stage.n));
    container.append(button);
  }
  const all = document.createElement('button');
  all.type = 'button';
  all.className = 'stage-chip';
  all.setAttribute('aria-pressed', String(activeStage === 'all'));
  all.textContent = `All stages ${earned.size}/${trophies.length}`;
  all.addEventListener('click', () => onChange('all'));
  container.append(all);
}

// nextUpTrophy: the single most urgent un-earned trophy — the possibly
// missable one first, then the first un-earned trophy in roadmap order
// (stage, then official id). The platinum (id 1) is earned last, so it
// never leads the list.
export function nextUpTrophy(trophies, earned) {
  const missable = trophies.find((t) => t.missable && !earned.has(t.id));
  if (missable) return { trophy: missable, reason: 'missable' };
  const inRoadmapOrder = [...trophies].sort((a, b) => a.stage - b.stage || a.id - b.id);
  const next = inRoadmapOrder.find((t) => t.id !== 1 && !earned.has(t.id));
  if (next) return { trophy: next, reason: 'roadmap' };
  return { trophy: null, reason: 'done' };
}

// renderNextUp: the banner naming the one trophy to do next, with a button
// that opens its guide. When everything is earned, it says so.
export function renderNextUp(container, trophies, earned, onShow) {
  const { trophy, reason } = nextUpTrophy(trophies, earned);
  container.replaceChildren();
  if (!trophy) {
    container.className = 'nextup nextup-done';
    const text = document.createElement('p');
    text.innerHTML = '<strong>Platinum earned.</strong> Every trophy is ticked — Vice Got a Price! is yours.';
    container.append(text);
    return;
  }
  container.className = 'nextup' + (reason === 'missable' ? ' nextup-missable' : '');
  const label = document.createElement('span');
  label.className = 'nextup-label';
  label.textContent = reason === 'missable' ? '⚠ Possibly missable — do this first' : 'Next up';
  container.append(label);
  const text = document.createElement('p');
  if (reason === 'missable') {
    text.innerHTML = `<strong>${trophy.name}</strong> — the Chapter 1 balcony meditation vanishes after Chapter 1. Do it before the chapter ends.`;
  } else {
    text.innerHTML = `<strong>${trophy.name}</strong> — ${trophy.description} (Stage ${trophy.stage}).`;
  }
  container.append(text);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'nextup-show';
  button.textContent = 'Show it';
  button.addEventListener('click', () => onShow(trophy.id));
  container.append(button);
}

// renderKindChips: one toggle button per filter kind.
export function renderKindChips(container, activeKind, onChange) {
  container.replaceChildren();
  for (const [kind, label] of Object.entries(KIND_LABELS)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip';
    button.textContent = label;
    button.setAttribute('aria-pressed', String(kind === activeKind));
    button.addEventListener('click', () => onChange(kind));
    container.append(button);
  }
}

// renderChecklistRows: one card per trophy in the filtered list, grouped
// under roadmap-stage headers (Stage 1 · Play the story, and so on).
// opts: {list, all, stages, earned, selectedId, spoilerOn, counters,
//        onSelect, onToggle}. Counter progress shows on the row as "9/18".
export function renderChecklistRows(container, opts) {
  const { list, all, stages, earned, selectedId, spoilerOn, counters, onSelect, onToggle } = opts;
  container.replaceChildren();
  // Roadmap order: by stage, then by official id — so each stage's header
  // appears exactly once.
  const sorted = [...list].sort((a, b) => a.stage - b.stage || a.id - b.id);
  let currentStage = null;
  for (const trophy of sorted) {
    if (trophy.stage !== currentStage) {
      currentStage = trophy.stage;
      const stage = stages.find((s) => s.n === currentStage);
      const inStage = all.filter((t) => t.stage === currentStage);
      const done = inStage.filter((t) => earned.has(t.id)).length;
      const header = document.createElement('li');
      header.className = 'group-head';
      header.innerHTML = '';
      const num = document.createElement('span');
      num.className = 'stage-num';
      num.textContent = `Stage ${currentStage}`;
      header.append(num);
      header.append(document.createTextNode(
        ` ${stage ? stage.title : ''} — ${done}/${inStage.length} earned`,
      ));
      container.append(header);
    }
    const hidden = isStoryHidden(trophy, earned, spoilerOn);
    const li = document.createElement('li');
    li.className = 'trophy-row' + (earned.has(trophy.id) ? ' earned' : '') + (trophy.id === selectedId ? ' selected' : '');
    li.dataset.trophyId = String(trophy.id);

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(trophy.id);
    box.setAttribute('aria-label', `Mark ${hidden ? 'story trophy' : trophy.name} as earned`);
    box.addEventListener('click', (event) => event.stopPropagation());
    box.addEventListener('change', () => onToggle(trophy.id, box.checked));
    li.append(box);

    const body = document.createElement('div');
    body.className = 'trophy-body';
    const name = document.createElement('p');
    name.className = 'trophy-name';
    name.textContent = hidden ? 'Hidden story trophy' : trophy.name;
    body.append(name);
    const desc = document.createElement('p');
    desc.className = hidden ? 'trophy-hidden' : 'trophy-desc';
    desc.textContent = hidden
      ? 'A story trophy — earn it in the game to reveal its name and description.'
      : trophy.description;
    body.append(desc);

    const tags = document.createElement('div');
    tags.className = 'tags';
    const gradeTag = document.createElement('span');
    gradeTag.className = `tag grade-${trophy.grade}`;
    gradeTag.textContent = trophy.grade;
    tags.append(gradeTag);
    const kindTag = document.createElement('span');
    kindTag.className = 'tag';
    kindTag.textContent = kindGroup(trophy);
    tags.append(kindTag);
    const stageTag = document.createElement('span');
    stageTag.className = 'tag';
    stageTag.textContent = `Stage ${trophy.stage}`;
    tags.append(stageTag);
    if (trophy.counter) {
      const value = counters[trophy.id] ?? 0;
      const counterTag = document.createElement('span');
      counterTag.className = 'tag counter-badge' + (value >= trophy.counter.target ? ' counter-done' : '');
      counterTag.textContent = `◷ ${formatCounterText(value, trophy.counter, true)}`;
      tags.append(counterTag);
    }
    if (trophy.missable) {
      const missableTag = document.createElement('span');
      missableTag.className = 'tag missable';
      missableTag.textContent = 'Possibly missable';
      tags.append(missableTag);
    }
    if (trophy.verified === false) {
      const unverifiedTag = document.createElement('span');
      unverifiedTag.className = 'tag unverified';
      unverifiedTag.textContent = 'Unverified';
      tags.append(unverifiedTag);
    }
    body.append(tags);
    li.append(body);
    li.addEventListener('click', () => onSelect(trophy.id));
    container.append(li);
  }
  document.getElementById('listEmpty').hidden = list.length > 0;
  document.getElementById('listCount').textContent = `${list.length} of 55 trophies`;
}

// renderTrophyDetail: the open guide — name, official description, guide,
// steps with inline citation numbers, the progress counter, and its
// numbered sources. counters is the id -> value map; onCounterChange and
// onToggle are called when the reader taps the counter or marks earned.
export function renderTrophyDetail(container, trophy, earned, spoilerOn, counters, onCounterChange, onToggle) {
  if (!trophy) {
    container.innerHTML =
      '<div class="detail-empty"><h2>Pick a trophy</h2>' +
      '<p>Click any trophy in the checklist to read its guide, step by step, with the sources it is based on.</p>' +
      '<p>Start with the pink-flagged one: Positive Mental Attitude is the only trophy in the game that may be missable.</p></div>';
    return;
  }
  const hidden = isStoryHidden(trophy, earned, spoilerOn);
  if (hidden) {
    container.innerHTML =
      '<div class="detail-empty"><h2>Hidden story trophy</h2>' +
      '<p>This trophy is part of the story. Earn it in the game — or turn spoiler mode off — to read its guide.</p></div>';
    return;
  }
  const el = document.createElement('div');
  const title = document.createElement('h2');
  title.textContent = trophy.name;
  el.append(title);

  const tags = document.createElement('div');
  tags.className = 'tags';
  for (const [cls, text] of [
    [`tag grade-${trophy.grade}`, trophy.grade],
    ['tag', kindGroup(trophy)],
    ['tag', `Stage ${trophy.stage}`],
  ]) {
    const tag = document.createElement('span');
    tag.className = cls;
    tag.textContent = text;
    tags.append(tag);
  }
  if (trophy.missable) {
    const tag = document.createElement('span');
    tag.className = 'tag missable';
    tag.textContent = 'Possibly missable';
    tags.append(tag);
  }
  if (trophy.verified === false) {
    const tag = document.createElement('span');
    tag.className = 'tag unverified';
    tag.textContent = 'Unverified';
    tags.append(tag);
  }
  el.append(tags);

  if (trophy.counter) {
    el.append(renderCounterWidget(trophy, counters[trophy.id] ?? 0, earned.has(trophy.id), onCounterChange, onToggle));
  }

  const officialLabel = document.createElement('p');
  officialLabel.className = 'official-label';
  officialLabel.textContent = 'Official description (PlayStation)';
  el.append(officialLabel);
  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = `“${trophy.description}”`;
  el.append(official);

  if (trophy.missable) {
    const warn = document.createElement('p');
    warn.className = 'warn';
    warn.textContent = 'Possibly missable — unconfirmed: the Chapter 1 balcony meditation disappears after Chapter 1, and nobody has confirmed whether the trophy needs it. PowerPyx, GTABase, KeenGamer and OutputLag flag it as possibly missable; Push Square lists no known missables. Do it to be safe — it takes a minute.';
    el.append(warn);
  }
  if (trophy.verified === false) {
    const warn = document.createElement('p');
    warn.className = 'warn';
    warn.textContent = 'Unverified: no guide has pinned down this trophy yet. The note below says what is known — and what is not.';
    el.append(warn);
  }

  const guideHeading = document.createElement('h3');
  guideHeading.textContent = 'How to get it';
  el.append(guideHeading);
  const guide = document.createElement('p');
  guide.className = 'guide-text';
  guide.textContent = trophy.guide;
  if (trophy.guideCites && trophy.guideCites.length > 0) {
    guide.append(document.createTextNode(' '));
    guide.append(citeSuperscripts(trophy.guideCites));
  }
  el.append(guide);

  if (trophy.steps && trophy.steps.length > 0) {
    const stepsHeading = document.createElement('h3');
    stepsHeading.textContent = 'Steps';
    el.append(stepsHeading);
    const steps = document.createElement('ol');
    for (const step of trophy.steps) {
      const item = document.createElement('li');
      const text = typeof step === 'string' ? step : step.text;
      const cites = typeof step === 'string' ? [] : (step.cites ?? []);
      item.textContent = text;
      if (cites.length > 0) {
        item.append(document.createTextNode(' '));
        item.append(citeSuperscripts(cites));
      }
      steps.append(item);
    }
    el.append(steps);
  }

  const sourcesHeading = document.createElement('h3');
  sourcesHeading.textContent = 'Sources';
  el.append(sourcesHeading);
  const sources = document.createElement('ul');
  sources.className = 'sources';
  for (const [index, source] of (trophy.sources ?? []).entries()) {
    const item = document.createElement('li');
    item.id = `source-${index + 1}`;
    const num = document.createElement('span');
    num.className = 'source-num';
    num.textContent = `[${index + 1}] `;
    item.append(num);
    const link = document.createElement('a');
    link.href = source.url;
    link.textContent = source.name;
    link.target = '_blank';
    link.rel = 'noopener';
    item.append(link);
    item.append(document.createTextNode(` — ${source.date}`));
    sources.append(item);
  }
  el.append(sources);
  container.replaceChildren(el);
}

// renderCounterWidget: the - / value / + tracker for a countable trophy.
// The value is saved in localStorage; hitting the target offers to tick
// the trophy earned (the reader still marks it — nothing auto-ticks).
function renderCounterWidget(trophy, value, isEarned, onCounterChange, onToggle) {
  const counter = trophy.counter;
  const box = document.createElement('div');
  box.className = 'counter-widget';
  const label = document.createElement('p');
  label.className = 'counter-label';
  label.textContent = 'Your progress';
  box.append(label);
  const row = document.createElement('div');
  row.className = 'counter-row';
  const minus = document.createElement('button');
  minus.type = 'button';
  minus.className = 'counter-btn';
  minus.textContent = '−';
  minus.setAttribute('aria-label', `One fewer ${counter.label}`);
  minus.disabled = value <= 0;
  minus.addEventListener('click', () => onCounterChange(trophy.id, Math.max(0, value - counter.step)));
  row.append(minus);
  const display = document.createElement('span');
  display.className = 'counter-value';
  display.textContent = `${formatCounterText(value, counter, false)} ${counter.label}`;
  row.append(display);
  const plus = document.createElement('button');
  plus.type = 'button';
  plus.className = 'counter-btn';
  plus.textContent = '+';
  plus.setAttribute('aria-label', `One more ${counter.label}`);
  plus.disabled = value >= counter.target;
  plus.addEventListener('click', () => onCounterChange(trophy.id, Math.min(counter.target, value + counter.step)));
  row.append(plus);
  box.append(row);
  const hint = document.createElement('p');
  hint.className = 'counter-hint';
  if (value >= counter.target) {
    hint.textContent = 'Target reached. ';
    const mark = document.createElement('button');
    mark.type = 'button';
    mark.className = 'counter-mark';
    mark.textContent = isEarned ? 'Already marked earned ✓' : 'Mark this trophy earned';
    mark.disabled = isEarned;
    mark.addEventListener('click', () => onToggle(trophy.id, true));
    hint.append(mark);
  } else {
    hint.textContent = `Tap + each time you finish one — it saves in your browser and shows on the checklist row.`;
  }
  box.append(hint);
  return box;
}
