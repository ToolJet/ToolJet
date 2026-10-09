# HomePage: website onboarding

tooljet.com sends visitors here to create an app from a template or an AI prompt. Chain:
`index.jsx` boot → `_helpers/templateCookie.js` (`set-ai-cookie`) → session `ai_cookies` → `HomePage.handleAiOnboarding` → `deployApp` / `createApp`.

- **Website contract:** `tj_template_id` goes in the redirect query string. For SSO it must also be inside the OAuth `state`, because the query string does not survive the identity provider.
- Boot awaits `set-ai-cookie` so the first `/api/session` carries the cookie. On failure or a 5 s timeout the URL param stays (it is the only copy) and a reload retries; on success it is stripped so a reload cannot deploy twice.
- Permission is `canCreateApp()` (`app_create`), not the role name. Denied opens the modal and erases the cookies at once; dismissing does not erase again.
- Only `appType === 'front-end'` acts on the cookies; workflow and module lists share this component.
- `GetStarted/withAdminOrBuilderOnly` redirects `/:workspace/home` to the dashboard only for `edition === 'cloud'` with a cookie. On `ee` the visitor stays on Get Started, so the logged-out flow cannot be checked locally on `ee`.
- Open: cookie lifetime.
