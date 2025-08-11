# Use the official Node.js image from the Docker Hub
FROM node:18

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json
COPY package*.json ./

# Install the app dependencies inside the container
RUN npm install

# Copy the rest of the application files into the container
COPY . .

# Expose the port your app will run on
EXPOSE 4000

# Command to run the app when the container starts
CMD ["node", "index.js"]
