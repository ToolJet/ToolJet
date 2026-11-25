import React from 'react';
import Link from '@docusaurus/Link';
import useVersionedHref from '../DocBlocks/useVersionedHref';

/** A version-aware link (see useVersionedHref) that can be used inside lists and table cells. */
export default function VLink({ href, className, children, ...rest }) {
  const to = useVersionedHref(href);
  return (
    <Link to={to} className={className} {...rest}>
      {children}
    </Link>
  );
}
