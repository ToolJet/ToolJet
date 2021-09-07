---
sidebar_position: 17
---

# Star rating

Star rating widet can be used to display as well as input ratings. The widget supports half stars and the number of stars can be set too.

<img class="screenshot-full" src="/img/widgets/star/star-rating.gif" alt="ToolJet - Star rating Widget" height="420"/>

### Event: On Change

This event is triggered when an star is clicked.


#### Properties

| properties      | description |
| ----------- | ----------- |
| Label | The text to be used in a label of the star rating. |
| Number of stars | This property is used for setting the initial count of stars in the list on intial load. `default: 5` (integer) |
| Default no of selected stars | This property specifies the default count of stars that are selected on initial load. `default: 5` (integer)|
|  Enable half star | Enabling this property activates a half star selection. `default: false` (bool)|
| Tooltips |This is used for displaying informative tooltips on each star its mapped to index of the star. `default: {{}}` (String array) |
| Star Color | This is used for setting the display color of the star. `default: #ffb400` (color hex) |


