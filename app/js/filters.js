const KIND_OF = {
  story: 'story',
  collectibles: 'collectibles',
  activities: 'activities',
  robbery: 'robbery',
  sidequest: 'sidequest',
  money: 'money',
};

export function kindGroup(trophy) {
  return KIND_OF[trophy.kind] ?? 'misc';
}

export const KIND_LABELS = {
  all: 'All',
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
  robbery: 'Robbery',
  sidequest: 'Side quests',
  misc: 'Misc',
  money: 'Money',
};

export function isStoryHidden(trophy, earned, spoilerOn) {
  return spoilerOn && trophy.story && !earned.has(trophy.id);
}

export function applyChecklistFilters(trophies, filters) {
  const query = (filters.query ?? '').trim().toLowerCase();
  return trophies.filter((trophy) => {
    if (filters.grade !== 'all' && trophy.grade !== filters.grade) return false;
    if (filters.stage !== 'all' && trophy.stage !== filters.stage) return false;
    if (filters.kind === 'missable') {
      if (!trophy.missable) return false;
    } else if (filters.kind !== 'all' && kindGroup(trophy) !== filters.kind) {
      return false;
    }
    if (filters.hideEarned && filters.earned.has(trophy.id)) return false;
    if (query) {
      const haystack = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}
