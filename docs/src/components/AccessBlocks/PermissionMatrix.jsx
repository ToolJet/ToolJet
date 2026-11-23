import React, { useId, useState } from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import ICONS from '../DocBlocks/icons';
import StateChip, { STATES, normalizeState } from './StateChip';
import RoleChip from './RoleChip';
import PlanTag from './PlanTag';
import VLink from './VLink';
import './AccessBlocks.css';

const STACKS = ['sm', 'md'];

function ResourceIcon({ name }) {
  const Icon = ICONS[name];
  if (!Icon) return null;
  return <Icon className="accblk-icon" aria-hidden="true" />;
}

/** In `level="resource"` a section (one resource) is one row: its summary states plus an expandable detail. */
function resourceRow(section) {
  return {
    id: section.id,
    label: section.label,
    icon: section.icon,
    plan: section.plan,
    href: section.href,
    states: section.summary || {},
    detail: section,
  };
}

function rowsFor(section, level) {
  if (Array.isArray(section.rows)) return section.rows;
  if (level === 'resource') return [resourceRow(section)];
  return Array.isArray(section.flags) ? section.flags : [];
}

const joinLabels = (items) => (items || []).map((item) => item.label).join(', ');

/** The expanded detail of a resource row: what it is, its settings, and notes per role. */
function ResourceDetail({ resource, roles }) {
  const { description, flags, access, href } = resource;
  const notes = Object.entries(resource.notes || access?.notes || {});
  const facts = [];
  if (flags?.length) facts.push(['Permissions tab', joinLabels(flags)]);
  if (access?.levels?.length) {
    const also = access.modifiers?.length ? `. Also: ${joinLabels(access.modifiers)}` : '';
    facts.push(['Granular access', `${joinLabels(access.levels)}${also}`]);
  }
  return (
    <div className="accblk-detail">
      {description && <div className="accblk-detail__text">{description}</div>}
      {facts.length > 0 && (
        <ul className="accblk-facts">
          {facts.map(([key, value]) => (
            <li key={key} className="accblk-facts__item">
              <span className="accblk-facts__key">{key}</span>
              <span>{value}</span>
            </li>
          ))}
        </ul>
      )}
      {notes.length > 0 && (
        <ul className="accblk-notes">
          {notes.map(([roleId, note]) => {
            const role = roles.find((item) => item.id === roleId);
            return (
              <li key={roleId} className="accblk-note">
                {role ? <RoleChip role={role} /> : <span>{roleId}</span>}
                <span className="accblk-note__text">{note}</span>
              </li>
            );
          })}
        </ul>
      )}
      {href && (
        <VLink href={href} className="accblk-detail__link">
          Learn more
        </VLink>
      )}
    </div>
  );
}

/** One row. Hooks live here, never in the parent's map. */
function MatrixRow({ row, roles, stateLabels, defaultExpanded, idPrefix, columnCount }) {
  const [open, setOpen] = useState(Boolean(defaultExpanded));
  const hasDetail = Boolean(row.detail);
  const detailId = `${idPrefix}-${row.id}`;
  const label = (
    <>
      {row.icon && <ResourceIcon name={row.icon} />}
      <span className="accblk-matrix__label-text">{row.label}</span>
    </>
  );

  return (
    <>
      <tr className="accblk-matrix__row" role="row">
        <th scope="row" role="rowheader" className="accblk-matrix__cell accblk-matrix__cell--label">
          <div className="accblk-matrix__label">
            {hasDetail ? (
              <button
                type="button"
                className="accblk-matrix__toggle"
                aria-expanded={open}
                aria-controls={detailId}
                onClick={() => setOpen((value) => !value)}
              >
                <ChevronDown className="accblk-matrix__chevron" aria-hidden="true" />
                {label}
              </button>
            ) : row.href ? (
              <VLink href={row.href} className="accblk-matrix__link">
                {label}
              </VLink>
            ) : (
              <span className="accblk-matrix__static">{label}</span>
            )}
            <PlanTag plan={row.plan} />
          </div>
          {row.description && !hasDetail && <div className="accblk-matrix__desc">{row.description}</div>}
          {row.links?.length > 0 && (
            <div className="accblk-matrix__links">
              {row.links.map((link, index) => (
                <React.Fragment key={link.href}>
                  {index > 0 && <span aria-hidden="true"> · </span>}
                  <VLink href={link.href}>{link.label}</VLink>
                </React.Fragment>
              ))}
            </div>
          )}
        </th>
        {roles.map((role) => (
          <td key={role.id} role="cell" className="accblk-matrix__cell accblk-matrix__cell--state">
            <span className="accblk-matrix__cell-label" aria-hidden="true">
              {role.label}
            </span>
            <StateChip value={row.states?.[role.id] ?? 'na'} labels={stateLabels} />
          </td>
        ))}
      </tr>
      {hasDetail && (
        <tr id={detailId} className="accblk-matrix__detail" role="row" hidden={!open}>
          <td role="cell" colSpan={columnCount} className="accblk-matrix__cell accblk-matrix__cell--detail">
            <ResourceDetail resource={row.detail} roles={roles} />
          </td>
        </tr>
      )}
    </>
  );
}

/** The states that appear in the table, in vocabulary order, for the legend. */
function usedStates(sections, roles, level) {
  const used = new Set();
  sections.forEach((section) => {
    rowsFor(section, level).forEach((row) => {
      roles.forEach((role) => used.add(normalizeState(row.states?.[role.id] ?? 'na').state));
    });
  });
  return Object.keys(STATES).filter((id) => used.has(id) && STATES[id].legend);
}

/**
 * Who has what, by default: a table of sections × roles whose cells are state
 * chips. `level="resource"` shows one row per section (resource) with an
 * expandable detail; `level="permission"` shows one row per flag, grouped by
 * section. Sections with explicit `rows` (comparisons) render as given.
 */
export default function PermissionMatrix({
  sections = [],
  roles = [],
  level = 'permission',
  firstColumn,
  stateLabels = {},
  legend = true,
  caption = 'Permissions by role',
  stack = 'sm',
  defaultExpanded = false,
  id,
}) {
  const reactId = useId();
  const idPrefix = `accblk-${(id || reactId).replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const columnCount = roles.length + 1;
  const stackName = STACKS.includes(stack) ? stack : 'sm';
  const legendStates = legend ? usedStates(sections, roles, level) : [];
  const showSectionRows = level !== 'resource';
  const firstHeading = firstColumn || (level === 'resource' ? 'Resource' : 'Permission');

  return (
    <div className={clsx('accblk-matrix', `accblk-matrix--stack-${stackName}`)}>
      <table className="accblk-matrix__table" role="table">
        <caption className="accblk-sr-only">{caption}</caption>
        <thead className="accblk-matrix__head" role="rowgroup">
          <tr className="accblk-matrix__head-row" role="row">
            <th scope="col" role="columnheader" className="accblk-matrix__cell accblk-matrix__cell--label">
              {firstHeading}
            </th>
            {roles.map((role) => (
              <th key={role.id} scope="col" role="columnheader" className="accblk-matrix__cell accblk-matrix__cell--role">
                <RoleChip role={role} />
              </th>
            ))}
          </tr>
        </thead>
        {sections.map((section) => {
          const rows = rowsFor(section, level);
          if (rows.length === 0) return null;
          return (
            <tbody key={section.id} className="accblk-matrix__section" role="rowgroup">
              {showSectionRows && (
                <tr className="accblk-matrix__section-row" role="row">
                  <th
                    scope="rowgroup"
                    role="rowheader"
                    colSpan={columnCount}
                    className="accblk-matrix__cell accblk-matrix__section-cell"
                  >
                    {section.icon && <ResourceIcon name={section.icon} />}
                    <span>{section.label}</span>
                    <PlanTag plan={section.plan} />
                  </th>
                </tr>
              )}
              {rows.map((row) => (
                <MatrixRow
                  key={row.id}
                  row={row}
                  roles={roles}
                  stateLabels={stateLabels}
                  defaultExpanded={defaultExpanded}
                  idPrefix={`${idPrefix}-${section.id}`}
                  columnCount={columnCount}
                />
              ))}
            </tbody>
          );
        })}
      </table>
      {legendStates.length > 0 && (
        <ul className="accblk-legend" aria-label="Legend">
          {legendStates.map((state) => (
            <li key={state} className="accblk-legend__item">
              <StateChip value={state} labels={stateLabels} />
              <span className="accblk-legend__text">{STATES[state].legend}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
