---
to: <%= plugins_path %>/plugins/<%= name %>/README.md
---
<%
 Display_name = h.capitalize(display_name)
%>
# <%= Display_name %>

Documentation on: https://docs.tooljet.com/docs/data-sources/<%= name %>