import React, { useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { toast } from 'react-hot-toast';
import moment from 'moment';

import { cn } from '@/lib/utils';
import { customComponentLibrariesService } from '@/_services/customComponentLibraries.service';
import { organizationService } from '@/_services';
import { fetchEdition } from '@/modules/common/helpers/utils';
import { Button } from '@/components/ui/Button/Button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '@/components/ui/Rocket/Select/Select';
import Dialog from '@/components/ui/Dialog';

import './resources/styles/access-tokens-card.styles.scss';

const EXPIRY_OPTIONS = [
  { label: 'No expiry', value: 'no expiry' },
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
  const [expiresInDays, setExpiresInDays] = useState(EXPIRY_OPTIONS[4].value);
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
        expiresInDays: expiresInDays === 'no expiry' ? null : Number(expiresInDays),
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

        <Button
          isLucid
          variant="primary"
          leadingIcon="plus"
          onClick={() => setShowCreateModal(true)}
          data-cy="create-new-token-button"
        >
          Create new token
        </Button>
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
        <AccessTokensEmptyState onCreate={() => setShowCreateModal(true)} />
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
                <Button
                  size="medium"
                  variant="dangerPrimary"
                  className="access-token-revoke-btn"
                  onClick={() => setRevokeTarget(token)}
                  data-cy={`revoke-token-${token.name}`}
                >
                  Revoke
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={showCreateModal}
        title={createdToken ? '' : 'Create personal access token'}
        cancelBtnProps={{ 'data-cy': 'cancel-button', disabled: createInProgress, onClick: closeCreateModal }}
        showCancelButton={!createdToken}
        submitActions={[
          {
            label: createdToken ? 'Done' : 'Create token',
            isLoading: createInProgress,
            'data-cy': 'submit-button',
            onClick: createdToken ? closeCreateModal : handleCreate,
          },
        ]}
        classes={{
          dialogContent: 'tw-max-w-md',
          ...(createdToken ? { dialogFooter: 'tw-justify-end', dialogBody: 'tw-pb-0' } : {}),
        }}
      >
        {createdToken ? (
          <div className="tw-flex tw-flex-col tw-gap-0.5">
            <h6 data-cy="modal-header" className="tw-text-text-default tw-font-medium tw-text-xl">
              Token created
            </h6>

            <p data-cy="modal-description" className="tw-text-text-default tw-text-base tw-mb-4">
              Copy this token now. It won&apos;t be shown again. If you lose it, revoke this token and create another.
            </p>

            <div className="tw-flex tw-items-center tw-gap-4 tw-rounded-md tw-p-3 tw-border tw-border-solid tw-border-border-weak">
              <div className="tw-min-w-0 tw-flex-1">
                <p className="tw-mb-1 tw-font-medium tw-text-text-placeholder tw-text-base">Token</p>
                <p className="tw-mb-0 tw-font-medium tw-text-text-default tw-text-base tw-truncate">{createdToken}</p>
              </div>

              <Button
                isLucid
                iconOnly
                variant="ghost"
                leadingIcon="copy"
                className="tw-shrink-0"
                fill="var(--icon-strong)"
                onClick={handleCopy}
              />
            </div>

            <div className="tw-flex tw-items-center tw-gap-4 tw-rounded-md tw-p-3 tw-border tw-border-solid tw-border-border-weak tw-mt-4">
              <div className="tw-min-w-0 tw-flex-1">
                <p className="tw-mb-1 tw-font-medium tw-text-text-placeholder tw-text-base">Workspace ID</p>
                <p className="tw-mb-0 tw-font-medium tw-text-text-default tw-text-base tw-truncate">{organizationId}</p>
              </div>

              <Button
                isLucid
                iconOnly
                variant="ghost"
                leadingIcon="copy"
                className="tw-shrink-0"
                fill="var(--icon-strong)"
                onClick={handleCopy}
              />
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
              {nameTouched && !name.trim() && (
                <div className="access-token-field-error">Enter a name so you can identify this token later.</div>
              )}
            </div>
            <div className="access-token-field">
              <label className="access-token-field-label">Workspace</label>

              <Dropdown
                options={organizations?.map((org) => ({ label: org.name, value: org.id })) ?? []}
                selectedOption={organizationId ?? null}
                onChangeSelectedOption={setOrganizationId}
                darkMode={darkMode}
              />
            </div>
            <div className="access-token-field">
              <label className="access-token-field-label">Expiration</label>

              <Dropdown
                options={EXPIRY_OPTIONS.map((opt) => ({ label: opt.label, value: opt.value })) ?? []}
                selectedOption={expiresInDays ?? null}
                onChangeSelectedOption={setExpiresInDays}
                darkMode={darkMode}
              />
            </div>
          </div>
        )}
      </Dialog>

      <Dialog
        open={!!revokeTarget}
        cancelBtnProps={{
          'data-cy': 'cancel-button',
          disabled: revokeInProgress,
          onClick: () => setRevokeTarget(null),
        }}
        submitActions={[
          {
            label: 'Revoke token',
            variant: 'dangerPrimary',
            isLoading: revokeInProgress,
            'data-cy': 'revoke-confirm',
            onClick: handleRevoke,
          },
        ]}
        classes={{ dialogBody: 'tw-pb-0', dialogContent: 'tw-max-w-md' }}
      >
        <div className="tw-flex tw-flex-col tw-gap-0.5">
          <h6 data-cy="modal-header" className="tw-text-text-default tw-font-medium tw-text-xl">
            Revoke token?
          </h6>

          <p data-cy="modal-description" className="tw-text-text-default tw-text-base tw-mb-0">
            Revoke{' '}
            <span className="tw-font-semibold">
              {revokeTarget?.name} in {revokeTarget?.organizationName}
            </span>
            ? Any CLI session or pipeline using this token stops working immediately.
            <br /> <br />
            <span className="tw-text-text-placeholder">
              This can&apos;t be undone. To restore access you&apos;ll need to create a new token and update wherever
              it&apos;s used.
            </span>
          </p>
        </div>
      </Dialog>
    </div>
  );
};

function AccessTokensEmptyState({ onCreate }) {
  return (
    <div className="tw-flex tw-flex-col tw-items-center tw-px-4 tw-py-10" data-cy="access-tokens-empty">
      <div className="tw-flex tw-justify-center tw-items-center tw-size-8 tw-rounded-lg tw-bg-background-surface-layer-02 tw-mb-2">
        <KeyRound size="20" color="var(--icon-default)" />
      </div>

      <p className="tw-font-medium tw-text-base tw-mb-0">No personal access tokens</p>

      <p className="tw-text-base tw-text-text-placeholder tw-mb-7 tw-text-center">
        Create a token to sign in to the ToolJet CLI from your machine,
        <br /> or to let a CI pipeline deploy on yourbehalf.
      </p>

      <Button isLucid variant="outline" leadingIcon="plus" onClick={onCreate} data-cy="create-token-button">
        Create token
      </Button>
    </div>
  );
}

function Dropdown({ darkMode, options, selectedOption, onChangeSelectedOption }) {
  return (
    <Select value={selectedOption} onValueChange={onChangeSelectedOption}>
      <SelectTrigger
        showArrow={false}
        className="tw-shadow-none tw-gap-1.5 tw-px-2 tw-py-1 tw-text-text-default tw-font-title-default hover:tw-bg-interactive-hover data-[state=open]:tw-bg-interactive-selected"
      >
        <SelectValue />
      </SelectTrigger>

      <SelectContent
        align="end"
        className={cn('tw-border tw-border-solid tw-border-border-weak', {
          'dark-theme theme-dark': darkMode,
        })}
      >
        <SelectGroup className="tw-h-56 tw-overflow-y-auto tw-hide-scrollbar">
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="tw-font-body-default tw-text-text-default tw-justify-between tw-gap-2"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
