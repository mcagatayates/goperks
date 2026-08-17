// Minimal English-country-name -> Turkish invoice label map, extend as needed.
const COUNTRY_TR_NAMES = {
  'United States': 'A.B.D.',
  'United States of America': 'A.B.D.',
  'United Kingdom': 'İngiltere',
  Canada: 'Kanada',
  Germany: 'Almanya',
  France: 'Fransa',
  Netherlands: 'Hollanda',
  Australia: 'Avustralya',
  Ireland: 'İrlanda',
};

function toTurkishCountryName(englishName) {
  if (!englishName) return null;
  return COUNTRY_TR_NAMES[englishName.trim()] || englishName.trim();
}

module.exports = { toTurkishCountryName };
