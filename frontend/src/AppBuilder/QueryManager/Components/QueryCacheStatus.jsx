import React from 'react';

export const QueryCacheStatus = ({ cache }) => {
  if (!cache || !['hit', 'miss', 'refresh', 'bypass'].includes(cache.status)) return null;
  let label;
  if (cache.status === 'hit') {
    label = 'Cache hit';
    if (Number.isFinite(cache.ageMs) && cache.ageMs >= 0) {
      const seconds = Math.floor(cache.ageMs / 1000);
      const age = seconds < 60 ? `${seconds} sec` : `${Math.floor(seconds / 60)} min`;
      label += ` · saved ${age} before this run`;
    }
  } else if (cache.status === 'bypass') {
    label = 'Cache bypassed';
  } else {
    label = `Cache ${cache.status} · ${cache.stored === true ? 'saved' : 'not saved'}`;
  }
  return (
    <span role="status" aria-label="Query cache status" className="tw-text-xs tw-text-text-placeholder tw-mx-2">
      {label}
    </span>
  );
};
