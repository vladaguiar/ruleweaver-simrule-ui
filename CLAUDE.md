# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Production build (outputs to ./dist)
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:coverage # Run tests with coverage report
```

## Project Overview

SimRule UI is a React testing platform for Drools business rules validation. It connects to **simrule-api** (port 8081), NOT directly to Rule Inspector.

**Key Point**: Rule sets are created externally via N8N workflows or Rule Inspector. This UI discovers and uses existing rule sets - it does not create them.

## Tech Stack

- React 18 + TypeScript + Vite (SWC)
- Radix UI primitives with Tailwind CSS (shadcn/ui patterns)
- Recharts for data visualization
- React Hook Form for forms
- Vitest for testing

## Architecture

### State-Based Routing

The app uses state-based routing in `App.tsx` with a `currentPage` state variable - there is no React Router. Navigation is handled via `onNavigate` callback passed through `Layout.tsx`.

```typescript
// App.tsx pattern
const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
// Layout receives onNavigate={(page) => setCurrentPage(page)}
```

### Services Layer

All API communication goes through singleton services in `src/services/`. Import from the barrel export:

```typescript
import { scenarioService, simulationService, datasetService } from '@/services';
```

Services handle:
- **apiService**: Base fetch wrapper with error handling, correlation IDs
- **scenarioService**: CRUD + bulk operations, search, filtering
- **simulationService**: Execute simulations, cancel, WebSocket progress
- **datasetService**: Upload, update, manage test datasets
- **coverageService**: Rule coverage reports
- **statisticsService**: Dashboard stats, trends, activity
- **schemaService**: Fact type schemas with validation and caching
- **websocketService**: Real-time simulation progress updates

### API Configuration

Configuration in `src/config/api.config.ts`. Base URL: `http://localhost:8081/api/v1`

Key endpoints:
- `/scenarios` - Test scenario CRUD
- `/simulations` - Batch execution
- `/datasets` - Test data management
- `/coverage/{ruleSet}` - Rule coverage
- `/statistics/overview`, `/statistics/trends`, `/statistics/activity` - Dashboard data
- `/schemas/{factType}` - Fact type schemas

WebSocket: `ws://localhost:8081/ws/simulations/{simulationId}`

### Path Alias

Use `@/` to reference `src/` directory (configured in vite.config.ts and tsconfig.json).

## UI Component Patterns

Components in `src/components/ui/` follow shadcn/ui conventions:
- Built on Radix UI primitives
- Styled with Tailwind CSS + `class-variance-authority`
- Use `cn()` utility from `src/components/ui/utils.ts` for className merging

## Key Implementation Details

### Bulk Delete with Fallback

`scenarioService.bulkDelete()` tries bulk API endpoint first, falls back to individual deletes on 404:

```typescript
// Returns { successCount, failureCount, deletedIds, failures }
const result = await scenarioService.bulkDelete(['id1', 'id2']);
```

### Schema Validation

`schemaService` caches schemas and provides client-side validation:

```typescript
const schema = await schemaService.getSchema('Customer');
const errors = schemaService.validateData(testData, schema);
// errors: { field, type: 'required'|'type'|'constraint', message }[]
```

### WebSocket Simulation Progress

```typescript
const ws = simulationService.connectWebSocket(simulationId, {
  onProgress: (data) => { /* percentage, completedScenarios */ },
  onScenarioComplete: (data) => { /* scenarioId, status */ },
  onComplete: (data) => { /* final status */ },
  onError: (error) => { /* handle error */ }
});
// Call ws.disconnect() on cleanup
```

## Critical Development Rules

1. **PRESERVE DESIGN** - Do NOT modify existing CSS, colors, fonts, or visual styling
2. **ADD FUNCTIONALITY** - Make static UI components dynamic with real API data
3. **DON'T REBUILD** - Enhance existing code, don't replace it
4. **KEEP COMPONENT STRUCTURE** - Maintain existing HTML layouts

## Testing

Tests are co-located with services (e.g., `scenario.service.test.ts`). Mock the api service:

```typescript
vi.mock('./api.service', () => ({
  apiService: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));
```

## API Documentation

- OpenAPI spec: `SimRule API OpenAPI v3.0.1.json`
- Documentation: `SIMRULE_API_DOCUMENTATION.md`
- Swagger UI: `http://localhost:8081/swagger-ui.html`
