import React, { useEffect, useMemo, useRef, useState } from 'react';
import cx from 'classnames';
import Highlighter from 'react-highlight-words';
import { shallow } from 'zustand/shallow';
import {
  Blocks,
  Check,
  ChevronRight,
  Copy,
  Database,
  FileText,
  Globe,
  Link2,
  Lock,
  LocateFixed,
  LogIn,
  MousePointerClick,
  Play,
  Search,
  SquareCode,
  Trash2,
  Variable,
  X,
} from 'lucide-react';

import useStore from '@/AppBuilder/_stores/store';
import WidgetIcon from '@/../assets/images/icons/widgets';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ToolTip } from '@/_components/ToolTip';
import CustomJSONViewer from '@/AppBuilder/LeftSidebar/LeftSidebarInspector/CustomJSONViewer/CustomJSONViewer';
import useInspectorTreeData from '@/AppBuilder/LeftSidebar/LeftSidebarInspector/useInspectorTreeData';
import useCallbackActions from '@/AppBuilder/LeftSidebar/LeftSidebarInspector/useCallbackActions';
import {
  copyToClipboard,
  extractComponentName,
  formatPathForCopy,
} from '@/AppBuilder/LeftSidebar/LeftSidebarInspector/utils';
import { generateCypressDataCy } from '@/modules/common/helpers/cypressHelpers';
import {
  ALL_CATEGORIES,
  filterInspectorCategories,
  getCategoryLabel,
  getEntryPath,
  getPathCategory,
  isEntityPath,
  isPathWithin,
} from './runtimeInspectorUtils';
import RuntimePanelCloseButton from '@/AppBuilder/QueryPanel/RuntimePanelCloseButton';
import RuntimeFilterSelect from '@/AppBuilder/QueryPanel/RuntimeFilterSelect';
import './styles.scss';

const CATEGORY_ICONS = {
  queries: Database,
  components: Blocks,
  globals: Globe,
  variables: Variable,
  page: FileText,
  constants: Lock,
  input: LogIn,
};

// Lucide icons for the entity actions from useCallbackActions (keyed by action name, which that
// hook owns). Unmapped actions fall back to their legacy SolidIcon.
const ENTITY_ACTION_ICONS = {
  'Run Query': Play,
  'View query': SquareCode,
  'Go to component': LocateFixed,
  'Delete Component': Trash2,
};

const EntityActionIcon = ({ name, iconName }) => {
  const Icon = ENTITY_ACTION_ICONS[name];
  return Icon ? <Icon size={14} /> : <SolidIcon name={iconName} width="14" height="14" fill="currentColor" />;
};

const EntryIcon = ({ name, iconsList, darkMode }) => {
  const icon = iconsList.find((item) => item?.iconName === name && !item?.isInfoIcon);
  if (icon?.iconPath) {
    return (
      <WidgetIcon
        name={extractComponentName(icon.iconPath)}
        fill={darkMode ? '#3A3F42' : '#D7DBDF'}
        width="14"
        height="14"
      />
    );
  }
  if (icon?.jsx) return icon.jsx({ height: 14, width: 14 });
  return null;
};

// Mirrors the sidebar detail view: a component inside a Form resolves to its id only.
const useInspectedValue = (path) => {
  const getResolvedValue = useStore((state) => state.getResolvedValue, shallow);
  const getComponentIdFromName = useStore((state) => state.getComponentIdFromName, shallow);
  const getComponentDefinition = useStore((state) => state.getComponentDefinition, shallow);

  if (!path) return undefined;
  if (path.startsWith('components.')) {
    const componentId = getComponentIdFromName(path.split('.')[1]);
    const parentId = getComponentDefinition(componentId)?.component?.parent;
    const parentType = parentId && getComponentDefinition(parentId)?.component?.component;
    if (parentType === 'Form') return { id: componentId };
    const value = getResolvedValue(`{{${path}}}`);
    return value === undefined ? { id: componentId } : value;
  }
  return getResolvedValue(`{{${path}}}`);
};

const EntryList = ({ entries, depth, selectedPath, onSelect, expanded, onToggle, forceExpand, searchValue, ...rest }) =>
  entries.map((entry) => {
    const path = getEntryPath(entry);
    const hasChildren = entry.children?.length > 0;
    const isOpen = hasChildren && (forceExpand || expanded.has(path) || isPathWithin(selectedPath, path));
    return (
      <React.Fragment key={entry.id}>
        <div
          className={cx('runtime-inspector__entry', { 'is-selected': isPathWithin(selectedPath, path) })}
          style={{ paddingLeft: 8 + depth * 14 }}
        >
          <button
            type="button"
            className={cx('runtime-inspector__twisty', { 'is-open': isOpen, 'is-hidden': !hasChildren })}
            onClick={() => onToggle(path)}
            tabIndex={hasChildren ? 0 : -1}
            aria-label={isOpen ? `Collapse ${entry.name}` : `Expand ${entry.name}`}
          >
            <ChevronRight size={12} />
          </button>
          <button
            type="button"
            className="runtime-inspector__entry-label"
            onClick={() => onSelect(path)}
            data-cy={`inspector-${generateCypressDataCy(entry.name)}-subnode-label`}
          >
            <span className="runtime-inspector__entry-icon">
              <EntryIcon name={entry.name} {...rest} />
            </span>
            <Highlighter
              className="runtime-inspector__entry-name"
              highlightClassName="runtime-inspector__match"
              searchWords={[searchValue]}
              autoEscape
              textToHighlight={entry.name}
            />
          </button>
        </div>
        {isOpen && (
          <EntryList
            entries={entry.children}
            depth={depth + 1}
            selectedPath={selectedPath}
            onSelect={onSelect}
            expanded={expanded}
            onToggle={onToggle}
            forceExpand={forceExpand}
            searchValue={searchValue}
            {...rest}
          />
        )}
      </React.Fragment>
    );
  });

const COPIED_FEEDBACK_MS = 1200;

// Icon-only copy action that confirms in place (check mark) on top of the global toast.
const CopyButton = ({ label, icon: Icon, onCopy, dataCy }) => {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const handleClick = () => {
    onCopy();
    setCopied(true);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
  };

  return (
    <ToolTip message={copied ? 'Copied' : label} placement="top">
      <button
        type="button"
        className={cx('runtime-inspector__icon-btn', { 'is-done': copied })}
        onClick={handleClick}
        aria-label={label}
        data-cy={dataCy}
      >
        {copied ? <Check size={14} /> : <Icon size={14} />}
      </button>
    </ToolTip>
  );
};

const DetailHeader = ({ path }) => {
  const getResolvedValue = useStore((state) => state.getResolvedValue, shallow);
  const callbackActions = useCallbackActions() || [];
  const segments = path.split('.');
  const category = getPathCategory(path);
  const entityActions = isEntityPath(path)
    ? (callbackActions.find((group) => group.for === category)?.actions ?? []).filter((action) => action.icon)
    : [];
  const actionPayload = { nodeName: segments[segments.length - 1], selectedNodePath: path };

  return (
    <div className="runtime-inspector__detail-header">
      <div className="runtime-inspector__crumbs" data-cy="inspector-detail-path">
        {segments.map((segment, index) => (
          <React.Fragment key={`${segment}-${index}`}>
            {index > 0 && <ChevronRight size={12} className="runtime-inspector__crumb-sep" />}
            <span className={cx({ 'is-current': index === segments.length - 1 })}>{segment}</span>
          </React.Fragment>
        ))}
      </div>
      <div className="runtime-inspector__actions">
        {entityActions.map(({ name, iconName, dispatchAction }) => (
          <ToolTip key={name} message={name} placement="top">
            <button
              type="button"
              className="runtime-inspector__icon-btn"
              onClick={() => dispatchAction(actionPayload)}
              aria-label={name}
              data-cy={`inspector-${generateCypressDataCy(name)}-action`}
            >
              <EntityActionIcon name={name} iconName={iconName} />
            </button>
          </ToolTip>
        ))}
        {entityActions.length > 0 && <span className="runtime-inspector__divider" aria-hidden="true" />}
        <CopyButton
          label="Copy path"
          icon={Link2}
          onCopy={() => copyToClipboard(formatPathForCopy(path), false)}
          dataCy="inspector-copy-path"
        />
        <CopyButton
          label="Copy value"
          icon={Copy}
          onCopy={() => copyToClipboard(getResolvedValue(`{{${path}}}`))}
          dataCy="inspector-copy-value"
        />
      </div>
    </div>
  );
};

/**
 * Bottom-panel Inspector: entity list on the left, the selected entity's values on the right,
 * so browsing never replaces the list the way the sidebar's drill-in view does.
 */
const RuntimeInspector = ({ darkMode, moduleId, appType, onClose }) => {
  const { treeData, iconsList } = useInspectorTreeData({ moduleId, appType });
  const searchValue = useStore((state) => state.inspectorSearchValue, shallow);
  const setSearchValue = useStore((state) => state.setInspectorSearchValue, shallow);
  const selectedPath = useStore((state) => state.selectedNodePath, shallow);
  const setSelectedPath = useStore((state) => state.setSelectedNodePath, shallow);

  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [collapsedCategories, setCollapsedCategories] = useState(() => new Set());
  const [expandedEntries, setExpandedEntries] = useState(() => new Set());

  const allCategories = useMemo(() => treeData?.children ?? [], [treeData]);
  const categories = useMemo(
    () => filterInspectorCategories(allCategories, { query: searchValue, category }),
    [allCategories, searchValue, category]
  );
  const isSearching = Boolean(searchValue?.trim());
  const selectedValue = useInspectedValue(selectedPath);

  const toggleIn = (setter) => (key) =>
    setter((previous) => {
      const next = new Set(previous);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  return (
    <div className={cx('runtime-inspector', { 'dark-theme': darkMode })} data-cy="runtime-inspector">
      <div className="runtime-inspector__toolbar">
        <label className="runtime-inspector__search">
          <Search size={13} />
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search"
            aria-label="Search inspector"
            data-cy="inspector-search-input"
          />
          {searchValue && (
            <button type="button" onClick={() => setSearchValue('')} aria-label="Clear search">
              <X size={12} />
            </button>
          )}
        </label>
        <div className="runtime-inspector__filters" role="tablist" aria-label="Filter by type">
          {[{ id: ALL_CATEGORIES, name: 'All' }, ...allCategories].map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={category === item.id}
              className={cx('runtime-inspector__filter', { 'is-active': category === item.id })}
              onClick={() => setCategory(item.id)}
            >
              {item.id === ALL_CATEGORIES ? 'All' : getCategoryLabel(item)}
            </button>
          ))}
        </div>
        <RuntimeFilterSelect
          value={category}
          onChange={setCategory}
          ariaLabel="Filter by type"
          dataCy="inspector-filter-select"
          options={[
            { value: ALL_CATEGORIES, label: 'All types' },
            ...allCategories.map((item) => ({ value: item.id, label: getCategoryLabel(item) })),
          ]}
        />
        {onClose && (
          <RuntimePanelCloseButton
            onClose={onClose}
            dataCy="inspector-close-button"
            className="runtime-inspector__close--end"
          />
        )}
      </div>

      <div className="runtime-inspector__body">
        <nav className="runtime-inspector__list" aria-label="Inspector entries">
          {categories.length === 0 && <div className="runtime-inspector__muted">No matches</div>}
          {categories.map((item) => {
            const Icon = CATEGORY_ICONS[item.id] ?? Blocks;
            const isCollapsed = !isSearching && category === ALL_CATEGORIES && collapsedCategories.has(item.id);
            return (
              <section key={item.id} className="runtime-inspector__group">
                <button
                  type="button"
                  className="runtime-inspector__group-header"
                  onClick={() => toggleIn(setCollapsedCategories)(item.id)}
                  aria-expanded={!isCollapsed}
                  data-cy={`inspector-${item.id}-expand-button`}
                >
                  <ChevronRight size={12} className={cx('runtime-inspector__chevron', { 'is-open': !isCollapsed })} />
                  <Icon size={13} />
                  <span>{getCategoryLabel(item)}</span>
                  <span className="runtime-inspector__count">{item.children.length}</span>
                </button>
                {!isCollapsed &&
                  (item.children.length ? (
                    <EntryList
                      entries={item.children}
                      depth={0}
                      selectedPath={selectedPath}
                      onSelect={setSelectedPath}
                      expanded={expandedEntries}
                      onToggle={toggleIn(setExpandedEntries)}
                      forceExpand={isSearching}
                      searchValue={searchValue}
                      iconsList={iconsList}
                      darkMode={darkMode}
                    />
                  ) : (
                    <div className="runtime-inspector__muted runtime-inspector__muted--inline">
                      No {getCategoryLabel(item).toLowerCase()}
                    </div>
                  ))}
              </section>
            );
          })}
        </nav>

        <section className="runtime-inspector__detail" aria-label="Selected value">
          {selectedPath ? (
            <>
              <DetailHeader path={selectedPath} />
              <div className="runtime-inspector__values" key={selectedPath}>
                <CustomJSONViewer
                  absolutePath={selectedPath}
                  data={selectedValue}
                  darkMode={darkMode}
                  iconsList={iconsList}
                />
              </div>
            </>
          ) : (
            <div className="runtime-inspector__empty">
              <MousePointerClick size={18} />
              <span>Select an item to inspect its values</span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default RuntimeInspector;
