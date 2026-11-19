import React from 'react';
import clsx from 'clsx';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Card, { CardFeatures, CardIcon } from './Card';

/** Product capability card: icon, optional badge, bullet list and optional screenshot. */
export default function CapabilityCard({ icon, title, description, img, href, features, badge }) {
  const imgSrc = useBaseUrl(img);

  return (
    <Card href={href} className="docblk-capability">
      <div
        className={clsx(
          'docblk-capability__body',
          img ? 'docblk-capability__body--with-media' : 'docblk-capability__body--fill'
        )}
      >
        {(icon || badge) && (
          <div className="docblk-capability__top">
            <CardIcon>{icon}</CardIcon>
            {badge && <span className="docblk-capability__badge">{badge}</span>}
          </div>
        )}
        <div className="docblk-capability__title">{title}</div>
        <div className="docblk-capability__description">{description}</div>
        <CardFeatures items={features} />
      </div>
      {img && (
        <div className="docblk-capability__media">
          {/* The title sits right above, so the screenshot adds nothing for a screen reader. */}
          <img className="docblk-capability__img" src={imgSrc} alt="" loading="lazy" decoding="async" />
        </div>
      )}
    </Card>
  );
}
