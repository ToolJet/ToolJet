---
id: map
title: Map
---
# Map

The map widget can be used to pick or select locations on the Google map with the location's coordinates.

<div style={{textAlign: 'center'}}>

![ToolJet - Widget Reference - Map](/img/widgets/map/map.png)

</div>

## Exposed variables

Exposed variables can be used to get data from the widget.

| variable      | description |
| ----------- | ----------- |
| bounds      | Viewport area of the map |
| center      | It contains the locations' coordinates at the center of the bounding area |
| markers     | A marker identifies a location on the map. `markers` contains the list of markers on the map |
| selectedMarker | Object with the marker selected by the user |

## Events

| events      | description |
| ----------- | ----------- |
| On bounds change | Triggered when the bounding area is changed. This event is triggered after `bounds` variable is updated |
| On create marker | This event is triggered when a new marker is created on the map |
| On marker click | This event is triggered when any of the markers in the map is clicked |

:::info
Check [Action Reference](/docs/actions/show-alert) docs to get the detailed information about all the **Actions**.
:::

## Properties

| properties      | description | Expected value |
| ----------- | ----------- | ------------------ |
| Initial location | It is the default location's coordinates that the map should focus on. | An object containing the latitude and langitude as key value pairs. ex: `{{ {"lat": 40.7128, "lng": -73.935242} }}` |
| Default Markers | List of markers that should be shown on the map | An array of objects containing the coordinates. ex: `{{ [{"lat": 40.7128, "lng": -73.935242}] }}` | 
| Add new markers | This property should be enabled to add new markers to the map on click. | `On` by default, toggle `off` to disable adding new markers on the map. Can be programmatically configured by clicking on `Fx`, accepts values `{{true}}` or `{{false}}` |
| Search for places | It can be used to show or hide auto-complete search box. | `On` by default, toggle `off` to disable search on the map. Can be programmatically configured by clicking on `Fx`, accepts values `{{true}}` or `{{false}}` |

## Layout

### Show on desktop

Toggle on or off to display the widget in desktop view. You can programmatically determing the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.
### Show on mobile

Toggle on or off to display the widget in mobile view. You can programmatically determing the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.

## Styles

### Visibility

Toggle on or off to control the visibility of the widget. You can programmatically change its value by clicking on the `Fx` button next to it. If `{{false}}` the widget will not be visible after the app is deployed. By default, it's set to `{{true}}`.

### Disable

This is `off` by default, toggle `on` the switch to lock the widget and make it non-functional. You can also programmatically set the value by clicking on the `Fx` button next to it. If set to `{{true}}`, the widget will be locked and becomes non-functional. By default, its value is set to `{{false}}`.

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::