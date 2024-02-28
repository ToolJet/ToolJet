---
id: what-are-events
title: Events
---

Events are used to run queries, show alerts and other functionalities based on triggers such as button clicks or query completion. Events can be chained together to run a series of logical operations. For example, the completion of one query could trigger another event that runs a second query, and so on. This way, a single user interaction, like clicking a button, could set off a chain of events.

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Triggering Events
Suppose you have a query that refreshes data when a user clicks on a button, and you also want to display a pop-up alert upon successful data refresh. In ToolJet, you can configure an event to trigger a query upon clicking the button, followed by another event to display a pop-up alert confirming the successful data refresh after the query execution is completed.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/tooljet-concepts/what-are-events/events-configuration.png" alt="Event Configuration" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Setting Up Event Handlers

Setting up event handlers to manage such triggers and responses is a straightforward process in ToolJet. For instance, to set up an event that triggers on the click of a button, you simply navigate to the button component's configuration, click on **New Event Handler**, and define the Event and the Action to be taken. The actions could range from running a query, showing an alert, or even switching to a different page. 

</div>

For detailed information about the events related to components, please refer to their respective documentation.







