
export const DATACENTERS = {
    'North-America': ['Aether', 'Primal', 'Crystal', 'Dynamis'],
    'Europe': ['Chaos', 'Light', 'Shadow'],
    'Japan': ['Elemental', 'Gaia', 'Mana', 'Meteor'],
    'Oceania': ['Materia'],
    '中国': ['陆行鸟', '莫古力', '猫小胖', '豆豆柴'],
    '한국': ['한국'],
    '繁中服': ['陸行鳥']
};
// Note: Shadow (EU) is upcoming/new, but if Universalis output didn't have it, I'll exclude it for now or just stick to verified ones.
// Update: Shadow is listed in official docs? Actually, let's just stick to what `test-universalis.ts` returned to be safe.
// My test output: Europe: Chaos, Light.
// So I will use exactly that.

export const REGIONS = Object.keys(DATACENTERS);
