import { useEffect, useRef, useState } from 'react';

/** The board's state kept by card key: the selected card, the card whose details show and the expanded cards. Under
 *  a new id field a card key can name another record (Alpha's id is Beta's code), so all three start over rather than
 *  move to that record. */
export const useCardKeys = (idField: string) => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  // The card whose details show (a details field is mapped): a click opens a card's details, a second click closes them.
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set());
  const toggleExpanded = (key: string) =>
    setExpandedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const keyedBy = useRef(idField);
  useEffect(() => {
    if (keyedBy.current === idField) return;
    keyedBy.current = idField;
    setSelectedKey(null);
    setOpenKey(null);
    setExpandedKeys(new Set());
  }, [idField]);
  return { selectedKey, setSelectedKey, openKey, setOpenKey, expandedKeys, toggleExpanded };
};
