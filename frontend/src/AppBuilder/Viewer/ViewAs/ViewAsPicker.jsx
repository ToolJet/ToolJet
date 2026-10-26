import React, { useEffect, useMemo, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Check, UserRoundSearch } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import useStore from '@/AppBuilder/_stores/store';
import { appPermissionService, authenticationService } from '@/_services';
import { clearViewAs, saveViewAs } from '@/AppBuilder/_helpers/viewAs';
import { useCanvasAppId } from './useCanvasAppId';

const APP_PERMISSION_FEATURES = ['appPermissionPages', 'appPermissionComponent', 'appPermissionQuery'];
const YOURSELF = { value: 'yourself', label: 'Yourself', target: null };

function canEditApp(appId) {
  const session = authenticationService.currentSessionValue;
  const permissions = session?.app_group_permissions;
  return !!(session?.admin || permissions?.is_all_editable || permissions?.editable_apps_id?.includes(appId));
}

// The server checks all of this again on every request; this only hides a control it would reject.
function useViewAsAvailable(appId) {
  const featureAccess = useStore((state) => state.license?.featureAccess);
  return !!appId && APP_PERMISSION_FEATURES.some((feature) => featureAccess?.[feature]) && canEditApp(appId);
}

const userLabel = (user) => [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;

// Only users and groups who can open the app are offered: the server rejects anyone else.
function useViewAsOptions(appId, enabled) {
  const [lists, setLists] = useState({ groups: [], users: [] });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    Promise.all([
      appPermissionService.getUsers(appId, 'user-groups').catch(() => []),
      appPermissionService.getUsers(appId, 'users').catch(() => []),
    ]).then(([groups, users]) => {
      if (cancelled) return;
      setLists({
        groups: (groups || []).map((group) => ({
          value: `group:${group.id}`,
          label: group.name,
          target: { kind: 'group', id: group.id, label: group.name },
        })),
        users: (users || []).map((user) => ({
          value: `user:${user.id}`,
          label: userLabel(user),
          detail: user.email,
          target: { kind: 'user', id: user.id, label: userLabel(user) },
        })),
      });
    });
    return () => {
      cancelled = true;
    };
  }, [appId, enabled]);

  return lists;
}

const matches = (search) => (option) => {
  const term = search.trim().toLowerCase();
  return !term || [option.label, option.detail].some((text) => text?.toLowerCase().includes(term));
};

function OptionSection({ title, options, selectedValue, onSelect }) {
  if (options.length === 0) return null;
  return (
    <div role="group" aria-label={title}>
      {title && <div className="tw-px-3 tw-pb-1 tw-pt-2 tw-font-title-small tw-text-text-placeholder">{title}</div>}
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="option"
          aria-selected={option.value === selectedValue}
          onClick={() => onSelect(option)}
          className="tw-flex tw-w-full tw-items-center tw-gap-2 tw-border-0 tw-bg-transparent tw-px-3 tw-py-1.5 tw-text-left tw-text-text-default hover:tw-bg-interactive-hover"
        >
          <span className="tw-min-w-0 tw-flex-1 tw-truncate tw-font-body-default">{option.label}</span>
          {option.value === selectedValue && (
            <Check width={14} height={14} className="tw-shrink-0 tw-text-icon-accent" />
          )}
        </button>
      ))}
    </div>
  );
}

// Same shape as the Version and Environment controls beside it: a ghost button with an accent
// icon and the current value. Applying a choice reloads the preview (onApply) so the whole app is
// rebuilt for the new identity and nothing loaded for the previous one survives.
export default function ViewAsPicker({ onApply, showDivider = false }) {
  const appId = useCanvasAppId();
  const available = useViewAsAvailable(appId);
  const target = useStore((state) => state.viewAs?.target);
  const { groups, users } = useViewAsOptions(appId, available);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () => ({ groups: groups.filter(matches(search)), users: users.filter(matches(search)) }),
    [groups, users, search]
  );

  if (!available) return null;

  const selectedValue = target ? `${target.kind}:${target.id}` : YOURSELF.value;

  const select = (option) => {
    setOpen(false);
    if (option.value === selectedValue) return;
    if (option.target) {
      saveViewAs(appId, option.target);
    } else {
      clearViewAs(appId);
    }
    onApply();
  };

  const nothingFound = search && filtered.groups.length === 0 && filtered.users.length === 0;

  return (
    <>
      {showDivider && <div className="navbar-seperator"></div>}
      <Popover.Root
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setSearch('');
        }}
      >
        <Popover.Trigger asChild>
          <Button
            variant="ghost"
            className="d-inline-flex align-items-center !tw-px-3 tw-ml-4 tw-max-w-[180px]"
            aria-label="View as"
            data-cy="preview-view-as"
          >
            <UserRoundSearch width={16} height={16} className="tw-shrink-0 tw-text-icon-accent" />
            <span className="tw-truncate">{target ? target.label : YOURSELF.label}</span>
          </Button>
        </Popover.Trigger>
        {/* Not portaled: Preview settings closes on clicks outside itself, which a portal would be. */}
        <Popover.Content
          align="start"
          sideOffset={4}
          className="tw-z-[2000] tw-w-60 tw-overflow-hidden tw-rounded-md tw-border tw-border-solid tw-border-border-weak tw-bg-background-surface-layer-01 tw-shadow-elevation-400"
        >
          <div className="tw-border-0 tw-border-b tw-border-solid tw-border-border-weak tw-p-2">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users and groups"
              aria-label="Search users and groups"
              className="tw-w-full tw-rounded tw-border tw-border-solid tw-border-border-weak tw-bg-transparent tw-px-2 tw-py-1 tw-font-body-default tw-text-text-default"
            />
          </div>
          <div role="listbox" aria-label="View as" className="tw-max-h-64 tw-overflow-y-auto tw-py-1">
            {!search && <OptionSection title="" options={[YOURSELF]} selectedValue={selectedValue} onSelect={select} />}
            <OptionSection title="Groups" options={filtered.groups} selectedValue={selectedValue} onSelect={select} />
            <OptionSection title="Users" options={filtered.users} selectedValue={selectedValue} onSelect={select} />
            {nothingFound && (
              <div className="tw-px-3 tw-py-2 tw-font-body-default tw-text-text-placeholder">
                No matching users or groups
              </div>
            )}
          </div>
        </Popover.Content>
      </Popover.Root>
    </>
  );
}
