# Platform environment REST fixture

This local dependency serves the three environment messages expected by the
Platform workspace-constant fixtures. ToolJet still resolves secrets, sends
HTTP requests, and processes query results. The stand-in does not replace
ToolJet API responses or establish that the shared remote service is available.

Start it with Postman CLI 1.70 or newer; no account or deployment is required:

```sh
postman simulation run postman/simulations/platform-environments/platform-environments.sim.yaml --port 4016 --no-history --output ndjson
```

Set `environmentRestFixtureUrl` in the ignored Cypress environment file to
`http://localhost:4016/environment`. The tests retain their existing remote
fixture URL when this override is absent.

Point the existing environment-seeded URL constants and secrets in the local
server environment at this base URL plus `/development`, `/staging`, or
`/production`, as appropriate, and restart the local server. Preserve the
other fixture values, including `customHeader` and `key=value`.

The mock requires that resolved header. It answers unmodeled methods and
paths with 501. Inspect simulation request events after running the tests to
confirm all three paths were exercised through the real backend.
