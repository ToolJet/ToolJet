---
id: use-events-on-chart
title: Use Events on Chart Created Through Custom Component
---
<div style={{paddingBottom:'24px'}}>

This guide will use the Custom Component to create a chart using a third-party library that supports events. Plotly is one of the libraries that supports events. In this tutorial, we will build a chart using Plotly and add events.

<div style={{textAlign: 'center'}}>
    <img style={{ marginBottom:'15px', border:'0'}} className="screenshot-full" src="/img/how-to/events-chart/plotly-chart-v2.png" alt="Plotly Chart" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Step 1: Add a Custom Component

- Open the App Builder and add a Custom Component to the page. 
- Click on the Custom Component to open the Properties panel.

Note: If you are not familiar with the Custom Component, please read the [Custom Component](/docs/widgets/custom-component/)documentation.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Step 2: Add the Code to the Custom Component

In the Code section of the `Custom Component` properties, add the following code:

```js
import React from 'https://cdn.skypack.dev/react';
import ReactDOM from 'https://cdn.skypack.dev/react-dom';
import { Button, Container } from 'https://cdn.skypack.dev/@material-ui/core';
import Plotly from 'https://cdn.skypack.dev/plotly.js-basic-dist-min';
import createPlotlyComponent from 'https://cdn.skypack.dev/react-plotly.js/factory';

// Define the custom component
const MyCustomComponent = ({ data, updateData, runQuery }) => {
    // Create Plot component using Plotly
    const Plot = createPlotlyComponent(Plotly);

    // Define onClick handler for bars
    const barOnClick = ({ points }) => {
        alert('A bar is clicked');
    };

    // Render the component
    return (
        <Container>
            <Plot
                data={[
                    {
                        name: 'Inbound',
                        type: 'bar',
                        x: [20, 14, 23, 22, 30, 12, 15, 26, 31, 16, 18, 29],
                        y: [
                            'Jan',
                            'Feb',
                            'Mar',
                            'Apr',
                            'May',
                            'Jun',
                            'Jul',
                            'Aug',
                            'Sep',
                            'Oct',
                            'Nov',
                            'Dec',
                        ],
                        marker: {
                            line: {
                                color: 'rgba(55, 128, 191, 1.0)',
                                width: 1,
                            },
                            color: 'rgba(55, 128, 191, 0.6)',
                        },
                        orientation: 'h',
                    },
                    {
                        name: 'Outbound',
                        type: 'bar',
                        x: [12, 18, 29, 22, 14, 23, 15, 23, 26, 13, 27, 12],
                        y: [
                            'Jan',
                            'Feb',
                            'Mar',
                            'Apr',
                            'May',
                            'Jun',
                            'Jul',
                            'Aug',
                            'Sep',
                            'Oct',
                            'Nov',
                            'Dec',
                        ],
                        marker: {
                            line: {
                                color: 'rgba(255, 153, 51, 1.0)',
                                width: 1,
                            },
                            color: 'rgba(255, 153, 51, 0.6)',
                        },
                        orientation: 'h',
                    },
                ]}
                layout={{
                    width: 840,
                    height: 800,
                    title: 'Tickets Resolved: Inbound & Outbound',
                    showlegend: false,
                }}
                onClick={barOnClick}
            />
        </Container>
    );
};

// Connect the component
const ConnectedComponent = Tooljet.connectComponent(MyCustomComponent);

// Render the connected component to the DOM
ReactDOM.render(<ConnectedComponent />, document.body);
```

**The steps to implement the above code is as follows:**

- Import the required libraries. 

```js
import React from 'https://cdn.skypack.dev/react'; // React library
import ReactDOM from 'https://cdn.skypack.dev/react-dom'; // React DOM library
import { Button, Container } from 'https://cdn.skypack.dev/@material-ui/core'; // Material UI library
import Plotly from 'https://cdn.skypack.dev/plotly.js-basic-dist-min'; // Plotly library
import createPlotlyComponent from 'https://cdn.skypack.dev/react-plotly.js/factory'; // Plotly React library
```


- Create a function component called `MyCustomComponent`. This component will render the chart. The `createPlotlyComponent` function is used to create a Plotly component. 
- A function called `barOnClick` is created that will be called when the user clicks on the bar. This function will display an alert message. 

```js
const MyCustomComponent = ({data, updateData, runQuery}) => { // function component
const Plot = createPlotlyComponent(Plotly); // create a Plotly component

    const barOnClick = ({points}) => { // function that will be called when the user clicks on the bar
            alert('A bar is clicked')   // display an alert message
    }
```

- Render the chart using the `Plot` component. Pass the data and layout to the `Plot` component. Also pass the `barOnClick` function to the `onClick` prop of the `Plot` component. 

```js
  return (
        <Container>
            <Plot
                data={[
                    {
                        name: 'Inbound',
                        type: 'bar',
                        x: [20, 14, 23, 22, 30, 12, 15, 26, 31, 16, 18, 29],
                        y: ['Jan', 
                            'Feb',
                            'Mar',
                            'Apr',
                            'May',
                            'Jun',
                            'Jul',
                            'Aug',
                            'Sep',
                            'Oct',
                            'Nov',
                            'Dec',
                        ],
                        marker: {
                            line: {
                                color: 'rgba(55, 128, 191, 1.0)',
                                width: 1,
                            },
                            color: 'rgba(55, 128, 191, 0.6)',
                        },
                        orientation: 'h',
                    },
                    {
                        name: 'Outbound',
                        type: 'bar',
                        x: [12, 18, 29, 22, 14, 23, 15, 23, 26, 13, 27, 12],
                        y: [
                            'Jan',
                            'Feb',
                            'Mar',
                            'Apr',
                            'May',
                            'Jun',
                            'Jul',
                            'Aug',
                            'Sep',
                            'Oct',
                            'Nov',
                            'Dec',
                        ],
                        marker: {
                            line: {
                                color: 'rgba(255, 153, 51, 1.0)',
                                width: 1,
                            },
                            color: 'rgba(255, 153, 51, 0.6)',
                        },
                        orientation: 'h',
                    },
                ]}
                layout={{
                    width: 840,
                    height: 800,
                    title: 'Tickets Resolved: Inbound & Outbound',
                    showlegend: false,
                }}
                onClick={barOnClick}
            />
        </Container>
    );
};
```

- Render the `MyCustomComponent` component using the `ReactDOM.render` function.

```js
const ConnectedComponent = Tooljet.connectComponent(MyCustomComponent); // connect the component to the Tooljet store
ReactDOM.render(<ConnectedComponent />, document.body); // render the component
```

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Step 3: Using Events from the Custom Component

In the code above, we created a function called `barOnClick` that will be called when the user clicks on the bar. This function holds the code that will be executed when the user clicks on the bar. 

```js
const barOnClick = ({points}) => {
        alert('A bar is clicked')
}
```

Instead of displaying an alert message, you can use the `runQuery` function to run a query. 

```js
const barOnClick = ({points}) => {
        runQuery('queryName')
}
```

`runQuery` is a function which accepts a query name as a string used to run the query from the custom component. Learn more about the custom component [here](/docs/widgets/custom-component/).

</div>