import { useEffect, useRef } from 'react';

/**
 * Keeps a choice field's value to what its options offer, and gives a value it dropped back once they offer it.
 *
 * A value no option offers is dropped, as the Select drops it: it showed the placeholder but stayed exposed, so a Form or
 * a query read an option that is not on screen (QA AD-57). Dropping it for good left the field empty after the options
 * were edited to offer it, since the Value property itself did not change again: Value qa, then Tree data given a qa
 * node, still showed the placeholder and exposed "" (QA AD-57, reopened). ToolJet's own Dropdown takes its default
 * again when its options change; here the dropped value comes back when an option offers it. Anything that sets the
 * value in between (a pick, setFieldValue, a new Value) wins over it. Fires no event: the user changed nothing.
 *
 * `restrict` gives a value as the field can hold it now: the same value when the options offer it, less of it or empty
 * when they do not, and as it is while there is nothing to judge it by (options loading or empty). `optionsKey` changes
 * with the options, so a dropped value is looked at again each time they change.
 */
export const useOfferedValue = <T>(
  value: T,
  setValue: (next: T) => void,
  restrict: (v: T) => T,
  optionsKey: string
) => {
  const held = useRef<{ dropped: T; left: string } | null>(null);
  const valueKey = JSON.stringify(value) ?? '';
  useEffect(() => {
    if (held.current && held.current.left !== valueKey) held.current = null;
    const wanted = held.current ? held.current.dropped : value;
    const next = restrict(wanted);
    const nextKey = JSON.stringify(next) ?? '';
    held.current = nextKey === (JSON.stringify(wanted) ?? '') ? null : { dropped: wanted, left: nextKey };
    if (nextKey !== valueKey) setValue(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueKey, optionsKey]);
};
