---
id: map
title: Map
---

<div className="badge badge--primary">Ant Design</div>

The **Map** component shows locations from your data as pins on an interactive map, with optional routes, areas and a heat layer. Use it to track deliveries, stores or field staff, or to let users pick a location.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Data (rows with coordinates) | The locations to show, usually a query's data, one row per pin with a latitude and a longitude. Rows without valid coordinates are skipped. | Array |
| Latitude field | Field in **Data** that holds the latitude. | Text. Default: `lat` |
| Longitude field | Field in **Data** that holds the longitude. | Text. Default: `lng` |
| Title field | Field shown as the title in a pin's popup. | Text. Default: `name` |
| Second line field | Field shown under the title in a pin's popup. | Text. Default: `address` |
| Status field (pin colour, toned by its words) | Field whose value colors the pin. Common words get matching colors, such as `Delivered` in green, `Delayed` in amber and `Failed` in red. | Text. Default: `status` |
| Status colours (\{ Open: "#2563eb" \} or tone names) | Your own colors for status values, such as `{ Open: '#2563eb' }`, or a tone name: `success`, `warning`, `danger`, `info` or `neutral`. | Object |
| Id field | Field that identifies each row, used by the **Select marker** action and `selectedMarkerId`. | Text. Default: `id` |
| Pin label field (a stop number, a price) | Field shown as a short label on the pin, such as a stop number or a price. | Text |
| Pin icon field (unused in the Ant pack) | Has no effect in the Ant Design library. | Text |
| Icon for every pin (unused in the Ant pack) | Has no effect in the Ant Design library. | Text |
| Heading field (degrees, 0 is north; turns the icon) | Field with a direction in degrees, where 0 is north, that turns the pin, such as a vehicle's heading. | Text |
| Marker image field (an image URL in place of the pin) | Field with an image URL shown in place of the pin, such as a photo. | Text |
| Marker size | Size of the pins. | `small`, `medium`, `large`. Default: `medium` |
| Popup fields (comma list; 'eta:ETA \{\}', 'total\|currency') | Fields shown as lines in a pin's popup, separated by commas, such as `eta:ETA {}, driver`. After a colon, add a label, where `{}` marks where the value goes; after `\|`, add a format such as `currency`, `percent` or `date`. | Text. Default: `eta:ETA {}, driver` |
| Show a popup on marker click | Opens a popup with the pin's details when the user clicks it. | On or off. Default: On |
| Show a legend of the colours | Shows a legend of the pin, route and area colors with their counts. | On or off. Default: On |
| Group nearby markers | Groups pins that are close together into one circle with a count, which splits apart as the user zooms in. | On or off. Default: On |
| Connect the markers as routes | Draws lines between the pins, in the order of **Route order field**, to show routes. | On or off. Default: Off |
| Route field (one line per value) | Field that splits the pins into separate routes, one line per value, such as a vehicle name. | Text |
| Route order field | Field that sets the order of the stops along each route. | Text |
| Routes start at (\{ lat, lng \}) | A point where every connected route begins, such as a depot, as `{ lat, lng }`. | Text |
| Route lines (rows with a path) | Lines to draw that aren't built from the pins, as rows with a `name` and a `path` of points, such as `[[37.79, -122.39], [37.76, -122.42]]`. A GeoJSON line also works. | Array |
| Route colours (\{ "Van 1": "#4f46e5" \}) | Colors for routes by name, such as `{ 'Van 1': '#4f46e5' }`. | Object |
| Areas (zones, territories, geofences) | Shaded areas to draw, such as delivery zones or geofences. Each row is either an outline of points or a circle with a center and a radius. | Array |
| Area outline field | Field in **Areas** that holds the outline, as a list of points or a GeoJSON polygon. | Text. Default: `outline` |
| Area title field | Field in **Areas** shown as each area's name. | Text. Default: `name` |
| Area status field (fill colour) | Field in **Areas** whose value sets the fill color, colored as **Status field** is. | Text. Default: `status` |
| Area radius field (metres, with lat and lng) | Field in **Areas** that holds a circle's radius in meters. The circle's center comes from the row's latitude and longitude. | Text. Default: `radius` |
| Show | What the locations show as: `markers` (pins), `heat` (a heat layer showing where locations are dense) or `both`. | `markers`, `heat`, `both`. Default: `markers` |
| Heat weight field (empty: each row counts once) | Field whose number gives each location more weight in the heat layer. Leave it empty to count each row once. | Text |
| Heat radius (px) | How far each location spreads in the heat layer, in pixels. | Number. Default: `28` |
| Let the user pick a location | Lets the user drop a pin by clicking the map, and drag it to adjust. The pin's position and address are in `pickedLocation`. | On or off. Default: Off |
| Picked location to start with (\{ lat, lng \}) | Where the picked pin starts, as `{ lat, lng }`, when **Let the user pick a location** is on. | Text |
| Show an address search box | Shows a search box for finding an address and moving the map to it. | On or off. Default: Off |
| Search placeholder | Hint shown in the search box while it is empty. | Text. Default: `Search for an address` |
| Geocoder URL (\{query\}; empty for OpenStreetMap Nominatim) | Address search service to use, with `{query}` where the search text goes. Leave it empty to use OpenStreetMap. | Text |
| Reverse geocoder URL (\{lat\}, \{lng\}) | Service that looks up the address of a picked point, with `{lat}` and `{lng}` placeholders. Leave it empty to use OpenStreetMap. | Text |
| Fit the view to what is drawn | Zooms and moves the map to show everything drawn on it. | On or off. Default: On |
| Default center (\{ lat, lng \}) | Point the map centers on when it isn't fitted to the markers, as `{ lat, lng }`. | Text |
| Default zoom (1 to 18) | Zoom level when the map isn't fitted to the markers, from 1 for the whole world to 18 for a street. | Number. Default: `12` |
| Map style | Look of the base map. `streets` follows the app's light or dark theme, `light` and `dark` force one, and `satellite` shows aerial imagery. | Streets, Satellite, Light, Dark. Default: Streets |
| Show a Map \| Satellite switch | Shows a control on the map for switching between the street map and satellite imagery. | On or off. Default: Off |
| Show a fullscreen button | Shows a button that opens the map in full screen. | On or off. Default: On |
| Zoom with the mouse wheel | Zooms the map with the mouse wheel. When off, the wheel scrolls the page, and Ctrl or Cmd with the wheel zooms the map. | On or off. Default: Off |
| Empty text | Message shown when there is nothing to draw on the map. | Text. Default: `No locations to show` |
| Tile URL (empty for the default basemap) | Address of your own map tiles, with `{z}`, `{x}` and `{y}` placeholders. Leave it empty for the default map. | Text |
| Tile attribution | Credit text shown for the tiles in **Tile URL**. | Text |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On marker click](../common-settings.md#events) | Triggers when the user clicks a pin. |
| [On map clicked](../common-settings.md#events) | Triggers when the user clicks the map outside the pins. |
| [On shape clicked](../common-settings.md#events) | Triggers when the user clicks a route line or an area. |
| [On location picked](../common-settings.md#events) | Triggers when the user picks a location by clicking the map, dragging the picked pin or choosing a search result. |
| [On bounds change](../common-settings.md#events) | Triggers when the user pans or zooms the map. Moves made by the actions don't fire it. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set center | Moves the map to the given **Latitude** and **Longitude**, and to the given zoom when one is set. | `components.map1.setCenter("{{37.7749}}", "{{-122.4194}}", "")` |
| Set zoom | Changes the zoom level, from 1 to 18. | `components.map1.setZoom("{{14}}")` |
| Fit to markers | Zooms and moves the map to show everything drawn on it. | `components.map1.fitBounds()` |
| Select marker | Selects the pin with the given **Marker id**, brings it into view and opens its popup. | `components.map1.selectMarker("")` |
| Clear selection | Clears the selected pin and the selected route or area. | `components.map1.clearSelection()` |
| Set picked location | Places the picked pin at the given **Latitude** and **Longitude**, without firing **On location picked**. | `components.map1.setPickedLocation("{{37.7749}}", "{{-122.4194}}")` |
| Clear picked location | Removes the picked pin. | `components.map1.clearPickedLocation()` |
| Set map style | Changes the base map to the given style: `streets`, `satellite`, `light` or `dark`. | `components.map1.setMapStyle("satellite")` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `data` | The locations to show, usually a query's data, one row per pin with a latitude and a longitude. Rows without valid coordinates are skipped. | `{{components.map1.data}}` |
| `latField` | Field in **Data** that holds the latitude. | `{{components.map1.latField}}` |
| `lngField` | Field in **Data** that holds the longitude. | `{{components.map1.lngField}}` |
| `titleField` | Field shown as the title in a pin's popup. | `{{components.map1.titleField}}` |
| `subtitleField` | Field shown under the title in a pin's popup. | `{{components.map1.subtitleField}}` |
| `statusField` | Field whose value colors the pin. Common words get matching colors, such as `Delivered` in green, `Delayed` in amber and `Failed` in red. | `{{components.map1.statusField}}` |
| `statusColors` | Your own colors for status values, such as `{ Open: '#2563eb' }`, or a tone name: `success`, `warning`, `danger`, `info` or `neutral`. | `{{components.map1.statusColors}}` |
| `idField` | Field that identifies each row, used by the **Select marker** action and `selectedMarkerId`. | `{{components.map1.idField}}` |
| `labelField` | Field shown as a short label on the pin, such as a stop number or a price. | `{{components.map1.labelField}}` |
| `iconField` | Has no effect in the Ant Design library. | `{{components.map1.iconField}}` |
| `markerIcon` | Has no effect in the Ant Design library. | `{{components.map1.markerIcon}}` |
| `headingField` | Field with a direction in degrees, where 0 is north, that turns the pin, such as a vehicle's heading. | `{{components.map1.headingField}}` |
| `imageField` | Field with an image URL shown in place of the pin, such as a photo. | `{{components.map1.imageField}}` |
| `markerSize` | Size of the pins. | `{{components.map1.markerSize}}` |
| `popupFields` | Fields shown as lines in a pin's popup, separated by commas, such as `eta:ETA {}, driver`. After a colon, add a label, where `{}` marks where the value goes; after `\|`, add a format such as `currency`, `percent` or `date`. | `{{components.map1.popupFields}}` |
| `showPopup` | Opens a popup with the pin's details when the user clicks it. | `{{components.map1.showPopup}}` |
| `showLegend` | Shows a legend of the pin, route and area colors with their counts. | `{{components.map1.showLegend}}` |
| `clusterMarkers` | Groups pins that are close together into one circle with a count, which splits apart as the user zooms in. | `{{components.map1.clusterMarkers}}` |
| `connectMarkers` | Draws lines between the pins, in the order of **Route order field**, to show routes. | `{{components.map1.connectMarkers}}` |
| `routeField` | Field that splits the pins into separate routes, one line per value, such as a vehicle name. | `{{components.map1.routeField}}` |
| `routeOrderField` | Field that sets the order of the stops along each route. | `{{components.map1.routeOrderField}}` |
| `routeStart` | A point where every connected route begins, such as a depot, as `{ lat, lng }`. | `{{components.map1.routeStart}}` |
| `routes` | Lines to draw that aren't built from the pins, as rows with a `name` and a `path` of points, such as `[[37.79, -122.39], [37.76, -122.42]]`. A GeoJSON line also works. | `{{components.map1.routes}}` |
| `routeColors` | Colors for routes by name, such as `{ 'Van 1': '#4f46e5' }`. | `{{components.map1.routeColors}}` |
| `areas` | Shaded areas to draw, such as delivery zones or geofences. Each row is either an outline of points or a circle with a center and a radius. | `{{components.map1.areas}}` |
| `areaShapeField` | Field in **Areas** that holds the outline, as a list of points or a GeoJSON polygon. | `{{components.map1.areaShapeField}}` |
| `areaTitleField` | Field in **Areas** shown as each area's name. | `{{components.map1.areaTitleField}}` |
| `areaStatusField` | Field in **Areas** whose value sets the fill color, colored as **Status field** is. | `{{components.map1.areaStatusField}}` |
| `areaRadiusField` | Field in **Areas** that holds a circle's radius in meters. The circle's center comes from the row's latitude and longitude. | `{{components.map1.areaRadiusField}}` |
| `display` | What the locations show as: `markers` (pins), `heat` (a heat layer showing where locations are dense) or `both`. | `{{components.map1.display}}` |
| `heatField` | Field whose number gives each location more weight in the heat layer. Leave it empty to count each row once. | `{{components.map1.heatField}}` |
| `heatRadius` | How far each location spreads in the heat layer, in pixels. | `{{components.map1.heatRadius}}` |
| `pickLocation` | Lets the user drop a pin by clicking the map, and drag it to adjust. The pin's position and address are in `pickedLocation`. | `{{components.map1.pickLocation}}` |
| `defaultPickedLocation` | Where the picked pin starts, as `{ lat, lng }`, when **Let the user pick a location** is on. | `{{components.map1.defaultPickedLocation}}` |
| `showSearch` | Shows a search box for finding an address and moving the map to it. | `{{components.map1.showSearch}}` |
| `searchPlaceholder` | Hint shown in the search box while it is empty. | `{{components.map1.searchPlaceholder}}` |
| `geocoderUrl` | Address search service to use, with `{query}` where the search text goes. Leave it empty to use OpenStreetMap. | `{{components.map1.geocoderUrl}}` |
| `reverseGeocoderUrl` | Service that looks up the address of a picked point, with `{lat}` and `{lng}` placeholders. Leave it empty to use OpenStreetMap. | `{{components.map1.reverseGeocoderUrl}}` |
| `fitToMarkers` | Zooms and moves the map to show everything drawn on it. | `{{components.map1.fitToMarkers}}` |
| `defaultCenter` | Point the map centers on when it isn't fitted to the markers, as `{ lat, lng }`. | `{{components.map1.defaultCenter}}` |
| `defaultZoom` | Zoom level when the map isn't fitted to the markers, from 1 for the whole world to 18 for a street. | `{{components.map1.defaultZoom}}` |
| `mapStyle` | Look of the base map. `streets` follows the app's light or dark theme, `light` and `dark` force one, and `satellite` shows aerial imagery. | `{{components.map1.mapStyle}}` |
| `showStyleSwitch` | Shows a control on the map for switching between the street map and satellite imagery. | `{{components.map1.showStyleSwitch}}` |
| `showFullscreen` | Shows a button that opens the map in full screen. | `{{components.map1.showFullscreen}}` |
| `scrollWheelZoom` | Zooms the map with the mouse wheel. When off, the wheel scrolls the page, and Ctrl or Cmd with the wheel zooms the map. | `{{components.map1.scrollWheelZoom}}` |
| `emptyText` | Message shown when there is nothing to draw on the map. | `{{components.map1.emptyText}}` |
| `tileUrl` | Address of your own map tiles, with `{z}`, `{x}` and `{y}` placeholders. Leave it empty for the default map. | `{{components.map1.tileUrl}}` |
| `tileAttribution` | Credit text shown for the tiles in **Tile URL**. | `{{components.map1.tileAttribution}}` |
| `selectedMarker` | The data row of the selected pin. It is empty when nothing is selected. | `{{components.map1.selectedMarker}}` |
| `selectedMarkerId` | Value of **Id field** for the selected pin. | `{{components.map1.selectedMarkerId}}` |
| `selectedShape` | The data row of the route or area the user clicked last. | `{{components.map1.selectedShape}}` |
| `selectedShapeType` | `route` or `area`, for the shape the user clicked last. | `{{components.map1.selectedShapeType}}` |
| `clickedLocation` | The `lat` and `lng` of the point the user clicked last on the map. | `{{components.map1.clickedLocation}}` |
| `pickedLocation` | The picked location's `lat` and `lng`, and its `address` once it is looked up. | `{{components.map1.pickedLocation}}` |
| `center` | The `lat` and `lng` of the center of the map's current view. | `{{components.map1.center}}` |
| `zoom` | The map's current zoom level. | `{{components.map1.zoom}}` |
| `bounds` | The edges of the current view, as `north`, `south`, `east` and `west`, and as `northEast` and `southWest` points. | `{{components.map1.bounds}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Background (behind the tiles) | Theme: Surface 2 |
| Border color | Theme: Weak border |
| Accent (pins without a status, the selection) | Theme: Brand primary |
| Group count color | Theme: Primary text |
| Radius | — |
