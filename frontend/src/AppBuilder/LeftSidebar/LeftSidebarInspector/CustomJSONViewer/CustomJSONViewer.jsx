import React from 'react';
import Row from './Components/Row';
import { appendPathSegment, splitPath } from '../utils';
import './styles.scss';

// Component exposed properties are grouped by value kind — id, string/Date, number, boolean,
// array, object, undefined, null, function — and ordered alphabetically within each group.
const getComponentEntryRank = (key, value) => {
  if (key === 'id') return 0;
  if (typeof value === 'string' || value instanceof Date) return 1;
  if (typeof value === 'number') return 2;
  if (typeof value === 'boolean') return 3;
  if (Array.isArray(value)) return 4;
  if (value !== null && typeof value === 'object') return 5;
  if (typeof value === 'undefined') return 6;
  if (value === null) return 7;
  if (typeof value === 'function') return 8;
  return 9;
};

const compareComponentEntries = ([keyA, valueA], [keyB, valueB]) => {
  const rankDiff = getComponentEntryRank(keyA, valueA) - getComponentEntryRank(keyB, valueB);
  return rankDiff !== 0 ? rankDiff : keyA.localeCompare(keyB);
};

const isComponentRootPath = (absolutePath) => {
  if (typeof absolutePath !== 'string') return false;
  const segments = splitPath(absolutePath);
  return segments.length === 2 && segments[0] === 'components';
};

// showPathCopy: off for payloads (e.g. debugger logs) whose paths aren't app-referenceable.
const CustomJSONViewer = ({ data, absolutePath, iconsList = [], showPathCopy = true }) => {
  // typeof null is 'object', so null needs its own check or Object.entries below throws. An empty object or
  // array and a Date have no entries either, so they show as one row too, not a blank pane (DB-11b).
  const isPrimitive =
    data === null || typeof data !== 'object' || data instanceof Date || Object.keys(data).length === 0;
  // A primitive is shown as one unnamed row, whose path is the value's own path.
  let entries;
  if (isPrimitive) {
    entries = [['', data]];
  } else {
    entries = Object.entries(data);
    if (isComponentRootPath(absolutePath)) {
      entries.sort(compareComponentEntries);
    }
  }

  return (
    <div className="custom-json-viewer">
      {entries.map(([key, value], index) => {
        return (
          <Row
            key={isPrimitive ? index : key}
            label={key}
            value={value}
            absolutePath={isPrimitive ? absolutePath : appendPathSegment(absolutePath, key)}
            iconsList={iconsList}
            showPathCopy={showPathCopy}
          />
        );
      })}
    </div>
  );
};

export default CustomJSONViewer;
