import React from 'react';

const STEPS = [
  {
    num: 1,
    title: 'Enable the API',
    desc: (
      <>
        Add these two variables to your <code>.env</code> file and restart the server.
      </>
    ),
    content: (
      <table className="api-step-table">
        <tbody>
          <tr>
            <td><code>ENABLE_EXTERNAL_API</code></td>
            <td>Set to <code>true</code></td>
          </tr>
          <tr>
            <td><code>EXTERNAL_API_ACCESS_TOKEN</code></td>
            <td>Your access token</td>
          </tr>
        </tbody>
      </table>
    ),
  },
  {
    num: 2,
    title: 'Generate a Token',
    desc: 'Run this command to create a cryptographically secure 64-character token.',
    content: (
      <pre className="api-step-code"><code>openssl rand -base64 48</code></pre>
    ),
  },
  {
    num: 3,
    title: 'Authenticate',
    desc: (
      <>
        Pass the token in the <code>Authorization</code> header on every request.
      </>
    ),
    content: (
      <pre className="api-step-code"><code>{'Authorization: Basic <access_token>'}</code></pre>
    ),
  },
];

export default function ApiSetupSteps() {
  return (
    <div className="api-setup-steps">
      {STEPS.map((step) => (
        <div key={step.num} className="api-setup-step">
          <div className="api-setup-step__num">{step.num}</div>
          <p className="api-setup-step__title">{step.title}</p>
          <p className="api-setup-step__desc">{step.desc}</p>
          <div className="api-setup-step__content">{step.content}</div>
        </div>
      ))}
    </div>
  );
}
