import React from 'react';
import { FileIcon, Grid2x2Icon, HelpCircleIcon, VariableIcon, ZapIcon } from 'lucide-react';
import RawWidgetIcon from '@/../assets/images/icons/widgets';
import RawDataSourceIcon from '@/AppBuilder/QueryManager/Components/DataSourceIcon';
import { componentTypeDefinitionMap as rawComponentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';
import type { ComponentsById, DependencyEntryKind, QueriesById } from './types';

// Untyped JS modules — cast at the import site so the JSX below stays readable.
const WidgetIcon = RawWidgetIcon as React.ComponentType<any>;
const DataSourceIcon = RawDataSourceIcon as React.ComponentType<any>;
const componentTypeDefinitionMap = rawComponentTypeDefinitionMap as Record<string, any>;

type IconBoxProps = {
  size: number;
  children: React.ReactNode;
};

// DataSourceIcon nudges some kinds up by 3px for the query list; this box neutralises
// that so every icon sits on the same baseline as the row's first text line.
const IconBox = ({ size, children }: IconBoxProps) => (
  <span className="dependency-icon-box" style={{ width: size, height: size }}>
    {children}
  </span>
);

export type QueryIconProps = {
  query?: any;
  size?: number;
};

export const QueryIcon = ({ query, size = 14 }: QueryIconProps) => (
  <IconBox size={size}>
    <DataSourceIcon source={query} height={size} />
  </IconBox>
);

export type ComponentIconProps = {
  componentType?: string;
  size?: number;
};

export const ComponentIcon = ({ componentType, size = 14 }: ComponentIconProps) => (
  <IconBox size={size}>
    <WidgetIcon
      name={String(componentType || '').toLowerCase()}
      version={componentTypeDefinitionMap[componentType as string]?.version}
      width={size}
    />
  </IconBox>
);

export type EntityIconProps = {
  /** Wider than UsageEntryKind: DependencyViewer synthesises 'appLoad' / 'pageLoad'. */
  kind?: DependencyEntryKind;
  entityId?: string | null;
  size?: number;
  queriesById?: QueriesById;
  componentsById?: ComponentsById;
};

/**
 * Icon for a usage entry, resolved from the live store where the entry only
 * carries an id (queries need their datasource, components their widget type).
 */
export const EntityIcon = ({ kind, entityId, size = 14, queriesById, componentsById }: EntityIconProps) => {
  const iconProps = { size, className: 'dependency-lucide-icon' };
  switch (kind) {
    case 'query': {
      const query = queriesById?.[entityId as string];
      return query ? (
        <QueryIcon query={query} size={size} />
      ) : (
        <IconBox size={size}>
          <HelpCircleIcon {...iconProps} />
        </IconBox>
      );
    }
    case 'component': {
      const componentType = componentsById?.[entityId as string]?.component?.component;
      return componentType ? (
        <ComponentIcon componentType={componentType} size={size} />
      ) : (
        <IconBox size={size}>
          <HelpCircleIcon {...iconProps} />
        </IconBox>
      );
    }
    case 'variable':
    case 'pageVariable':
    case 'global':
    case 'constant':
      return (
        <IconBox size={size}>
          <VariableIcon {...iconProps} />
        </IconBox>
      );
    case 'page':
    case 'pageLoad':
      return (
        <IconBox size={size}>
          <FileIcon {...iconProps} />
        </IconBox>
      );
    case 'appLoad':
      return (
        <IconBox size={size}>
          <Grid2x2Icon {...iconProps} />
        </IconBox>
      );
    case 'action':
      return (
        <IconBox size={size}>
          <ZapIcon {...iconProps} />
        </IconBox>
      );
    default:
      return (
        <IconBox size={size}>
          <HelpCircleIcon {...iconProps} />
        </IconBox>
      );
  }
};

export type DatabaseArrowIconProps = {
  size?: number;
  className?: string;
};

type DatabaseArrowProps = DatabaseArrowIconProps & {
  up?: boolean;
};

// lucide has no database-arrow-down/up, so the two directional variants the design
// uses for "Uses" / "Used by" are drawn here in lucide's stroke style.
const DatabaseArrow = ({ size = 16, up = false, className }: DatabaseArrowProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14a9 3 0 0 0 9 3" />
    <path d="M3 12a9 3 0 0 0 9 3" />
    <path d="M21 5v4" />
    {up ? <path d="M18 21v-7" /> : <path d="M18 14v7" />}
    {up ? <path d="M15 17l3-3 3 3" /> : <path d="M15 18l3 3 3-3" />}
  </svg>
);

export const DatabaseArrowDownIcon = (props: DatabaseArrowIconProps) => <DatabaseArrow {...props} />;
export const DatabaseArrowUpIcon = (props: DatabaseArrowIconProps) => <DatabaseArrow {...props} up />;

export default EntityIcon;
