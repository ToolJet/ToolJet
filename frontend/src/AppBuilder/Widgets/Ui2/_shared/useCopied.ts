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

export const useCopied = (): [boolean, () => void] => {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return undefined;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);
  return [copied, () => setCopied(true)];
};
