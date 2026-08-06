import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { decodeEntities } from '@/_helpers/utils';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import DependencyEntityRow from '@/AppBuilder/LeftSidebar/Dependencies/DependencyEntityRow';
import { ComponentIcon, EntityIcon, QueryIcon } from '@/AppBuilder/LeftSidebar/Dependencies/entityIcons';
import { formatActionLabel, getComponentDisplayName } from '@/AppBuilder/LeftSidebar/Dependencies/relationshipLabels';
import { buildDeleteDialogCopy, nestedChildNote, usedByLabel } from './deleteDialogCopy';
// The dependent rows are the Dependencies panel's rows; pull in their styles so the
// dialog does not depend on that panel having been mounted first.
import '@/AppBuilder/LeftSidebar/Dependencies/styles.scss';
import './entityDelete.scss';

const KIND_SUBTITLES = {
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
const subtitleOf = (entry, componentsById) =>
  entry.kind === 'component'
    ? getComponentDisplayName(componentsById?.[entry.id]?.component?.component)
    : KIND_SUBTITLES[entry.kind] ?? '';

const SubjectIcon = ({ subject, queriesById, componentsById }) =>
  subject.kind === 'query' ? (
    <QueryIcon query={subject.query ?? queriesById?.[subject.id]} size={16} />
  ) : (
    <ComponentIcon
      componentType={subject.componentType ?? componentsById?.[subject.id]?.component?.component}
      size={16}
    />
  );

/** One blocked subject: header with its dependent count, body with the dependents. */
const BlockerCard = ({ subject, collapsible, defaultExpanded, queriesById, componentsById }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isOpen = !collapsible || expanded;
  const Chevron = isOpen ? ChevronUpIcon : ChevronDownIcon;
  const name = decodeEntities(subject.name);

  return (
    <div className="entity-delete-card" data-cy={`entity-delete-card-${String(subject.name).toLowerCase()}`}>
      <div
        className={`entity-delete-card-header ${collapsible ? 'clickable' : ''}`}
        onClick={collapsible ? () => setExpanded((prev) => !prev) : undefined}
        role={collapsible ? 'button' : undefined}
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
        <div className="entity-delete-card-body">
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
      )}
    </div>
  );
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
}) => {
  const { blocked, title, subtitle } = buildDeleteDialogCopy({ entityLabel, subjects, blockers });
  // A lone card is always open — there is nothing to compare it against. With several,
  // everything starts collapsed so the subject names stay scannable.
  const collapsible = blockers.length > 1;

  return (
    <Modal
      show={show}
      onHide={onCancel}
      animation={false}
      centered
      contentClassName={`entity-delete-modal ${darkMode ? 'dark-theme' : ''}`}
      dialogClassName="entity-delete-modal-dialog"
      onClick={(e) => e.stopPropagation()}
      data-cy="entity-delete-modal"
    >
      <Modal.Body className="entity-delete-body">
        {blocked && (
          <div className="entity-delete-warning-icon">
            <SolidIcon name="warning" width="40px" fill="var(--icon-warning, #e54d2e)" />
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
                queriesById={queriesById}
                componentsById={componentsById}
              />
            ))}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="entity-delete-footer">
        {blocked ? (
          <ButtonSolid size="sm" variant="primary" onClick={onCancel} data-cy="entity-delete-got-it">
            Got it
          </ButtonSolid>
        ) : (
          <>
            <ButtonSolid size="sm" variant="tertiary" onClick={onCancel} data-cy="entity-delete-cancel">
              Cancel
            </ButtonSolid>
            <ButtonSolid size="sm" variant="primary" onClick={onConfirm} data-cy="entity-delete-confirm">
              Delete
            </ButtonSolid>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default EntityDeleteDialog;
