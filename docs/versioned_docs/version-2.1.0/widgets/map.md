---
id: map
title: Map
---

The map component enables users to choose or select locations by their coordinates on Google Map. It allows users to interact with the map interface and pick specific points of interest.

:::tip Using Self-hosted 
If you are utilizing the self-hosted version of ToolJet, it is necessary to configure the Google Maps API key as an environment variable. Please refer to the [environment variable setup documentation](/docs/setup/env-vars/#google-maps-configuration--optional-).
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/widgets/map/mapv2.png" alt="ToolJet - Widget Reference - Map" />

</div>

## Events

| Event Name        | Description                                   |
| ----------------- | --------------------------------------------- |
| On bounds change  | Triggered when the bounding area is modified. This event occurs after the `bounds` variable has been updated. |
| On create marker  | Triggered when a new marker is added to the map. |
| On marker click   | Triggered when a user clicks on any of the markers displayed on the map. |

:::info
For detailed information about all the available **Actions**, please refer to the [Action Reference](/docs/category/actions-reference) documentation.
:::

## Properties

| properties      | description | Expected value |
| ----------- | ----------- | ------------------ |
| Initial location | It is the default location's coordinates that the map should focus on. | An object containing the latitude and langitude as key value pairs. ex: `{{ {"lat": 40.7128, "lng": -73.935242} }}` |
| Default Markers | List of markers that should be shown on the map | An array of objects containing the coordinates. ex: `{{ [{"lat": 40.7128, "lng": -73.935242}] }}` | 
| Add new markers | This property should be enabled to add new markers to the map on click. | `On` by default, toggle `off` to disable adding new markers on the map. Can be programmatically configured by clicking on `Fx`, accepts values `{{true}}` or `{{false}}` |
| Search for places | It can be used to show or hide auto-complete search box. | `On` by default, toggle `off` to disable search on the map. Can be programmatically configured by clicking on `Fx`, accepts values `{{true}}` or `{{false}}` |

## General
### Tooltip

A Tooltip is often used to specify extra information about something when the user hovers the mouse pointer over the widget.

Under the <b>General</b> accordion, you can set the value in the string format. Now hovering over the widget will display the string as the tooltip.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tooltip.png" alt="ToolJet - Widget Reference - Map" />

</div>

## Layout

### Show on desktop

Toggle on or off to display the widget in desktop view. You can programmatically determine the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.
### Show on mobile

Toggle on or off to display the widget in mobile view. You can programmatically determine the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.

## Styles

### Visibility

Toggle on or off to control the visibility of the widget. You can programmatically change its value by clicking on the `Fx` button next to it. If `{{false}}` the widget will not be visible after the app is deployed. By default, it's set to `{{true}}`.

### Disable

This is `off` by default, toggle `on` the switch to lock the widget and make it non-functional. You can also programmatically set the value by clicking on the `Fx` button next to it. If set to `{{true}}`, the widget will be locked and becomes non-functional. By default, its value is set to `{{false}}`.

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::

## Exposed Variables

Exposed variables can be used to get data from the widget.

| Variables    | Description |
| ----------- | ----------- |
| center | This variable will hold the latitude, longitude and the google map url value. |
| center.`lat` | This variable holds the latitude value of the marker on the map component. You can access the value dynamically using JS: `{{components.map1.center.lat}}`|
| centere.`lng` | This variable gets updated with RGB color code whenever a user selects a color from the color picker. You can access the value dynamically using JS: `{{components.map1.center.lng}}`|
| center.`googleMapUrl` | This variable holds the URL of the location where the center marker is placed on the map component. You can access the value dynamically using JS: `{{components.map1.center.googleMapUrl}}`|
| markers | The markers variable will hold the value only if `add new markers` is enabled from the map properties. Each marker is an object and will have `lat` and `lng` keys. Values can be accessed dynamically using `{{components.map1.markers[1].lat}}` |
| selectedMarker | Object with the marker selected by the user |

## Component specific actions (CSA)

Following actions of map component can be controlled using the component specific actions(CSA):

| Actions     | Description |
| ----------- | ----------- |
| setLocation | Set the marker's location on map using latitude and longitude values as parameteres via a component-specific action within any event handler. Additionally, you have the option to employ a RunJS query to execute component-specific actions such as: `component.map1.setLocation(40.7128, -73.935242)`  |

