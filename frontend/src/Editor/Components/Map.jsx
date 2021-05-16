import React, { useEffect, useState, useCallback } from 'react';
import config from 'config';
import { GoogleMap, LoadScript } from '@react-google-maps/api';
import { Marker } from '@react-google-maps/api';

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
    defaultMarkers = JSON.parse(defaultMarkerValue)
  } catch (err) { console.log(err); }

  const addNewMarkersProp = component.definition.properties.addNewMarkers;
  const canAddNewMarkers = addNewMarkersProp ? addNewMarkersProp.value : false;

  const [gmap, setGmap] = useState(null);
  const [mapCenter, setMapCenter] = useState(JSON.parse(center));
  const [markers, setMarkers] = useState(defaultMarkers);

  useEffect(() => {
    onComponentOptionChanged(component, 'markers', markers);
  }, [markers.length]);

  const containerStyle = {
    width,
    height
  };

  function handleMapClick(e) {
    if(!canAddNewMarkers) { return }

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    const newMarkers = markers;
    newMarkers.push({ lat, lng });
    setMarkers(newMarkers);
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
    function onLoad (mapInstance) {
      setGmap(mapInstance);
    }
  )

  return (
    <div style={{ width, height }} onClick={() => onComponentClick(id, component)}>
      <LoadScript
        googleMapsApiKey={config.GOOGLE_MAPS_API_KEY}
      >
        <GoogleMap
          center={mapCenter}
          mapContainerStyle={containerStyle}
          zoom={12}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            draggable: true
          }}
          onLoad={onLoad}
          onClick={handleMapClick}
          onDragEnd={handleBoundsChange}
        >
          {markers.map((marker) =>
            <Marker
              position={marker}
              label={marker.label}
            />
          )}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};
