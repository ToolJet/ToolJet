---
to: <%= name %>/package.json
---
{
  "name": "<%= name %>",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "lib:dev": "tooljet library dev",
    "lib:build": "tooljet library build",
    "lib:publish": "tooljet library publish"
  },
  "dependencies": {
    "@radix-ui/react-checkbox": "^1.4.1",
    "@radix-ui/react-dialog": "^1.3.1",
    "@radix-ui/react-label": "^2.1.17",
    "@radix-ui/react-scroll-area": "^1.4.0",
    "@radix-ui/react-select": "^2.4.1",
    "@radix-ui/react-slot": "^1.5.0",
    "@radix-ui/react-switch": "^1.4.1",
    "@radix-ui/react-tabs": "^1.2.1",
    "@radix-ui/react-tooltip": "^1.4.1",
    "@tooljet/custom-component-sdk": "0.1.0-beta.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^1.61.0",
    "react-router": "^7.1.0",
    "recharts": "^2.15.4",
    "tailwind-merge": "^3.7.0",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.6.1",
    "postcss": "^8.5.31",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tailwindcss": "^3.4.19",
    "typescript": "^5.9.3"
  },
  "peerDependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
