import React from 'react';
import clsx from 'clsx';
import Card, { CardIcon } from './Card';

/** Icon, title and short description, with an optional badge ("Paid" is amber, any other text blue). */
export default function FeatureCard({ icon, title, description, href, badge }) {
  return (
    <Card href={href} className="docblk-feature">
      {(icon || badge) && (
        <div className="docblk-feature__top">
          <CardIcon>{icon}</CardIcon>
          {badge && (
            <span className={clsx('docblk-badge', badge === 'Paid' && 'docblk-badge--paid')}>
              {badge}
            </span>
          )}
        </div>
      )}
      <div>
        <div className="docblk-feature__title">{title}</div>
        <div className="docblk-feature__description">{description}</div>
      </div>
    </Card>
  );
}
