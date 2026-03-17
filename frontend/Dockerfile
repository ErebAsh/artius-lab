# Use Node
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy files
COPY package.json package-lock.json ./
RUN npm install

COPY . .

# Build app
RUN npm run build

# Start app
CMD ["npm", "run", "dev"]

EXPOSE 3000