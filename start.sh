#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a port is ready
wait_for_port() {
    local port=$1
    local service=$2
    local max_attempts=30
    local attempt=0
    
    echo -e "${YELLOW}Waiting for $service to be ready on port $port...${NC}"
    
    while [ $attempt -lt $max_attempts ]; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo -e "${GREEN}$service is ready!${NC}"
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
    done
    
    echo -e "${YELLOW}Warning: $service may not be fully ready, but continuing...${NC}"
    return 1
}

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down servers...${NC}"
    if [ ! -z "$TAIL_BACKEND_PID" ]; then
        kill $TAIL_BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$TAIL_FRONTEND_PID" ]; then
        kill $TAIL_FRONTEND_PID 2>/dev/null
    fi
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    exit
}

# Set up trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Initialize conda (try common locations)
if [ -f "/opt/miniconda3/etc/profile.d/conda.sh" ]; then
    source "/opt/miniconda3/etc/profile.d/conda.sh"
elif [ -f "$HOME/miniconda3/etc/profile.d/conda.sh" ]; then
    source "$HOME/miniconda3/etc/profile.d/conda.sh"
elif [ -f "$HOME/anaconda3/etc/profile.d/conda.sh" ]; then
    source "$HOME/anaconda3/etc/profile.d/conda.sh"
fi

# Activate conda environment and start backend
echo -e "${BLUE}Starting backend server...${NC}"
cd "$BACKEND_DIR"

# Free port 8000 if a stale backend (or other process) is still listening — otherwise uvicorn fails with Errno 48.
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}Port 8000 is in use; stopping existing listener(s)...${NC}"
    lsof -ti :8000 2>/dev/null | xargs kill -TERM 2>/dev/null || true
    sleep 1
    if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        lsof -ti :8000 2>/dev/null | xargs kill -KILL 2>/dev/null || true
        sleep 1
    fi
fi

# Start backend using conda run (more reliable in scripts)
if command -v conda &> /dev/null; then
    conda run -n study-help python main.py > /tmp/study-backend.log 2>&1 &
else
    echo -e "${YELLOW}Warning: conda not found, using system Python${NC}"
    python main.py > /tmp/study-backend.log 2>&1 &
fi
BACKEND_PID=$!

# Wait a moment for the process to start
sleep 2

# Check if backend process is still running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${YELLOW}Backend failed to start. Check /tmp/study-backend.log for errors.${NC}"
    exit 1
fi

# Wait for backend to be ready
wait_for_port 8000 "Backend"

# Start frontend
echo -e "${BLUE}Starting frontend server...${NC}"
cd "$FRONTEND_DIR"

npm run dev > /tmp/study-frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait a moment for the process to start
sleep 2

# Check if frontend process is still running
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${YELLOW}Frontend failed to start. Check /tmp/study-frontend.log for errors.${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Wait for frontend to be ready
wait_for_port 5173 "Frontend"

# Open browser
echo -e "${GREEN}Opening browser at http://localhost:5173${NC}"
open http://localhost:5173

# Show logs from both servers
echo -e "\n${BLUE}=== Server Logs (Press Ctrl+C to stop) ===${NC}\n"

# Tail both log files with labels
tail -f /tmp/study-backend.log | sed 's/^/[BACKEND] /' &
TAIL_BACKEND_PID=$!

tail -f /tmp/study-frontend.log | sed 's/^/[FRONTEND] /' &
TAIL_FRONTEND_PID=$!

# Wait for both server processes
wait $BACKEND_PID $FRONTEND_PID
