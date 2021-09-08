---
sidebar_position: 8
---

# Map

Map can be used to pick or select a locations on the google map with the location's coordinates.

<img class="screenshot-full" src="/img/widgets/map/map.gif" alt="ToolJet - Widget Reference - Map" height="420"/>

#### Exposed variables

| variable      | description |
| ----------- | ----------- |
| bounds      | Viewport area of the map |
| center      | It contains the locations's coordinates at the center of the bounding area |
| markers     | A marker identifies a location on the map. `markers` contains the list of markers on the map |
| selectedMarker | Object with the marker selected by the user |

#### Events

| events      | description |
| ----------- | ----------- |
| On bounds change | Triggered when the bounding area is changed. This event is triggered after `bounds` variable is updated |
| On create marker | This event is triggered when a new marker is created on the map |
| On marker click | This event is triggered when any of the markers in the map is clicked |

#### Properties

| properties      | description |
| ----------- | ----------- |
| Initial location | It is the default location's coordinates that the map should focus on. |
| Default Markers | Default markers can have list of markers that can be placed on the map |
| Add new markers | For adding new markers to the map, **add new markers** property should be enabled. |
| Seaech for places | It can be used to show or hide Search box. |