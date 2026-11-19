import { isStoryHidden, KIND_LABELS, kindGroup } from './filters.js';

const STAGE_HOURS = { 1: 80 / 17, 2: 100 / 33, 3: 10 / 5 };
const RING_CIRCUMFERENCE = 326.7;

export function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

function tag(cls, text) {
  return el('span', cls, text);
}

function trophyTags(trophy, extra) {
  const tags = el('div', 'tags');
  tags.append(
    tag(`tag grade-${trophy.grade}`, trophy.grade),
    tag('tag', kindGroup(trophy)),
    tag('tag', `Stage ${trophy.stage}`),
  );
  if (extra) tags.append(extra);
  if (trophy.missable) tags.append(tag('tag missable', 'Possibly missable'));
  if (trophy.verified === false) tags.append(tag('tag unverified', 'Unverified'));
  return tags;
}

const $ = (id) => document.getElementById(id);

export function formatCounterValue(value, counter, short) {
  if (!counter || counter.unit !== '$') return String(value);
  if (short && value >= 1000) return `$${Math.round(value / 1000)}k`;
  return `$${value.toLocaleString('en-US')}`;
}

export function formatCounterText(value, counter, short) {
  const f = (v) => formatCounterValue(v, counter, short);
  return `${f(value)}/${f(counter.target)}`;
}

function citeSuperscripts(cites) {
  const sup = el('sup', 'cites');
  for (const [index, cite] of cites.entries()) {
    if (index > 0) sup.append(document.createTextNode(' '));
    const link = el('a');
    link.href = `#source-${cite}`;
    link.textContent = `[${cite}]`;
    sup.append(link);
  }
  return sup;
}

function sourceShortName(source) {
  return source.name.split('—')[0].trim();
}

function sourceNameChips(sources, cites) {
  const wrap = el('span', 'step-srcs');
  const seen = new Set();
  for (const cite of cites) {
    const source = sources[cite - 1];
    if (!source) continue;
    const short = sourceShortName(source);
    if (seen.has(short)) continue;
    seen.add(short);
    wrap.append(el('span', 'step-src', short));
  }
  return wrap;
}

function renderSourcesBox(sources) {
  const box = el('div', 'sources-box');
  box.append(el('h3', 'sources-heading', `Sources — every fact below is cited here (${sources.length})`));
  const list = el('ul', 'sources');
  for (const [index, source] of sources.entries()) {
    const item = el('li');
    item.id = `source-${index + 1}`;
    item.append(el('span', 'source-num', `[${index + 1}] `));
    const link = el('a');
    link.href = source.url;
    link.textContent = source.name;
    link.target = '_blank';
    link.rel = 'noopener';
    item.append(link, document.createTextNode(` — ${source.date}`));
    list.append(item);
  }
  box.append(list);
  return box;
}

export function renderProgressStats(trophies, earned) {
  const total = trophies.length;
  const done = earned.size;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  $('ringFill').style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - done / total));
  $('ringPct').textContent = `${pct}%`;
  $('progressCount').textContent = `${done} / ${total}`;
  const byGrade = { platinum: [0, 0], gold: [0, 0], silver: [0, 0], bronze: [0, 0] };
  for (const trophy of trophies) {
    const slot = byGrade[trophy.grade];
    if (!slot) continue;
    slot[1]++;
    if (earned.has(trophy.id)) slot[0]++;
  }
  $('gradeBars').textContent =
    `Platinum ${byGrade.platinum[0]}/${byGrade.platinum[1]} · Gold ${byGrade.gold[0]}/${byGrade.gold[1]} · Silver ${byGrade.silver[0]}/${byGrade.silver[1]} · Bronze ${byGrade.bronze[0]}/${byGrade.bronze[1]}`;
  const hoursLeft = trophies
    .filter((t) => !earned.has(t.id))
    .reduce((sum, t) => sum + (STAGE_HOURS[t.stage] ?? 0), 0);
  $('hoursLeft').textContent =
    done === total
      ? 'Platinum earned — 0 h left'
      : `≈ ${Math.round(hoursLeft)} h left to the platinum (estimate)`;
}

export function renderAuditStrip(trophies) {
  const total = trophies.length;
  const named = trophies.filter((t) => t.name).length;
  const guided = trophies.filter((t) => t.guide && t.guide.trim()).length;
  const cited = trophies.filter((t) => t.sources && t.sources.length > 0).length;
  const counters = trophies.filter((t) => t.counter).length;
  const sources = new Set(trophies.flatMap((t) => (t.sources ?? []).map((s) => s.name))).size;
  const missable = trophies.filter((t) => t.missable).length;
  const unverified = trophies.filter((t) => t.verified === false).length;
  const word = (have) => (have === total ? `ALL ${total}` : `${have}/${total}`);
  $('auditStrip').innerHTML = `Audit: <strong>${word(named)} NAMED</strong> · <strong>${word(guided)} GUIDED</strong> · <strong>${word(cited)} CITED</strong> · <strong>${counters} progress counters</strong> · <strong>${sources} sources</strong> · <strong>${missable} possibly missable (unconfirmed)</strong> · <strong>${unverified} unverified</strong> · sources checked 19 Nov 2026`;
}

export function renderStageStrip(container, stages, trophies, earned, activeStage, onChange, totalHours) {
  container.replaceChildren();
  container.append(el('span', 'stage-strip-label', 'Roadmap:'));
  for (const stage of stages) {
    const inStage = trophies.filter((t) => t.stage === stage.n);
    const done = inStage.filter((t) => earned.has(t.id)).length;
    const button = el('button', 'stage-chip');
    button.type = 'button';
    button.setAttribute('aria-pressed', String(activeStage === stage.n));
    button.append(el('span', 'stage-chip-num', `S${stage.n}`));
    button.append(document.createTextNode(` ${stage.title} ${done}/${inStage.length}`));
    button.append(el('span', 'stage-hours', ` · ${stage.hours}`));
    button.addEventListener('click', () => onChange(activeStage === stage.n ? 'all' : stage.n));
    container.append(button);
  }
  const all = el('button', 'stage-chip', `All stages ${earned.size}/${trophies.length}`);
  all.type = 'button';
  all.setAttribute('aria-pressed', String(activeStage === 'all'));
  if (totalHours) all.append(el('span', 'stage-hours', ` · ${totalHours}`));
  all.addEventListener('click', () => onChange('all'));
  container.append(all);
}

export function nextUpTrophy(trophies, earned) {
  const missable = trophies.find((t) => t.missable && !earned.has(t.id));
  if (missable) return { trophy: missable, reason: 'missable' };
  const inRoadmapOrder = [...trophies].sort((a, b) => a.stage - b.stage || a.id - b.id);
  const next = inRoadmapOrder.find((t) => t.id !== 1 && !earned.has(t.id));
  if (next) return { trophy: next, reason: 'roadmap' };
  return { trophy: null, reason: 'done' };
}

export function renderNextUp(container, trophies, earned, onShow) {
  const { trophy, reason } = nextUpTrophy(trophies, earned);
  container.replaceChildren();
  if (!trophy) {
    container.className = 'nextup nextup-done';
    const text = el('p');
    text.innerHTML = '<strong>Platinum earned.</strong> Every trophy is ticked — Vice Got a Price! is yours.';
    container.append(text);
    return;
  }
  container.className = 'nextup' + (reason === 'missable' ? ' nextup-missable' : '');
  container.append(el('span', 'nextup-label', reason === 'missable' ? '⚠ Possibly missable — do this first' : 'Next up'));
  const text = el('p');
  if (reason === 'missable') {
    text.innerHTML = `<strong>${trophy.name}</strong> — the Chapter 1 balcony meditation vanishes after Chapter 1. Do it before the chapter ends.`;
  } else {
    text.innerHTML = `<strong>${trophy.name}</strong> — ${trophy.description} (Stage ${trophy.stage}).`;
  }
  container.append(text);
  const button = el('button', 'nextup-show', 'Show it');
  button.type = 'button';
  button.addEventListener('click', () => onShow(trophy.id));
  container.append(button);
}

export function renderKindChips(container, activeKind, onChange) {
  container.replaceChildren();
  for (const [kind, label] of Object.entries(KIND_LABELS)) {
    const button = el('button', 'chip', label);
    button.type = 'button';
    button.setAttribute('aria-pressed', String(kind === activeKind));
    button.addEventListener('click', () => onChange(kind));
    container.append(button);
  }
}

export function renderChecklistRows(container, opts) {
  const { list, all, stages, earned, selectedId, spoilerOn, counters, onSelect, onToggle } = opts;
  container.replaceChildren();
  const sorted = [...list].sort((a, b) => a.stage - b.stage || a.id - b.id);
  let currentStage = null;
  for (const trophy of sorted) {
    if (trophy.stage !== currentStage) {
      currentStage = trophy.stage;
      const stage = stages.find((s) => s.n === currentStage);
      const inStage = all.filter((t) => t.stage === currentStage);
      const done = inStage.filter((t) => earned.has(t.id)).length;
      const header = el('li', 'group-head');
      header.append(el('span', 'stage-num', `Stage ${currentStage}`));
      header.append(document.createTextNode(
        ` ${stage ? stage.title : ''} — ${done}/${inStage.length} earned` +
        (stage && stage.hours ? ` · ${stage.hours}` : ''),
      ));
      container.append(header);
    }
    const hidden = isStoryHidden(trophy, earned, spoilerOn);
    const li = el('li', 'trophy-row' + (earned.has(trophy.id) ? ' earned' : '') + (trophy.id === selectedId ? ' selected' : ''));
    li.dataset.trophyId = String(trophy.id);

    const box = el('input');
    box.type = 'checkbox';
    box.checked = earned.has(trophy.id);
    box.setAttribute('aria-label', `Mark ${hidden ? 'story trophy' : trophy.name} as earned`);
    box.addEventListener('click', (event) => event.stopPropagation());
    box.addEventListener('change', () => onToggle(trophy.id, box.checked));
    li.append(box);

    const body = el('div', 'trophy-body');
    body.append(el('p', 'trophy-name', hidden ? 'Hidden story trophy' : trophy.name));
    const desc = el('p', hidden ? 'trophy-hidden' : 'trophy-desc', hidden
      ? 'A story trophy — earn it in the game to reveal its name and description.'
      : trophy.description);
    body.append(desc);

    let counterTag = null;
    if (trophy.counter) {
      const value = counters[trophy.id] ?? 0;
      counterTag = tag(
        'tag counter-badge' + (value >= trophy.counter.target ? ' counter-done' : ''),
        `◷ ${formatCounterText(value, trophy.counter, true)}`,
      );
    }
    body.append(trophyTags(trophy, counterTag));
    li.append(body);
    li.addEventListener('click', () => onSelect(trophy.id));
    container.append(li);
  }
  $('listEmpty').hidden = list.length > 0;
  $('listCount').textContent = `${list.length} of 55 trophies`;
}

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
  const root = el('div');
  root.append(el('h2', null, trophy.name));
  root.append(trophyTags(trophy));

  root.append(renderSourcesBox(trophy.sources ?? []));

  if (trophy.counter) {
    root.append(renderCounterWidget(trophy, counters[trophy.id] ?? 0, earned.has(trophy.id), onCounterChange, onToggle));
  }

  root.append(el('p', 'official-label', 'Official description (PlayStation)'));
  root.append(el('p', 'official', `“${trophy.description}”`));

  if (trophy.missable) {
    root.append(el('p', 'warn', 'Possibly missable — unconfirmed: the Chapter 1 balcony meditation disappears after Chapter 1, and nobody has confirmed whether the trophy needs it. PowerPyx, GTABase, KeenGamer and OutputLag flag it as possibly missable; Push Square lists no known missables. Do it to be safe — it takes a minute.'));
  }
  if (trophy.verified === false) {
    root.append(el('p', 'warn', 'Unverified: no guide has pinned down this trophy yet. The note below says what is known — and what is not.'));
  }

  root.append(el('h3', null, 'How to get it'));
  const guide = el('p', 'guide-text', trophy.guide);
  if (trophy.guideCites && trophy.guideCites.length > 0) {
    guide.append(document.createTextNode(' '));
    guide.append(citeSuperscripts(trophy.guideCites));
    guide.append(document.createTextNode(' '));
    guide.append(sourceNameChips(trophy.sources ?? [], trophy.guideCites));
  }
  root.append(guide);

  if (trophy.steps && trophy.steps.length > 0) {
    root.append(el('h3', null, 'Steps'));
    const steps = el('ol');
    for (const step of trophy.steps) {
      const item = el('li');
      const text = typeof step === 'string' ? step : step.text;
      const cites = typeof step === 'string' ? [] : (step.cites ?? []);
      item.textContent = text;
      if (cites.length > 0) {
        item.append(document.createTextNode(' '));
        item.append(citeSuperscripts(cites));
        item.append(document.createTextNode(' '));
        item.append(sourceNameChips(trophy.sources ?? [], cites));
      }
      steps.append(item);
    }
    root.append(steps);
  }

  container.replaceChildren(root);
}

function renderCounterWidget(trophy, value, isEarned, onCounterChange, onToggle) {
  const counter = trophy.counter;
  const box = el('div', 'counter-widget');
  box.append(el('p', 'counter-label', 'Your progress'));
  const row = el('div', 'counter-row');
  const minus = el('button', 'counter-btn', '−');
  minus.type = 'button';
  minus.setAttribute('aria-label', `One fewer ${counter.label}`);
  minus.disabled = value <= 0;
  minus.addEventListener('click', () => onCounterChange(trophy.id, Math.max(0, value - counter.step)));
  row.append(minus);
  row.append(el('span', 'counter-value', `${formatCounterText(value, counter, false)} ${counter.label}`));
  const plus = el('button', 'counter-btn', '+');
  plus.type = 'button';
  plus.setAttribute('aria-label', `One more ${counter.label}`);
  plus.disabled = value >= counter.target;
  plus.addEventListener('click', () => onCounterChange(trophy.id, Math.min(counter.target, value + counter.step)));
  row.append(plus);
  box.append(row);
  const hint = el('p', 'counter-hint');
  if (value >= counter.target) {
    hint.textContent = 'Target reached. ';
    const mark = el('button', 'counter-mark', isEarned ? 'Already marked earned ✓' : 'Mark this trophy earned');
    mark.type = 'button';
    mark.disabled = isEarned;
    mark.addEventListener('click', () => onToggle(trophy.id, true));
    hint.append(mark);
  } else {
    hint.textContent = `Tap + each time you finish one — it saves in your browser and shows on the checklist row.`;
  }
  box.append(hint);
  return box;
}
