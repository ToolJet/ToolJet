import React from 'react';
import PlanBadge from '../PlanBadge';
import './AccessBlocks.css';

/** A plan badge sized for use inside a block (a matrix row, a layer title, a modifier). */
export default function PlanTag({ plan }) {
  if (!plan) return null;
  return (
    <span className="accblk-plan">
      <PlanBadge type={plan} />
    </span>
  );
}
