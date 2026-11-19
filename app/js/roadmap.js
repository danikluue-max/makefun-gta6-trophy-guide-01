// The platinum roadmap, the missable watch list and the key facts — the
// rail beside the checklist. Content comes from app/data/roadmap.json and
// app/data/trophies.json; this file only turns it into HTML.

// renderPlatinumRoadmap: the three stages, with hours and trophy counts.
export function renderPlatinumRoadmap(container, roadmap) {
  const el = document.createElement('div');
  const heading = document.createElement('h2');
  heading.textContent = roadmap.title;
  el.append(heading);
  const intro = document.createElement('p');
  intro.textContent =
    `Difficulty ${roadmap.difficulty} · ${roadmap.hours} · ${roadmap.playthroughs} playthrough · ` +
    `${roadmap.online}.`;
  el.append(intro);
  for (const stage of roadmap.stages) {
    const stageHeading = document.createElement('h3');
    const num = document.createElement('span');
    num.className = 'stage-num';
    num.textContent = `Stage ${stage.n}`;
    stageHeading.append(num);
    stageHeading.append(document.createTextNode(stage.title));
    el.append(stageHeading);
    const meta = document.createElement('p');
    meta.className = 'stage-meta';
    meta.textContent = `${stage.hours} · ${stage.trophyCount} trophies`;
    el.append(meta);
    const text = document.createElement('p');
    text.textContent = stage.text;
    el.append(text);
    const list = document.createElement('ul');
    for (const bullet of stage.bullets) {
      const item = document.createElement('li');
      item.textContent = bullet;
      list.append(item);
    }
    el.append(list);
  }
  const checklistHeading = document.createElement('h3');
  checklistHeading.textContent = 'What 100% completion needs';
  el.append(checklistHeading);
  const checklist = document.createElement('ul');
  for (const itemText of roadmap.checklist100) {
    const item = document.createElement('li');
    item.textContent = itemText;
    checklist.append(item);
  }
  el.append(checklist);
  const sources = document.createElement('p');
  sources.textContent = 'Roadmap sources: ';
  for (const [index, source] of roadmap.checklistSources.entries()) {
    if (index > 0) sources.append(document.createTextNode(' · '));
    const link = document.createElement('a');
    link.href = source.url;
    link.textContent = `${source.name} (${source.date})`;
    link.target = '_blank';
    link.rel = 'noopener';
    sources.append(link);
  }
  el.append(sources);
  container.replaceChildren(el);
}

// renderMissableWatchlist: every missable trophy, with its one-line warning.
// The missable question is genuinely unsettled: PowerPyx, GTABase,
// KeenGamer and OutputLag flag Positive Mental Attitude as possibly
// missable, Push Square lists no known missables, and nothing is confirmed
// either way — the panel says so instead of picking a side.
export function renderMissableWatchlist(container, trophies, roadmap) {
  const missable = trophies.filter((t) => t.missable);
  const el = document.createElement('div');
  const heading = document.createElement('h2');
  heading.textContent = 'Missable watch list';
  el.append(heading);
  const count = document.createElement('p');
  count.innerHTML = `<span class="missable-flag">${missable.length} possibly missable</span> — and unconfirmed. Everything else can be done after the story.`;
  el.append(count);
  for (const trophy of missable) {
    const name = document.createElement('p');
    name.innerHTML = `<strong>${trophy.name}</strong> — ${trophy.description}`;
    el.append(name);
    const warn = document.createElement('p');
    warn.textContent =
      'Chapter 1, after the mission Down to Earth: talk to Lucia in the kitchen in the morning, follow her to the balcony and choose “Accept”. After Chapter 1 the spot is gone for good.';
    el.append(warn);
  }
  const note = document.createElement('p');
  note.className = 'missable-note';
  note.textContent = roadmap?.missableNote ??
    'Possibly missable, not confirmed: the Chapter 1 balcony meditation disappears after Chapter 1, and nobody has confirmed whether the trophy needs it.';
  el.append(note);
  container.replaceChildren(el);
}

// renderKeyFacts: the facts a hunter checks before starting.
export function renderKeyFacts(container, roadmap) {
  const el = document.createElement('div');
  const heading = document.createElement('h2');
  heading.textContent = 'Before you start';
  el.append(heading);
  const list = document.createElement('ul');
  for (const fact of roadmap.facts) {
    const item = document.createElement('li');
    item.textContent = fact;
    list.append(item);
  }
  el.append(list);
  container.replaceChildren(el);
}
