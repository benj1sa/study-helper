# AlgoTracker Frontend

React + TypeScript frontend for the AlgoTracker study helper application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the next available port).

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library (built on Radix UI)
- **TanStack Query** - Data fetching and caching
- **Axios** - HTTP client
- **Lucide React** - Icons

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui base components
│   ├── Layout.tsx      # Main layout with tabs
│   ├── TopicList.tsx   # Dashboard view
│   ├── ProblemButton.tsx  # Problem rating button
│   ├── ReviewQueue.tsx # Review queue view
│   └── UploadView.tsx  # Schedule upload view
├── lib/                # Utilities and services
│   ├── api.ts         # API client
│   ├── queryClient.ts # React Query configuration
│   └── utils.ts       # Helper functions
├── types/             # TypeScript type definitions
│   └── index.ts
├── App.tsx            # Root component
├── main.tsx           # Entry point
└── index.css          # Global styles
```

## API Endpoints

The frontend expects the backend to be running at `http://localhost:8000` with the following endpoints:

- `GET /api/syllabus` - Get the full syllabus data
- `POST /api/attempt` - Log a problem attempt
- `POST /api/upload` - Upload and parse a syllabus image
- `POST /api/upload/save` - Save parsed schedule data

## Features

- **Dashboard**: View all topics and problems with progress tracking
- **Review Queue**: See problems that need review (hard problems or >7 days old)
- **Add Schedule**: Upload a syllabus image to parse and add to the system
- **Optimistic Updates**: Instant UI feedback when rating problems
