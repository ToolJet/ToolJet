import React, { useMemo } from 'react';
import { Modal } from 'react-bootstrap';
import useStore from '@/AppBuilder/_stores/store';
import { decodeEntities } from '@/_helpers/utils';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { getQueryUsage } from '@/AppBuilder/_utils/entityUsage';
import EntityUsageList from '@/AppBuilder/Shared/EntityUsage/EntityUsageList';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';

// Usage view for a query: which components/queries consume it, what it references
// in its options, and which components/pages trigger it via event handlers.
const QueryUsageModal = ({ show, onHide, query, darkMode }) => {
  const { moduleId } = useModuleContext();

  const usage = useMemo(() => {
    if (!show || !query) return null;
    return getQueryUsage(useStore.getState(), query.id, moduleId);
  }, [show, query, moduleId]);

  if (!usage) return null;

  const groups = [
    { title: 'Used by', entries: usage.usedBy },
    { title: 'Triggered by', entries: usage.triggeredBy },
    { title: 'Uses', entries: usage.uses },
  ];

  return (
    <Modal
      show={show}
      onHide={onHide}
      animation={false}
      centered
      contentClassName={`query-usage-modal ${darkMode ? 'dark-theme' : ''}`}
      onClick={(e) => e.stopPropagation()}
    >
      <Modal.Header closeButton>
        <Modal.Title data-cy="query-usage-modal-title" style={{ fontSize: '16px' }}>
          Usage of {decodeEntities(query?.name ?? '')}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        <EntityUsageList
          groups={groups}
          emptyMessage="No usage found on this page. Bindings, and events that run this query, will show up here."
          onNavigate={onHide}
        />
      </Modal.Body>
      <Modal.Footer>
        <ButtonSolid size="sm" variant="tertiary" onClick={onHide} data-cy="query-usage-modal-close">
          Close
        </ButtonSolid>
      </Modal.Footer>
    </Modal>
  );
};

export default QueryUsageModal;
