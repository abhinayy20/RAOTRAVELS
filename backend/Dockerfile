# Use Node.js 20 alpine for a lightweight image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy the rest of the backend source code
COPY . .

# Expose the backend port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
