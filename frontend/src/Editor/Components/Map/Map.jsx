import React, { useState, useCallback, useEffect } from 'react';
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
  // canvasWidth,
  registerAction,
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
  const canAddNewMarkers = addNewMarkersProp ? resolveReferences(addNewMarkersProp.value, currentState) : false;

  const canSearchProp = component.definition.properties.canSearch;
  const canSearch = canSearchProp ? resolveReferences(canSearchProp.value, currentState) : false;
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
    width: '100%',
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

    onComponentOptionsChanged(component, [
      ['bounds', bounds],
      ['center', addMapUrlToJson(newCenter)],
    ]).then(() => onEvent('onBoundsChange', { component }));
  }

  useEffect(() => {
    const resolvedCenter = resolveReferences(center, currentState);
    setMapCenter(resolvedCenter);
    onComponentOptionsChanged(component, [['center', addMapUrlToJson(resolvedCenter)]]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onLoad = useCallback(function onLoad(mapInstance) {
    setGmap(mapInstance);
    const centerJson = mapInstance.center?.toJSON();
    onComponentOptionsChanged(component, [['center', addMapUrlToJson(centerJson)]]);
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

  registerAction('setLocation', async function (lat, lng) {
    if (lat && lng) setMapCenter(resolveReferences({ lat, lng }, currentState));
  });

  return (
    <div
      data-disabled={parsedDisabledState}
      style={{ height, display: parsedWidgetVisibility ? '' : 'none' }}
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
