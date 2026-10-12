import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  Archive,
  Check,
  Copy,
  Download,
  Eye,
  Link,
  Loader2,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Printer,
  RotateCcw,
  Send,
  Share2,
  Star,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import TablerIcon from '@/_ui/Icon/TablerIcon';
import { actionIcon, isDestructive } from '../../../_utils/rowActionIcon';

// A button column's actions in the Table's ToolJet UI 2.0 look (shadcnLook.scss): small ghost icon buttons with the
// label as their tooltip, or one "..." button opening a menu of the actions. Either way a click runs the button's own
// events (OnTableButtonColumnClicked with its ref), exactly as its labelled button does.

const LUCIDE = {
  trash: Trash2,
  pencil: Pencil,
  eye: Eye,
  check: Check,
  x: X,
  download: Download,
  copy: Copy,
  send: Send,
  share: Share2,
  archive: Archive,
  phone: Phone,
  'user-plus': UserPlus,
  printer: Printer,
  link: Link,
  rotate: RotateCcw,
  star: Star,
  plus: Plus,
};

/** The icon of an action: its own Tabler icon when it shows one, else one read from its label; null when neither. */
const ActionIcon = ({ action, size = 16 }) => {
  if (action.loading) return <Loader2 size={size} className="tj-row-action-spin" aria-hidden="true" />;
  if (action.iconVisible && typeof action.iconName === 'string' && action.iconName) {
    return <TablerIcon iconName={action.iconName} size={size} stroke={1.75} aria-hidden="true" />;
  }
  const Icon = LUCIDE[actionIcon(action.label)];
  return Icon ? <Icon size={size} strokeWidth={1.75} aria-hidden="true" /> : null;
};

const stop = (e) => e.stopPropagation();

export const RowActionIcons = ({ actions, onAction }) => (
  <div className="tj-row-actions h-100 d-flex align-items-center" role="group" aria-label="Row actions">
    {actions.map((action) => {
      const icon = <ActionIcon action={action} />;
      return (
        <button
          key={action.id}
          type="button"
          className={`tj-row-action-icon${icon ? '' : ' tj-row-action-icon--text'}${
            isDestructive(action.label) ? ' tj-row-action-destructive' : ''
          }`}
          title={action.tooltip ? String(action.tooltip) : action.label}
          aria-label={action.label}
          disabled={action.disabled || action.loading}
          // The click reaches the row as a labelled button's does (the row selects, onRowClicked fires).
          onClick={() => onAction(action.id)}
          data-action={action.id}
        >
          {icon || action.label}
        </button>
      );
    })}
  </div>
);

export const RowActionMenu = ({ actions, onAction }) => {
  if (!actions.length) return null;
  return (
    <div className="tj-row-actions h-100 d-flex align-items-center">
      <DropdownMenu.Root modal={false}>
        {/* Opening the menu is not an action: the row neither selects nor fires onRowClicked. Clicks in the menu
            (a portal, but inside the row in React's tree) stop at its content. */}
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className="tj-row-action-icon tj-row-action-trigger"
            aria-label="Row actions"
            onClick={stop}
          >
            <MoreHorizontal size={16} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="tj-row-action-menu"
            align="end"
            sideOffset={4}
            collisionPadding={8}
            onClick={stop}
          >
            {actions.map((action, i) => (
              <React.Fragment key={action.id}>
                {/* Destructive actions sit apart at the end of their run, as shadcn's row menus draw Delete. */}
                {i > 0 && isDestructive(action.label) && !isDestructive(actions[i - 1].label) ? (
                  <DropdownMenu.Separator className="tj-row-action-separator" />
                ) : null}
                <DropdownMenu.Item
                  className={`tj-row-action-item${isDestructive(action.label) ? ' tj-row-action-destructive' : ''}`}
                  disabled={action.disabled || action.loading}
                  onSelect={() => onAction(action.id)}
                  data-action={action.id}
                >
                  <span className="tj-row-action-item-icon">
                    <ActionIcon action={action} size={15} />
                  </span>
                  <span className="tj-row-action-item-label">{action.label}</span>
                </DropdownMenu.Item>
              </React.Fragment>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
};
