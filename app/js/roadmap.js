import { el } from './render.js';

export function renderPlatinumRoadmap(container, roadmap) {
  const root = el('div');
  root.append(el('h2', null, roadmap.title));
  root.append(el('p', null, `Difficulty ${roadmap.difficulty} · ${roadmap.hours} · ${roadmap.playthroughs} playthrough · ${roadmap.online}.`));
  for (const stage of roadmap.stages) {
    const stageHeading = el('h3');
    stageHeading.append(el('span', 'stage-num', `Stage ${stage.n}`));
    stageHeading.append(document.createTextNode(stage.title));
    root.append(stageHeading);
    root.append(el('p', 'stage-meta', `${stage.hours} · ${stage.trophyCount} trophies`));
    root.append(el('p', null, stage.text));
    const list = el('ul');
    for (const bullet of stage.bullets) {
      list.append(el('li', null, bullet));
    }
    root.append(list);
  }
  root.append(el('h3', null, 'What 100% completion needs'));
  const checklist = el('ul');
  for (const itemText of roadmap.checklist100) {
    checklist.append(el('li', null, itemText));
  }
  root.append(checklist);
  const sources = el('p', null, 'Roadmap sources: ');
  for (const [index, source] of roadmap.checklistSources.entries()) {
    if (index > 0) sources.append(document.createTextNode(' · '));
    const link = el('a');
    link.href = source.url;
    link.textContent = `${source.name} (${source.date})`;
    link.target = '_blank';
    link.rel = 'noopener';
    sources.append(link);
  }
  root.append(sources);
  container.replaceChildren(root);
}

export function renderMissableWatchlist(container, trophies, roadmap) {
  const missable = trophies.filter((t) => t.missable);
  const root = el('div');
  root.append(el('h2', null, 'Missable watch list'));
  const count = el('p');
  count.innerHTML = `<span class="missable-flag">${missable.length} possibly missable</span> — and unconfirmed. Everything else can be done after the story.`;
  root.append(count);
  for (const trophy of missable) {
    const name = el('p');
    name.innerHTML = `<strong>${trophy.name}</strong> — ${trophy.description}`;
    root.append(name);
    root.append(el('p', null, 'Chapter 1, after the mission Down to Earth: talk to Lucia in the kitchen in the morning, follow her to the balcony and choose “Accept”. After Chapter 1 the spot is gone for good.'));
  }
  root.append(el('p', 'missable-note', roadmap?.missableNote ??
    'Possibly missable, not confirmed: the Chapter 1 balcony meditation disappears after Chapter 1, and nobody has confirmed whether the trophy needs it.'));
  container.replaceChildren(root);
}

export function renderKeyFacts(container, roadmap) {
  const root = el('div');
  root.append(el('h2', null, 'Before you start'));
  const list = el('ul');
  for (const fact of roadmap.facts) {
    list.append(el('li', null, fact));
  }
  root.append(list);
  container.replaceChildren(root);
}
