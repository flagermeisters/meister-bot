#!/bin/bash

echo "Starting Meister Bot in development mode..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker is not running. Please start Docker first."
  exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
  echo "Warning: .env file not found."
  
  if [ -f ".env.example" ]; then
    echo "Would you like to create a .env file from the example? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
      cp .env.example .env
      # Change NODE_ENV to development in the .env file
      sed -i '' 's/NODE_ENV=production/NODE_ENV=development/' .env
      echo "Created .env from example. Please edit it with your actual credentials."
      echo "Press any key when done editing to continue, or Ctrl+C to exit."
      read -n 1
    else
      echo "Please create a .env file with your Discord bot token and admin role ID."
      exit 1
    fi
  else
    echo "Please create a .env file with your Discord bot token and admin role ID."
    exit 1
  fi
fi

# Build the development container
echo "Building development container..."
docker compose build

# Run the development container
echo "Starting container in dev mode..."
docker compose up -d

# Check if container started successfully
if [ $? -eq 0 ]; then
  echo "Meister Bot started in development mode."
  echo "Check logs with: docker compose logs -f"
  echo "Note: In development mode, the bot will automatically reload when you make changes to the code."
else
  echo "Failed to start Meister Bot. Check the error messages above."
  exit 1
fi