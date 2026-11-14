import React, { useLayoutEffect, useRef, useState } from 'react';
import { Library, type LucideIcon } from 'lucide-react';
import { ToolTip } from '@/_components/ToolTip';
import './styles.scss';

import type { PackIdentity } from './packIdentity';

// The Inspector's label tooltip (Inspector/Elements/Components/ToolTip): same bubble, side and timing.
const TOOLTIP_DELAY = { show: 250, hide: 400 };

/** Whether a name is cut off with an ellipsis, rechecked when its box resizes. */
const useIsCutOff = (text: string) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [cutOff, setCutOff] = useState(false);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const check = () => setCutOff(element.scrollWidth > element.clientWidth);
    check();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(check);
    observer.observe(element);
    return () => observer.disconnect();
  }, [text]);
  return [ref, cutOff] as const;
};

/** A name that shows in full in the Inspector tooltip while it is cut off. */
const Name = ({ text, className }: { text: string; className: string }) => {
  const [ref, cutOff] = useIsCutOff(text);
  // The trigger, not ToolTip's show, switches the tooltip: show={false} renders the span without the
  // OverlayTrigger around it, so toggling it remounts the span and leaves the resize check on a detached node.
  return (
    <ToolTip message={text} placement="left" delay={TOOLTIP_DELAY} trigger={cutOff ? ['hover', 'focus'] : []}>
      <span ref={ref} className={className}>
        {text}
      </span>
    </ToolTip>
  );
};

/**
 * The line a component's Properties tab opens with: where it comes from and what it is (design option D), for pack
 * components, native widgets and module instances. Every library shares the Library icon, since the packs ship none
 * of their own; modules pass their own (Blocks). How the two names share the width is pure CSS (styles.scss): the
 * library name's data-name also sizes it, through attr(data-name).
 */
export const PackIdentityStrip = ({
  library,
  component,
  icon: Icon = Library,
}: PackIdentity & { icon?: LucideIcon }) => (
  <div className="pack-identity-strip" aria-label={`${component} from ${library}`} data-cy="pack-identity-strip">
    <span className="pack-identity-strip-library">
      <Icon className="pack-identity-strip-icon" size={14} aria-hidden="true" />
      <span className="pack-identity-strip-library-name" data-name={library}>
        <Name text={library} className="pack-identity-strip-text" />
      </span>
    </span>
    <span className="pack-identity-strip-dot" aria-hidden="true">
      ·
    </span>
    <Name text={component} className="pack-identity-strip-component pack-identity-strip-text" />
  </div>
);
