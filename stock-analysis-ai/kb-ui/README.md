# KB UI - Web Interface for Agentic KB System

Vue 3 + Vite frontend application for the Agentic Knowledge Base System.

## Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Backend API running (FastAPI server on `http://localhost:8000`)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_APP_TITLE=Agentic KB System
```

3. Start development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Build

```bash
npm run build
```

Output will be in `dist/` directory.

## Testing

```bash
# Unit tests
npm run test:unit

# Component tests
npm run test:component

# E2E tests
npm run test:e2e
```

## Project Structure

```
kb-ui/
├── src/
│   ├── components/    # Vue components
│   ├── views/         # Page components
│   ├── services/      # API services
│   ├── stores/        # Pinia stores
│   ├── composables/   # Vue composables
│   ├── types/         # TypeScript types
│   └── utils/         # Utility functions
└── tests/             # Test files
```

## Tech Stack

- Vue 3 (Composition API)
- TypeScript
- Vite
- Pinia (state management)
- Vue Router
- Axios (HTTP client)
- Tailwind CSS
