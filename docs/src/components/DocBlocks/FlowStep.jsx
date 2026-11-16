import React from 'react';
import Card from './Card';

/** Numbered step tile. With `href` the whole tile is a link. */
export default function FlowStep({ number, title, description, href }) {
  return (
    <Card href={href} className="docblk-flow-step">
      <div className="docblk-flow-step__number">{number}</div>
      <div className="docblk-flow-step__title">{title}</div>
      <div className="docblk-flow-step__description">{description}</div>
    </Card>
  );
}
