import React from 'react';
import clsx from 'clsx';
import './DocBlocks.css';

const TONES = ['violet', 'blue'];

/**
 * Gradient banner that opens a landing page. `title` is the page's <h1>, so
 * the page needs `hide_title: true` in its front matter.
 */
export default function DocHero({ eyebrow, title, description, chips, tone = 'violet', children }) {
  const toneName = TONES.includes(tone) ? tone : TONES[0];

  return (
    <div className={clsx('docblk-hero', `docblk-hero--${toneName}`)}>
      {eyebrow && <div className="docblk-hero__eyebrow">{eyebrow}</div>}
      <h1 className="docblk-hero__title">{title}</h1>
      {description && <p className="docblk-hero__description">{description}</p>}
      {Array.isArray(chips) && chips.length > 0 && (
        <ul className="docblk-hero__chips">
          {chips.map((chip) => (
            <li key={chip} className="docblk-hero__chip">
              {chip}
            </li>
          ))}
        </ul>
      )}
      {children && <div className="docblk-hero__body">{children}</div>}
    </div>
  );
}
