import React, { Suspense } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { fetchEdition } from './utils';

const BlankComponent: ComponentType<any> = () => null;

type EditionSlots<P> = {
  ce?: ComponentType<P>;
  ee?: ComponentType<P>;
  cloud?: ComponentType<P>;
};

// Requires at least one of ce/ee/cloud to be passed, rest stay optional.
type RequireAtLeastOne<T> = { [K in keyof T]: Pick<Required<T>, K> & Partial<T> }[keyof T];

export type PickEditionSpecificComponentParams<P extends object = Record<string, unknown>> = RequireAtLeastOne<
  EditionSlots<P>
> & {
  /** Treat `cloud` as `ee` when `cloud` isn't explicitly provided. */
  cloudSameAsEE?: boolean;
  /** Suspense fallback shown while a lazy-loaded edition component is being fetched. */
  fallback?: ReactNode;
};

export function pickEditionSpecificComponent<P extends object = Record<string, unknown>>({
  ce,
  ee,
  cloud,
  cloudSameAsEE = false,
  fallback = null,
}: PickEditionSpecificComponentParams<P>): ComponentType<P> {
  // The type above requires at least one of ce/ee/cloud, but checkJs is off for .jsx
  // callers, so this is the only thing that catches an empty call at those sites.
  if (process.env.NODE_ENV !== 'production' && !ce && !ee && !cloud) {
    console.warn('pickEditionSpecificComponent: none of ce/ee/cloud were provided — every edition will render blank.');
  }

  const edition = fetchEdition();
  const resolvedCloud = cloudSameAsEE ? cloud ?? ee : cloud;
  const Resolved = (edition === 'ee' ? ee : edition === 'cloud' ? resolvedCloud : ce) ?? BlankComponent;

  return function EditionComponent(props: P) {
    return (
      <Suspense fallback={fallback}>
        <Resolved {...props} />
      </Suspense>
    );
  };
}
