---
id: markdown
title: Markdown
---

In ToolJet, the Chat Component supports Markdown formatting for both responses and messages. This can be used enhance text formatting using Markdown syntax, making conversations more readable and structured.

## Supported Markdown Syntax

#### Headings

| <div style = {{ width:'200px' }}> Heading </div> | <div style = {{ width:'200px' }}> Format </div> |
|:-------:|:------:|
| H1 | `# Heading`|
| H2 | `## Heading` |
| H3 | `### Heading` |
| H4 | `#### Heading` |
| H5 | `##### Heading` |
| H6 | `###### Heading` |

#### Text Formatting

##### Bold

<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

Format: 
```
**Text**
```

</div>

<div style = {{ width:'20%' }} > </div>

<div style = {{ width:'40%' }} >

Result: 

**Text**

</div>

</div>

##### Italic

<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

Format: 
```
*Text*
```

</div>

<div style = {{ width:'20%' }} > </div>

<div style = {{ width:'40%' }} >

Result: 

*Text*

</div>

</div>

##### Bold and Italic

<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

Format: 
```
***Text***
```

</div>

<div style = {{ width:'20%' }} > </div>

<div style = {{ width:'40%' }} >

Result: 

***Text***

</div>

</div>

##### Strikethrough

<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

Format: 
```
~~Text~~
```

</div>

<div style = {{ width:'20%' }} > </div>

<div style = {{ width:'40%' }} >

Result: 

~~Text~~

</div>

</div>

#### Lists

##### Unordered Lists

<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

Format: 
```
- Item 1
- Item 2
  - Nested Item 2.1
  - Nested Item 2.2
```

</div>

<div style = {{ width:'20%' }} > </div>

<div style = {{ width:'40%' }} >

Result:
- Item 1
- Item 2
  - Nested Item 2.1
  - Nested Item 2.2

</div>

</div>


##### Ordered Lists

<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

Format: 
```
1. First Item
2. Second Item
   1. Nested Item 2.1
   2. Nested Item 2.2
```

</div>

<div style = {{ width:'20%' }} > </div>

<div style = {{ width:'40%' }} >

Result:
1. First Item
2. Second Item
   1. Nested Item 2.1
   2. Nested Item 2.2

</div>

</div>


##### Task Lists

<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

Format: 
```
- [x] Completed task
- [ ] Pending task
```

</div>

<div style = {{ width:'20%' }} > </div>

<div style = {{ width:'40%' }} >

Result:
- [x] Completed task
- [ ] Pending task

</div>

</div>

#### Code

##### Inlince Code

<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

Format: 
```
This is `inline code`.
```

</div>

<div style = {{ width:'20%' }} > </div>

<div style = {{ width:'40%' }} >

Result:

This is `inline code`.
</div>

</div>

##### Code Block

<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

Format: 
```
\```javascript
const hello = "world";
console.log(hello);
\```
```
Note: Please remove `/` from the syntax.

</div>

<div style = {{ width:'20%' }} > </div>

<div style = {{ width:'40%' }} >

Result:
```javascript
const hello = "world";
console.log(hello);
```
</div>

</div>

#### Block Quotes

<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

Format: 
```
> Single level quote
>> Nested quote
>>> Deep nested quote
```

</div>

<div style = {{ width:'20%' }} > </div>

<div style = {{ width:'40%' }} >

Result:
> Single level quote
>> Nested quote
>>> Deep nested quote
</div>

</div>

#### Links and Images

##### Links

<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

Format: 
```
[Link Text](https://example.com)
```

</div>

<div style = {{ width:'20%' }} > </div>

<div style = {{ width:'40%' }} >

Result:

[Link Text](https://example.com)

</div>

</div>

##### Image

<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

Format: 
```
![Image Alt Text](https://images.unsplash.com/photo-1509966756634-9c23dd6e6815?q=80&w=3176&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)
```

</div>

<div style = {{ width:'20%' }} > </div>

<div style = {{ width:'40%' }} >

Result:

![Image Alt Text](https://images.unsplash.com/photo-1509966756634-9c23dd6e6815?q=80&w=3176&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)

</div>

</div>

#### Tables

<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

Format: 
```
| Header 1 | Header 2 |
|-----------|-----------|
| Cell 1    | Cell 2    |
| Cell 3    | Cell 4    |
```

</div>

<div style = {{ width:'20%' }} > </div>

<div style = {{ width:'40%' }} >

Result:

 Header 1 | Header 2 |
|-----------|-----------|
| Cell 1    | Cell 2    |
| Cell 3    | Cell 4    |

</div>

</div>

#### Horizontal Rules

<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

Format: 
```
--- 
OR
___
OR
***
```

</div>

<div style = {{ width:'20%' }} > </div>

<div style = {{ width:'40%' }} >

Result:

--- 

</div>

</div>

#### HTML Content

<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

Format: 
```
<div style="color: blue;">
  Colored text
</div>
<table>
  <tr>
    <td>HTML Table</td>
  </tr>
</table>
```

</div>

<div style = {{ width:'20%' }} > </div>

<div style = {{ width:'40%' }} >

Result:

<div style = {{ color: 'blue'}}>
  Colored text
</div>
<table>
  <tr>
    <td>HTML Table</td>
  </tr>
</table>

</div>

</div>

#### Footnotes

<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

Format: 
```
Here's a sentence with a footnote[^1].

[^1]: This is the footnote.
```

</div>

<div style = {{ width:'20%' }} > </div>

<div style = {{ width:'40%' }} >

Result:

Here's a sentence with a footnote[^1].

[^1]: This is the footnote.

</div>

</div>

