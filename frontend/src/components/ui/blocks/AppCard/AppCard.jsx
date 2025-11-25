import React from 'react';
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

const AppCard = ({
  icon,
  title,
  description,
  variant = 'outline',
  className,
  app,
  onPlay,
  onEdit,
  onClone,
  onDelete,
  onExport,
  canPlay = true,
  canEdit = true,
  canDelete,
  ...props
}) => {
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

        <div className="tw-mt-1 tw-h-0 tw-hidden group-hover:tw-flex tw-opacity-0 group-hover:tw-h-auto group-hover:tw-opacity-100 has-[button[data-state=open]]:tw-flex has-[button[data-state=open]]:tw-h-auto has-[button[data-state=open]]:tw-opacity-100 has-[button[data-state=open]]:tw-translate-y-0 group-hover:tw-translate-y-0 tw-transition-all tw-duration-150 tw-ease-in-out tw-items-center tw-justify-between tw-gap-2">
          <div className="tw-grow tw-w">
            <Button variant="ghost" size="medium" disabled={!canPlay} onClick={() => onPlay?.(app)}>
              <Play className="tw-size-4 tw-text-icon-strong" />
              Play
            </Button>
          </div>
          <Button variant="secondary" size="medium" disabled={!canEdit} onClick={() => onEdit?.(app)}>
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
              <DropdownMenuItem onClick={() => onEdit?.(app)}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onClone?.(app)}>Make a copy</DropdownMenuItem>
              {onExport && <DropdownMenuItem onClick={() => onExport?.(app)}>Export</DropdownMenuItem>}
              <DropdownMenuItem>Favorite</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete?.(app)}
                disabled={canDelete ? !canDelete(app) : false}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </ItemContent>
    </Item>
  );
};

export default AppCard;
