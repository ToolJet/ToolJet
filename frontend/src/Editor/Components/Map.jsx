import React from 'react';
import { GoogleMap, LoadScript } from '@react-google-maps/api';
import config from 'config';

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
  // const label = component.definition.properties.label.value;

  const center = {
    lat: 40.7128,
    lng: -73.935242
  };

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
          center={center}
          mapContainerStyle={containerStyle}
          zoom={12}
          options={{
            streetViewControl: false,
            mapTypeControl: false

          }}
        >
          { /* Child components, such as markers, info windows, etc. */ }
          <></>
        </GoogleMap>
      </LoadScript>
    </div>
  );
};
