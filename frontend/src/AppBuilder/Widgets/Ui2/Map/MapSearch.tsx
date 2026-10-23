import React, { useEffect, useRef, useState } from 'react';
import { Spinner } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { isEnter } from '@/AppBuilder/Widgets/Ui2/_shared/keyboard';
import { GeocoderAnswerTooLarge, geocode } from './mapLayers';
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
  // The geocoder searched, by its URL: Map hands over the same `live` ref each render, so a new geocoderUrl alone
  // neither restarted a search nor withdrew the places the old one found, and those could still be picked.
  const provider = live.current.geocoder.search;
  // The places found, with the query and the geocoder they were found for: a place answers only that query, so Enter
  // on a new query during the pause before its search never picks the last query's place.
  const [found, setFound] = useState<{ query: string; provider: string; places: Place[] }>({
    query: '',
    provider: '',
    places: [],
  });
  const results = found.query === query.trim() && found.provider === provider ? found.places : [];
  const setResults = (places: Place[]) => setFound({ query: query.trim(), provider, places });
  const [searching, setSearching] = useState(false);
  // A failure belongs to the query and the geocoder that failed, like their places: a new query's pause before its
  // search shows no message from the last one.
  const [failure, setFailure] = useState({ query: '', provider: '', message: '' });
  const searchError = failure.query === query.trim() && failure.provider === provider ? failure.message : '';
  const setSearchError = (message: string) => setFailure({ query: query.trim(), provider, message });
  // The query Enter asked for, when the geocoder does not search as you type, and which press it was: Enter again on
  // the same query after a failure is a new attempt, so it searches again.
  const [submitted, setSubmitted] = useState('');
  const [attempt, setAttempt] = useState(0);
  // Enter while that query's search runs starts no second one.
  const submit = (q: string) => {
    if (searching && submitted === q) return;
    setSubmitted(q);
    setAttempt((n) => n + 1);
  };
  // The label of the place just chosen fills the box; it is not searched for again.
  const chosenRef = useRef('');
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3 || typeof fetch !== 'function' || query === chosenRef.current || (!typeAhead && submitted !== q)) {
      setFound({ query: '', provider: '', places: [] });
      setSearching(false);
      return undefined;
    }
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = setTimeout(
      () => {
        setSearching(true);
        geocode(provider, { query: q }, controller?.signal)
          .then((places) => {
            if (places) {
              setFound({ query: q, provider, places });
              setFailure({ query: q, provider, message: places.length ? '' : 'No places found' });
            }
          })
          .catch((error) =>
            setFailure({
              query: q,
              provider,
              message:
                error instanceof GeocoderAnswerTooLarge
                  ? "The geocoder's answer is too large to show"
                  : 'Search is unavailable right now',
            })
          )
          .finally(() => setSearching(false));
      },
      typeAhead ? SEARCH_DELAY_MS : 0
    );
    return () => {
      clearTimeout(timer);
      controller?.abort();
    };
  }, [query, submitted, attempt, typeAhead, provider]);
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
    submit,
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
  const { query, setQuery, results, setResults, searching, searchError, submitted, submit, chosenRef, choosePlace } =
    search;
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
          if (disabled) return;
          // The Enter that confirms IME characters (Japanese, Chinese, Korean) neither searches nor picks a place.
          if (isEnter(e) && results[0]) choosePlace(results[0]);
          else if (isEnter(e) && !typeAhead) submit(query.trim());
          if (e.key === 'Escape') setResults([]);
        }}
      />
      {searching ? <Spinner className="sc-map-search-spin tw-h-3.5 tw-w-3.5" /> : null}
      {results.length ? (
        <ul className="sc-map-search-results" role="listbox">
          {results.map((r, i) => (
            <li key={`${r.lat},${r.lng},${i}`} role="option" aria-selected={false}>
              {/* Disabled with the map: a suggestion already open moved the map, set pickedLocation and fired
                  onLocationPicked once the map was disabled or loading, and Tab then Enter reached it under the
                  loading veil. */}
              <button type="button" disabled={disabled} onClick={() => !disabled && choosePlace(r)}>
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
