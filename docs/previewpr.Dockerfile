# Use the official Node.js image as the base image
FROM node:16.14

# Fix for JS heap limit allocation issue
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Create a working directory for the app
WORKDIR /app

# Copy your Docusaurus project files into the container
COPY package*.json ./
COPY docs ./docs
COPY src ./src
COPY static ./static
COPY versioned_docs ./versioned_docs
COPY versioned_sidebars ./versioned_sidebars
COPY babel.config.js ./
COPY docusaurus.config.js ./
COPY sidebars.js ./
COPY versions.json ./

# Install project dependencies
RUN npm install

# Start the application using npm start
CMD ["npm", "start"]
