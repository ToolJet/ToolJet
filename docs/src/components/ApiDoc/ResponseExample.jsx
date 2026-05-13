import React from 'react';
import './ApiDoc.css';

export default function ResponseExample({ statusCode, body }) {
  return (
    <details className="api-response-example">
      <summary>
        Response{statusCode ? ` — ${statusCode}` : ''}
      </summary>
      <pre style={{ marginTop: '8px' }}>
        <code>{typeof body === 'string' ? body : JSON.stringify(body, null, 2)}</code>
      </pre>
    </details>
  );
}
