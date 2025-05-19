---
id: debug-components
title: "Debug Components"
---

When building apps using natural language in ToolJet, components may sometimes be generated with incomplete or incorrect configurations like broken bindings or invalid expressions. These issues can lead to runtime errors and disrupt your workflow. 

Now, you can fix these errors in components with AI. This new feature is built to streamline the debugging process by context-aware suggestions directly at the point of failure. Instead of switching contexts or manually troubleshooting, you can resolve errors quickly with AI assistance right inside the component’s property editor.


## How It Works?

If a component property contains an error, you’ll see an error message in the code hinter. Below this message, a **Fix with AI**  button appears. This button only shows up when there’s an actual error once the error is resolved, the button disappears.

<img className="screenshot-full img-s" style={{marginBottom:"15px"}}  src="/img/tooljet-ai/fix01.png" alt="tooljet ai doc assistant" />

Clicking on the **Fix with AI** opens a mini chat window, anchored right near the error and it knows which component and property the issue is coming from. This means you don’t need to re-explain the problem. The AI sees the broken component, the error message, and and fixes it for you.

<img className="screenshot-full img-s" style={{marginBottom:"15px"}}  src="/img/tooljet-ai/fix02.png" alt="tooljet ai doc assistant" />

Once the fix is ready, click on **Apply fix** or you also have an option to regnerate the fix if you think it needs more work. On clicking on **Apply fix**, the AI will apply the fix to the component property and you'll see the updated component configuration. 
<img className="screenshot-full img-s" src="/img/tooljet-ai/fix03.png" alt="tooljet ai doc assistant" />


## Use Case 
Let's say you are building an Order Management app where you have a table component and the data loaded in the table has incorrect expressions that are causing runtime errors. You can now use the **Fix with AI** button to correct those expressions as shown in the image below.

<img className="screenshot-full img-l" style={{marginBottom:"15px"}}   src="/img/tooljet-ai/fix-eg.png" alt="tooljet ai doc assistant" />

ToolJet’s **Fix with AI** makes it easier to fix errors by using AI to help you right when something goes wrong. Whether it’s a small mistake in your logic or a problem with your expression, this feature helps you fix it quickly so you can keep building without getting stuck or distracted.
