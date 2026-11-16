import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useVersionedHref from './useVersionedHref';
import './DocBlocks.css';

/**
 * Frame shared by every card in the kit. With `href` the whole card is one
 * version-aware link; without it the card is a static box with no hover.
 */
export default function Card({ href, className, children }) {
  const to = useVersionedHref(href);

  if (!href) {
    return <div className={clsx('docblk-card', className)}>{children}</div>;
  }
  return (
    <Link to={to} className={clsx('docblk-card', 'docblk-card--link', className)}>
      {children}
    </Link>
  );
}

/** Icon slot: an emoji string or a React node, hidden from assistive tech. */
export function CardIcon({ children }) {
  if (!children) return null;
  return (
    <span className="docblk-card__icon" aria-hidden="true">
      {children}
    </span>
  );
}

/** Bullet list used by ConfigCard and CapabilityCard. */
export function CardFeatures({ items }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <ul className="docblk-card__features">
      {items.map((item, index) => (
        <li key={index} className="docblk-card__feature">
          {item}
        </li>
      ))}
    </ul>
  );
}
