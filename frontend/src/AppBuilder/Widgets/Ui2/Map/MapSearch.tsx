import React, { useEffect, useRef, useState } from 'react';
import { Spinner } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { geocode } from './mapLayers';
import { hasSize } from './mapIcons';
import type { MutableRefObject } from 'react';
import type { LeafletMap } from 'leaflet';
import type { LatLng, MapLive, Place } from './mapTypes';

const SEARCH_DELAY_MS = 600;

/** The address search: the query, the places found and the one chosen (the map goes there; with pickLocation it is
 *  the picked spot). */
export const useMapSearch = ({
  live,
  mapRef,
  pick,
  typeAhead,
}: {
  live: MutableRefObject<MapLive>;
  mapRef: MutableRefObject<LeafletMap | null>;
  pick: (at: LatLng | null, options?: { quiet?: boolean; address?: string }) => void;
  typeAhead: boolean;
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  // The query Enter asked for, when the geocoder does not search as you type.
  const [submitted, setSubmitted] = useState('');
  // The label of the place just chosen fills the box; it is not searched for again.
  const chosenRef = useRef('');
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3 || typeof fetch !== 'function' || query === chosenRef.current || (!typeAhead && submitted !== q)) {
      setResults([]);
      setSearching(false);
      return undefined;
    }
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = setTimeout(
      () => {
        setSearching(true);
        geocode(live.current.geocoder.search, { query: q }, controller?.signal)
          .then((places) => {
            if (places) {
              setResults(places);
              setSearchError(places.length ? '' : 'No places found');
            }
          })
          .catch(() => setSearchError('Search is unavailable right now'))
          .finally(() => setSearching(false));
      },
      typeAhead ? SEARCH_DELAY_MS : 0
    );
    return () => {
      clearTimeout(timer);
      controller?.abort();
    };
  }, [query, submitted, typeAhead, live]);
  const choosePlace = (place: Place) => {
    const map = mapRef.current;
    setResults([]);
    setSearchError('');
    chosenRef.current = place.label;
    setQuery(place.label);
    if (map) map.setView([place.lat, place.lng], Math.max(map.getZoom(), 16), { animate: hasSize(map) });
    if (live.current.pickLocation) pick(place, { address: place.label });
  };
  return {
    query,
    setQuery,
    results,
    setResults,
    searching,
    searchError,
    submitted,
    setSubmitted,
    chosenRef,
    choosePlace,
  };
};

export const MapSearch = ({
  search,
  disabled,
  placeholder,
  typeAhead,
}: {
  search: ReturnType<typeof useMapSearch>;
  disabled: boolean;
  placeholder: string;
  typeAhead: boolean;
}) => {
  const {
    query,
    setQuery,
    results,
    setResults,
    searching,
    searchError,
    submitted,
    setSubmitted,
    chosenRef,
    choosePlace,
  } = search;
  return (
    <div className="sc-map-search" role="search">
      <input
        type="search"
        value={query}
        disabled={disabled}
        placeholder={placeholder || 'Search for an address'}
        aria-label={placeholder || 'Search for an address'}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && results[0]) choosePlace(results[0]);
          else if (e.key === 'Enter' && !typeAhead) setSubmitted(query.trim());
          if (e.key === 'Escape') setResults([]);
        }}
      />
      {searching ? <Spinner className="sc-map-search-spin tw-h-3.5 tw-w-3.5" /> : null}
      {results.length ? (
        <ul className="sc-map-search-results" role="listbox">
          {results.map((r, i) => (
            <li key={`${r.lat},${r.lng},${i}`} role="option" aria-selected={false}>
              <button type="button" onClick={() => choosePlace(r)}>
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      ) : searchError && query.trim().length >= 3 && !searching ? (
        <div className="sc-map-search-note">{searchError}</div>
      ) : !typeAhead && query.trim().length >= 3 && submitted !== query.trim() && query !== chosenRef.current ? (
        <div className="sc-map-search-note">Press Enter to search</div>
      ) : null}
    </div>
  );
};
