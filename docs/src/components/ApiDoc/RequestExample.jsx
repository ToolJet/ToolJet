import React, { useState } from 'react';
import './ApiDoc.css';

export default function RequestExample({ code }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="api-request-example">
      <div className="api-request-example__header">
        <span className="api-request-example__label">Request</span>
        <button
          className={`api-copy-btn${copied ? ' api-copy-btn--copied' : ''}`}
          onClick={handleCopy}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre style={{ margin: 0 }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}
