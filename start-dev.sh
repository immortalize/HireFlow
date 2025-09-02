#!/bin/bash

# Navigate to the backend directory and start the dev server in the background.
echo "Starting backend dev server..."
cd ~/code/HireFlow/backend && npm run dev &

# Navigate to the frontend directory and start the dev server in the background.
echo "Starting frontend dev server..."
cd ~/code/HireFlow/frontend && npm run dev &

# Wait for both background processes to complete before the script exits.
# This ensures the terminals stay open and the output from both processes is visible.
wait



#!/bin/bash

# A function to gracefully shut down the background processes.
cleanup() {
    echo "Stopping existing dev servers..."
    # The 'pkill' command sends a signal to kill processes by name.
    # We use 'npm' as a filter to target the correct processes.
    pkill -f "npm run dev"
    echo "Servers stopped."
    exit 0
}

# Trap the CTRL+C signal (SIGINT) and call the cleanup function.
# This ensures that pressing Ctrl+C will properly shut down the servers.
trap cleanup SIGINT

# Call cleanup at the start of the script to ensure a clean slate.
cleanup

# Navigate to the backend directory and start the dev server in the background.
echo "Starting backend dev server..."
cd ~/code/HireFlow/backend && npm run dev &

# Navigate to the frontend directory and start the dev server in the background.
echo "Starting frontend dev server..."
cd ~/code/HireFlow/frontend && npm run dev &

# Wait for both background processes to complete before the script exits.
# This ensures the terminals stay open and the output from both processes is visible.
wait

# Call cleanup one more time after the wait command just in case
cleanup

