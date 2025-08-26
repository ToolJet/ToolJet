---
id: style-guide
title: Style Guide
---

Welcome to the ToolJet's Style Guide for creating clear, consistent, and accessible documentation. In this guide, you will find recommendations on text formatting, proper use of headers, code snippet styling, accessibility practices, and much more. 

## 1. Text Formatting Guidelines

Different elements in your projects should be formatted consistently for clarity. Here are some recommendations:

a. Italics are used for names given to Queries, Database Tables, and Components.

**Examples:**
- Create a new query and rename it to *getEmployees*.
- Select **ToolJetDB** as the the data source and *Employees* table as the data source.
- Pass the returned data to the *allEmployees* component.

b. Bold is applied for Workspace Constants, Clickable Buttons, fx, Data Sources, and Components.

**Examples:**
- Select the **Button** component and change its label to "Save".
- Drag andn drop a **Table** component and rename it to *todosTable*.
- Expand the query panel at the bottom and click on the **Add** button to create a new **REST API** query.


c. Use Single Ticks for Inline Code and Triple Ticks for Multi-Line Code.

**Examples:**
- The **fx** option next to the Loading state property can be used to add a loader to the component. For instance, you can enter `{{queries.getData.isLoading === true}}` to show the loader while the *getData* query is running. 
- Use the below code to fetch data:
```js
// this code is wrapped in triple ticks
const fetchData = async () => {
const response = await api.get('/users');
console.log(response.data);
};
```

**Additional Items**:
- API Endpoints: Use code ticks for API endpoints (e.g., `GET /api/v1/resources`).
- Labels or User Inputs: Use double quotes to highlight labels or user inputs (e.g., "Enter your username").

---

## 2. Headings

Proper use of headers is crucial for organizing content and improving readability. Use the following guidelines to determine which header level to apply:

- **Title Casing**: Apply title casing for all headers to maintain consistency.
- **Main Header**: Use a single hash (`#`) for the main topic of the document or section. This should be used once per document for the main header.
- **Secondary Header**: Use double hashes (`##`) for subtopics or main sections within a major section. This level of header should organize content under the main header.
- **Tertiary Header**: Use triple hashes (`###`) for more detailed points or subsections under a secondary header. This header is useful for going deeper into specifics within a section.
- **Quaternary Header**: Use four hashes (`####`) for even more granular details within a tertiary section. This header is rarely needed but can be useful in complex documentation.
- **Spacing**: Ensure there’s a blank line before and after each header to maintain readability and to separate the sections clearly.
- **Header Frequency**: Avoid using more than three levels of headers to prevent overcomplication. If additional granularity is needed, consider breaking the content into separate sections or documents.

---

## 3. Markdown Tables

To efficiently present extensive and repetitive information about features, such as the properties of a component, use markdown tables. This format helps organize and display the data clearly and concisely.

Ensure all tables are left-aligned for consistency. This aids in readability and ensures that the content is easy to scan.

**Example**:
| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
|:---------- | :---------- | :------------ |
| chartTitle       | Holds the title of the chart component. | Accessible dynamically with JS (for e.g., `{{components.chart1.chartTitle}}`). |
| xAxisTitle         | Contains the title for the X-axis of the chart.        | Accessible dynamically with JS (for e.g., `{{components.chart1.xAxisTitle}}`). |
| yAxisTitle         | Contains the title for the Y-axis of the chart.        | Accessible dynamically with JS (for e.g., `{{components.chart1.yAxisTitle}}`). |
| clickedDataPoints  | Stores details about the data points that were clicked.| Accessible dynamically with JS (for e.g., `{{components.chart1.clickedDataPoints}}`). Each data point includes `xAxisLabel`, `yAxisLabel`, `dataLabel`, `dataValue`, and `dataPercent`. |
  
- Use **bold** formatting for all column headers to differentiate them from the table content.
- Avoid leaving empty cells in tables. If a cell doesn’t have applicable content, use a placeholder like "N/A" or "—" to indicate that the cell is intentionally blank.

---

## 4. Admonitions

Admonitions are blocks of content that are designed to draw attention to specific points in your documentation. Use them sparingly to avoid overwhelming the user. Reserve admonitions for critical or cautionary information only. 

- **Warning Admonitions**: Use `warning` type admonitions for high-risk actions or irreversible changes. This type of admonition should alert users to potential dangers or critical issues.

**Example**: 
:::warning
Ensure you back up your data before upgrading to the latest version.
:::

- **Tip Admonitions**: Use `info` type admonitions to offer useful hints or best practices. These are generally positive and provide additional value to the user.

**Example**:
:::info
Preview the changes before pushing them.
:::

Overuse can dilute their impact. Use *italics* instead of admonitions whenever possible to emphasize important information instead of admonitions. This is a less intrusive way to draw attention to key details.

---

## 5. Image Guidelines
Include images that closely align with real-world use cases. This makes the documentation more practical and relatable for the user.

- Name images to reflect their purpose, such as `create-get-query.jpeg`. This helps maintain an organized file structure and makes it easier to locate specific images.
- Align images to the left. This is the standard alignment that works well with most content layouts.
- Set the image width to 100% to ensure it scales appropriately with different screen sizes.
- Keep image sizes under 300kb to balance load speed and quality. 
- Alt text should be a concise description of the image, providing the same information as the image itself. This is essential for accessibility and for users who rely on screen readers.
- Skip phrases like "image of" or "graphic of" as screen readers handle this automatically. Focus on describing what is important about the image.
- Use `WEBP` or `PNG` formats for web images due to their balance between quality and file size. 
- Use `SVG` for logos or icons to ensure scalability without loss of quality.

---

## 6. Tone and Clarity

Maintaining a clear and consistent tone throughout your documentation is crucial for effective communication. The goal is to be concise, informative, and user-friendly.

- Keep language straightforward and concise. Avoid jargon unless it's essential for the audience and provide explanations where necessary.
- Always proofread content using Grammarly or a similar tool before submitting a PR. This helps catch errors that might be missed during the initial writing process.
- Use the active voice wherever possible to make the content more direct and engaging. Passive voice can make sentences longer and more difficult to understand.


---

## 7. Bullet Points

Use bullet points to break down steps or lists for clarity. This makes the content easier to scan and understand.

- Avoid using bullet points for a single item. If there is only one point to make, integrate it into the main text instead.  
- Ensure subpoints are correctly indented in markdown. This maintains the hierarchy and relationship between the main point and subpoints.
- End bullet points that are complete sentences with a period. This helps maintain proper grammar and readability.
- Do not insert blank lines between bullet points. This keeps the list compact and visually connected.
- Use nested bullet points for items that require further explanation or hierarchy within a list.

---

## 9. Specific Language Guidelines

Use the below language guidelines to ensure clarity and consistency.

### HTTP Formatting

- All HTTP headers should be capitalized like this: `First-Letter-Capitalized`. This follows the standard convention and makes the headers easier to distinguish.
  **Example**: 
```
Content-Type: application/json
Authorization: Bearer <token>
```

- HTTP blocks should be ready to run when pasted into tools like Postman or `cURL` commands. This means including all necessary components like headers, body, and method. **Example**:
```bash
curl -X POST https://api.example.com/resource \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer <token>' \
-d '{"key": "value"}'
```

### JavaScript Guidelines

- End statements with semicolons (`;`). While JavaScript can often infer semicolons, explicitly including them prevents potential issues, especially in complex code. **Example**:
```javascript
const name = 'John';
console.log(name);
```

- Use single quotes for strings unless double quotes are necessary (e.g., to avoid escaping single quotes inside the string). **Example**:
```javascript
const greeting = 'Hello, world!';
```

### JSON Formatting

- Indent JSON by 2 spaces. This is a standard practice that improves readability. **Example**:
```json
{
    "name": "John Doe",
    "age": 30,
    "city": "New York"
}
```

- Avoid comments in JSON code, as JSON does not natively support comments. If explanations are needed, provide them outside the JSON block in the documentation.

### Shell Scripting

- Break separate commands into distinct code blocks or chain them with `&&` for readability. For multi-line commands, use `\` to break lines. **Example**:
```bash
sudo apt-get update && \
sudo apt-get install -y curl
```

- Preface comments with `#` to explain the command's purpose.
**Example**:
```bash
# This command installs Node.js
sudo apt-get install -y nodejs
```

### SQL Queries

- Format SQL queries with keywords in uppercase, and break down long queries into multiple lines for better readability. **Example**:
```sql
SELECT name, age, city
FROM users
WHERE age > 30
ORDER BY name ASC;
```

---

## 10. Linking Guidelines

- Use root-relative paths (e.g., `/schema/postgres/tables.mdx`) instead of relative links to avoid broken links during file moves. This practice ensures that links remain functional even if files are moved within the directory structure. **Example**: <br/>
`[Postgres tables](/schema/postgres/tables.mdx)` links to the Postgres tables page.

- When linking to a specific section within a page, use anchor links to direct the user precisely where needed. **Example**:  <br/>
`ToolJet supports [multiple environments,](https://docs.tooljet.com/docs/#multiple-environments)` takes the user directly to the specific section.


---

## 11. Semantics and Terminology

- Write in the second person (e.g., *you*, *your*). This makes the content more engaging and directly applicable to the reader.
- Ensure that case sensitivity is consistently applied across the document, particularly for technical terms or commands. This is important for commands and variables in code that are case-sensitive.
**Example**: <br/>"`MyVariable` and `myvariable` are not the same."
- Define acronyms on first use and avoid using them excessively to maintain readability. This helps readers who may not be familiar with all acronyms.
**Example**: <br/>"The Content Delivery Network (CDN) is used to deliver content to users efficiently."
- Maintain consistent terminology throughout the document. If you start with "user," don't switch to "customer" later in the same context.

---



By following these guidelines, you can ensure that your documentation is clear, consistent, and easy to use for a wide range of audiences. 