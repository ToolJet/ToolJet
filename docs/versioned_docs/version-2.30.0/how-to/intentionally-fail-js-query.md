---
id: intentionally-fail-js-query
title: Intentionally fail a RunJS query
---

In this how-to guide, we will create a RunJS query that will throw an error.

- Create a RunJS query and paste the code below. We will use the constructor `ReferenceError` since it is used to create a range error instance.
  ```js
  throw new ReferenceError('This is a reference error.');
  ```

- Now, add a event handler to show an alert when the query fails. **Save** the query and **Run** it.

    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/failjs/failjs.gif" alt="Intentionally fail a RunJS query" />

    </div>

:::info
Most common use-case for intentionally failing a query is **debugging**.
:::