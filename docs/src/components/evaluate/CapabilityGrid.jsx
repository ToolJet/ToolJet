import React from 'react';
import './evaluate.css';

export function CapabilityCard({ icon, title, description }) {
  return (
    <div className="eval-cap-card">
      <span className="eval-cap-icon">{icon}</span>
      <div>
        <div className="eval-cap-title">{title}</div>
        <div className="eval-cap-desc">{description}</div>
      </div>
    </div>
  );
}

export function CapabilityGrid({ items, cols }) {
  const style = cols ? { gridTemplateColumns: `repeat(${cols}, 1fr)` } : undefined;
  return (
    <div className="eval-cap-grid" style={style}>
      {items.map(({ icon, title, description }, i) => (
        <CapabilityCard key={i} icon={icon} title={title} description={description} />
      ))}
    </div>
  );
}
