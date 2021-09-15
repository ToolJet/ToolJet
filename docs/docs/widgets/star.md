---
sidebar_position: 14
---

# Star rating

Star rating widget can be used to display as well as input ratings. The widget supports half stars, and the number of stars can be set too.

<img class="screenshot-full" src="/img/widgets/star/star-rating.gif" alt="ToolJet - Star rating Widget" height="420"/>

### Event: On Change

This event is triggered when an star is clicked.


#### Properties

| properties      | description |
| ----------- | ----------- |
| Label | The text to be used as the label for the star rating. |
| Number of stars | Initial number of stars in the list on initial load. `default: 5`|
| Default no of selected stars | This property specifies the default count of stars that are selected on the initial load. `default: 5` (integer)|
|  Enable half star | Allos selection of half stars if enabled. `default: false` (bool)|
| Tooltips |This is used for displaying informative tooltips on each star, and it is mapped to the index of the star. `default: []` (array of strings ) |
| Star Color | Display color of the star. `default: #ffb400` (color hex) |


