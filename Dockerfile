# Base image
FROM node:12.2.0

# Set working directory
WORKDIR /usr/src/app

# Copy package.json
COPY package.json .

# Install dependencies
RUN npm install --silent

# Copy app source
COPY . .

# Start app
CMD ["npm", "start"]
