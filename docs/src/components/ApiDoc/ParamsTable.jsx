import React from 'react';
import './ApiDoc.css';

export default function ParamsTable({ title, params }) {
  if (!params || params.length === 0) return null;
  return (
    <div className="api-params-section">
      {title && <div className="api-params-title">{title}</div>}
      <div className="api-params-list">
        {params.map((p, i) => (
          <div key={i} className="api-param-row">
            <div className="api-param-row__meta">
              <span className="api-param__name">{p.name}</span>
              {p.type && <span className="api-param__type">{p.type}</span>}
              {p.required
                ? <span className="api-param__badge api-param__badge--required">required</span>
                : <span className="api-param__badge api-param__badge--optional">optional</span>
              }
            </div>
            {p.description && (
              <div className="api-param-row__desc">{p.description}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
