---
id: get-variables
title: Get Variables
---

To store and retrieve data dynamically within **Run Python Code** in ToolJet, users can set and access variables and page variables using specific functions.

## Set a Variable

```py
actions.setVariable('color','blue')
#replace color with your desired variable name
```

<img className="screenshot-full" src="/img/datasource-reference/custom-python/set-variable.png" alt="Set Variable" />

## Immediately Retrieve a Variable After Setting it

```py
actions.setVariable('mode','dark')
#replace mode with your desired variable name

actions.getVariable('mode')
#replace mode with your desired variable name
```
<img className="screenshot-full" src="/img/datasource-reference/custom-python/get-variable.png" alt="Get Variable" />

## Set a Page-Specific Variable

```py
actions.setPageVariable('version', 1)
#replace version with your desired variable name
```

<img className="screenshot-full" src="/img/datasource-reference/custom-python/set-page-var.png" alt="Set Page Variable" />

## Immediately Retrieve a Page-Specific Variable After Setting it

```py
actions.setPageVariable('number',1)
#replace number with your desired variable name

actions.getPageVariable('number')
#replace number with your desired variable name
```

<img className="screenshot-full" src="/img/datasource-reference/custom-python/get-page-var.png" alt="Get Page Variable" />