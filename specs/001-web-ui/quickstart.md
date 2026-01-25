# Quick Start Guide: Web UI for Agentic KB System

**Date**: 2026-01-25  
**Feature**: Web UI for Agentic KB System

## Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Backend API running (FastAPI server on `http://localhost:8000`)
- Modern web browser (Chrome, Firefox, Safari, Edge - latest 2 versions)

## Project Setup

### 1. Create Vue 3 Project with Vite

```bash
# Navigate to repository root
cd /path/to/eddid-ai

# Create Vue 3 project with Vite
npm create vite@latest kb-ui -- --template vue-ts

# Or using yarn
yarn create vite kb-ui --template vue-ts

# Or using pnpm
pnpm create vite kb-ui --template vue-ts
```

### 2. Install Dependencies

```bash
cd kb-ui

# Install core dependencies
npm install vue-router@4 pinia axios

# Install development dependencies
npm install -D vitest @vue/test-utils @vitejs/plugin-vue typescript
npm install -D @playwright/test  # For E2E tests (optional)

# Install UI/CSS framework (example: Tailwind CSS)
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 3. Project Structure

After setup, your `kb-ui/` directory should have:

```
kb-ui/
├── src/
│   ├── components/
│   ├── views/
│   ├── services/
│   ├── stores/
│   ├── composables/
│   ├── types/
│   ├── utils/
│   ├── router/
│   ├── App.vue
│   └── main.ts
├── public/
├── tests/
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### 4. Configure Vite

Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})
```

### 5. Configure TypeScript

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## Development

### Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

Output will be in `dist/` directory, ready for static hosting.

### Run Tests

```bash
# Unit tests
npm run test:unit

# Component tests
npm run test:component

# E2E tests
npm run test:e2e
```

## API Configuration

### Environment Variables

Create `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_APP_TITLE=Agentic KB System
```

### API Service Setup

Create `src/services/api/client.ts`:

```typescript
import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle errors globally
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export default apiClient
```

## Key Implementation Steps

### 1. Set Up Router

Create `src/router/index.ts`:

```typescript
import { createRouter, createWebHistory } from 'vue-router'
import ChatView from '@/views/ChatView.vue'
import DocumentsView from '@/views/DocumentsView.vue'
import CandidatesView from '@/views/CandidatesView.vue'
import MonitoringView from '@/views/MonitoringView.vue'

const routes = [
  { path: '/', redirect: '/chat' },
  { path: '/chat', name: 'Chat', component: ChatView },
  { path: '/documents', name: 'Documents', component: DocumentsView },
  { path: '/candidates', name: 'Candidates', component: CandidatesView },
  { path: '/monitoring', name: 'Monitoring', component: MonitoringView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
```

### 2. Set Up Pinia Stores

Create `src/stores/index.ts`:

```typescript
import { createPinia } from 'pinia'

const pinia = createPinia()

export default pinia
```

Example store: `src/stores/session.store.ts`:

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSessionStore = defineStore('session', () => {
  const sessionId = ref<string | null>(null)
  const persistedSessions = ref<string[]>([])

  function loadSessionFromStorage() {
    const stored = localStorage.getItem('kb_current_session')
    if (stored) {
      sessionId.value = stored
    }
  }

  function saveSessionToStorage(id: string) {
    sessionId.value = id
    localStorage.setItem('kb_current_session', id)
    if (!persistedSessions.value.includes(id)) {
      persistedSessions.value.push(id)
    }
  }

  return {
    sessionId,
    persistedSessions,
    loadSessionFromStorage,
    saveSessionToStorage
  }
})
```

### 3. Create API Services

Example: `src/services/chat.service.ts`:

```typescript
import apiClient from './api/client'
import type { ChatRequest, ChatResponse } from '@/types/api.types'

export const chatService = {
  async sendQuery(request: ChatRequest): Promise<ChatResponse> {
    const response = await apiClient.post<ChatResponse>('/chat/query', request)
    return response.data
  }
}
```

### 4. Create Type Definitions

Create `src/types/api.types.ts` based on OpenAPI schema in `contracts/openapi.yaml`.

## Testing the Integration

### 1. Verify Backend Connection

```bash
# Test health endpoint
curl http://localhost:8000/api/v1/health
```

### 2. Test Chat Query

```bash
curl -X POST http://localhost:8000/api/v1/chat/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is AI?"}'
```

### 3. Test in Browser

1. Start dev server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Open browser DevTools → Network tab
4. Submit a chat query
5. Verify API calls are made correctly

## Next Steps

1. Implement Chat Interface (Priority P1)
2. Implement Document Management (Priority P2)
3. Implement Candidate Review (Priority P2)
4. Implement Monitoring Dashboard (Priority P3)

See `tasks.md` (generated by `/speckit.tasks`) for detailed task breakdown.

## Troubleshooting

### CORS Issues

If you encounter CORS errors, ensure the backend has CORS configured:

```python
# In FastAPI backend
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### API Connection Issues

- Verify backend is running on `http://localhost:8000`
- Check `VITE_API_BASE_URL` in `.env`
- Verify network tab in browser DevTools

### TypeScript Errors

- Run `npm run type-check` to identify type errors
- Ensure all API types match backend models
- Check `tsconfig.json` configuration

## Resources

- [Vue 3 Documentation](https://vuejs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Vue Router Documentation](https://router.vuejs.org/)
- [OpenAPI Contract](./contracts/openapi.yaml)
