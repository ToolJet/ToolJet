import React from 'react';
import { Bolt } from 'lucide-react';
import { resolveReferences } from '@/_helpers/utils';
import CodeHinter from '@/AppBuilder/CodeEditor';
import FxButton from '@/AppBuilder/CodeBuilder/Elements/FxButton';
import { Button } from '@/components/ui/Button/Button';
import { Switch, Popover, PopoverContent } from '@/components/ui/Rocket';
import { PopoverAnchor } from '@/components/ui/Rocket/shadcn/popover';
import { POPOVER_MENU_Z } from '@/AppBuilder/RightSideBar/Inspector/ActionConfigurationPanels/shared';
import { cn } from '@/lib/utils';

// Untyped (.jsx) imports — cast to loose component types so they can be used as JSX under strict TS.
const CodeHinterComponent = CodeHinter as React.ComponentType<any>;
const FxButtonComponent = FxButton as React.ComponentType<any>;
const ButtonComponent = Button as React.ComponentType<any>
const SwitchComponent = Switch as React.ComponentType<any>;
const PopoverComponent = Popover as React.ComponentType<any>;
const PopoverContentComponent = PopoverContent as React.ComponentType<any>;
const PopoverAnchorComponent = PopoverAnchor as React.ComponentType<any>;

type ParamUpdate = (param: Record<string, any>, attr: string, value: unknown, paramType?: string) => void;

interface ToolbarTileProps {
  label: string;
  propertyKey: string;
  component: any;
  paramUpdated: ParamUpdate;
  darkMode?: boolean;
  dataCy: string;
  isConfigurable?: boolean;
  configContent?: React.ReactNode;
  configOpen?: boolean;
  onConfigOpenChange?: (open: boolean) => void;
}

/**
 * A single Toolbar list tile: label + (hover) cog + (hover) fx + pill toggle.
 * When fx is active the pill is replaced by a single-line code editor rendered inside the tile.
 */
export const ToolbarTile = ({
  label,
  propertyKey,
  component,
  paramUpdated,
  darkMode,
  dataCy,
  isConfigurable = false,
  configContent = null,
  configOpen = false,
  onConfigOpenChange = () => { },
}: ToolbarTileProps) => {
  const definitionProp = component?.component?.definition?.properties?.[propertyKey] || {};
  const fxActive: boolean = definitionProp.fxActive ?? false;
  const value = definitionProp.value;
  const resolvedChecked = !!resolveReferences(value);

  const paramRef = {
    name: propertyKey,
    ...component?.component?.properties?.[propertyKey],
  };

  const handleToggle = (checked: boolean) =>
    paramUpdated(paramRef, 'value', checked ? '{{true}}' : '{{false}}', 'properties');
  const handleFxPress = () => paramUpdated(paramRef, 'fxActive', !fxActive, 'properties');
  const handleCodeChange = (newValue: string) => paramUpdated(paramRef, 'value', newValue, 'properties');
  const stopPropagation = (e: React.SyntheticEvent) => e.stopPropagation();

  const tile = (
    <div
      className={cn(
        'tw-group tw-flex tw-flex-col tw-gap-2 tw-rounded-[6px] tw-bg-interactive-default tw-px-[8px] tw-py-[7px]',
        isConfigurable && 'hover:tw-bg-interactive-hover'
      )}
    >
      <div className="tw-flex tw-items-center tw-gap-2">
        <span
          className="tw-min-w-0 tw-flex-1 tw-truncate tw-font-body-default tw-text-text-default"
          data-cy={`${dataCy}-label`}
        >
          {label}
        </span>

        {isConfigurable && (
          <ButtonComponent
            fill="var(--icon-strong)"
            iconOnly
            isLucid
            leadingIcon="bolt"
            onClick={(e: React.SyntheticEvent) => {
              e.stopPropagation();
              onConfigOpenChange(!configOpen);
            }}
            className={!configOpen && 'tw-opacity-0 group-hover:tw-opacity-100'}
            size="small"
            variant="ghost"
            aria-label={`Configure ${label}`}
            data-cy={`${dataCy}-configure-button`}
          />
        )}

        <span
          className={cn('tw-flex tw-items-center', !fxActive && 'tw-opacity-0 group-hover:tw-opacity-100')}
          onClick={stopPropagation}
        >
          <FxButtonComponent active={fxActive} onPress={handleFxPress} dataCy={dataCy} />
        </span>

        {!fxActive && (
          <SwitchComponent
            checked={resolvedChecked}
            onCheckedChange={handleToggle}
            onPointerDown={stopPropagation}
            onClick={stopPropagation}
            aria-label={label}
            data-cy={`${dataCy}-toggle`}
          />
        )}
      </div>

      {fxActive && (
        <div onClick={stopPropagation}>
          <CodeHinterComponent
            type="basic"
            initialValue={value}
            onChange={handleCodeChange}
            usePortalEditor={false}
            component={component?.component}
            cyLabel={`${dataCy}-visibility`}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="tw-mb-1" data-cy={`${dataCy}-toolbar-item`}>
      {isConfigurable ? (
        <PopoverComponent open={configOpen} onOpenChange={onConfigOpenChange}>
          <PopoverAnchorComponent asChild>{tile}</PopoverAnchorComponent>
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
      ) : (
        tile
      )}
    </div>
  );
};

export default ToolbarTile;
