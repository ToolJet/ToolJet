import React, { useState, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, Autocomplete } from '@react-google-maps/api';
import { resolveReferences, resolveWidgetFieldValue } from '@/_helpers/utils';
import { darkModeStyles } from './styles';

export const Map = function Map({
  id,
  width,
  height,
  component,
  darkMode,
  onComponentClick,
  currentState,
  onComponentOptionChanged,
  onComponentOptionsChanged,
  onEvent,
}) {
  const center = component.definition.properties.initialLocation.value;
  const defaultMarkerValue = component.definition.properties.defaultMarkers.value;

  let defaultMarkers = [];
  try {
    defaultMarkers = defaultMarkerValue;
  } catch (err) {
    console.log(err);
  }

  const addNewMarkersProp = component.definition.properties.addNewMarkers;
  const canAddNewMarkers = addNewMarkersProp ? addNewMarkersProp.value : false;

  const canSearchProp = component.definition.properties.canSearch;
  const canSearch = canSearchProp ? canSearchProp.value : false;
  const widgetVisibility = component.definition.styles?.visibility?.value ?? true;
  const disabledState = component.definition.styles?.disabledState?.value ?? false;

  const parsedDisabledState =
    typeof disabledState !== 'boolean' ? resolveWidgetFieldValue(disabledState, currentState) : disabledState;

  let parsedWidgetVisibility = widgetVisibility;

  try {
    parsedWidgetVisibility = resolveReferences(parsedWidgetVisibility, currentState, []);
  } catch (err) {
    console.log(err);
  }

  const [gmap, setGmap] = useState(null);
  const [autoComplete, setAutoComplete] = useState(null);
  const [mapCenter, setMapCenter] = useState(resolveReferences(center, currentState));
  const [markers, setMarkers] = useState(resolveReferences(defaultMarkers, currentState));

  const containerStyle = {
    width,
    height,
  };

  function handleMapClick(e) {
    if (!canAddNewMarkers) {
      return;
    }

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    const newMarkers = markers;
    newMarkers.push({ lat, lng });
    setMarkers(newMarkers);

    onComponentOptionChanged(component, 'markers', newMarkers).then(() => onEvent('onCreateMarker', { component }));
  }

  function handleBoundsChange() {
    const mapBounds = gmap.getBounds();

    const bounds = {
      northEast: mapBounds.getNorthEast()?.toJSON(),
      southWest: mapBounds.getSouthWest()?.toJSON(),
    };

    const newCenter = gmap.center?.toJSON();
    setMapCenter(newCenter);

    onComponentOptionsChanged(component, [
      ['bounds', bounds],
      ['center', newCenter],
    ]).then(() => onEvent('onBoundsChange', { component }));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onLoad = useCallback(function onLoad(mapInstance) {
    setGmap(mapInstance);
    onComponentOptionsChanged(component, [['center', mapInstance.center?.toJSON()]]);
  });

  function handleMarkerClick(index) {
    onComponentOptionChanged(component, 'selectedMarker', markers[index]).then(() =>
      onEvent('onMarkerClick', { component })
    );
  }

  function onPlaceChanged() {
    const location = autoComplete.getPlace().geometry.location?.toJSON();
    setMapCenter(location);
    handleBoundsChange();
  }

  function onAutocompleteLoad(autocompleteInstance) {
    setAutoComplete(autocompleteInstance);
  }

  return (
    <div
      data-disabled={parsedDisabledState}
      style={{ width, height, display: parsedWidgetVisibility ? '' : 'none' }}
      onClick={(event) => {
        event.stopPropagation();
        onComponentClick(id, component, event);
      }}
      className="map-widget"
    >
      <div
        className="map-center"
        style={{
          right: width * 0.5 - 18,
          top: height * 0.5 - 50,
        }}
      >
        <img className="mx-2" src="/assets/images/icons/marker.svg" width="24" height="64" />
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
              <input type="text" placeholder="Search" className="place-search-input" />
            </Autocomplete>
          )}
          {Array.isArray(markers) && (
            <>
              {markers.map((marker, index) => (
                <Marker key={index} position={marker} label={marker.label} onClick={() => handleMarkerClick(index)} />
              ))}
            </>
          )}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};
