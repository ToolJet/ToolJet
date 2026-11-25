import React from 'react';
import clsx from 'clsx';
import { ChevronRight } from 'lucide-react';
import CardGrid from '../DocBlocks/CardGrid';
import Card, { CardIcon } from '../DocBlocks/Card';
import RoleChip from './RoleChip';
import PlanTag from './PlanTag';
import VLink from './VLink';
import './AccessBlocks.css';

function Chips({ items, small }) {
  if (!items?.length) return null;
  return (
    <ul className={clsx('accblk-chips', small && 'accblk-chips--small')}>
      {items.map((item) => (
        <li key={item} className="accblk-chip">
          {item}
        </li>
      ))}
    </ul>
  );
}

const findRole = (roles, id) => roles.find((role) => role.id === id);

/** The levels of one resource type: scope, the ordered levels, modifiers, the ceiling per role, notes. */
function LevelsCard({ resource, roles, href, linkLabel }) {
  const access = resource.access || {};
  const levels = access.levels || [];
  const isLadder = access.ladder !== false && levels.length > 1;
  const ceilingByLevel = {};
  Object.entries(access.ceiling || {}).forEach(([roleId, levelId]) => {
    (ceilingByLevel[levelId] = ceilingByLevel[levelId] || []).push(roleId);
  });
  const notes = Object.entries(access.notes || {});
  const List = isLadder ? 'ol' : 'ul';

  return (
    <Card className="accblk-levels">
      <div className="accblk-levels__head">
        <CardIcon>{resource.icon}</CardIcon>
        <div className="accblk-levels__heading">
          <div className="accblk-levels__title">
            {resource.label}
            <PlanTag plan={resource.plan} />
          </div>
          {access.kinds?.length > 0 && <div className="accblk-levels__kinds">{access.kinds.join(' · ')}</div>}
        </div>
        {href && (
          <VLink href={href} className="accblk-levels__link">
            {linkLabel}
          </VLink>
        )}
      </div>

      {access.scope?.length > 0 && (
        <div className="accblk-levels__row">
          <span className="accblk-levels__key">Scope</span>
          <Chips items={access.scope} />
          {access.scopeNote && <span className="accblk-levels__hint">{access.scopeNote}</span>}
        </div>
      )}

      {levels.length > 0 && (
        <div className="accblk-levels__row">
          <span className="accblk-levels__key">{isLadder ? 'Levels' : 'Pick one'}</span>
          <List className={clsx('accblk-ladder', isLadder ? 'accblk-ladder--steps' : 'accblk-ladder--options')}>
            {levels.map((level, index) => (
              <li key={level.id} className="accblk-ladder__step">
                {isLadder && index > 0 && (
                  <span className="accblk-ladder__arrow" aria-hidden="true">
                    <ChevronRight />
                  </span>
                )}
                <div className="accblk-ladder__body">
                  {isLadder && (
                    <span className="accblk-ladder__rung" aria-hidden="true">
                      {index + 1}
                    </span>
                  )}
                  <div className="accblk-ladder__text">
                    <span className="accblk-ladder__name">{level.label}</span>
                    {level.description && <span className="accblk-ladder__desc">{level.description}</span>}
                    {(ceilingByLevel[level.id] || []).map((roleId) => {
                      const role = findRole(roles, roleId);
                      return role ? (
                        <span key={roleId} className="accblk-ceiling">
                          <RoleChip role={role} />
                          <span>up to here</span>
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              </li>
            ))}
          </List>
        </div>
      )}

      {access.modifiers?.length > 0 && (
        <div className="accblk-levels__row">
          <span className="accblk-levels__key">Also</span>
          <ul className="accblk-modifiers">
            {access.modifiers.map((modifier) => (
              <li key={modifier.id} className="accblk-modifier">
                <span className="accblk-modifier__label">
                  {modifier.label}
                  <PlanTag plan={modifier.plan} />
                </span>
                {modifier.description && <span className="accblk-modifier__desc">{modifier.description}</span>}
                <Chips items={modifier.options} small />
                {modifier.href && (
                  <VLink href={modifier.href} className="accblk-modifier__link">
                    Learn more
                  </VLink>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {notes.length > 0 && (
        <ul className="accblk-notes">
          {notes.map(([roleId, note]) => {
            const role = findRole(roles, roleId);
            return (
              <li key={roleId} className="accblk-note">
                {role ? <RoleChip role={role} /> : <span>{roleId}</span>}
                <span className="accblk-note__text">{note}</span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

/**
 * One card per resource type (`id`), or a two-column grid of them (`ids`).
 * `resources` is the RESOURCES export of the page's data file; `roles` gives
 * the ceiling and note chips their names and colours.
 */
export default function AccessLevels({ resources = [], id, ids, roles = [], href, linkLabel = 'Configure in Groups' }) {
  const wanted = ids || (id ? [id] : []);
  const picked = wanted.map((rid) => resources.find((resource) => resource.id === rid)).filter(Boolean);
  if (picked.length === 0) return null;
  if (picked.length === 1) {
    return <LevelsCard resource={picked[0]} roles={roles} href={href} linkLabel={linkLabel} />;
  }
  return (
    <CardGrid columns={2}>
      {picked.map((resource) => (
        <LevelsCard key={resource.id} resource={resource} roles={roles} href={href} linkLabel={linkLabel} />
      ))}
    </CardGrid>
  );
}
