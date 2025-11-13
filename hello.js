/**
 * Hello World Example
 * A simple demonstration file for the ToolJet project
 */

function hello() {
  return 'Hello, World!';
}

function greet(name) {
  return `Hello, ${name}!`;
}

module.exports = {
  hello,
  greet,
};

// If running directly
if (require.main === module) {
  console.log(hello());
  console.log(greet('ToolJet'));
}
