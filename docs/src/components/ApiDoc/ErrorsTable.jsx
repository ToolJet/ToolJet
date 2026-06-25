import React from 'react';
import './ApiDoc.css';

export default function ErrorsTable({ errors }) {
  if (!errors || errors.length === 0) return null;
  return (
    <div className="api-params-section">
      <div className="api-params-title">Error Responses</div>
      <div className="api-params-list">
        {errors.map((e, i) => (
          <div key={i} className="api-param-row">
            <div className="api-param-row__meta">
              <span className="api-error__status">{e.status}</span>
            </div>
            {e.description && (
              <div className="api-param-row__desc">{e.description}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
