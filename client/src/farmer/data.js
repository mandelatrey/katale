export const CROPS = [
  { id: 'maize',    abbr: 'Mz', label: 'Maize' },
  { id: 'beans',    abbr: 'Bn', label: 'Beans' },
  { id: 'coffee',   abbr: 'Cf', label: 'Coffee' },
  { id: 'matooke',  abbr: 'Mt', label: 'Matooke' },
  { id: 'rice',     abbr: 'Rc', label: 'Rice' },
  { id: 'cassava',  abbr: 'Cs', label: 'Cassava' },
  { id: 'gnuts',    abbr: 'Gn', label: 'G.nuts' },
  { id: 'sorghum',  abbr: 'Sg', label: 'Sorghum' },
];

export const MOCK_FARMERS = [
  { id: 'nj', initials: 'NJ', name: 'Namuli Joyce',   district: 'Mbale',   village: 'Bufumbo',       kg: 1200, grade: 'A', kmAway: 12,  crops: ['maize', 'beans'] },
  { id: 'op', initials: 'OP', name: 'Okello Peter',   district: 'Soroti',  village: 'Gweri',         kg: 840,  grade: 'B', kmAway: 45,  crops: ['maize', 'beans'] },
  { id: 'ar', initials: 'AR', name: 'Achan Ruth',     district: 'Gulu',    village: 'Awach',         kg: 2100, grade: 'A', kmAway: 78,  crops: ['maize'] },
  { id: 'sk', initials: 'SK', name: 'Ssebunya Kato',  district: 'Iganga',  village: 'Nakigo',        kg: 560,  grade: 'A', kmAway: 23,  crops: ['beans'] },
  { id: 'nb', initials: 'NB', name: 'Nakato Betty',   district: 'Masaka',  village: 'Kyanamukaaka',  kg: 1450, grade: 'B', kmAway: 102, crops: ['maize', 'beans'] },
];

export const DEFAULT_PRODUCER_SETTINGS = {
  stock: true,
  timelines: true,
  quality: false,
  availability: false,
};
