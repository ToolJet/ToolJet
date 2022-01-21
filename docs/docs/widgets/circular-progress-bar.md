# Circular Progress Bar

Circular progress bar widget can be used to show progress in a progress circle.

<img class="screenshot-full" src="/img/widgets/circular-progressbar/circular-progress.gif" alt="ToolJet - Widget Reference - Tags" height="420"/>

#### Properties

| properties      | description |
| ----------- | ----------- |
| Text | We can set a text inside the progress circle.|
| Progress | It can be used to set the progress of the widget. Progress should be an integer between 0 and 100.|

#### Styles

| properties      | description |
| ----------- | ----------- |
| Color | To define stroke color.|
| Stroke width | To define the width of stroke, value must between 0-100. ``Default: 8``.|
| Counter Clockwise | Whether to rotate progress bar in counterclockwise direction. ``Default: false``.|
| circleRatio | To define ratio of the full circle diameter the progressbar should use. ``Default: 1``.|

#### More info

Circular progress bar widget uses [react-circular-progress](https://github.com/kevinsqi/react-circular-progressbar) package. Check the repo for futher more details about properties and styles.