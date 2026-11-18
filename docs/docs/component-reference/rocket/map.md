---
id: map
title: Map
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Map** component plots rows with coordinates as pins on a map, such as delivery stops, store locations or field visits. It can also draw route lines, zones and a heat layer, and let the user pick a location or search for an address.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Data (rows with coordinates) | Rows to plot. Each row needs a latitude and a longitude; rows without valid coordinates are skipped and counted in a note. | Array |
| Latitude field | Field in each row that holds the latitude. | Text. Default: `lat` |
| Longitude field | Field in each row that holds the longitude. | Text. Default: `lng` |
| Title field | Field shown as the pin's title in its tooltip and popup. | Text. Default: `name` |
| Second line field | Field shown as a second line under the title in the popup. | Text. Default: `address` |
| Status field (pin colour, toned by its words) | Field whose value colors the pin. Common words such as `Delivered` or `Delayed` get a matching tone, and the legend lists each status. | Text. Default: `status` |
| Status colours (\{ Open: "#2563eb" \} or tone names) | A color or tone name for each status value, for example `{ "Open": "#2563eb" }`. Overrides the automatic tone. | Object |
| Id field | Field that identifies each row. **Select marker** looks pins up by this value, and it fills **selectedMarkerId**. | Text. Default: `id` |
| Pin label field (a stop number, a price) | Field shown as short text inside the pin, such as a stop number or a price. | Text |
| Pin icon field (a lucide icon name) | Field that holds a Lucide icon name to show inside each pin. | Text |
| Icon for every pin (a lucide icon name) | A Lucide icon shown inside every pin that has no icon of its own. | Text |
| Heading field (degrees, 0 is north; turns the icon) | Field with a direction in degrees, where `0` is north. Rotates the pin's icon, for example to show which way a vehicle is heading. | Text |
| Marker image field (an image URL in place of the pin) | Field with an image URL to show in place of the pin, such as a photo or a logo. | Text |
| Marker size | Size of the pins. | `small`, `medium`, `large`. Default: `medium` |
| Popup fields (comma list; 'eta:ETA \{\}', 'total\|currency') | Comma-separated fields to list in the popup. Add a label after a colon (`eta:ETA {}`, where `{}` marks the value) or a format after a pipe (`total\|currency`). | Text. Default: `eta:ETA {}, driver` |
| Currency (ISO code, e.g. USD) | Currency code used for popup fields formatted as `currency`, such as `USD` or `EUR`. | Text. Default: `USD` |
| Locale | Locale used to format numbers, currency and dates in the popup, such as `en-US`. Leave empty to follow the currency. | Text |
| Show a popup on marker click | Opens a popup with the row's details when the user clicks a pin. | On or off. Default: On |
| Show a legend of the colours | Shows a legend of the status, route and area colors in the corner of the map. | On or off. Default: On |
| Group nearby markers | Groups pins that sit close together into a single count. Clicking a group zooms in on it. | On or off. Default: On |
| Connect the markers as routes | Draws lines through the pins in order, one line for each value of **Route field**. | On or off. Default: Off |
| Route field (one line per value) | Field that splits connected pins into separate routes, such as a driver or a vehicle. Leave empty for one line through every pin. | Text |
| Route order field | Field that sets the order of the pins along each route, such as a stop number. | Text |
| Routes start at (\{ lat, lng \}) | A point `{ lat, lng }` where every connected route begins, such as a depot. | Text |
| Route lines (rows with a path) | Extra lines to draw, one row per line. Each row has a `name` and a `path` of points, and can set a `color` or a `status`. | Array |
| Route colours (\{ "Van 1": "#4f46e5" \}) | A color for each route name, for example `{ "Van 1": "#4f46e5" }`. | Object |
| Areas (zones, territories, geofences) | Zones to shade on the map, such as territories or geofences. Each row has an outline of points, or a `lat`, `lng` and radius for a circle. | Array |
| Area outline field | Field in each area row that holds its outline as a list of points or GeoJSON. | Text. Default: `outline` |
| Area title field | Field shown as the area's label. | Text. Default: `name` |
| Area status field (fill colour) | Field whose value sets the area's fill color, the same way **Status field** colors pins. | Text. Default: `status` |
| Area radius field (metres, with lat and lng) | Field with a radius in meters. An area row with `lat`, `lng` and a radius is drawn as a circle. | Text. Default: `radius` |
| Show | What to draw for the rows: pins, a heat layer showing where rows are dense, or both. | `markers`, `heat`, `both`. Default: `markers` |
| Heat weight field (empty: each row counts once) | Field that weights each row in the heat layer, such as an order count. Leave empty to count each row once. | Text |
| Heat radius (px) | Size in pixels of each point's glow in the heat layer. | Number. Default: `28` |
| Let the user pick a location | Lets the user drop a pin by clicking the map and drag it to adjust. The chosen point fills **pickedLocation**, with its address when one is found. | On or off. Default: Off |
| Picked location to start with (\{ lat, lng \}) | A point `{ lat, lng }` to place the picked pin at when the map opens. | Text |
| Show an address search box | Shows a search box where the user can look up an address and jump to it. With **Let the user pick a location** on, choosing a result also picks it. | On or off. Default: Off |
| Search placeholder | Hint text shown in the empty search box. | Text. Default: `Search for an address` |
| Geocoder URL (\{query\}; empty for OpenStreetMap Nominatim) | Address search service to use, with `{query}` where the search text goes. Leave empty to use OpenStreetMap, which searches when the user presses Enter. | Text |
| Reverse geocoder URL (\{lat\}, \{lng\}) | Service used to find the address of a picked point, with `{lat}` and `{lng}` in the URL. Leave empty to use OpenStreetMap. | Text |
| Fit the view to what is drawn | Zooms and pans so every pin, route and area is in view whenever the data changes. | On or off. Default: On |
| Default center (\{ lat, lng \}) | A point `{ lat, lng }` to center on when the view isn't fitted to the data. | Text |
| Default zoom (1 to 18) | Zoom level to use with **Default center**, from `1` (the whole world) to `18` (street level). | Number. Default: `12` |
| Map style | Look of the base map. | Streets, Satellite, Light, Dark. Default: Streets |
| Show a Map \| Satellite switch | Shows a **Map** and **Satellite** switch on the map so the user can change the style. | On or off. Default: Off |
| Show a fullscreen button | Shows a button that expands the map to full screen. | On or off. Default: On |
| Zoom with the mouse wheel | Zooms the map with the mouse wheel. When off, the page scrolls past the map and the user holds Ctrl or Cmd to zoom. | On or off. Default: Off |
| Empty text | Message shown when there is nothing to plot. | Text. Default: `No locations to show` |
| Tile URL (empty for the default basemap) | URL template of a custom tile server for the base map. Leave empty for the default map. | Text |
| Tile attribution | Credit text shown in the corner for the custom tiles. | Text |

### Additional Actions

Each of these can be switched on or off, or set with a logical expression by clicking **fx**.

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Visibility | Shows or hides the component. Hidden components keep their space unless Collapse when hidden is on. | On or off. Default: On |
| Collapse when hidden | Removes the hidden component's space, so the components below it move up. | On or off. Default: Off |
| Loading state | Shows the component's loading look and blocks interaction, for example while a query runs. | On or off. Default: Off |
| Disable | Stops the user from interacting with the component. | On or off. Default: Off |

### Devices

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Show on desktop | Shows the component in the desktop layout. | On or off. Default: On |
| Show on mobile | Shows the component in the mobile layout. | On or off. Default: Off |

## Events

Add a handler from the **Events** section of the properties panel. See [Event Triggers](../../app-builder/events/event-triggers.md) for the steps.

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| On marker click | Triggers when the user clicks a pin. |
| On map clicked | Triggers when the user clicks an empty spot on the map. |
| On shape clicked | Triggers when the user clicks a route line or an area. |
| On location picked | Triggers when the user picks a location by clicking the map, dragging the pin or choosing a search result. |
| On bounds change | Triggers when the user pans or zooms the map. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set center | Moves the map to the given **Latitude** and **Longitude**, and to **Zoom** when one is given. | `components.map1.setCenter("{{37.7749}}", "{{-122.4194}}", "")` |
| Set zoom | Sets the map's zoom level. | `components.map1.setZoom("{{14}}")` |
| Fit to markers | Zooms and pans so every pin, route and area is in view. | `components.map1.fitBounds()` |
| Select marker | Selects the pin whose id matches **Marker id**, brings it into view and opens its popup. | `components.map1.selectMarker("")` |
| Clear selection | Clears the selected pin, route or area and closes the popup. | `components.map1.clearSelection()` |
| Set picked location | Places the picked pin at the given **Latitude** and **Longitude** without firing **On location picked**. | `components.map1.setPickedLocation("{{37.7749}}", "{{-122.4194}}")` |
| Clear picked location | Removes the picked pin and clears **pickedLocation**. | `components.map1.clearPickedLocation()` |
| Set map style | Changes the base map style to `streets`, `satellite`, `light` or `dark`. | `components.map1.setMapStyle("satellite")` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.map1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.map1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.map1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `data` | Rows to plot. Each row needs a latitude and a longitude; rows without valid coordinates are skipped and counted in a note. | `{{components.map1.data}}` |
| `latField` | Field in each row that holds the latitude. | `{{components.map1.latField}}` |
| `lngField` | Field in each row that holds the longitude. | `{{components.map1.lngField}}` |
| `titleField` | Field shown as the pin's title in its tooltip and popup. | `{{components.map1.titleField}}` |
| `subtitleField` | Field shown as a second line under the title in the popup. | `{{components.map1.subtitleField}}` |
| `statusField` | Field whose value colors the pin. Common words such as `Delivered` or `Delayed` get a matching tone, and the legend lists each status. | `{{components.map1.statusField}}` |
| `statusColors` | A color or tone name for each status value, for example `{ "Open": "#2563eb" }`. Overrides the automatic tone. | `{{components.map1.statusColors}}` |
| `idField` | Field that identifies each row. **Select marker** looks pins up by this value, and it fills **selectedMarkerId**. | `{{components.map1.idField}}` |
| `labelField` | Field shown as short text inside the pin, such as a stop number or a price. | `{{components.map1.labelField}}` |
| `iconField` | Field that holds a Lucide icon name to show inside each pin. | `{{components.map1.iconField}}` |
| `markerIcon` | A Lucide icon shown inside every pin that has no icon of its own. | `{{components.map1.markerIcon}}` |
| `headingField` | Field with a direction in degrees, where `0` is north. Rotates the pin's icon, for example to show which way a vehicle is heading. | `{{components.map1.headingField}}` |
| `imageField` | Field with an image URL to show in place of the pin, such as a photo or a logo. | `{{components.map1.imageField}}` |
| `markerSize` | Size of the pins. | `{{components.map1.markerSize}}` |
| `popupFields` | Comma-separated fields to list in the popup. Add a label after a colon (`eta:ETA {}`, where `{}` marks the value) or a format after a pipe (`total\|currency`). | `{{components.map1.popupFields}}` |
| `currency` | Currency code used for popup fields formatted as `currency`, such as `USD` or `EUR`. | `{{components.map1.currency}}` |
| `locale` | Locale used to format numbers, currency and dates in the popup, such as `en-US`. Leave empty to follow the currency. | `{{components.map1.locale}}` |
| `showPopup` | Opens a popup with the row's details when the user clicks a pin. | `{{components.map1.showPopup}}` |
| `showLegend` | Shows a legend of the status, route and area colors in the corner of the map. | `{{components.map1.showLegend}}` |
| `clusterMarkers` | Groups pins that sit close together into a single count. Clicking a group zooms in on it. | `{{components.map1.clusterMarkers}}` |
| `connectMarkers` | Draws lines through the pins in order, one line for each value of **Route field**. | `{{components.map1.connectMarkers}}` |
| `routeField` | Field that splits connected pins into separate routes, such as a driver or a vehicle. Leave empty for one line through every pin. | `{{components.map1.routeField}}` |
| `routeOrderField` | Field that sets the order of the pins along each route, such as a stop number. | `{{components.map1.routeOrderField}}` |
| `routeStart` | A point `{ lat, lng }` where every connected route begins, such as a depot. | `{{components.map1.routeStart}}` |
| `routes` | Extra lines to draw, one row per line. Each row has a `name` and a `path` of points, and can set a `color` or a `status`. | `{{components.map1.routes}}` |
| `routeColors` | A color for each route name, for example `{ "Van 1": "#4f46e5" }`. | `{{components.map1.routeColors}}` |
| `areas` | Zones to shade on the map, such as territories or geofences. Each row has an outline of points, or a `lat`, `lng` and radius for a circle. | `{{components.map1.areas}}` |
| `areaShapeField` | Field in each area row that holds its outline as a list of points or GeoJSON. | `{{components.map1.areaShapeField}}` |
| `areaTitleField` | Field shown as the area's label. | `{{components.map1.areaTitleField}}` |
| `areaStatusField` | Field whose value sets the area's fill color, the same way **Status field** colors pins. | `{{components.map1.areaStatusField}}` |
| `areaRadiusField` | Field with a radius in meters. An area row with `lat`, `lng` and a radius is drawn as a circle. | `{{components.map1.areaRadiusField}}` |
| `display` | What to draw for the rows: pins, a heat layer showing where rows are dense, or both. | `{{components.map1.display}}` |
| `heatField` | Field that weights each row in the heat layer, such as an order count. Leave empty to count each row once. | `{{components.map1.heatField}}` |
| `heatRadius` | Size in pixels of each point's glow in the heat layer. | `{{components.map1.heatRadius}}` |
| `pickLocation` | Lets the user drop a pin by clicking the map and drag it to adjust. The chosen point fills **pickedLocation**, with its address when one is found. | `{{components.map1.pickLocation}}` |
| `defaultPickedLocation` | A point `{ lat, lng }` to place the picked pin at when the map opens. | `{{components.map1.defaultPickedLocation}}` |
| `showSearch` | Shows a search box where the user can look up an address and jump to it. With **Let the user pick a location** on, choosing a result also picks it. | `{{components.map1.showSearch}}` |
| `searchPlaceholder` | Hint text shown in the empty search box. | `{{components.map1.searchPlaceholder}}` |
| `geocoderUrl` | Address search service to use, with `{query}` where the search text goes. Leave empty to use OpenStreetMap, which searches when the user presses Enter. | `{{components.map1.geocoderUrl}}` |
| `reverseGeocoderUrl` | Service used to find the address of a picked point, with `{lat}` and `{lng}` in the URL. Leave empty to use OpenStreetMap. | `{{components.map1.reverseGeocoderUrl}}` |
| `fitToMarkers` | Zooms and pans so every pin, route and area is in view whenever the data changes. | `{{components.map1.fitToMarkers}}` |
| `defaultCenter` | A point `{ lat, lng }` to center on when the view isn't fitted to the data. | `{{components.map1.defaultCenter}}` |
| `defaultZoom` | Zoom level to use with **Default center**, from `1` (the whole world) to `18` (street level). | `{{components.map1.defaultZoom}}` |
| `mapStyle` | Look of the base map. | `{{components.map1.mapStyle}}` |
| `showStyleSwitch` | Shows a **Map** and **Satellite** switch on the map so the user can change the style. | `{{components.map1.showStyleSwitch}}` |
| `showFullscreen` | Shows a button that expands the map to full screen. | `{{components.map1.showFullscreen}}` |
| `scrollWheelZoom` | Zooms the map with the mouse wheel. When off, the page scrolls past the map and the user holds Ctrl or Cmd to zoom. | `{{components.map1.scrollWheelZoom}}` |
| `emptyText` | Message shown when there is nothing to plot. | `{{components.map1.emptyText}}` |
| `tileUrl` | URL template of a custom tile server for the base map. Leave empty for the default map. | `{{components.map1.tileUrl}}` |
| `tileAttribution` | Credit text shown in the corner for the custom tiles. | `{{components.map1.tileAttribution}}` |
| `selectedMarker` | The row of the selected pin, or an empty object when none is selected. | `{{components.map1.selectedMarker}}` |
| `selectedMarkerId` | The id of the selected pin, from **Id field**. | `{{components.map1.selectedMarkerId}}` |
| `selectedShape` | The row of the route or area the user clicked last. | `{{components.map1.selectedShape}}` |
| `selectedShapeType` | Whether the selected shape is a `route` or an `area`. | `{{components.map1.selectedShapeType}}` |
| `clickedLocation` | The `lat` and `lng` of the last spot the user clicked on the map. | `{{components.map1.clickedLocation}}` |
| `pickedLocation` | The picked point's `lat` and `lng`, and its `address` once it is found. | `{{components.map1.pickedLocation}}` |
| `center` | The `lat` and `lng` at the center of the current view. | `{{components.map1.center}}` |
| `zoom` | The current zoom level. | `{{components.map1.zoom}}` |
| `bounds` | The edges of the current view: `north`, `south`, `east` and `west`, plus `northEast` and `southWest` points. | `{{components.map1.bounds}}` |
| `isVisible` | Whether the component is visible. | `{{components.map1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.map1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.map1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Background (behind the tiles) | Theme: Surface 3 |
| Border color | Theme: Default border |
| Accent (pins without a status, the selection) | Theme: Brand primary |
| Group count color | Theme: Primary text |
| Radius | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
