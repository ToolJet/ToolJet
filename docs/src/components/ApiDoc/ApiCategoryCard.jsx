import React from 'react';
import './ApiDoc.css';

export default function ApiCategoryCard({ title, description, href, endpointCount }) {
  return (
    <a href={href} className="api-category-card">
      <p className="api-category-card__title">{title}</p>
      <p className="api-category-card__description">{description}</p>
      <div className="api-category-card__meta">
        {endpointCount != null && (
          <span className="api-category-card__count">{endpointCount} endpoints</span>
        )}
        <span className="api-category-card__arrow">→</span>
      </div>
    </a>
  );
}
