#!/bin/bash

# Setup script for Study Helper application
# This script sets up the Python virtual environment and installs all dependencies

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Study Helper Setup ===${NC}\n"

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed.${NC}"
    echo -e "Please install Python 3.8 or higher from https://www.python.org/downloads/"
    exit 1
fi

PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo -e "${GREEN}✓ Python found: $PYTHON_VERSION${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed.${NC}"
    echo -e "Please install Node.js from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✓ Node.js found: $NODE_VERSION${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed.${NC}"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo -e "${GREEN}✓ npm found: $NPM_VERSION${NC}\n"

# Setup backend
echo -e "${BLUE}Setting up backend...${NC}"
cd "$BACKEND_DIR"

# Create virtual environment
if [ -d "venv" ]; then
    echo -e "${YELLOW}Virtual environment already exists.${NC}"
    read -p "Do you want to recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Removing existing virtual environment...${NC}"
        rm -rf venv
        python3 -m venv venv
        echo -e "${GREEN}Virtual environment created.${NC}"
    fi
else
    echo -e "${BLUE}Creating virtual environment...${NC}"
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to create virtual environment.${NC}"
        exit 1
    fi
    echo -e "${GREEN}Virtual environment created.${NC}"
fi

# Activate virtual environment
echo -e "${BLUE}Activating virtual environment...${NC}"
source venv/bin/activate

# Upgrade pip
echo -e "${BLUE}Upgrading pip...${NC}"
pip install --upgrade pip --quiet

# Install Python dependencies
echo -e "${BLUE}Installing Python dependencies...${NC}"
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install Python dependencies.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python dependencies installed.${NC}\n"

# Setup frontend
echo -e "${BLUE}Setting up frontend...${NC}"
cd "$FRONTEND_DIR"

# Install Node dependencies
echo -e "${BLUE}Installing Node.js dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install Node.js dependencies.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js dependencies installed.${NC}\n"

# Optional: Setup environment variables
echo -e "${BLUE}Environment variables setup (optional)...${NC}"
cd "$BACKEND_DIR"
if [ -f "env.example" ] && [ ! -f ".env" ]; then
    echo -e "${YELLOW}An example environment file was found.${NC}"
    read -p "Do you want to create a .env file for the Google Gemini API key? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp env.example .env
        echo -e "${GREEN}.env file created.${NC}"
        echo -e "${YELLOW}Please edit backend/.env and add your Google Gemini API key.${NC}"
        echo -e "${YELLOW}Get your API key from: https://makersuite.google.com/app/apikey${NC}"
    fi
elif [ ! -f "env.example" ] && [ ! -f ".env" ]; then
    echo -e "${YELLOW}To enable syllabus upload, create backend/.env with:${NC}"
    echo -e "${YELLOW}GOOGLE_GEMINI_KEY=your_api_key_here${NC}"
fi

echo -e "\n${GREEN}=== Setup Complete! ===${NC}"
echo -e "\n${BLUE}To start the application, run:${NC}"
echo -e "${GREEN}./start.sh${NC}\n"
