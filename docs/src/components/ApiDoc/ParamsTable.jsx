import React from 'react';
import './ApiDoc.css';

export default function ParamsTable({ title, params }) {
  if (!params || params.length === 0) return null;
  return (
    <div className="api-params-section">
      {title && <h4>{title}</h4>}
      <table className="api-params-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Required</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p, i) => (
            <tr key={i}>
              <td>
                <span className="api-param__name">{p.name}</span>
                {p.required && <span className="api-param__required">*</span>}
              </td>
              <td>
                {p.type && <span className="api-param__type">{p.type}</span>}
              </td>
              <td>{p.required ? 'Yes' : 'No'}</td>
              <td>{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
