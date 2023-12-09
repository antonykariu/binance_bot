# Use the official Node.js image as the base image
FROM node:14

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the application code to the working directory
COPY . .

# Install PM2 globally
RUN npm install -g pm2
ENV PM2_PUBLIC_KEY lwkoqesxdx1nm2y
ENV PM2_SECRET_KEY tvb4wrhubn92qpl
# Expose the port that the application will run on
EXPOSE 3000

# Start the application using PM2
CMD ["pm2-runtime", "ecosystem.config.cjs"]

