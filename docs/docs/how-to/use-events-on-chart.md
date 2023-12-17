---
id: use-events-on-chart
title: Use Events on Chart
---

Currently, the chart component does not support events. However, you can use the Custom Component to create a chart using a third-party library that supports events. Plotly is one of the libraries that supports events. In this tutorial, we will build a chart using Plotly and add events to it.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0'}} className="screenshot-full" src="/img/how-to/events-chart/plotly-chart.png" alt="Plotly Chart" />
</div>

## Step 1: Add a Custom Component

Open the App Builder and add a Custom Component to the page. Then, click on the Custom Component to open the Properties panel.

Note: If you are not familiar with the Custom Component, please read the [Custom Component](/docs/widgets/custom-component/) doc.

## Step 2: Add the code to the Custom Component

```js
import React from 'https://cdn.skypack.dev/react';
import ReactDOM from 'https://cdn.skypack.dev/react-dom';
import { Button, Container } from 'https://cdn.skypack.dev/@material-ui/core';
import Plotly from 'https://cdn.skypack.dev/plotly.js-basic-dist-min';
import createPlotlyComponent from 'https://cdn.skypack.dev/react-plotly.js/factory';

const MyCustomComponent = ({data, updateData, runQuery}) => {
const Plot = createPlotlyComponent(Plotly);

    const barOnClick = ({points}) => {
      	console.log('here--- ', points[0].label, points.length)
        if(points[0].label === "Pub ABC"){
            runQuery('switchTablePage')
        }
    }
  return (
  <Container>
      <Plot data={[ 
        {   
            "name": "Pub ABC",
            "x": [ "Pub ABC" ],
            "y": [ 60 ],
            "marker": { "color": "blue" },
            "type": "bar" 
            },  
            {   
            "name": "Pub XYZ",
            "x": [ "Pub XYZ" ],
            "y": [ 40 ], 
            "marker": { "color": "red" },
            "type": "bar" 
            }
        ]}
        layout={{
            width: 640,
            height: 480,
            title: "Views by Publisher",
            showlegend: false,
        }}
        onClick={barOnClick}
        />
    </Container>
)}
const ConnectedComponent = Tooljet.connectComponent(MyCustomComponent);
ReactDOM.render(<ConnectedComponent />, document.body);

```

Let's understand the code above in detail. First, we imported the required libraries. 

```js
import React from 'https://cdn.skypack.dev/react'; // React library
import ReactDOM from 'https://cdn.skypack.dev/react-dom'; // React DOM library
import { Button, Container } from 'https://cdn.skypack.dev/@material-ui/core'; // Material UI library
import Plotly from 'https://cdn.skypack.dev/plotly.js-basic-dist-min'; // Plotly library
import createPlotlyComponent from 'https://cdn.skypack.dev/react-plotly.js/factory'; // Plotly React library
```


Then, we created a function component called `MyCustomComponent`. This component will render the chart. We use the `createPlotlyComponent` function to create a Plotly component. Then, we create a function called `barOnClick` that will be called when the user clicks on the bar. This function will log the label of the bar in the console. If the label is `Pub ABC`, we will call the `runQuery` function to switch the page to the table page. 

```js
const MyCustomComponent = ({data, updateData, runQuery}) => { // function component
const Plot = createPlotlyComponent(Plotly); // create Plotly component

    const barOnClick = ({points}) => { // function to handle click event
      	console.log('here--- ', points[0].label, points.length) // log the label of the bar
        if(points[0].label === "Pub ABC"){ // if the label is Pub ABC
            runQuery('switchTablePage') // call the runQuery function to trigger the switchTablePage query (you can pass any query)
        }
    }
  return ( // return the Plotly component
  <Container> // Material UI Container component
      <Plot data={[  // Plotly component
        {   
            "name": "Pub ABC", // bar name
            "x": [ "Pub ABC" ], // bar label
            "y": [ 60 ], // bar value
            "marker": { "color": "blue" }, // bar color
            "type": "bar"  // bar type
            },  
            {   
            "name": "Pub XYZ",
            "x": [ "Pub XYZ" ],
            "y": [ 40 ], 
            "marker": { "color": "red" },
            "type": "bar" 
            }
        ]}
        layout={{ // Plotly layout
            width: 640, // chart width
            height: 480, // chart height
            title: "Views by Publisher", // chart title
            showlegend: false, // hide the legend
        }}
        onClick={barOnClick} // add the onClick event handler
        />
    </Container>
)}
```

Finally, we render the `MyCustomComponent` component using the `ReactDOM.render` function.

```js
const ConnectedComponent = Tooljet.connectComponent(MyCustomComponent); // connect the component to the Tooljet store
ReactDOM.render(<ConnectedComponent />, document.body); // render the component
```

## Step 3: Create the query

Now, we need to create a query that will switch the page. Let's create a new javascript query from the query manager and call it `switchTablePage`. Then, add the following code to the query.

```js
actions.switchPage('tablepage')
```

**Note**: `runQuery` is a function which accepts a query name as a string used to run the query from the custom component. Learn more about the custom component [here](/docs/widgets/custom-component/).

Once the query is created, you can click on the bar of the custom component to trigger the query.