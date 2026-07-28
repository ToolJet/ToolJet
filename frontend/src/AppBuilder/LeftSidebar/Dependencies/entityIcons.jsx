import React from 'react';
import { FileIcon, Grid2x2Icon, HelpCircleIcon, VariableIcon, ZapIcon } from 'lucide-react';
import WidgetIcon from '@/../assets/images/icons/widgets';
import DataSourceIcon from '@/AppBuilder/QueryManager/Components/DataSourceIcon';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';

// DataSourceIcon nudges some kinds up by 3px for the query list; this box neutralises
// that so every icon sits on the same baseline as the row's first text line.
const IconBox = ({ size, children }) => (
  <span className="dependency-icon-box" style={{ width: size, height: size }}>
    {children}
  </span>
);

export const QueryIcon = ({ query, size = 14 }) => (
  <IconBox size={size}>
    <DataSourceIcon source={query} height={size} />
  </IconBox>
);

export const ComponentIcon = ({ componentType, size = 14 }) => (
  <IconBox size={size}>
    <WidgetIcon
      name={String(componentType || '').toLowerCase()}
      version={componentTypeDefinitionMap[componentType]?.version}
      width={size}
    />
  </IconBox>
);

/**
 * Icon for a usage entry, resolved from the live store where the entry only
 * carries an id (queries need their datasource, components their widget type).
 */
export const EntityIcon = ({ kind, entityId, size = 14, queriesById, componentsById }) => {
  const iconProps = { size, className: 'dependency-lucide-icon' };
  switch (kind) {
    case 'query': {
      const query = queriesById?.[entityId];
      return query ? (
        <QueryIcon query={query} size={size} />
      ) : (
        <IconBox size={size}>
          <HelpCircleIcon {...iconProps} />
        </IconBox>
      );
    }
    case 'component': {
      const componentType = componentsById?.[entityId]?.component?.component;
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

// lucide has no database-arrow-down/up, so the two directional variants the design
// uses for "Uses" / "Used by" are drawn here in lucide's stroke style.
const DatabaseArrow = ({ size = 16, up = false, className }) => (
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

export const DatabaseArrowDownIcon = (props) => <DatabaseArrow {...props} />;
export const DatabaseArrowUpIcon = (props) => <DatabaseArrow {...props} up />;

export default EntityIcon;
