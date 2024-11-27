/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, LoadScript, Marker, Autocomplete, Polygon } from '@react-google-maps/api';
import { resolveWidgetFieldValue } from '@/_helpers/utils';
import { darkModeStyles } from './styles';
import { useTranslation } from 'react-i18next';

export const Map = function Map({
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

  // const parsedDisabledState =
  //   typeof disabledState !== 'boolean' ? resolveWidgetFieldValue(disabledState) : disabledState;

  let parsedWidgetVisibility = widgetVisibility;

  try {
    parsedWidgetVisibility = resolveWidgetFieldValue(parsedWidgetVisibility);
  } catch (err) {
    console.log(err);
  }

  const [gmap, setGmap] = useState(null);
  const [autoComplete, setAutoComplete] = useState(null);
  const [mapCenter, setMapCenter] = useState(() => resolveWidgetFieldValue(center));
  const [markers, setMarkers] = useState(defaultMarkers);

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
    if (!canAddNewMarkers) {
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

  function handleBoundsChange() {
    const mapBounds = gmap.getBounds();

    const bounds = {
      northEast: mapBounds.getNorthEast()?.toJSON(),
      southWest: mapBounds.getSouthWest()?.toJSON(),
    };

    const newCenter = gmap.center?.toJSON();
    setMapCenter(newCenter);
    const exposedVariables = {
      bounds,
      center: addMapUrlToJson(newCenter),
    };
    setExposedVariables(exposedVariables);
    fireEvent('onBoundsChange');
    // onComponentOptionsChanged(component, [
    //   ['bounds', bounds],
    //   ['center', addMapUrlToJson(newCenter)],
    // ]).then(() => fireEvent('onBoundsChange'));
  }

  useEffect(() => {
    if (isInitialRender.current) return;
    const resolvedCenter = resolveWidgetFieldValue(center);
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

  function handleMarkerClick(index) {
    setExposedVariable('selectedMarker', markers[index]);
    fireEvent('onMarkerClick');
    // onComponentOptionChanged(component, 'selectedMarker', markers[index]).then(() => fireEvent('onMarkerClick'));
  }

  function onPlaceChanged() {
    const location = autoComplete.getPlace().geometry.location?.toJSON();
    setMapCenter(location);
    handleBoundsChange();
  }

  function onAutocompleteLoad(autocompleteInstance) {
    setAutoComplete(autocompleteInstance);
  }

  useEffect(() => {
    const resolvedCenter = resolveWidgetFieldValue(center);
    const exposedVariables = {
      setLocation: async function (lat, lng) {
        if (lat && lng) setMapCenter(resolveWidgetFieldValue({ lat, lng }));
      },
      center: addMapUrlToJson(resolvedCenter),
      markers: defaultMarkers,
    };

    setMapCenter(resolvedCenter);
    setExposedVariables(exposedVariables);
    isInitialRender.current = false;
  }, []);

  return (
    <div
      data-disabled={disabledState}
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
      <LoadScript googleMapsApiKey={window.public_config.GOOGLE_MAPS_API_KEY} libraries={['places']}>
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
          onDragEnd={handleBoundsChange}
        >
          {canSearch && (
            <Autocomplete onPlaceChanged={onPlaceChanged} onLoad={onAutocompleteLoad}>
              <input
                type="text"
                placeholder={t('globals.search', 'Search')}
                className={`place-search-input ${darkMode && 'text-light bg-dark dark-theme-placeholder'}`}
              />
            </Autocomplete>
          )}
          {Array.isArray(markers) && (
            <>
              {markers.map((marker, index) => (
                <Marker key={index} position={marker} label={marker.label} onClick={() => handleMarkerClick(index)} />
              ))}
            </>
          )}
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
      </LoadScript>
    </div>
  );
};
