---
id: actions
title: Page Navigation Through Actions
---

ToolJet enables seamless navigation between different pages of your app using event handlers and actions. You can also pass query parameters during navigation, making it easy to share context between pages. This is especially useful for building custom navigation components like navbars or sharing the relevant data with another page.

## Example: Building Custom Navigation Menu

Follow these steps to build a custom navigation menu:

1. Add a container to serve as your navigation wrapper.
2. Place icons or text components inside the container for each page you want to link to.
3. For each navigation item:
    - Select the component (icon or text).
    - Add a event handler.
        - Event: On click
        - Action: Switch page
        - Page: Select the target page from the dropdown.

Once configured, clicking on a navigation item will take the user to the corresponding page.

## Example: Ticket Management System

Let’s say you're building a ticket management system with two pages:
- Page 1 shows a list of all tickets.
- Page 2 displays the details of a selected ticket.

To set this up:

1. On Page 1, display all the tickets using a Table.
2. Add an event handler to the table:
    - Event: Row clicked
    - Action: Switch page
    - Page: Select the ticket details page.
    - Query parameters:
        - Key: ticketId
        - Value: `{{components.ticketTable.selectedRow.ticket_id}}`
3. On Page 2, design the UI to display the ticket details.
4. Use the query parameter to fetch or display the selected ticket's data:
    - Reference it with: `{{globals.urlparams.ticketId}}`

This setup allows users to click on a ticket in the table and seamlessly navigate to a new page showing all the relevant information for that specific ticket.