import React, { useCallback, useEffect, useRef, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { decodeEntities } from '@/_helpers/utils';
import { ButtonSolid as RawButtonSolid } from '@/_ui/AppButton/AppButton';
import RawSolidIcon from '@/_ui/Icon/SolidIcons';
import DependencyEntityRow from '@/AppBuilder/LeftSidebar/Dependencies/DependencyEntityRow';
import { ComponentIcon, EntityIcon, QueryIcon } from '@/AppBuilder/LeftSidebar/Dependencies/entityIcons';
import { formatActionLabel, getComponentDisplayName } from '@/AppBuilder/LeftSidebar/Dependencies/relationshipLabels';
import { buildDeleteDialogCopy, nestedChildNote, usedByLabel } from './deleteDialogCopy';
import type { DeleteSubject, UsageEntry } from '@/AppBuilder/_utils/entityUsage';
import type { ComponentsById, QueriesById } from '@/AppBuilder/LeftSidebar/Dependencies/types';
import type { DeleteDialogSubject } from './deleteDialogCopy';
import { activateOnEnterOrSpace } from '@/AppBuilder/Shared/EntityUsage/keyboard';
// The dependent rows are the Dependencies panel's rows; pull in their styles so the
// dialog does not depend on that panel having been mounted first.
import '@/AppBuilder/LeftSidebar/Dependencies/styles.scss';
import './entityDelete.scss';

// Untyped JS modules — cast at the import site.
const ButtonSolid = RawButtonSolid as React.ComponentType<any>;
const SolidIcon = RawSolidIcon as React.ComponentType<any>;

const KIND_SUBTITLES: Record<string, string | undefined> = {
  query: 'Query',
  variable: 'Variable',
  pageVariable: 'Page variable',
  global: 'Global',
  constant: 'Constant',
  page: 'Page',
  action: 'Action',
};

// Name and entity type only — the dialog says what still references the subject, not
// which property or event does the referencing.
const subtitleOf = (entry: UsageEntry, componentsById?: ComponentsById): string =>
  entry.kind === 'component'
    ? getComponentDisplayName(componentsById?.[entry.id as string]?.component?.component)
    : (KIND_SUBTITLES[entry.kind] ?? '');

type SubjectIconProps = {
  subject: DeleteSubject;
  queriesById?: QueriesById;
  componentsById?: ComponentsById;
};

const SubjectIcon = ({ subject, queriesById, componentsById }: SubjectIconProps) =>
  subject.kind === 'query' ? (
    <QueryIcon query={subject.query ?? queriesById?.[subject.id]} size={16} />
  ) : (
    <ComponentIcon
      componentType={subject.componentType ?? componentsById?.[subject.id]?.component?.component}
      size={16}
    />
  );

type BlockerCardProps = {
  subject: DeleteSubject;
  collapsible: boolean;
  defaultExpanded: boolean;
  /**
   * Sole card — it takes the whole scroll region and its body is the only thing that
   * scrolls, so a heavily-referenced single subject never produces nested scrollbars.
   */
  fill?: boolean;
  queriesById?: QueriesById;
  componentsById?: ComponentsById;
};

/**
 * One blocked subject: a header carrying its dependent count, and a scrolling body of
 * dependents.
 *
 * The header is a sibling of the scroll region rather than `position: sticky` inside it.
 * Sticky needs an opaque backdrop to hide what passes under it, and this header's
 * `--interactive-default` is 8% alpha — rows showed straight through it. Keeping the
 * header outside the scrolling element makes overlap impossible by construction.
 */
const BlockerCard = ({
  subject,
  collapsible,
  defaultExpanded,
  fill = false,
  queriesById,
  componentsById,
}: BlockerCardProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isOpen = !collapsible || expanded;
  const Chevron = isOpen ? ChevronUpIcon : ChevronDownIcon;
  const name = decodeEntities(subject.name);

  // Overlay scrollbars stay hidden until you scroll, so a clipped list reads as a complete
  // one. This drives a bottom fade that shows only while there is more below.
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const [hasMoreBelow, setHasMoreBelow] = useState(false);
  const updateScrollState = useCallback(() => {
    const el = bodyRef.current;
    if (!el) return;
    // 1px of slack: fractional scroll offsets otherwise leave the fade on at the very end.
    setHasMoreBelow(el.scrollHeight - el.scrollTop - el.clientHeight > 1);
  }, []);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) {
      setHasMoreBelow(false);
      return undefined;
    }
    updateScrollState();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateScrollState, isOpen, subject.dependents]);

  return (
    <div
      className={`entity-delete-card ${fill ? 'fill' : ''}`}
      data-cy={`entity-delete-card-${String(subject.name).toLowerCase()}`}
    >
      <div
        className={`entity-delete-card-header ${collapsible ? 'clickable' : ''}`}
        onClick={collapsible ? () => setExpanded((prev) => !prev) : undefined}
        onKeyDown={collapsible ? activateOnEnterOrSpace(() => setExpanded((prev) => !prev)) : undefined}
        role={collapsible ? 'button' : undefined}
        tabIndex={collapsible ? 0 : undefined}
        aria-expanded={collapsible ? isOpen : undefined}
      >
        <span className="entity-delete-card-subject">
          <SubjectIcon subject={subject} queriesById={queriesById} componentsById={componentsById} />
          <span className="entity-delete-card-name text-truncate" title={name}>
            {name}
          </span>
        </span>
        <span className="entity-delete-card-count">
          {usedByLabel(subject.dependents.length)}
          {collapsible && <Chevron size={16} className="entity-delete-card-chevron" />}
        </span>
      </div>
      {isOpen && (
        <div className="entity-delete-card-body-wrap">
          <div className="entity-delete-card-body" ref={bodyRef} onScroll={updateScrollState}>
            {subject.dependents.map((entry) => {
              const key = `${entry.kind}:${entry.id ?? entry.name}`;
              const descendant = subject.viaDescendant?.[key];
              return (
                <React.Fragment key={key}>
                  {descendant && (
                    <div className="entity-delete-nested-note" data-cy="entity-delete-nested-note">
                      {nestedChildNote(decodeEntities(descendant), name)}
                    </div>
                  )}
                  <DependencyEntityRow
                    icon={
                      <EntityIcon
                        kind={entry.kind}
                        entityId={entry.id}
                        queriesById={queriesById}
                        componentsById={componentsById}
                      />
                    }
                    name={entry.kind === 'action' ? formatActionLabel(entry.name) : entry.name}
                    subtitle={subtitleOf(entry, componentsById)}
                    dataCy={`entity-delete-dependent-${String(entry.name).toLowerCase()}`}
                  />
                </React.Fragment>
              );
            })}
          </div>
          {hasMoreBelow && <div className="entity-delete-scroll-fade" data-cy="entity-delete-scroll-fade" />}
        </div>
      )}
    </div>
  );
};

export type EntityDeleteDialogProps = {
  show: boolean;
  /** 'component' | 'query' — free-form; deleteDialogCopy pluralises anything. */
  entityLabel?: string;
  /** Everything the user asked to delete. */
  subjects?: DeleteDialogSubject[];
  /** The subset still referenced from outside — getDeleteBlockers output. */
  blockers?: DeleteSubject[];
  queriesById?: QueriesById;
  componentsById?: ComponentsById;
  onCancel?: () => void;
  onConfirm?: () => void;
  darkMode?: boolean;
};

/**
 * Delete confirmation for components and queries.
 *
 * When `blockers` is non-empty the delete is refused: the dialog lists what still
 * references each blocked subject and offers only "Got it". Deletion is offered only
 * when nothing outside the selection depends on the subjects.
 */
export const EntityDeleteDialog = ({
  show,
  entityLabel = 'component',
  subjects = [],
  blockers = [],
  queriesById,
  componentsById,
  onCancel,
  onConfirm,
  darkMode = false,
}: EntityDeleteDialogProps) => {
  const { blocked, title, subtitle } = buildDeleteDialogCopy({ entityLabel, subjects, blockers });
  // A lone card is always open — there is nothing to compare it against. With several,
  // everything starts collapsed so the subject names stay scannable.
  const collapsible = blockers.length > 1;
  // Sole blocker: give the card the whole region and let only its body scroll, so the
  // common "one component, many dependents" case has a single scrollbar rather than a
  // list-scroll wrapped around a body-scroll.
  const singleBlocker = blockers.length === 1;

  return (
    <Modal
      show={show}
      onHide={onCancel}
      // The canvas registers a global `esc` hotkey that calls preventDefault() on every
      // key it handles (useKeyHooks), and its listener is installed before this modal's.
      // @restart/ui only calls onHide() when the keydown was not already default-prevented,
      // so Escape would never close the dialog. onEscapeKeyDown is invoked unconditionally,
      // ahead of that check, which is why closing is wired here rather than through onHide.
      onEscapeKeyDown={() => onCancel?.()}
      animation={false}
      centered
      contentClassName={`entity-delete-modal ${darkMode ? 'dark-theme' : ''}`}
      dialogClassName="entity-delete-modal-dialog"
      onClick={(e: any) => e.stopPropagation()}
      data-cy="entity-delete-modal"
    >
      <Modal.Body className="entity-delete-body">
        {blocked && (
          <div className="entity-delete-warning-icon">
            <SolidIcon name="warning" width="40px" fill="var(--icon-warning)" />
          </div>
        )}
        <div className="entity-delete-heading">
          <div className="entity-delete-title" data-cy="entity-delete-title">
            {title}
          </div>
          <div className="entity-delete-subtitle" data-cy="entity-delete-subtitle">
            {subtitle}
          </div>
        </div>
        {blocked && (
          <div className="entity-delete-scroll">
            {blockers.map((subject) => (
              <BlockerCard
                key={`${subject.kind}:${subject.id}`}
                subject={subject}
                collapsible={collapsible}
                defaultExpanded={!collapsible}
                fill={singleBlocker}
                queriesById={queriesById}
                componentsById={componentsById}
              />
            ))}
          </div>
        )}
      </Modal.Body>
      {/*
        Confirm state mirrors the pre-existing delete-query modal from lts-3.16
        (`.query-folder-delete-modal`, styles in _styles/queryManager.scss): Cancel tertiary
        on the left, a `dangerPrimary` Delete carrying the trash glyph on the right, pushed
        apart by space-between. The blocked state has a single button and keeps it trailing,
        since space-between would strand a lone "Got it" against the left edge.
      */}
      <Modal.Footer className={`entity-delete-footer ${blocked ? 'single-action' : ''}`}>
        {blocked ? (
          <ButtonSolid size="sm" variant="primary" onClick={onCancel} data-cy="entity-delete-got-it">
            Got it
          </ButtonSolid>
        ) : (
          <>
            <ButtonSolid size="sm" variant="tertiary" onClick={onCancel} data-cy="entity-delete-cancel">
              Cancel
            </ButtonSolid>
            <ButtonSolid size="sm" variant="dangerPrimary" onClick={onConfirm} data-cy="entity-delete-confirm">
              <SolidIcon name="trash" width="14" fill="#fff" />
              Delete
            </ButtonSolid>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default EntityDeleteDialog;
