import React, { useEffect, useRef, useState } from 'react';
import config from 'config';
import { OnboardingUIWrapper, OnboardingFormInsideWrapper } from '@/modules/onboarding/components';
import { FormHeader, FormTextInput, SubmitButton } from '@/modules/common/components';
import './workspaceLogin.scss';

export default function WorkspaceLogin({ context, onBack }) {
  const [workspace, setWorkspace] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  const submit = async (event) => {
    event.preventDefault();
    if (!workspace.trim()) {
      setError('Enter your workspace URL.');
      return;
    }
    setBusy(true);
    setError('');
    const controller = new AbortController();
    request.current = controller;
    try {
      const id = new URL(context.redirectTo, window.location.origin).searchParams.get('request');
      const response = await fetch(`${config.apiUrl.replace(/\/$/, '')}/mcp-oauth/interactions/${id}/workspace`, {
        method: 'POST',
        signal: controller.signal,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-tooljet-oauth-csrf': context.flow.csrfToken,
        },
        body: JSON.stringify({ workspace: workspace.trim() }),
      });
      if (!response.ok)
        throw new Error(
          'This workspace or connection link is unavailable. Check the URL or start again from your AI client.'
        );
      const result = await response.json();
      if (controller.signal.aborted) return;
      window.location.assign(result.redirectUrl);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err.message);
      setBusy(false);
    }
  };
  return (
    <div className="login-form mcp-workspace-login">
      <OnboardingUIWrapper>
        <OnboardingFormInsideWrapper>
          <FormHeader>Sign in with your workspace</FormHeader>
          <p className="signup-info">Continue to the sign-in methods configured for your workspace.</p>
          <form onSubmit={submit} noValidate>
            <FormTextInput
              label="Workspace URL"
              name="workspace"
              placeholder="acme.tooljet.com"
              value={workspace}
              onChange={(event) => {
                setWorkspace(event.target.value);
                setError('');
              }}
              disableStartAdornment
            />
            <p className="signup-info">Use the workspace link shared by your admin.</p>
            {error && (
              <p role="alert" className="mcp-workspace-error">
                {error}
              </p>
            )}
            <SubmitButton buttonText="Continue" isLoading={busy} disabled={busy} />
          </form>
          <button type="button" className="mcp-workspace-link mcp-workspace-back" onClick={onBack} disabled={busy}>
            <span aria-hidden="true">← </span>Back to sign in
          </button>
        </OnboardingFormInsideWrapper>
      </OnboardingUIWrapper>
    </div>
  );
}
