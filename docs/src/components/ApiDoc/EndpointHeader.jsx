import React from 'react';
import MethodBadge from './MethodBadge';
import './ApiDoc.css';

export default function EndpointHeader({ method, path }) {
  return (
    <div className="api-endpoint-header">
      <MethodBadge method={method} />
      <span className="api-endpoint-header__path">{path}</span>
    </div>
  );
}
