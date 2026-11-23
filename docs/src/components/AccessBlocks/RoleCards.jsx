import React from 'react';
import clsx from 'clsx';
import CardGrid from '../DocBlocks/CardGrid';
import ConfigCard from '../DocBlocks/ConfigCard';
import { roleToneClass } from './RoleChip';
import './AccessBlocks.css';

/** One ConfigCard per role, in the role's colour: icon, kind, name, description and "can" bullets. */
export default function RoleCards({ roles = [], columns }) {
  if (roles.length === 0) return null;
  return (
    <CardGrid columns={columns || roles.length}>
      {roles.map((role) => (
        <div key={role.id} className={clsx('accblk-role-card', roleToneClass(role))}>
          <ConfigCard
            icon={role.icon}
            label={role.kind}
            title={role.label}
            description={role.description}
            features={role.highlights}
            href={role.href}
          />
        </div>
      ))}
    </CardGrid>
  );
}
