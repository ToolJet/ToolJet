import React from 'react';
import './ApiDoc.css';

export default function MethodBadge({ method }) {
  const m = (method || '').toUpperCase();
  return (
    <span className={`api-method-badge api-method-badge--${m.toLowerCase()}`}>
      {m}
    </span>
  );
}
