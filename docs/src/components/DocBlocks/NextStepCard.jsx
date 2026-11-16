import React from 'react';
import Card from './Card';

/** Compact "where to go next" card with a "Learn more" cue. */
export default function NextStepCard({ title, description, href }) {
  return (
    <Card href={href} className="docblk-next-step">
      <div className="docblk-next-step__title">{title}</div>
      <div className="docblk-next-step__description">{description}</div>
      {href && (
        <span className="docblk-next-step__cta">
          Learn more <span aria-hidden="true">→</span>
        </span>
      )}
    </Card>
  );
}
