import React from 'react';
import { Button } from '@/components/ui/Button/Button';
import { Popover, PopoverContent } from '@/components/ui/Rocket';
import { PopoverAnchor } from '@/components/ui/Rocket/shadcn/popover';
import { POPOVER_MENU_Z } from '@/AppBuilder/RightSideBar/Inspector/ActionConfigurationPanels/shared';
import { cn } from '@/lib/utils';

// Untyped (.jsx) imports — cast to loose component types so they can be used as JSX under strict TS.
const ButtonComponent = Button as React.ComponentType<any>;
const PopoverComponent = Popover as React.ComponentType<any>;
const PopoverContentComponent = PopoverContent as React.ComponentType<any>;
const PopoverAnchorComponent = PopoverAnchor as React.ComponentType<any>;

interface ToolbarTileProps {
  dataCy: string;
  row: React.ReactNode;
  label?: string;
  darkMode?: boolean;
  isConfigurable?: boolean;
  fxActive?: boolean;
  configContent?: React.ReactNode;
  configOpen?: boolean;
  onConfigOpenChange?: (open: boolean) => void;
}

/**
 * A single Toolbar list tile: Wraps a standard inspector toggle row.
 * Configurable items overlay a cog on hover that opens a config popover anchored to the row.
 */
export const ToolbarTile = ({
  dataCy,
  row,
  label = '',
  darkMode,
  isConfigurable = false,
  fxActive = false,
  configContent = null,
  configOpen = false,
  onConfigOpenChange = () => {},
}: ToolbarTileProps) => {
  if (!isConfigurable) {
    return row;
  }

  return (
    <PopoverComponent open={configOpen} onOpenChange={onConfigOpenChange}>
      <PopoverAnchorComponent asChild>
        {/* Keep the standard row's fx button visible while hovering anywhere in the tile (incl. the cog), since the cog sits outside `.wrapper-div-code-editor` */}
        <div
          className="tw-group tw-relative [&:hover_.fx-button-container]:!tw-opacity-100"
          data-cy={`${dataCy}-toolbar-item`}
        >
          {row}
          {/* Cog sits just left of the (hover-revealed) fx button. */}
          <ButtonComponent
            fill="var(--icon-strong)"
            iconOnly
            isLucid
            leadingIcon="bolt"
            onClick={(e: React.SyntheticEvent) => {
              e.stopPropagation();
              onConfigOpenChange(!configOpen);
            }}
            className={cn(
              'tw-h-[21px] tw-w-[21px] tw-absolute tw-top-0',
              fxActive ? 'tw-right-[44px]' : 'tw-right-[72px]',
              !configOpen && 'tw-opacity-0 group-hover:tw-opacity-100'
            )}
            size="small"
            variant="ghost"
            aria-label={`Configure ${label}`}
            data-cy={`${dataCy}-configure-button`}
          />
        </div>
      </PopoverAnchorComponent>
      <PopoverContentComponent
        side="left"
        align="start"
        sideOffset={8}
        className={cn(POPOVER_MENU_Z, 'tw-w-[300px] tw-max-w-[300px] tw-gap-0 tw-p-0', darkMode && 'dark-theme')}
        onInteractOutside={(e: any) => {
          // keep the popover open when interacting with a CodeMirror autocomplete list
          const autocomplete = document.querySelector('.cm-completionListIncompleteBottom');
          if (autocomplete && autocomplete.contains(e.target)) e.preventDefault();
        }}
      >
        {configContent}
      </PopoverContentComponent>
    </PopoverComponent>
  );
};

export default ToolbarTile;
