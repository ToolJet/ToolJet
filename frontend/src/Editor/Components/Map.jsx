import React, { useEffect, useState, useCallback } from 'react';
import config from 'config';
import { GoogleMap, LoadScript } from '@react-google-maps/api';
import { Marker } from '@react-google-maps/api';
import { resolveReferences } from '@/_helpers/utils';
import { Autocomplete } from '@react-google-maps/api';

export const Map = function Map({
  id,
  width,
  height,
  component,
  onComponentClick,
  currentState,
  onComponentOptionChanged,
  onComponentOptionsChanged,
  onEvent
}) {
  const center = component.definition.properties.initialLocation.value;
  const defaultMarkerValue = component.definition.properties.defaultMarkers.value;

  let defaultMarkers = []
  try {
    defaultMarkers = defaultMarkerValue
  } catch (err) { console.log(err); }

  const addNewMarkersProp = component.definition.properties.addNewMarkers;
  const canAddNewMarkers = addNewMarkersProp ? addNewMarkersProp.value : false;

  const canSearchProp = component.definition.properties.canSearch;
  const canSearch = canSearchProp ? canSearchProp.value : false;

  const [gmap, setGmap] = useState(null);
  const [autoComplete, setAutoComplete] = useState(null);
  const [mapCenter, setMapCenter] = useState(resolveReferences(JSON.parse(center), currentState, false));
  const [markers, setMarkers] = useState(resolveReferences(defaultMarkers, currentState, []));

  useEffect(() => {
    setMarkers(resolveReferences(defaultMarkers, currentState, false));
  }, [currentState]);

  const containerStyle = {
    width,
    height
  };

  const darkModeStyles = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#263c3f" }],
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.fill",
      stylers: [{ color: "#6b9a76" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#38414e" }],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#212a37" }],
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: "#9ca5b3" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#746855" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#1f2835" }],
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.fill",
      stylers: [{ color: "#f3d19c" }],
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: "#2f3948" }],
    },
    {
      featureType: "transit.station",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#17263c" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#515c6d" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#17263c" }],
    },
  ]


  function handleMapClick(e) {
    if(!canAddNewMarkers) { return }

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
      northEast: mapBounds.getNorthEast().toJSON(),
      southWest: mapBounds.getSouthWest().toJSON(),
    }

    const newCenter = gmap.center.toJSON();
    setMapCenter(newCenter);

    onComponentOptionsChanged(component, [
      ['bounds', bounds],
      ['center', newCenter]
    ]).then(() => onEvent('onBoundsChange', { component }));
  }

  const onLoad = useCallback(
    function onLoad(mapInstance) {
      setGmap(mapInstance);
      onComponentOptionsChanged(component, [
        ['center', mapInstance.center.toJSON()]
      ])
    }
  )

  function handleMarkerClick(index) {
    onComponentOptionChanged(component,
      'selectedMarker', markers[index]
    ).then(() => onEvent('onMarkerClick', { component }));
  }

  function onPlaceChanged() {
    const location = autoComplete.getPlace().geometry.location.toJSON();
    setMapCenter(location);
    handleBoundsChange();
  }

  function onAutocompleteLoad(autocompleteInstance) {
    setAutoComplete(autocompleteInstance);
  }

  return (
    <div style={{ width, height }} onClick={() => onComponentClick(id, component)} className="map-widget">
      <LoadScript
        googleMapsApiKey={config.GOOGLE_MAPS_API_KEY}
        libraries={["places"]}
      >
        <GoogleMap
          center={mapCenter}
          mapContainerStyle={containerStyle}
          zoom={12}
          options={{
            styles: localStorage.getItem('darkMode') === 'true' ? darkModeStyles : '',
            streetViewControl: false,
            mapTypeControl: false,
            draggable: true
          }}
          onLoad={onLoad}
          onClick={handleMapClick}
          onDragEnd={handleBoundsChange}
        >
          {canSearch &&
            <Autocomplete
                onPlaceChanged={onPlaceChanged}
                onLoad={onAutocompleteLoad}
              >
                <input
                  type="text"
                  placeholder="Search"
                  className="place-search-input"
                />
            </Autocomplete>
          }
          {Array.isArray(markers) &&
            <>
              {markers.map((marker, index) =>
                <Marker
                  position={marker}
                  label={marker.label}
                  onClick={(e) => handleMarkerClick(index)}
                />
              )}
            </>
          }
        </GoogleMap>
      </LoadScript>
    </div>
  );
};
