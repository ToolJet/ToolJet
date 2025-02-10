---
id: get-variables
title: Get Variables
---

To set and access variables or page variables in **Run Python code**, you can use the below functions:

### Set a Variable

```py
actions.setVariable('color','blue')
#replace color with your desired variable name
```

### Immediately Retrieve a Variable After Setting it

```py
actions.setVariable('mode','dark')
#replace mode with your desired variable name

actions.getVariable('mode')
#replace mode with your desired variable name
```

### Set a Page-Specific Variable

```py
actions.setPageVariable('version', 1)
#replace version with your desired variable name
```

### Immediately Retrieve a Page-Specific Variable After Setting it

```py
actions.setPageVariable('number',1)
#replace number with your desired variable name

actions.getPageVariable('number')
#replace number with your desired variable name
```