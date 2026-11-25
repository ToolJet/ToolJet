import React from 'react';
import Card, { CardFeatures, CardIcon } from './Card';

/** Option card: a coloured pill label (with an optional icon tile beside it), title, description and a bullet list. */
export default function ConfigCard({ icon, title, description, href, label, labelColor, labelBg, features }) {
  // Only set the custom properties that were passed, so the stylesheet's
  // default pill colours apply otherwise.
  const labelStyle = {
    ...(labelBg && { '--docblk-label-bg': labelBg }),
    ...(labelColor && { '--docblk-label-color': labelColor }),
  };

  return (
    <Card href={href} className="docblk-config">
      <div>
        {icon ? (
          <div className="docblk-config__top">
            <CardIcon>{icon}</CardIcon>
            {label && (
              <span className="docblk-config__label" style={labelStyle}>
                {label}
              </span>
            )}
          </div>
        ) : (
          label && (
            <span className="docblk-config__label" style={labelStyle}>
              {label}
            </span>
          )
        )}
        <div className="docblk-config__title">{title}</div>
        <div className="docblk-config__description">{description}</div>
      </div>
      <CardFeatures items={features} />
    </Card>
  );
}
