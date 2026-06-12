FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --production

# Copy compiled distribution files
COPY dist/ ./dist/

# Expose port 3001
EXPOSE 3001

# Start the application
CMD node dist/main.js
