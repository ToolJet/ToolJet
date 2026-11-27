import React from 'react';
import { SearchIcon } from 'lucide-react';
import './panel.scss';

/**
 * Centred empty state for a panel body: icon tile, title, one line of help, optional text actions.
 * actions: [{ label, onClick, dataCy }]
 */
const PanelEmptyState = ({ icon, title, description, actions = [], dataCy }) => (
  <div className="tj-panel-empty" data-cy={dataCy}>
    {icon && <span className="tj-panel-empty__spot">{icon}</span>}
    <div className="tj-panel-empty__text">
      <div className="tj-panel-empty__title">{title}</div>
      {description && <div className="tj-panel-empty__description">{description}</div>}
    </div>
    {actions.length > 0 && (
      <div className="tj-panel-empty__actions">
        {actions.map(({ label, onClick, dataCy: actionDataCy }) => (
          <button key={label} type="button" className="tj-panel-empty__action" onClick={onClick} data-cy={actionDataCy}>
            {label}
          </button>
        ))}
      </div>
    )}
  </div>
);

/** A search (or filter) matched nothing. Every panel says it the same way and offers the way out. */
export const NoMatchesEmptyState = ({
  term,
  scope = '',
  description,
  onClearSearch,
  extraActions = [],
  dataCy,
  clearDataCy,
}) => (
  <PanelEmptyState
    icon={<SearchIcon size={20} />}
    title={term ? `No matches for “${term}”${scope}` : 'No matches'}
    description={description}
    actions={[...extraActions, { label: 'Clear search', onClick: onClearSearch, dataCy: clearDataCy }]}
    dataCy={dataCy}
  />
);

export default PanelEmptyState;
