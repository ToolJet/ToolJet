// The tone a status word reads as ('Paid' success, 'Overdue' danger, 'In review' info), 'neutral' for none. The same
// word lists as the Ant and shadcn packs (lib/ui2/display/lists/model.ts there), so a status column colours alike in
// every pack when the app sets no colours of its own.
const TONES: [string, RegExp][] = [
  [
    'danger',
    /\b(overdue|out of stock|failed|failure|error|cancell?ed|rejected|declined|blocked|expired|lost|critical|urgent|high|severe|breach(ed)?|late|delayed|churned|suspended|terminated|refunded|disputed|offline|down|absent|no show|missed|out of service|churn|out of range|alerts?|alarms?|fail|lapsed|detractors?|full(?! time)|sold out)\b/,
  ],
  [
    'warning',
    /\b(pending|unpaid|due|due soon|expiring|expiring soon|waitlist|waitlisted|contraction|downgrade|reorder|low stock|waiting|awaiting|review|on hold|hold|draft|medium|at risk|risk|partial|partially paid|tentative|requested|needs attention|needs [a-z]+|follow up|warning|watch|watching|few spots|few left|passives?|almost full|nearly full|maintenance|busy|trial|missing|incomplete|in repair|repair|in workshop|workshop)\b/,
  ],
  [
    'success',
    /\b(paid|active|done|complete|completed|resolved|approved|confirmed|in stock|won|healthy|available|delivered|shipped|success|successful|passed|live|online|published|ready|accepted|vacant|clean|fulfilled|on track|closed won|signed|settled|given|attached|received|present|in service|on the road|on road|on duty|on shift|in operation|operational|operating|running|deployed|en route|on route|returned|verified|validated|cleared|expansion|upgrade|in range|within range|pass|renewed|promoters?)\b/,
  ],
  [
    'info',
    /\b(new(?! (york|zealand|delhi|jersey|mexico|hampshire|south wales|orleans|brunswick|haven|england|caledonia|guinea|westminster))|open|in progress|scheduled|booked|sent|assigned|processing|planned|upcoming|started|qualified|contacted|proposal|negotiation|checked in|in transit|on the way|en route|dispatched|on site|checked out|on loan|in use|occupied|reserved|held|flying|in flight|airborne|quoted|committed|in testing|testing|in qa|on call|on duty|out for delivery|picked up)\b/,
  ],
];

/** The tone a chip takes from its value's words ('Paid' success, 'Overdue' danger), 'neutral' for none. */
export const chipTone = (value: unknown): string => {
  if (typeof value !== 'string') return 'neutral';
  const t = value.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!t) return 'neutral';
  if (/^not\b/.test(t)) return TONES[2][1].test(t.slice(3)) ? 'warning' : 'neutral';
  if (/^(in|under) review$/.test(t)) return 'info';
  if (/^(out|on hire|hired out|lent out)$/.test(t)) return 'info';
  for (const [tone, words] of TONES) if (words.test(t)) return tone;
  return 'neutral';
};
