# Base image
FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy Prisma schema file
COPY prisma/schema.prisma ./prisma/schema.prisma

# Generate Prisma Client
RUN npx prisma generate

# Copy remaining app source
COPY . .

# Build the application
RUN npm run build

# Start the server using the production build
CMD [ "node", "dist/main.js" ]