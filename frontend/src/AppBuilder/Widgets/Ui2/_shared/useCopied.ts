// ToolJet UI 2.0: a copy button's "Copied" state, shown for 1.5s after a copy.
import { useEffect, useState } from 'react';

export const useCopied = (): [boolean, () => void] => {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return undefined;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);
  return [copied, () => setCopied(true)];
};
