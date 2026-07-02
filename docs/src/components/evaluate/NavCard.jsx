import React from 'react';
import './evaluate.css';

export function NavCard({ label, icon, title, description, href }) {
  return (
    <a className="eval-nav-card" href={href}>
      <div className="eval-nav-card-top">
        {icon && <span className="eval-nav-card-icon">{icon}</span>}
        {label && <span className="eval-nav-card-label">{label}</span>}
      </div>
      <div className="eval-nav-card-title">{title}</div>
      {description && <div className="eval-nav-card-desc">{description}</div>}
    </a>
  );
}

export function NavCardGrid({ children, cols }) {
  const style = cols ? { gridTemplateColumns: `repeat(${cols}, 1fr)` } : undefined;
  return <div className="eval-nav-grid" style={style}>{children}</div>;
}
