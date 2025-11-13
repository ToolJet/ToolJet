# Hello World Example

This is a simple "Hello World" example for the ToolJet project.

## Usage

You can run the hello world example directly:

```bash
node hello.js
```

This will output:
```
Hello, World!
Hello, ToolJet!
```

## API

The `hello.js` module exports two functions:

### `hello()`
Returns a simple "Hello, World!" greeting.

**Returns:** `string`

**Example:**
```javascript
const { hello } = require('./hello');
console.log(hello()); // "Hello, World!"
```

### `greet(name)`
Returns a personalized greeting.

**Parameters:**
- `name` (string): The name to greet

**Returns:** `string`

**Example:**
```javascript
const { greet } = require('./hello');
console.log(greet('ToolJet')); // "Hello, ToolJet!"
```
