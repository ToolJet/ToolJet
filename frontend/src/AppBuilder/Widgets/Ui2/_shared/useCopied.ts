// ToolJet UI 2.0: a copy button's copy, and its "Copied" state, shown for 1.5s after a copy.
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

/** Copies text, then marks it copied; a missing or refused clipboard (thrown or rejected) says so in a toast. Copied
 *  shows only once the clipboard took the text (the Key-value list showed it for every press). */
export const copyText = async (text: string, markCopied: () => void, failure: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
    markCopied();
  } catch {
    toast.error(failure);
  }
};

/** Whether `text` shows as copied, and the mark for a copy of it. The mark belongs to the text it was made for: a copy
 *  of an old value that finished after the value changed showed the check against the new one. Each copy starts the
 *  1.5s again (a second copy within it went off early). */
export const useCopied = (text: string): [boolean, () => void] => {
  // A new object for each copy, so the timer restarts even when the same text is copied again.
  const [mark, setMark] = useState<{ text: string } | null>(null);
  useEffect(() => {
    if (!mark) return undefined;
    const t = setTimeout(() => setMark(null), 1500);
    return () => clearTimeout(t);
  }, [mark]);
  return [mark !== null && mark.text === text, () => setMark({ text })];
};
