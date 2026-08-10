import React, { useEffect, useState } from 'react';
import moment from 'moment';
import toast from 'react-hot-toast';
import ModalBase from '@/_ui/Modal';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { customComponentLibrariesService } from '@/_services/customComponentLibraries.service';
import { organizationService } from '@/_services';
import { fetchEdition } from '@/modules/common/helpers/utils';
import './resources/styles/access-tokens-card.styles.scss';

const EXPIRY_OPTIONS = [
  { label: 'No expiry', value: '' },
  { label: '7 days', value: '7' },
  { label: '30 days', value: '30' },
  { label: '60 days', value: '60' },
  { label: '90 days', value: '90' },
];

const isExpired = (token) => token.expiresAt && new Date(token.expiresAt) < new Date();

export const AccessTokensCard = ({ darkMode }) => {
  const [tokens, setTokens] = useState(null); // null = loading
  const [loadFailed, setLoadFailed] = useState(false); // list fetch failed ≠ empty list
  const [organizations, setOrganizations] = useState([]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [nameTouched, setNameTouched] = useState(false); // frame 08: blur-without-value validation
  const [organizationId, setOrganizationId] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('');
  const [createInProgress, setCreateInProgress] = useState(false);

  const [createdToken, setCreatedToken] = useState(null); // raw token — shown exactly once (frame 07)
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revokeInProgress, setRevokeInProgress] = useState(false);

  const edition = fetchEdition();

  const fetchTokens = () => {
    setLoadFailed(false);
    customComponentLibrariesService
      .listTokens()
      .then((res) => setTokens(Array.isArray(res) ? res : []))
      .catch(() => {
        // A failed fetch must NOT masquerade as "no tokens" — distinct error state + retry.
        setTokens([]);
        setLoadFailed(true);
      });
  };

  useEffect(() => {
    if (edition === 'ce') return;
    fetchTokens();
    organizationService
      .getOrganizations('active')
      .then((res) => {
        const orgs = res?.organizations ?? res ?? [];
        setOrganizations(orgs);
        if (orgs.length > 0) setOrganizationId(orgs[0].id);
      })
      .catch(() => toast.error('Could not load your workspaces', { duration: 3000 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (edition === 'ce') return null;

  const resetCreateForm = () => {
    setName('');
    setNameTouched(false);
    setExpiresInDays('');
    setCreatedToken(null);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setNameTouched(true);
      return;
    }
    if (!organizationId) {
      // workspaces failed to load (or none) — never send organizationId: ''
      toast.error('Select a workspace for this token', { duration: 3000 });
      return;
    }
    setCreateInProgress(true);
    try {
      const created = await customComponentLibrariesService.createToken({
        name: name.trim(),
        organizationId,
        expiresInDays: expiresInDays ? Number(expiresInDays) : null,
      });
      setCreatedToken(created.token);
      fetchTokens();
    } catch (error) {
      toast.error(error?.data?.message ?? 'Could not create token', { duration: 3000 });
    }
    setCreateInProgress(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(createdToken);
      toast.success('Token copied to clipboard', { duration: 2000 });
    } catch {
      // clipboard API can be denied (permissions / non-secure context) — the token is
      // still on screen, so tell the user to grab it manually instead of failing silently.
      toast.error('Could not copy automatically — select and copy the token manually', { duration: 3000 });
    }
  };

  const handleRevoke = async () => {
    setRevokeInProgress(true);
    try {
      await customComponentLibrariesService.deleteToken(revokeTarget.id);
      toast.success('Token revoked', { duration: 2000 });
      setRevokeTarget(null);
      fetchTokens();
    } catch (error) {
      toast.error(error?.data?.message ?? 'Could not revoke token', { duration: 3000 });
    }
    setRevokeInProgress(false);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    resetCreateForm();
  };

  return (
    <div className="card profile-page-card tw-mt-16 access-tokens-card">
      {/* header: p-16, title 16/500 + subtitle 12 placeholder, primary button (design 52:7675-7679) */}
      <div className="access-tokens-header">
        <div className="access-tokens-header-text">
          <h3 className="access-tokens-title" data-cy="card-title-access-tokens">
            Personal access tokens
          </h3>
          <p className="access-tokens-subtitle">Authenticate the ToolJet CLI from your machine or a CI pipeline.</p>
        </div>
        <ButtonSolid
          variant="primary"
          leftIcon="plus"
          fill="#fff"
          iconWidth="16"
          onClick={() => setShowCreateModal(true)}
          data-cy="create-token-button"
        >
          Create new token
        </ButtonSolid>
      </div>

      {/* list: users-table pattern, full-bleed rows (design 52:7680-7702) */}
      {tokens === null ? null : loadFailed ? (
        <div className="access-tokens-empty" data-cy="access-tokens-load-error">
          <p className="access-tokens-empty-title">Could not load your tokens</p>
          <p className="access-tokens-empty-subtitle">
            <button type="button" className="access-tokens-retry-link" onClick={fetchTokens}>
              Retry
            </button>
          </p>
        </div>
      ) : tokens.length === 0 ? (
        <div className="access-tokens-empty" data-cy="access-tokens-empty">
          <p className="access-tokens-empty-title">No access tokens yet</p>
          <p className="access-tokens-empty-subtitle">
            Tokens let the ToolJet CLI deploy custom component libraries to your workspaces.
          </p>
        </div>
      ) : (
        <div className="access-tokens-list" data-cy="access-tokens-table">
          <div className="access-tokens-list-header">
            <div className="access-tokens-cell">Name</div>
            <div className="access-tokens-cell">Workspace</div>
            <div className="access-tokens-cell">Last used</div>
            <div className="access-tokens-cell access-tokens-cell-actions" aria-hidden="true">
              Actions
            </div>
          </div>
          {tokens.map((token) => (
            <div className="access-tokens-row" key={token.id} data-cy={`token-row-${token.name}`}>
              <div className="access-tokens-cell access-token-name">{token.name}</div>
              <div className="access-tokens-cell">{token.organizationName ?? '—'}</div>
              <div className="access-tokens-cell">
                {isExpired(token) ? (
                  <span className="access-token-expired-pill">Expired</span>
                ) : token.lastUsedAt ? (
                  moment(token.lastUsedAt).fromNow()
                ) : (
                  'Never used'
                )}
              </div>
              <div className="access-tokens-cell access-tokens-cell-actions">
                <button
                  type="button"
                  className="access-token-revoke-btn"
                  onClick={() => setRevokeTarget(token)}
                  data-cy={`revoke-token-${token.name}`}
                >
                  <SolidIcon name="trash" width="14" fill="var(--text-placeholder)" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create flow — dialog 444px/rounded-8, centered heading px-24 py-16, body p-24 (frames 03–07) */}
      <ModalBase
        show={showCreateModal}
        handleClose={closeCreateModal}
        darkMode={darkMode}
        title={createdToken ? 'Token created' : 'Create personal access token'}
        className="access-token-modal"
        showFooter={false}
      >
        {createdToken ? (
          <div className="access-token-created" data-cy="token-created-view">
            <p className="access-token-created-warning">
              Copy your token now — <strong>it will not be shown again.</strong>
            </p>
            <div className="access-token-created-row">
              <code className="access-token-created-value">{createdToken}</code>
              <ButtonSolid variant="secondary" size="sm" onClick={handleCopy} data-cy="copy-token-button">
                Copy
              </ButtonSolid>
            </div>
            <div className="access-token-modal-footer">
              <ButtonSolid variant="primary" size="sm" onClick={closeCreateModal} data-cy="token-done-button">
                Done
              </ButtonSolid>
            </div>
          </div>
        ) : (
          <div className="access-token-form">
            <div className="access-token-field">
              <label className="access-token-field-label">Token name</label>
              <input
                type="text"
                className={`access-token-field-input ${nameTouched && !name.trim() ? 'has-error' : ''}`}
                placeholder="e.g. macbook-cli"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setNameTouched(true)}
                data-cy="token-name-input"
              />
              {nameTouched && !name.trim() && <div className="access-token-field-error">Name is required</div>}
            </div>
            <div className="access-token-field">
              <label className="access-token-field-label">Workspace</label>
              <select
                className="access-token-field-input"
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                data-cy="token-workspace-select"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="access-token-field">
              <label className="access-token-field-label">Expiration</label>
              <select
                className="access-token-field-input"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                data-cy="token-expiry-select"
              >
                {EXPIRY_OPTIONS.map((opt) => (
                  <option key={opt.label} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="access-token-modal-footer">
              <ButtonSolid variant="tertiary" size="sm" onClick={closeCreateModal} data-cy="token-cancel-button">
                Cancel
              </ButtonSolid>
              <ButtonSolid
                variant="primary"
                size="sm"
                onClick={handleCreate}
                isLoading={createInProgress}
                data-cy="token-create-button"
              >
                Create token
              </ButtonSolid>
            </div>
          </div>
        )}
      </ModalBase>

      {/* Revoke confirm (frame 09) */}
      <ModalBase
        show={!!revokeTarget}
        handleClose={() => setRevokeTarget(null)}
        darkMode={darkMode}
        title="Revoke token"
        className="access-token-modal"
        showFooter={false}
      >
        <div className="access-token-revoke-confirm">
          <p>
            Revoke <strong>{revokeTarget?.name}</strong>? Any CLI logged in with this token will stop working
            immediately. This cannot be undone.
          </p>
          <div className="access-token-modal-footer">
            <ButtonSolid variant="tertiary" size="sm" onClick={() => setRevokeTarget(null)} data-cy="revoke-cancel">
              Cancel
            </ButtonSolid>
            <ButtonSolid
              variant="dangerPrimary"
              size="sm"
              onClick={handleRevoke}
              isLoading={revokeInProgress}
              data-cy="revoke-confirm"
            >
              Revoke token
            </ButtonSolid>
          </div>
        </div>
      </ModalBase>
    </div>
  );
};
