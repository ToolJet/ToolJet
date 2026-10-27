/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete, Polygon } from '@react-google-maps/api';
import { resolveWidgetFieldValue } from '@/_helpers/utils';
import { darkModeStyles } from './styles';
import { useTranslation } from 'react-i18next';
import './styles.scss';

// Static identity: useJsApiLoader warns (and can reload) when `libraries` is a new
// array each render.
const MAP_LIBRARIES = ['places'];

const toFiniteCoordinate = (value) => {
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
};

// A location is usable only when BOTH coordinates are finite numbers. Anything
// else fed into the Google SDK throws inside the Map/Marker internals and kills
// the widget subtree (and, pre-fix, every other Map on the page).
const sanitizeLocation = (value) => {
  const lat = toFiniteCoordinate(value?.lat);
  const lng = toFiniteCoordinate(value?.lng);
  if (lat === null || lng === null) return null;
  return { lat, lng };
};

const FALLBACK_CENTER = { lat: 0, lng: 0 };

export default function Map({
  id,
  width,
  height,
  darkMode,
  onComponentClick = () => {},
  onComponentOptionChanged = () => {},
  onComponentOptionsChanged = () => {},
  styles,
  setExposedVariable,
  setExposedVariables,
  dataCy,
  properties,
  fireEvent,
}) {
  const isInitialRender = useRef(true);
  const center = properties?.initialLocation ?? { lat: 0, lng: 0 };
  const { polygonPoints = [], defaultMarkers = [] } = properties;

  const { t } = useTranslation();

  const canAddNewMarkers = properties?.addNewMarkers ?? false;
  const canSearch = properties?.canSearch ?? false;
  const widgetVisibility = styles?.visibility ?? true;
  const disabledState = styles?.disabledState ?? false;

  const parsedDisabledState =
    typeof disabledState !== 'boolean' ? !!resolveWidgetFieldValue(disabledState) : disabledState;

  let parsedWidgetVisibility = widgetVisibility;

  try {
    parsedWidgetVisibility = resolveWidgetFieldValue(parsedWidgetVisibility);
  } catch (err) {
    console.log(err);
  }

  const [gmap, setGmap] = useState(null);
  const [autoComplete, setAutoComplete] = useState(null);
  const [mapCenter, setMapCenter] = useState(
    () => sanitizeLocation(resolveWidgetFieldValue(center)) ?? FALLBACK_CENTER
  );
  const [markers, setMarkers] = useState(defaultMarkers);
  // The first `idle` is the initial load settling, not a user viewport change:
  // it publishes bounds/center but must not fire onBoundsChange.
  const hasSettledOnceRef = useRef(false);

  // One window-level loader shared by EVERY Map instance (keyed by id). The
  // <LoadScript> component this replaces broke with multiple instances: a second
  // Map (e.g. inside a Modal) stayed on "Loading..." forever, and any instance's
  // unmount cleanup deleted window.google out from under the others.
  const { isLoaded } = useJsApiLoader({
    id: 'tooljet-google-maps-loader',
    googleMapsApiKey: window.public_config?.GOOGLE_MAPS_API_KEY,
    libraries: MAP_LIBRARIES,
  });

  const containerStyle = {
    width: '100%',
    height,
  };

  useEffect(() => {
    setMarkers(defaultMarkers);
  }, [JSON.stringify(defaultMarkers)]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('center', center);
  }, [center]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('markers', defaultMarkers);
  }, [defaultMarkers]);

  function handleMapClick(e) {
    if (parsedDisabledState || !canAddNewMarkers) {
      return;
    }

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    const newMarkers = [...markers];
    newMarkers.push({ lat, lng });
    setMarkers(newMarkers);
    setExposedVariable('markers', newMarkers);
    fireEvent('onCreateMarker');
    // onComponentOptionChanged(component, 'markers', newMarkers).then(() => fireEvent('onCreateMarker'));
  }

  function addMapUrlToJson(centerJson) {
    centerJson.googleMapUrl = `https://www.google.com/maps/@?api=1&map_action=map&center=${centerJson?.lat},${centerJson?.lng}`;
    return centerJson;
  }

  // Fires on the map's `idle` event — after EVERY settled viewport change (drag,
  // zoom, programmatic recenter), where the old drag-only listener missed zooms
  // entirely and left `bounds` empty until the first drag.
  function handleIdle() {
    if (!gmap) return;
    const mapBounds = gmap.getBounds();
    if (!mapBounds) return;

    const bounds = {
      northEast: mapBounds.getNorthEast()?.toJSON(),
      southWest: mapBounds.getSouthWest()?.toJSON(),
    };

    const newCenter = gmap.center?.toJSON();
    // Identity-stable sync: a fresh object every idle would change the GoogleMap
    // `center` prop, which re-centers the map, which fires `idle` again — an
    // infinite publish/event loop. Keep the previous state object when the
    // coordinates have not actually moved.
    setMapCenter((previous) =>
      previous && newCenter && previous.lat === newCenter.lat && previous.lng === newCenter.lng ? previous : newCenter
    );
    const exposedVariables = {
      bounds,
      center: addMapUrlToJson(newCenter),
    };
    setExposedVariables(exposedVariables);
    if (hasSettledOnceRef.current) {
      fireEvent('onBoundsChange');
    }
    hasSettledOnceRef.current = true;
  }

  useEffect(() => {
    if (isInitialRender.current) return;
    const resolvedCenter = sanitizeLocation(resolveWidgetFieldValue(center)) ?? FALLBACK_CENTER;
    setMapCenter(resolvedCenter);
    setExposedVariable('center', addMapUrlToJson(resolvedCenter));
    // onComponentOptionsChanged(component, [['center', addMapUrlToJson(resolvedCenter)]]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onLoad = useCallback(function onLoad(mapInstance) {
    setGmap(mapInstance);
    const centerJson = mapInstance.center?.toJSON();
    setExposedVariable('center', addMapUrlToJson(centerJson));
    // onComponentOptionsChanged(component, [['center', addMapUrlToJson(centerJson)]]);
  });

  function handleMarkerClick(markerEntry) {
    if (parsedDisabledState) return;
    setExposedVariable('selectedMarker', markerEntry);
    fireEvent('onMarkerClick');
    // onComponentOptionChanged(component, 'selectedMarker', markers[index]).then(() => fireEvent('onMarkerClick'));
  }

  function onPlaceChanged() {
    if (parsedDisabledState) return;
    const location = autoComplete?.getPlace()?.geometry?.location?.toJSON();
    if (!location) return;
    // Recenter to the PICKED place and publish it. The old code synchronously
    // called the bounds handler here, which read the STALE map instance (still at
    // the previous location) and clobbered the just-set center — the map never
    // moved and the app saw the old centre. Bounds now publish from the map's own
    // `idle` once it has actually moved.
    setMapCenter(location);
    setExposedVariable('center', addMapUrlToJson(location));
  }

  function onAutocompleteLoad(autocompleteInstance) {
    setAutoComplete(autocompleteInstance);
  }

  useEffect(() => {
    const resolvedCenter = sanitizeLocation(resolveWidgetFieldValue(center)) ?? FALLBACK_CENTER;
    const exposedVariables = {
      setLocation: async function (lat, lng) {
        // Finite-number coercion, not truthiness: 0 is a valid coordinate (the
        // old `if (lat && lng)` guard silently ignored the equator/prime meridian).
        const location = sanitizeLocation({ lat, lng });
        if (!location) return;
        setMapCenter(location);
        // The exposed center must follow the CSA, not wait for a drag.
        setExposedVariable('center', addMapUrlToJson(location));
      },
      center: addMapUrlToJson(resolvedCenter),
      markers: defaultMarkers,
    };

    setMapCenter(resolvedCenter);
    setExposedVariables(exposedVariables);
    isInitialRender.current = false;
  }, []);

  // Invalid entries (null, missing/garbage coordinates) are skipped so one bad
  // entry cannot throw inside the Marker SDK and hide every other marker. The
  // ORIGINAL entry rides along so a click exposes exactly what the app configured.
  const renderableMarkers = Array.isArray(markers)
    ? markers
        .map((marker) => ({ marker, position: sanitizeLocation(marker) }))
        .filter(({ position }) => position !== null)
    : [];

  return (
    <div
      data-disabled={parsedDisabledState}
      style={{ height, display: parsedWidgetVisibility ? '' : 'none', boxShadow: styles.boxShadow }}
      onClick={(event) => {
        event.stopPropagation();
        onComponentClick(id);
      }}
      className="map-widget"
      data-cy={dataCy}
    >
      <div
        className="map-center"
        style={{
          right: width * 0.5 - 18,
          top: height * 0.5 - 50,
        }}
      >
        <img className="mx-2" src="assets/images/icons/marker.svg" width="24" height="64" />
      </div>
      {isLoaded ? (
        <GoogleMap
          center={mapCenter}
          mapContainerStyle={containerStyle}
          zoom={12}
          options={{
            styles: darkMode === true ? darkModeStyles : '',
            streetViewControl: false,
            mapTypeControl: false,
            draggable: true,
          }}
          onLoad={onLoad}
          onClick={handleMapClick}
          onIdle={handleIdle}
        >
          {canSearch && (
            <Autocomplete onPlaceChanged={onPlaceChanged} onLoad={onAutocompleteLoad}>
              <input
                type="text"
                placeholder={t('globals.search', 'Search')}
                disabled={parsedDisabledState}
                className={`place-search-input ${darkMode && 'text-light bg-dark dark-theme-placeholder'}`}
              />
            </Autocomplete>
          )}
          {renderableMarkers.map(({ marker, position }, index) => (
            <Marker key={index} position={position} label={marker?.label} onClick={() => handleMarkerClick(marker)} />
          ))}
          {polygonPoints.length > 1 && (
            <Polygon
              path={polygonPoints}
              onClick={() => {
                fireEvent('onPolygonClick');
              }}
              options={{
                strokeColor: '#4d72fa',
                strokeOpacity: 1,
                strokeWeight: 2,
                fillColor: '#4d72fa',
                fillOpacity: 0.5,
              }}
            />
          )}
        </GoogleMap>
      ) : (
        <div className="map-loading-placeholder">{t('globals.loading', 'Loading...')}</div>
      )}
    </div>
  );
}
