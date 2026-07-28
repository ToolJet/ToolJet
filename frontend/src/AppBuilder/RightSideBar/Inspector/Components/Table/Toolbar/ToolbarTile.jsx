import React from 'react';
import { Bolt } from 'lucide-react';
import { resolveReferences } from '@/_helpers/utils';
import CodeHinter from '@/AppBuilder/CodeEditor';
import FxButton from '@/AppBuilder/CodeBuilder/Elements/FxButton';
import { Switch, Popover, PopoverContent } from '@/components/ui/Rocket';
import { PopoverAnchor } from '@/components/ui/Rocket/shadcn/popover';
import { POPOVER_MENU_Z } from '@/AppBuilder/RightSideBar/Inspector/ActionConfigurationPanels/shared';
import { cn } from '@/lib/utils';

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
  onConfigOpenChange = () => {},
}) => {
  const definitionProp = component?.component?.definition?.properties?.[propertyKey] || {};
  const fxActive = definitionProp.fxActive ?? false;
  const value = definitionProp.value;
  const resolvedChecked = !!resolveReferences(value);

  const paramRef = { name: propertyKey, ...component?.component?.properties?.[propertyKey] };

  const handleToggle = (checked) => paramUpdated(paramRef, 'value', checked ? '{{true}}' : '{{false}}', 'properties');
  const handleFxPress = () => paramUpdated(paramRef, 'fxActive', !fxActive, 'properties');
  const handleCodeChange = (newValue) => paramUpdated(paramRef, 'value', newValue, 'properties');

  const tile = (
    <div className="tw-group tw-flex tw-flex-col tw-gap-2 tw-rounded-md tw-bg-interactive-default tw-px-3 tw-py-2 hover:tw-bg-interactive-hover">
      <div className="tw-flex tw-min-h-5 tw-items-center tw-gap-2">
        <span
          className="tw-min-w-0 tw-flex-1 tw-truncate tw-font-title-default tw-text-text-default"
          data-cy={`${dataCy}-label`}
        >
          {label}
        </span>

        {isConfigurable && (
          <button
            type="button"
            aria-label={`Configure ${label}`}
            data-cy={`${dataCy}-configure-button`}
            onClick={(e) => {
              e.stopPropagation();
              onConfigOpenChange(!configOpen);
            }}
            className={cn(
              'tw-flex tw-h-5 tw-w-5 tw-items-center tw-justify-center tw-rounded tw-border-0 tw-bg-transparent tw-p-0 tw-text-icon-default tw-cursor-pointer hover:tw-text-icon-strong',
              !configOpen && 'tw-opacity-0 group-hover:tw-opacity-100'
            )}
          >
            <Bolt size={14} />
          </button>
        )}

        <span
          className={cn('tw-flex tw-items-center', !fxActive && 'tw-opacity-0 group-hover:tw-opacity-100')}
          onClick={(e) => e.stopPropagation()}
        >
          <FxButton active={fxActive} onPress={handleFxPress} dataCy={dataCy} />
        </span>

        {!fxActive && (
          <Switch
            checked={resolvedChecked}
            onCheckedChange={handleToggle}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            aria-label={label}
            data-cy={`${dataCy}-toggle`}
          />
        )}
      </div>

      {fxActive && (
        <div onClick={(e) => e.stopPropagation()}>
          <CodeHinter
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
        <Popover open={configOpen} onOpenChange={onConfigOpenChange}>
          <PopoverAnchor asChild>{tile}</PopoverAnchor>
          <PopoverContent
            side="left"
            align="start"
            sideOffset={8}
            className={cn(POPOVER_MENU_Z, 'tw-w-[300px] tw-max-w-[300px] tw-gap-0 tw-p-0', darkMode && 'dark-theme')}
            onInteractOutside={(e) => {
              // keep the popover open when interacting with a CodeMirror autocomplete list
              const autocomplete = document.querySelector('.cm-completionListIncompleteBottom');
              if (autocomplete && autocomplete.contains(e.target)) e.preventDefault();
            }}
          >
            {configContent}
          </PopoverContent>
        </Popover>
      ) : (
        tile
      )}
    </div>
  );
};

export default ToolbarTile;
