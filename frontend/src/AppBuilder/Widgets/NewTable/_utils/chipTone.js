// The tone of a status chip (a string column's "Show as status chip"), read from the value's words: a state such as
// "Paid", "Overdue" or "In progress", or a priority such as "High". Tones are the .tj-chip variants in shadcnLook.scss,
// which take their colours from the app theme. Danger is checked first, so "Out of stock" is never read as "In stock".
const TONES = [
  [
    'danger',
    /\b(overdue|out of stock|failed|failure|error|cancell?ed|rejected|declined|blocked|expired|lost|critical|urgent|high|severe|breach(ed)?|late|delayed|churned|suspended|terminated|refunded|disputed|offline|down|absent|no show|missed|out of service)\b/,
  ],
  [
    'warning',
    /\b(pending|unpaid|due|reorder|low stock|waiting|awaiting|review|on hold|hold|draft|medium|at risk|risk|partial|partially paid|tentative|requested|needs attention|needs [a-z]+|follow up|warning|maintenance|occupied|busy|trial|missing|incomplete|in repair|repair|in workshop|workshop)\b/,
  ],
  [
    'success',
    /\b(paid|active|done|complete|completed|resolved|approved|confirmed|in stock|won|healthy|available|delivered|shipped|success|successful|passed|live|online|published|ready|accepted|vacant|clean|fulfilled|on track|closed won|signed|settled|given|attached|received|present|in service|returned)\b/,
  ],
  [
    'info',
    // "New" is a state, not the start of a place: New York and New Zealand chips were tinted blue (a people directory,
    // 2026-10-14).
    /\b(new(?! (york|zealand|delhi|jersey|mexico|hampshire|south wales|orleans|brunswick|haven|england|caledonia|guinea|westminster))|open|in progress|scheduled|booked|sent|assigned|processing|planned|upcoming|started|qualified|contacted|proposal|negotiation|checked in|in transit|on the way|en route|dispatched|on site|checked out|on loan|in use)\b/,
  ],
];

export const chipTone = (value) => {
  if (typeof value !== 'string') return 'neutral';
  const text = value.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return 'neutral';
  // "Not started" is not "started"; "Not paid" or "Not delivered" still needs attention.
  if (/^not\b/.test(text)) return TONES[2][1].test(text.slice(3)) ? 'warning' : 'neutral';
  // Work under way, as In progress is: "In review" was amber in a claims list beside the same state in blue in the table
  // next to it (2026-10-14). "Needs review" and a bare "Review" still need attention.
  if (/^(in|under) review$/.test(text)) return 'info';
  for (const [tone, words] of TONES) if (words.test(text)) return tone;
  return 'neutral';
};

// The text of a status chip: a value stored all in lowercase ("completed", "in_progress") reads as a label in sentence
// case ("Completed", "In progress"); a value with any capital letter, or one that starts with a digit, is shown exactly as
// written.
export const chipLabel = (value) => {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (!/^[a-z][a-z0-9 _-]*$/.test(text)) return text;
  const words = text.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};
