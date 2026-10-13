// ToolJet UI 2.0 pack: the Map (Widgets/Shadcn/ShadMap.jsx), markers from rows on open raster tiles (no API key):
// delivery stops, stores, sites, assets in the field. Data-driven like the other sections: every part is a property
// the visual builder edits.
import { ARRAY, NUMBER, STRING, action, code, colorStyle, shadConfig, sizeStyle, toggle } from './shadcnPackHelpers.js';

const STOPS =
  "{{[{ id: 'S-101', customer: 'Ferry Building Market', address: '1 Ferry Building', status: 'Delivered', eta: '9:10 AM', driver: 'Maya Chen', lat: 37.7955, lng: -122.3937 }, { id: 'S-102', customer: 'Dolores Bakery', address: '3498 18th St', status: 'Delivered', eta: '9:40 AM', driver: 'Maya Chen', lat: 37.7614, lng: -122.4269 }, { id: 'S-103', customer: 'Mission Bay Labs', address: '1700 Owens St', status: 'In transit', eta: '10:25 AM', driver: 'Owen Hart', lat: 37.7683, lng: -122.3934 }, { id: 'S-104', customer: 'Sunset Florist', address: '1101 Irving St', status: 'Delayed', eta: '11:05 AM', driver: 'Owen Hart', lat: 37.7641, lng: -122.4703 }, { id: 'S-105', customer: 'Wharf Seafood Co.', address: '2800 Leavenworth St', status: 'Scheduled', eta: '11:30 AM', driver: 'Priya Nair', lat: 37.8063, lng: -122.4182 }, { id: 'S-106', customer: 'Union Square Books', address: '345 Stockton St', status: 'Failed', eta: '10:50 AM', driver: 'Priya Nair', lat: 37.7881, lng: -122.4065 }, { id: 'S-107', customer: 'Hayes Valley Cafe', address: '432 Octavia St', status: 'Delivered', eta: '9:55 AM', driver: 'Leo Martins', lat: 37.7764, lng: -122.4241 }, { id: 'S-108', customer: 'Presidio Outfitters', address: '50 Moraga Ave', status: 'Pending', eta: '12:15 PM', driver: 'Leo Martins', lat: 37.7989, lng: -122.4662 }]}}";

export const shadMapConfig = shadConfig({
  name: 'ShadMap',
  displayName: 'Map',
  description:
    "Map with markers from rows, on open map tiles (no API key): delivery stops, stores, sites, field assets, incidents. data: rows read through latField and lngField (numbers or numeric text; rows without valid coordinates, or at exactly 0, 0, are skipped and counted in a footnote), titleField, subtitleField (a second line: the address), statusField (the pin's colour, toned by its words: Delivered green, Delayed or Pending amber, Failed red, Open, Scheduled or In transit blue; or a tone name success | warning | danger | info) and idField. A click on a marker selects it (selectedMarker: its row, selectedMarkerId), opens a popup with the title, status and popupFields (a comma list of field specs as the Record list's metaFields: 'driver', 'eta:ETA {}', 'total|currency', 'due|date:Due {}'; showPopup off for none) and fires onMarkerClick; a click on the map clears it, exposes clickedLocation { lat, lng } and fires onMapClick. clusterMarkers groups nearby markers into counts (on by default; keeps thousands of rows smooth; a click on a count zooms in). fitToMarkers (on by default) opens the map on all markers and refits when data changes; off, it opens on defaultCenter ({ lat, lng }, [lat, lng] or 'lat, lng') at defaultZoom (1 to 18; 12 is a city, 15 a street). Exposes center { lat, lng }, zoom and bounds { northEast, southWest } after every move; onBoundsChange fires when the user pans or zooms. Actions: setCenter(lat, lng, zoom), setZoom(zoom), fitBounds() (back to all markers), selectMarker(id) (opens its popup and brings it into view), clearSelection(). Tiles follow the app theme (light or dark basemap); tileUrl ({z}/{x}/{y} template) and tileAttribution override them for one widget. Height: fixed (the map fills it); give it 320 to 640px, the full height of a page column beside a list",
  defaultSize: { width: 20, height: 420 },
  properties: {
    data: code('Data (rows with coordinates)', ARRAY, [], {
      placeholder: "[{ id: 1, name: 'Ferry Building', lat: 37.7955, lng: -122.3937, status: 'Delivered' }]",
    }),
    latField: code('Latitude field', STRING, 'lat'),
    lngField: code('Longitude field', STRING, 'lng'),
    titleField: code('Title field', STRING, 'name'),
    subtitleField: code('Second line field', STRING, ''),
    statusField: code('Status field (pin colour, toned by its words)', STRING, 'status'),
    idField: code('Id field', STRING, 'id'),
    popupFields: code("Popup fields (comma list; 'eta:ETA {}', 'total|currency')", STRING, ''),
    showPopup: toggle('Show a popup on marker click', true),
    clusterMarkers: toggle('Group nearby markers', true),
    fitToMarkers: toggle('Fit the view to the markers', true),
    defaultCenter: code(
      'Default center ({ lat, lng })',
      { type: 'union', schemas: [STRING, ARRAY, { type: 'object' }] },
      '',
      {
        placeholder: '{{ { lat: 37.7749, lng: -122.4194 } }}',
      }
    ),
    defaultZoom: code('Default zoom (1 to 18)', NUMBER, 12),
    emptyText: code('Empty text', STRING, 'No locations to show'),
    tileUrl: code('Tile URL (empty for the default basemap)', STRING, '', {
      placeholder: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    }),
    tileAttribution: code('Tile attribution', STRING, ''),
  },
  defaults: {
    data: { value: STOPS },
    latField: { value: 'lat' },
    lngField: { value: 'lng' },
    titleField: { value: 'customer' },
    subtitleField: { value: 'address' },
    statusField: { value: 'status' },
    idField: { value: 'id' },
    popupFields: { value: 'eta:ETA {}, driver' },
    showPopup: { value: '{{true}}' },
    clusterMarkers: { value: '{{true}}' },
    fitToMarkers: { value: '{{true}}' },
    defaultCenter: { value: '' },
    defaultZoom: { value: '{{12}}' },
    emptyText: { value: 'No locations to show' },
    tileUrl: { value: '' },
    tileAttribution: { value: '' },
  },
  styles: {
    backgroundColor: colorStyle('Background (behind the tiles)'),
    borderColor: colorStyle('Border color'),
    accentColor: colorStyle('Accent (pins without a status, groups, the selection)'),
    borderRadius: sizeStyle('Radius'),
  },
  events: {
    onMarkerClick: { displayName: 'On marker click' },
    onMapClick: { displayName: 'On map click' },
    onBoundsChange: { displayName: 'On bounds change' },
  },
  exposedVariables: {
    selectedMarker: {},
    selectedMarkerId: null,
    clickedLocation: {},
    center: {},
    zoom: 12,
    bounds: {},
  },
  actions: [
    action('setCenter', 'Set center', [
      ['lat', 'Latitude', '{{37.7749}}'],
      ['lng', 'Longitude', '{{-122.4194}}'],
      ['zoom', 'Zoom (optional)', ''],
    ]),
    action('setZoom', 'Set zoom', [['zoom', 'Zoom', '{{14}}']]),
    action('fitBounds', 'Fit to markers'),
    action('selectMarker', 'Select marker', [['id', 'Marker id', '']]),
    action('clearSelection', 'Clear selection'),
  ],
});
