import React, { forwardRef, useCallback, useLayoutEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';

const TruncatingText = forwardRef(function TruncatingText(
  { text, children, className, title: titleOverride, ...props },
  ref
) {
  const [node, setNode] = useState(null);
  const [autoTitle, setAutoTitle] = useState(undefined);
  const content = text ?? children;
  const stringContent = typeof content === 'string' ? content : null;

  const setRefs = useCallback(
    (el) => {
      setNode(el);
      if (typeof ref === 'function') ref(el);
      else if (ref) ref.current = el;
    },
    [ref]
  );

  useLayoutEffect(() => {
    if (!node) return undefined;

    const measure = () => {
      const overflowed = node.scrollWidth - node.clientWidth > 0.5;
      setAutoTitle(overflowed && stringContent ? stringContent : undefined);
    };

    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(node);

    const mutationObserver = new MutationObserver(measure);
    mutationObserver.observe(node, {
      childList: true,
      characterData: true,
      subtree: true,
    });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [node, stringContent]);

  return (
    <span ref={setRefs} title={titleOverride ?? autoTitle} className={cn('tw-block tw-truncate', className)} {...props}>
      {content}
    </span>
  );
});

TruncatingText.displayName = 'TruncatingText';

TruncatingText.propTypes = {
  text: PropTypes.node,
  children: PropTypes.node,
  className: PropTypes.string,
  title: PropTypes.string,
};

export { TruncatingText };
