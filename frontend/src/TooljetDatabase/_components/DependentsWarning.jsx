import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

// "N resources reference this table" - a floor, never phrased as "will break" (the backend can
// only see query references, not e.g. a table id hardcoded in a RunJS query).
//
// Shared by MigrationConfirmModal (every DDL action) and DeleteTableModal. `showForeignKeyTables`
// defaults off: `dependents.foreignKeyTables` is tied to the table itself, not to the action being
// confirmed, so a rename/add-column migration on a table other tables reference would otherwise show
// a "Referencing tables" line for a block that only actually applies to dropping the table.
export default function DependentsWarning({ loading, dependents, foreignKeyTables = [] }) {
  const [expanded, setExpanded] = useState(false);
  if (loading) {
    return (
      <div className="migration-deps-warning" data-cy="migration-deps-loading">
        Checking dependent resources…
      </div>
    );
  }

  const hasDependents = !!dependents && dependents.count > 0;
  if (!hasDependents && foreignKeyTables.length === 0) return null;

  return (
    <div className="migration-deps-warning" data-cy="migration-deps-warning">
      {hasDependents && (
        <>
          <div className="migration-deps-summary" onClick={() => setExpanded((prev) => !prev)}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>
              {dependents.count} resource{dependents.count === 1 ? '' : 's'} reference this table
            </span>
          </div>
          {expanded && (
            <ul className="migration-deps-list">
              {dependents.dependents.map((dependent) => (
                <li key={dependent.id}>
                  <span className="migration-deps-app-name">{dependent.name}</span>
                  <span className="migration-deps-app-type">{dependent.type}</span>
                  <span className="migration-deps-queries">
                    {dependent.queries.map((query) => query.name).join(', ')}
                  </span>
                </li>
              ))}
              {dependents.count > dependents.dependents.length && (
                <li className="migration-deps-more">+{dependents.count - dependents.dependents.length} more</li>
              )}
            </ul>
          )}
        </>
      )}
      {foreignKeyTables.length > 0 && (
        <div className="migration-deps-fk-tables" data-cy="migration-deps-fk-tables">
          Referencing tables: {foreignKeyTables.map((table) => table.name).join(', ')}
        </div>
      )}
    </div>
  );
}
