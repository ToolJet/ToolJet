# __DISPLAY_NAME__

A ToolJet app in Code mode: `frontend/` is its React + TypeScript source, `app.json` names the app and its
routes (its screens). ToolJet keeps sign-in, permissions, environments, data sources and queries.

    tooljet app install   install dependencies; no package install scripts run (frontend/.npmrc sets this too)
    tooljet app pull      read the app's queries and pages, write typed hooks to frontend/src/tooljet.gen.ts
    tooljet app check     fail on a query, route or page the code names that the app does not have
    tooljet app dev       build on every save and show it live in the ToolJet builder
    tooljet app publish   save the app's draft as a version (its code is frozen with it)

Queries are created and edited in ToolJet's query editor. The code runs them by name:

    const orders = useAppQuery('orders');      // { data, loading, error, run(params) }
    await updateStatus.run({ id, status });     // values for the query's parameters ({{parameters.id}})

Each route in `app.json` has a hidden page in the app (`<home page handle>-<route id>`): set who may open the route with
that page's permissions in ToolJet. A route the user may not open is refused, and a link to it opens the first
route they may open.
