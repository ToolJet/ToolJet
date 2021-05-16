import React from 'react';
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
  onEvent
}) {
  const center = component.definition.properties.initialLocation.value;
  const defaultMarkerValue = component.definition.properties.defaultMarkers.value;
  const defaultMarkers = defaultMarkerValue ? JSON.parse(defaultMarkerValue) : [];

  const containerStyle = {
    width,
    height
  };


  return (
    <div style={{ width, height }} onClick={() => onComponentClick(id, component)}>
      <LoadScript
        googleMapsApiKey={config.GOOGLE_MAPS_API_KEY}
      >
        <GoogleMap
          center={JSON.parse(center)}
          mapContainerStyle={containerStyle}
          zoom={12}
          options={{
            streetViewControl: false,
            mapTypeControl: false

          }}
        >
          {defaultMarkers.map((marker) =>
            <Marker
              position={marker}
            />
          )}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};
