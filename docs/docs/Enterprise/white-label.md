---
id: white-label
title: White Label
---

# White Label

White Label feature will allow you to remove the ToolJet branding from the ToolJet platform and add your own custom logo and text.

This feature allows you to rebrand the following:
- **App logo** (Logo on login screen, dashboard, and app-editor)

<img className="screenshot-full" src="/img/enterprise/white-label/applogo.png" alt="ToolJet - Enterprise - White label" height="420"/>

<img className="screenshot-full" src="/img/enterprise/white-label/appeditor.png" alt="ToolJet - Enterprise - White label" height="420"/>

- **Favicon**

- **Page Title** (next to Favicon)

<img className="screenshot-full" src="/img/enterprise/white-label/favicon.png" alt="ToolJet - Enterprise - White label" height="420"/>

## Configuration

To enable white labelling, you'll need to set the below mentioned **environment variables** in the .env file:

- `WHITE_LABEL_LOGO`: URL of the logo. Preferred dimensions of the logo are: width 130px and height 26px
- `WHITE_LABEL_TEXT`: The text that you want to display as Page Title
- `WHITE_LABEL_FAVICON`: URL of the favicon. Preferred dimensions of the logo are: 16x16px or 32x32px 