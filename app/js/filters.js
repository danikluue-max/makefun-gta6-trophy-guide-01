// Checklist filtering and spoiler masking for the Leonida Trophy Guide.
// Pure functions: given the trophy list and the reader's state, decide what
// shows, in what order, and what stays hidden behind spoiler mode.

// kindGroup: the filter chip a trophy belongs to. Platinum, 100% completion
// and the lone combat trophy group under "misc"; missable is a cross-cutting
// flag, not a kind.
export function kindGroup(trophy) {
  switch (trophy.kind) {
    case 'story': return 'story';
    case 'collectibles': return 'collectibles';
    case 'activities': return 'activities';
    case 'robbery': return 'robbery';
    case 'sidequest': return 'sidequest';
    case 'money': return 'money';
    default: return 'misc';
  }
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

// isStoryHidden: a story trophy stays masked while spoiler mode is on and
// the reader has not earned it yet.
export function isStoryHidden(trophy, earned, spoilerOn) {
  return spoilerOn && trophy.story && !earned.has(trophy.id);
}

// applyChecklistFilters: search text + kind chip + grade + hide-earned +
// roadmap stage, in checklist order (official id order).
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
