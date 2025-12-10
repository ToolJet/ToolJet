import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@/components/ui/Button/Button';
import { MoreVertical, Play, SquarePen } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/Rocket/dropdown-menu';
import { Item, ItemContent, ItemDescription, ItemFooter, ItemMedia, ItemTitle } from '@/components/ui/Rocket/item';

/**
 * Generic resource card component for displaying items in a grid view.
 * Accepts generic actions and can be used for any resource type (apps, modules, workflows, etc.)
 */
export function ResourceCard({
  icon,
  title,
  description,
  variant = 'outline',
  className,
  item, // Generic item prop (replaces app-specific 'app' prop)
  actions = {},
  canPlay = true,
  canEdit = true,
  canDelete,
  renderActions, // Optional custom actions renderer
  ...props
}) {
  // If custom renderActions is provided, use it; otherwise use default actions UI
  const actionsContent = renderActions ? (
    renderActions({ item, actions, canPlay, canEdit, canDelete })
  ) : (
    <div className="tw-mt-1 tw-h-0 tw-hidden group-hover:tw-flex tw-opacity-0 group-hover:tw-h-auto group-hover:tw-opacity-100 has-[button[data-state=open]]:tw-flex has-[button[data-state=open]]:tw-h-auto has-[button[data-state=open]]:tw-opacity-100 has-[button[data-state=open]]:tw-translate-y-0 group-hover:tw-translate-y-0 tw-transition-all tw-duration-150 tw-ease-in-out tw-items-center tw-justify-between tw-gap-2">
      <div className="tw-grow tw-w">
        <Button variant="ghost" size="medium" disabled={!canPlay} onClick={() => actions.play?.(item)}>
          <Play className="tw-size-4 tw-text-icon-strong" />
          Play
        </Button>
      </div>
      <Button variant="secondary" size="medium" disabled={!canEdit} onClick={() => actions.edit?.(item)}>
        <SquarePen className="tw-size-4 tw-text-icon-accent" />
        Edit
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:tw-bg-muted tw-text-muted-foreground tw-flex tw-size-6"
            size="medium"
            iconOnly
          >
            <MoreVertical className="tw-text-icon-strong" />
            <span className="tw-sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="tw-w-32">
          <DropdownMenuItem onClick={() => actions.edit?.(item)}>Edit</DropdownMenuItem>
          <DropdownMenuItem onClick={() => actions.clone?.(item)}>Make a copy</DropdownMenuItem>
          {actions.export && <DropdownMenuItem onClick={() => actions.export?.(item)}>Export</DropdownMenuItem>}
          <DropdownMenuItem>Favorite</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => actions.delete?.(item)}
            disabled={canDelete ? !canDelete(item) : false}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <Item variant={variant} className={`tw-group tw-flex-nowrap tw-h-[104px] ${className || ''}`} {...props}>
      {icon && (
        <ItemMedia className="group-hover:-tw-translate-y-3 group-hover:tw-h-0 group-hover:tw-opacity-0 tw-transition-all tw-duration-150 tw-ease-in-out tw-relative group-has-[button[data-state=open]]:tw-h-0 group-has-[button[data-state=open]]:tw-opacity-0 group-has-[button[data-state=open]]:-tw-translate-y-2">
          {icon}
        </ItemMedia>
      )}
      <ItemContent className="tw-w-full tw-translate-y-0 group-hover:-tw-translate-y-4 has-[button[data-state=open]]:-tw-translate-y-4 tw-transition-all">
        {title && <ItemTitle>{title}</ItemTitle>}
        {description && <ItemDescription>{description}</ItemDescription>}
        {actionsContent}
      </ItemContent>
    </Item>
  );
}

ResourceCard.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.string,
  description: PropTypes.string,
  variant: PropTypes.string,
  className: PropTypes.string,
  item: PropTypes.object, // Generic item object
  actions: PropTypes.object,
  canPlay: PropTypes.bool,
  canEdit: PropTypes.bool,
  canDelete: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
  renderActions: PropTypes.func, // Custom actions renderer
};

export default ResourceCard;

