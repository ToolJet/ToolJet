---
id: calendar
title: Calendar
---
# Calendar

Calendar widget comes with the following features:  
- **Day, month and week level views**
- **Events**
- **Resource scheduling**

<div style={{textAlign: 'center'}}>

![ToolJet - Widget Reference - Calendar](/img/widgets/calendar/calendar.png)

</div>

## Properties

### Date format
Determines the format in which any date passed to the calendar via any of the properties will be parsed.  
It also determines the format in which any date made available by the calendar via exposed variables will be displayed.  
It uses the date format conventions of [moment.js](https://momentjs.com/).
### Default date
Determines the date on which the calendar's view will be centered on.  
If the calendar is on `month` view, it will show the month on which this date exists.  
If the calendar is on `week` view, it will show the week on which this date exists.  
This property needs to be formatted using the `Date format` property which is configurable on the inspector.
### Events
`Events` property should contain an array of objects, each of which describes the events that the calendar needs to display.
  
Assuming that you set the date format to `MM-DD-YYYY HH:mm:ss A Z`, setting the `Events` property to the following code snippet will display an event titled `Sample Event` at the first hour of this day, as displayed in the image of calendar at the beginning of this page.

```javascript
{{[
  {
	  title: 'Sample event',
      start: `${moment().startOf('day').format('MM-DD-YYYY HH:mm:ss A Z')}`,
      end: `${moment().endOf('day').format('MM-DD-YYYY HH:mm:ss A Z')}`,
      allDay: false,
      tooltip: 'Sample event',
      color: 'lightgreen',
  }
]}}
```

### Event object properties

| Name | Description |
|------|-------------|
| title | Title of the event |
| start | The date(and time) on which this event begins. Needs to be formatted in the `Date format` you've supplied |
| end | The date(and time) on which this event ends. Needs to be formatted in the `Date format` you've supplied |
| allDay | Optional. Qualifies the event as an 'All day event', which will pin it to date headers on `day` and `week` level views |
| tooltip | Tooltip which will be display when the user hovers over the event |
| color | Background color of the event, any css supported color name or hex code can be used |
| textColor | Color of the event title, any css supported color name or hex code can be used |
| textOrientation | Optional. If it is set to `vertical`, the title of the event will be oriented vertically. |
| resourceId | Applicable only if you're using resource scheduling. This is the id of the resource to which this event correspond to. |

You may supply any other additional property to the event(s). These additional properties will available to you when the calendar widget
exposes any of the events via its exposed variables.

### Resources

Specifying resources will make the calendar categorize `week` view and `day` view for each of the resources specified.  

  For example, to categorize week/day view into for three rooms, we specify `resources` this way:

```javascript
{{[
    {resourceId: 1, title: 'Room A'},
    {resourceId: 2, title: 'Room B'},
    {resourceId: 3, title: 'Room C'},
  ]}}
```

If we specify the `resourceId` of any of the events as `1`, then that event will be assigned to `Room A`, generating the following calendar, assuming that we've set the view to `day` and are viewing the day on which this event exists.

<div style={{textAlign: 'center'}}>

![ToolJet - Widget Reference - Calendar](/img/widgets/calendar/calendar-resource.png)

</div>

### Default view

Determines whether the calendar would display a `day`, a `week` or a `month`.  
Setting this property to anything other than these values will make the calendar default to `month` view.

The view that is currently selected will be exposed as the variable `currentView`.

### Start time on week and day view

This determines the time at which week view and day view cells begins. Keep in mind that this
field accepts a date, but still only the time and timezone(if provided) are taken from this date.
The date should be provided in the date format chosen by you in the first property field.

### End time on week and day view

This determines the time at which week view and day view cells ends. Keep in mind that this
field accepts a date, but still only the time and timezone(if provided) are taken from this date.
The date should be provided in the date format chosen by you in the first property field.

### Show toolbar

Determines whether the calendar toolbar should be displayed or not. Click on `Fx` button to programmatically determine the field value to `{{true}}` or `{{false}}`.

### Show view switcher

Determines whether the calendar's buttons that allow user to switch between `month`, `week` and `day` level views will be displayed. Click on `Fx` button to programmatically determine the field value to `{{true}}` or `{{false}}`.

### Highlight today

Determines whether the today's card on the calendar should be highlighted or not. Click on `Fx` button to programmatically determine the field value to `{{true}}` or `{{false}}`.

### Show popover when the event is clicked

Determines whether to display a popover whenever an event is clicked. Click on `Fx` button to programmatically determine the field value to `{{true}}` or `{{false}}`.

## Events

<div style={{textAlign: 'center'}}>

![ToolJet - Widget Reference - Calendar](/img/widgets/calendar/events.png)

</div>

### On Event selected

This event is fired when the user clicks on a calendar event.  
  
Last selected event is exposed as `selectedEvent`.

### on Slot selected

This event is fired when the user either clicks on an calendar slot(empty cell or empty space of a cell with event) or when they click and drag to select multiple slots.  
  
Last selected slot(s) are exposed as `selectedSlots`.

### On Date Navigate

This event is fired when the user clicks on `Today`, `Next` or `Back` buttons on the calendar.
The corresponding date to which the user navigated, will be exposed as `currentDate`.

### On View Change

This event is fired when a different view is selected by the user. The current view is exposed as
`currentView`.

:::info
Check [Action Reference](/docs/actions/show-alert) docs to get the detailed information about all the **Actions**.
:::

## Layout

<div style={{textAlign: 'center'}}>

![ToolJet - Widget Reference - Calendar](/img/widgets/calendar/layout.png)

</div>

### Show on desktop

Toggle on or off to display the widget in desktop view. You can programmatically determing the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.
### Show on mobile

Toggle on or off to display the widget in mobile view. You can programmatically determing the value by clicking on `Fx` to set the value `{{true}}` or `{{false}}`.

## Styles

<div style={{textAlign: 'center'}}>

![ToolJet - Widget Reference - Calendar](/img/widgets/calendar/styles.png)

</div>

### Visibility

Toggle on or off to control the visibility of the widget. You can programmatically change its value by clicking on the `Fx` button next to it. If `{{false}}` the widget will not be visible after the app is deployed. By default, it's set to `{{true}}`.

### Cell size in views classified by resource

When `resources` are specified, the calendar could take up quite a lot of horizontal space, making the horizontal scroll bar of calendar having to be relied upon all the time.  

If we set this property to `compact`, the cell sizes will be smaller in `week` and `day` views.

### Header date format on week view

This format determines how the column header for each day in week view will be displayed. As with every other date format field in ToolJet, this follows the momentjs standard of date formatting.

:::info
Any property having `Fx` button next to its field can be **programmatically configured**.
:::