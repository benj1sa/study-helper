# Study Helper

A web application to help track your study progress, manage problem sets, and maintain study streaks. Built with React + TypeScript frontend and FastAPI backend.

## Features

- **Problem Tracking**: Track your progress on individual problems with difficulty ratings (easy, medium, hard)
- **Review Queue**: Automatically identify problems that need review (hard problems or those attempted >7 days ago)
- **Statistics Dashboard**: View your study statistics including streaks, total problems solved, and daily activity
- **Achievements System**: Unlock achievements as you progress through your studies
- **Syllabus Upload**: Upload syllabus images to automatically parse and import problem sets (requires Google Gemini API key)
- **PDF Viewer**: View problem sets and solutions directly in the application

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) and **npm** - [Download Node.js](https://nodejs.org/)
- **Python** (3.8 or higher) - [Download Python](https://www.python.org/downloads/)
- **Git** - [Download Git](https://git-scm.com/downloads)

### Optional

- **Google Gemini API Key** - Required only for the syllabus upload/parsing feature. You can get one from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ben-study-helper
```

### 2. Set Up Backend

#### Create Virtual Environment

```bash
cd backend
python3 -m venv venv
```

#### Activate Virtual Environment

**On macOS/Linux:**
```bash
source venv/bin/activate
```

**On Windows:**
```bash
venv\Scripts\activate
```

#### Install Dependencies

```bash
pip install -r requirements.txt
```

#### Set Up Environment Variables (Optional)

If you want to use the syllabus upload feature, create a `.env` file in the `backend` directory:

```bash
# If env.example exists (without dot), copy it:
cp env.example .env

# Or create .env manually and add:
# GOOGLE_GEMINI_KEY=your_api_key_here
```

Then edit `.env` and add your Google Gemini API key:

```
GOOGLE_GEMINI_KEY=your_api_key_here
```

**Note:** The application works without an API key, but the syllabus upload feature will be disabled.

### 3. Set Up Frontend

```bash
cd ../frontend
npm install
```

## Running the Application

### Quick Start (Recommended)

From the root directory, use the provided startup script:

```bash
./start.sh
```

This script will:
1. Create and activate a Python virtual environment if it doesn't exist
2. Start the backend server on `http://localhost:8000`
3. Start the frontend development server on `http://localhost:5173`
4. Open your browser automatically

**Note:** On first run, you may need to make the script executable:
```bash
chmod +x start.sh
```

### Manual Start

#### Start Backend

```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python main.py
```

The backend will start on `http://localhost:8000`

#### Start Frontend

In a new terminal:

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173`

## Initial Setup

### First Run

1. When you first start the application, the data files will be automatically initialized with empty structures
2. You can start tracking problems immediately by manually adding them, or
3. Upload a syllabus image (if you have the API key configured) to automatically import problem sets

### Adding Problem Sets

#### Option 1: Upload Syllabus (Requires API Key)

1. Click on the "Add Schedule" tab
2. Upload a syllabus image (PNG or JPEG)
3. Review the parsed data
4. Click "Save" to import the problem sets

#### Option 2: Manual Entry

You can manually edit `backend/data/study_data.json` to add topics and problems. The structure should be:

```json
{
  "course_title": "Your Course Name",
  "topics": [
    {
      "id": "topic_001",
      "date": "1/15",
      "name": "Topic Name",
      "problems": [
        {
          "id": "topic_001_1a",
          "label": "1a",
          "history": []
        }
      ]
    }
  ]
}
```

## Project Structure

```
ben-study-helper/
├── backend/              # FastAPI backend
│   ├── data/            # User data files (gitignored)
│   ├── main.py          # FastAPI application
│   ├── models.py        # Pydantic models
│   ├── data_service.py  # Data persistence logic
│   ├── parser_service.py # Syllabus parsing service
│   ├── achievements.py  # Achievement system
│   └── requirements.txt # Python dependencies
├── frontend/            # React + TypeScript frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── lib/        # Utilities and API client
│   │   └── types/      # TypeScript types
│   └── package.json    # Node dependencies
├── parser/              # Standalone parser script
├── problems-and-solutions/ # PDF files (your problem sets)
├── start.sh            # Startup script
└── README.md           # This file
```

## API Endpoints

The backend provides the following API endpoints:

- `GET /api/syllabus` - Get the full syllabus/study data
- `GET /api/exams` - Get exam data
- `POST /api/attempt` - Log a problem attempt
- `POST /api/upload` - Upload and parse a syllabus image
- `POST /api/upload/save` - Save parsed schedule data
- `GET /api/stats` - Get user statistics
- `GET /api/achievements` - Get all achievements
- `GET /api/streak` - Get streak information
- `GET /api/pdf/{filename}` - Serve PDF files

## Troubleshooting

### Backend won't start

- **Port 8000 already in use**: Stop any other application using port 8000, or modify the port in `backend/main.py`
- **Python not found**: Ensure Python 3.8+ is installed and in your PATH
- **Module not found errors**: Make sure you've activated the virtual environment and installed dependencies with `pip install -r requirements.txt`

### Frontend won't start

- **Port 5173 already in use**: The frontend will automatically try the next available port
- **npm install fails**: Try deleting `node_modules` and `package-lock.json`, then run `npm install` again
- **Module not found errors**: Ensure all dependencies are installed with `npm install`

### Syllabus upload not working

- **"API key not found" error**: The Google Gemini API key is optional. If you want to use this feature:
  1. Get an API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
  2. Create `backend/.env` file with `GOOGLE_GEMINI_KEY=your_key_here`
  3. Restart the backend server

- **Parsing errors**: The parser may have trouble with certain image formats or layouts. Try:
  - Using a high-quality image
  - Ensuring the syllabus table is clearly visible
  - Using PNG format instead of JPEG

### Data files not appearing

- Data files are created automatically on first run in `backend/data/`
- If files are missing, check that the backend has write permissions in the `backend/data/` directory
- The application will initialize empty data structures if files don't exist

### PDFs not loading

- Ensure PDF files are in the `problems-and-solutions/` directory
- PDF filenames should match what's referenced in your study data
- Check browser console for any CORS or loading errors

## Development

### Backend Development

The backend uses FastAPI with automatic API documentation available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Frontend Development

The frontend uses Vite for fast development. Hot module replacement is enabled by default.

### Building for Production

**Frontend:**
```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`

**Backend:**
The backend can be run in production using a process manager like `gunicorn` or `uvicorn`:

```bash
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Contributing

This is a class project. Feel free to fork, modify, and use it for your own studies!

## License

This project is provided as-is for educational purposes.
