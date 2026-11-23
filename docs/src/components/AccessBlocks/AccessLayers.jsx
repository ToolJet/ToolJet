import React from 'react';
import clsx from 'clsx';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Card from '../DocBlocks/Card';
import RoleChip from './RoleChip';
import PlanTag from './PlanTag';
import VLink from './VLink';
import './AccessBlocks.css';

const layerRoles = (layer, roles) =>
  (layer.roles || []).map((id) => roles.find((role) => role.id === id)).filter(Boolean);

/** The one-line "you are here" strip used at the top of the other pages. */
function Strip({ layers, highlight }) {
  return (
    <ol className="accblk-strip" aria-label="Where access is decided">
      {layers.map((layer, index) => {
        const current = layer.id === highlight;
        const text = layer.short || layer.label;
        return (
          <li key={layer.id} className="accblk-strip__item">
            {index > 0 && <ChevronRight className="accblk-strip__sep" aria-hidden="true" />}
            {layer.href && !current ? (
              <VLink href={layer.href} className="accblk-strip__link">
                {text}
              </VLink>
            ) : (
              <span
                className={clsx('accblk-strip__link', current && 'accblk-strip__link--current')}
                aria-current={current ? 'true' : undefined}
              >
                {text}
                {current && <span className="accblk-sr-only"> (this page)</span>}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Where access is decided, from the instance down to inside an app. The full
 * form is a narrowing stack of linked cards; `compact` renders the strip.
 */
export default function AccessLayers({ layers = [], roles = [], compact = false, highlight }) {
  if (compact) return <Strip layers={layers} highlight={highlight} />;

  return (
    <ol className="accblk-layers">
      {layers.map((layer, index) => {
        const decided = layerRoles(layer, roles);
        return (
          <li key={layer.id} className="accblk-layers__item" style={{ '--accblk-depth': index }}>
            <Card href={layer.href} className="accblk-layer">
              <span className="accblk-layer__index" aria-hidden="true">
                {index + 1}
              </span>
              <div className="accblk-layer__body">
                <div className="accblk-layer__title">
                  {layer.label}
                  <PlanTag plan={layer.plan} />
                </div>
                <div className="accblk-layer__by">
                  <span className="accblk-layer__by-label">Decided by</span>
                  {decided.length > 0
                    ? decided.map((role) => <RoleChip key={role.id} role={role} />)
                    : layer.decidedBy && <span className="accblk-layer__by-text">{layer.decidedBy}</span>}
                </div>
                <div className="accblk-layer__desc">{layer.description}</div>
              </div>
            </Card>
            {index < layers.length - 1 && (
              <span className="accblk-layers__arrow" aria-hidden="true">
                <ChevronDown />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
