// Lists translation keys that exist in one language but not the other.
// Usage: npm run check-i18n
import { TRANSLATIONS } from '../src/lib/i18n';

const deKeys = Object.keys(TRANSLATIONS.de).sort();
const enKeys = Object.keys(TRANSLATIONS.en).sort();

const missingInEn = deKeys.filter(k => !enKeys.includes(k));
const missingInDe = enKeys.filter(k => !deKeys.includes(k));

console.log('Missing in EN:', missingInEn);
console.log('Missing in DE:', missingInDe);
