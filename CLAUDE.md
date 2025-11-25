# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:3000)
npm run dev

# Production build (outputs to ./build)
npm run build
```

## Project Overview

SimRule UI is a React 18+ testing platform for Drools business rules validation, part of the RuleWeaver ecosystem. It provides test scenario management, batch simulation execution, rule coverage analysis, and result visualization.

**Key Ecosystem Components**:
- **simrule-ui** (this project) - React web application
- **simrule-api** (backend) - Spring Boot on port 8081
- **simrule-db** - MongoDB for data persistence
- **Rule Inspector** - Rule execution service on port 8080

**Backend Integration**: This UI connects to `simrule-api` (port 8081), NOT directly to Rule Inspector.

## Architecture

### Current Tech Stack
- **Framework**: React 18 with TypeScript, Vite with SWC
- **UI Components**: Radix UI primitives with Tailwind CSS (shadcn/ui style)
- **Charts**: Recharts
- **Forms**: React Hook Form

### Project Structure

```
src/
├── App.tsx                    # Main app with state-based routing
├── main.tsx                   # Application entry point
├── components/
│   ├── Layout.tsx             # Main layout with sidebar navigation
│   ├── Dashboard.tsx          # Overview stats and quick actions
│   ├── Scenarios.tsx          # Test scenario management
│   ├── SimulationRunner.tsx   # Batch execution runner
│   ├── Results.tsx            # Simulation results viewer
│   ├── Coverage.tsx           # Rule coverage analysis
│   ├── Datasets.tsx           # Test data management
│   ├── Settings.tsx           # App configuration
│   └── ui/                    # Radix-based UI primitives
```

### Navigation Pattern
The app uses state-based routing in `App.tsx` with a `currentPage` state variable. Navigation is handled via the `onNavigate` callback passed to `Layout.tsx`.

### Path Alias
Use `@/` to reference `src/` directory (configured in `vite.config.ts`).

## API Integration

**Base URLs**:
- Development: `http://localhost:8081/api/v1`
- WebSocket: `ws://localhost:8081/ws/simulations/{simulationId}`

**Core Endpoints**:
- Scenarios: `POST/GET/PUT/DELETE /api/v1/scenarios`
- Simulations: `POST /api/v1/simulations`, `GET /api/v1/simulations/{id}`
- Datasets: `POST/GET/DELETE /api/v1/datasets`
- Coverage: `POST/GET /api/v1/coverage/{ruleSet}`

**API Documentation**: See `SIMRULE_API_DOCUMENTATION.md` and `SimRule API OpenAPI v3.0.1.json`.

## UI Component Conventions

Components in `src/components/ui/` follow shadcn/ui patterns:
- Built on Radix UI primitives
- Styled with Tailwind CSS and `class-variance-authority`
- Use `cn()` utility from `src/components/ui/utils.ts` for className merging

## Critical Development Rules

1. **PRESERVE DESIGN** - Do NOT modify existing CSS, colors, fonts, or visual styling
2. **ADD FUNCTIONALITY** - Make static UI components dynamic with real API data
3. **DON'T REBUILD** - Enhance existing code, don't replace it
4. **KEEP COMPONENT STRUCTURE** - Maintain existing HTML layouts

## Feature Requirements (Full Details Below)

### 1. Dashboard Page

Overview page showing system status and quick actions.

**Capabilities**:
- Display quick stats (total scenarios, recent simulations, coverage percentage)
- Recent activity timeline showing last 10 operations
- Quick action buttons (Create Scenario, Run Simulation, View Reports)
- System health indicators (simrule-api and Rule Inspector connectivity)
- Rule set selector for filtering dashboard data
- Navigate to other pages from dashboard cards

**User Experience**:
- Grid layout with MUI Cards for stats
- Responsive design (stack cards on mobile)
- Color-coded status indicators (green/yellow/red)
- Loading skeletons while data fetches
- Auto-refresh every 30 seconds (configurable)

### 2. Test Scenario Management

Create, edit, and organize test scenarios for rule validation.

**Scenario List**:
- Display all scenarios in searchable/filterable table (React Table)
- Filter by rule set, fact type, status (ACTIVE, DRAFT, ARCHIVED), tags
- Bulk operations (delete, archive, change status)
- Quick actions per row (Run, Edit, Clone, Delete)
- Pagination with configurable page size
- Export scenario list as CSV

**Scenario Editor**:
- **Metadata Section**: Name, description, rule set, agenda group, fact type, tags
- **Test Data Input** (multiple methods):
  - Monaco JSON editor with syntax validation
  - Form-based input with schema-driven fields (if fact schema available)
  - Import from file (JSON, CSV, Excel)
  - Select from test dataset library
  - Generate sample data button
- **Expected Results Configuration**:
  - Expected validation status (true/false)
  - Expected rules to fire (list of rule names)
  - Custom assertions with field/operator/value (e.g., `discountPercentage EQUALS 25`)
  - Expected modifications to fact (before/after comparison)
- **Actions**:
  - Save as draft
  - Activate scenario
  - Run immediately (single execution)
  - Clone scenario with new name
  - Delete scenario (with confirmation)

**User Experience**:
- MUI Stepper or Tabs for sections
- Real-time JSON validation in Monaco Editor
- Auto-save to localStorage every 30 seconds
- Unsaved changes warning on navigation
- Keyboard shortcuts (Ctrl+S to save, Ctrl+Enter to run)
- Help tooltips explaining assertion operators

### 3. Simulation Runner

Execute batch simulations against multiple scenarios and track progress in real-time.

**Capabilities**:
- **Simulation Configuration**:
  - Select execution mode (sequential or parallel)
  - Choose scenarios to include (multi-select from list or select by tags)
  - Filter by rule set or fact type
  - Set execution timeout per scenario
  - Name the simulation run
- **Execution Orchestration**:
  - Submit simulation request to simrule-api
  - Establish WebSocket connection for real-time progress
  - Display progress bar showing completion percentage
  - Show currently executing scenario
  - Display running count (e.g., "7/40 scenarios complete")
- **Progress Tracking**:
  - Real-time WebSocket updates from simrule-api
  - Visual progress indicator (MUI LinearProgress)
  - Status updates: PENDING → RUNNING → COMPLETED/FAILED
  - Cancel simulation button (if supported by backend)
- **Result Summary**:
  - Pass/fail counts and percentages
  - Total execution time
  - Performance metrics (avg, min, max execution time)
  - Navigate to detailed results

**User Experience**:
- MUI Dialog or full-page view for simulation runner
- Animated progress bar with percentage
- Color-coded status badges (green for pass, red for fail)
- Confetti animation on 100% pass rate (optional fun element)
- Error toast notifications if WebSocket connection fails
- Ability to run simulation in background (minimize dialog)

### 4. Results Viewer

Analyze simulation results with drill-down capabilities and comparison features.

**Capabilities**:
- **Simulation Results List**:
  - Display all past simulations with filters (status, date range, rule set)
  - Show summary stats per simulation (pass rate, duration, scenario count)
  - Sort by date, pass rate, duration
  - Quick actions (View Details, Re-run, Export, Delete)
- **Detailed Results View**:
  - Individual scenario execution results
  - Status for each scenario (PASSED, FAILED, ERROR)
  - Actual vs expected comparison:
    - Validation result (isValid: true/false)
    - Rules fired (expected vs actual)
    - Assertion results (each assertion pass/fail)
    - Fact modifications (diff view of before/after)
  - Execution metrics (duration in ms)
  - Error messages and stack traces (if failed)
- **Drill-Down Analysis**:
  - Click scenario to expand full details
  - View raw validation response from Rule Inspector
  - Compare expected vs actual JSON side-by-side
  - View Drools rule activation details
- **Export Capabilities**:
  - Export results as CSV (summary view)
  - Export results as JSON (full detail)
  - Generate PDF report (formatted)

**User Experience**:
- Master-detail layout (list on left, details on right)
- Or responsive stacked layout on mobile
- Color-coded status indicators throughout
- Expandable/collapsible sections (MUI Accordion)
- Syntax-highlighted JSON diffs (Monaco Editor or custom diff component)
- Copy to clipboard buttons for JSON payloads
- Breadcrumb navigation (Simulations → Simulation Detail → Scenario Detail)

### 5. Rule Coverage Analysis

Identify untested rules and visualize testing coverage across rule sets.

**Capabilities**:
- **Coverage Dashboard**:
  - Overall coverage percentage for selected rule set
  - Total rules vs tested rules count
  - Coverage trend over time (line chart with Recharts)
  - Coverage heatmap by agenda group
- **Rule-Level Coverage**:
  - List all rules in rule set (fetched from Rule Inspector or cache)
  - Indicate which rules have been tested (checkmark icon)
  - Show untested rules prominently (warning icon)
  - Display test count per rule (how many scenarios fire this rule)
  - Last tested date per rule
- **Gap Analysis**:
  - Highlight untested rules requiring attention
  - Suggest scenarios to improve coverage
  - Show rule dependencies and risk assessment (if available)
- **Generate Coverage Report**:
  - Trigger coverage calculation via simrule-api
  - Generate PDF report with charts and tables
  - Export coverage data as CSV/JSON

**User Experience**:
- Visual coverage percentage with progress circle (MUI CircularProgress variant)
- Interactive heatmap (click to drill into specific agenda group)
- Sortable/filterable rule table (React Table)
- Color coding: green (tested), red (untested), yellow (partially tested)
- Coverage trends chart showing improvement over time
- Export button for sharing with stakeholders

### 6. Test Dataset Management

Upload, organize, and reuse test datasets across multiple scenarios.

**Capabilities**:
- **Dataset Upload**:
  - Upload CSV, JSON, or Excel files
  - Parse and validate dataset structure
  - Map columns to fact fields (for CSV/Excel)
  - Preview dataset records before saving
  - Specify fact type and metadata
- **Dataset Library**:
  - List all uploaded datasets with filters (fact type, status)
  - Search datasets by name or description
  - Display record count and last used date
  - Quick actions (View, Edit, Delete, Download)
- **Dataset Details**:
  - View dataset records in table format (React Table with pagination)
  - Edit individual records (inline editing or modal)
  - Add/remove records
  - Validate records against fact schema (if available)
  - Usage tracking (which scenarios use this dataset)
- **Dataset Selection**:
  - When creating scenarios, select dataset from library
  - Choose specific records or use all records
  - Clone dataset for modifications

**User Experience**:
- Drag-and-drop file upload with visual feedback
- CSV column mapping wizard (MUI Stepper)
- Preview table before confirming upload
- Inline editing in dataset table (React Table with edit mode)
- Bulk import progress indicator for large datasets
- Dataset usage indicators (which scenarios depend on this dataset)

### 7. Settings and Configuration

User preferences and application configuration.

**Capabilities**:
- **API Configuration**:
  - SimRule API base URL (default: http://localhost:8081/api/v1)
  - Rule Inspector URL (default: http://localhost:8080/api/v1)
  - Test connectivity button for both APIs
  - Request timeout settings
- **User Preferences**:
  - Default rule set for quick actions
  - Default page size for tables
  - Auto-refresh interval for dashboard
  - Theme selection (light/dark mode)
  - Date/time format preferences
- **Execution Settings**:
  - Default execution mode (sequential/parallel)
  - Scenario execution timeout
  - WebSocket connection timeout
  - Max concurrent scenarios for parallel mode
- **Display Settings**:
  - Preferred data format in Monaco Editor (JSON/YAML)
  - Monaco Editor theme (light/dark/high-contrast)
  - Table density (compact/standard/comfortable)

**User Experience**:
- MUI Tabs for settings categories
- Instant preview of theme changes
- Validation of URLs with visual feedback (green checkmark/red X)
- Reset to defaults button (with confirmation dialog)
- Import/export settings as JSON file
- Settings persistence to localStorage

---

## Component Architecture

### Application Structure (React 18+)

```
simrule-ui/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   ├── manifest.json           # PWA manifest
│   └── robots.txt
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── common/            # Generic components
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorMessage.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   └── CopyButton.tsx
│   │   ├── scenarios/         # Scenario-specific components
│   │   │   ├── ScenarioList.tsx
│   │   │   ├── ScenarioEditor.tsx
│   │   │   ├── ScenarioForm.tsx
│   │   │   ├── ExpectedResultsForm.tsx
│   │   │   └── AssertionBuilder.tsx
│   │   ├── simulations/       # Simulation components
│   │   │   ├── SimulationRunner.tsx
│   │   │   ├── SimulationProgress.tsx
│   │   │   ├── SimulationList.tsx
│   │   │   └── SimulationCard.tsx
│   │   ├── results/           # Result visualization
│   │   │   ├── ResultsTable.tsx
│   │   │   ├── ResultDetail.tsx
│   │   │   ├── ComparisonView.tsx
│   │   │   └── AssertionResults.tsx
│   │   ├── datasets/          # Dataset management
│   │   │   ├── DatasetUpload.tsx
│   │   │   ├── DatasetList.tsx
│   │   │   ├── DatasetDetail.tsx
│   │   │   ├── ColumnMapper.tsx
│   │   │   └── DatasetPreview.tsx
│   │   ├── coverage/          # Coverage analysis
│   │   │   ├── CoverageChart.tsx
│   │   │   ├── CoverageHeatmap.tsx
│   │   │   ├── RuleTable.tsx
│   │   │   └── CoverageTrend.tsx
│   │   └── layout/            # Layout components
│   │       ├── Navigation.tsx
│   │       ├── Sidebar.tsx
│   │       ├── Header.tsx
│   │       └── Footer.tsx
│   ├── pages/                 # Top-level page components
│   │   ├── Dashboard.tsx
│   │   ├── ScenarioListPage.tsx
│   │   ├── ScenarioEditorPage.tsx
│   │   ├── SimulationRunnerPage.tsx
│   │   ├── ResultsViewerPage.tsx
│   │   ├── CoverageReportPage.tsx
│   │   ├── DatasetManagerPage.tsx
│   │   └── SettingsPage.tsx
│   ├── services/              # API client services
│   │   ├── api.service.ts     # Base Axios configuration
│   │   ├── scenario.service.ts
│   │   ├── simulation.service.ts
│   │   ├── dataset.service.ts
│   │   ├── coverage.service.ts
│   │   └── websocket.service.ts
│   ├── hooks/                 # Custom React hooks
│   │   ├── useScenarios.ts
│   │   ├── useSimulation.ts
│   │   ├── useWebSocket.ts
│   │   ├── useCoverage.ts
│   │   ├── useDatasets.ts
│   │   └── useLocalStorage.ts
│   ├── contexts/              # React contexts
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── AppContext.tsx
│   ├── types/                 # TypeScript type definitions
│   │   ├── scenario.types.ts
│   │   ├── simulation.types.ts
│   │   ├── dataset.types.ts
│   │   ├── coverage.types.ts
│   │   └── api.types.ts
│   ├── utils/                 # Utility functions
│   │   ├── validation.ts
│   │   ├── formatting.ts
│   │   ├── export.ts
│   │   └── dateUtils.ts
│   ├── config/                # Configuration
│   │   ├── apiConfig.ts
│   │   └── constants.ts
│   ├── styles/                # Global styles
│   │   ├── theme.ts           # MUI theme configuration
│   │   └── global.css
│   ├── App.tsx                # Root component
│   ├── main.tsx               # Application entry point
│   └── vite-env.d.ts          # Vite type definitions
├── tests/                     # Test files
│   ├── unit/                  # Vitest unit tests
│   ├── integration/           # Integration tests
│   └── e2e/                   # Playwright E2E tests
├── .env.development           # Development environment variables
├── .env.production            # Production environment variables
├── .eslintrc.json            # ESLint configuration
├── .prettierrc               # Prettier configuration
├── index.html                # Entry HTML
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts            # Vite configuration
└── README.md
```

---

## Integration Requirements

### SimRule API Integration

**Important**: simrule-ui integrates with **simrule-api** (Spring Boot microservice on port 8081), NOT directly with Rule Inspector. The simrule-api handles all communication with Rule Inspector internally.

**API Base URL**:
- Development: `http://localhost:8081/api/v1`
- Docker: `http://simrule-api:8081/api/v1`
- Production: `https://simrule-api.example.com/api/v1`

**OpenAPI Specification**:
- Located at: `\simrule-ui\SimRule API OpenAPI v3.0.1.json`
- Additional documentation: `\simrule-ui\SIMRULE_API_DOCUMENTATION.md`
- Swagger UI: `http://localhost:8081/swagger-ui.html`

**Core Endpoints**:

**Scenarios** (Test Scenario Management):
- `POST /api/v1/scenarios` - Create new test scenario
- `GET /api/v1/scenarios` - List all scenarios (with filters: ruleSet, factType, status, tags)
- `GET /api/v1/scenarios/{scenarioId}` - Get scenario details
- `PUT /api/v1/scenarios/{scenarioId}` - Update existing scenario
- `DELETE /api/v1/scenarios/{scenarioId}` - Delete scenario
- `POST /api/v1/scenarios/{scenarioId}/clone` - Clone scenario with new name

**Simulations** (Execution and Results):
- `POST /api/v1/simulations` - Execute simulation (batch scenario execution)
- `GET /api/v1/simulations/{simulationId}` - Get simulation status and results
- `GET /api/v1/simulations` - List all simulations (with filters: status, ruleSet)
- WebSocket: `/ws/simulations/{simulationId}` - Real-time progress updates

**Datasets** (Test Data Management):
- `POST /api/v1/datasets` - Upload test dataset (CSV, JSON, Excel)
- `GET /api/v1/datasets` - List all datasets (with filters: factType, status)
- `GET /api/v1/datasets/{datasetId}` - Get dataset details and records
- `DELETE /api/v1/datasets/{datasetId}` - Delete dataset

**Coverage** (Rule Coverage Analysis):
- `POST /api/v1/coverage/{ruleSet}` - Generate coverage report for rule set
- `GET /api/v1/coverage/{ruleSet}/latest` - Get latest coverage report
- `GET /api/v1/coverage/{ruleSet}` - List all coverage reports for rule set

**Health and Monitoring**:
- `GET /actuator/health` - Health check endpoint
- `GET /actuator/metrics` - Prometheus metrics

### Request/Response Patterns

**Common Request Headers**:
```typescript
{
  'Content-Type': 'application/json',
  'X-Correlation-ID': '<uuid>',      // For request tracing
  'X-User-ID': '<username>',         // For audit logging (optional)
  'Authorization': 'Bearer <token>'  // If authentication enabled
}
```

### WebSocket Integration

**Connection Pattern**:
```typescript
// After starting simulation via POST /api/v1/simulations
const simulationId = response.data.simulationId;

// Connect to WebSocket endpoint
const ws = new WebSocket(`ws://localhost:8081/ws/simulations/${simulationId}`);

// Handle progress messages
ws.onmessage = (event) => {
  const progress = JSON.parse(event.data);
  // { type: 'PROGRESS', percentage: 45, completedScenarios: 18, totalScenarios: 40 }
  // { type: 'SCENARIO_COMPLETE', scenarioId: 'SCEN_001', status: 'PASSED' }
  // { type: 'SIMULATION_COMPLETE', status: 'COMPLETED', passRate: 95.5 }
};
```

---

## Configuration Management

### Environment Variables

**Development** (`.env.development`):
```env
VITE_API_BASE_URL=http://localhost:8081/api/v1
VITE_WS_BASE_URL=ws://localhost:8081/ws
VITE_ENABLE_AUTH=false
VITE_ENABLE_PWA=false
VITE_LOG_LEVEL=debug
VITE_AUTO_REFRESH_INTERVAL=30000
VITE_REQUEST_TIMEOUT=10000
```

**Docker** (`.env.docker`):
```env
VITE_API_BASE_URL=http://simrule-api:8081/api/v1
VITE_WS_BASE_URL=ws://simrule-api:8081/ws
VITE_ENABLE_AUTH=false
VITE_ENABLE_PWA=true
VITE_LOG_LEVEL=info
VITE_AUTO_REFRESH_INTERVAL=30000
VITE_REQUEST_TIMEOUT=15000
```

**Production** (`.env.production`):
```env
VITE_API_BASE_URL=https://simrule-api.example.com/api/v1
VITE_WS_BASE_URL=wss://simrule-api.example.com/ws
VITE_ENABLE_AUTH=true
VITE_ENABLE_PWA=true
VITE_LOG_LEVEL=error
VITE_AUTO_REFRESH_INTERVAL=60000
VITE_REQUEST_TIMEOUT=30000
```

### MUI Theme Configuration

**Custom Theme** (`src/styles/theme.ts`):
```typescript
import { createTheme } from '@mui/material/styles';

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    success: {
      main: '#4caf50',
    },
    error: {
      main: '#f44336',
    },
    warning: {
      main: '#ff9800',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
  },
});
```

---

## Deployment Model

### Development Deployment

**Local Development**:
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Application runs at http://localhost:5173 (Vite default)
# Hot reload enabled
```

### Docker Deployment

**Dockerfile** (Multi-Stage Build):
```dockerfile
# Stage 1: Build React application
FROM node:22.16.0-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build for production
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

**Nginx Configuration** (`nginx.conf`):
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json;

    # SPA routing - redirect all requests to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Don't cache index.html
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### Docker Compose

```yaml
version: '3.8'

services:
  simrule-ui:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "4200:80"
    environment:
      - API_URL=http://simrule-api:8081/api/v1
    networks:
      - ruleweaver-network
    depends_on:
      - simrule-api
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 3s
      retries: 3

  simrule-api:
    image: simrule-api:latest
    ports:
      - "8081:8081"
    networks:
      - ruleweaver-network

networks:
  ruleweaver-network:
    driver: bridge
```

---

## Success Criteria

### 1. Functional Completeness
- ✅ All core features implemented and working
- ✅ SimRule API integration successful
- ✅ Scenario management (CRUD) operational
- ✅ Simulation execution with real-time progress
- ✅ Coverage analysis with visualizations
- ✅ Dataset upload and management
- ✅ WebSocket real-time updates working

### 2. Quality Standards
- ✅ Mobile-responsive on all devices
- ✅ WCAG 2.1 AA accessibility compliance
- ✅ 80%+ unit test coverage (Vitest)
- ✅ E2E tests for critical flows (Playwright)
- ✅ Performance: Lighthouse score 90+
- ✅ No console errors in production build

### 3. Integration Success
- ✅ Successful scenario creation and execution
- ✅ Real-time WebSocket progress updates
- ✅ Proper error handling for all API scenarios
- ✅ Correlation ID tracking working

### 4. Deployment Readiness
- ✅ Docker image builds successfully
- ✅ Nginx serving static files correctly
- ✅ Environment configuration working
- ✅ PWA installation functional
- ✅ Production bundle optimized (< 500KB gzipped)

---

## Development Phases

### Phase 1: Foundation (Week 1-2)
- Project setup with Vite + React + TypeScript
- MUI theme configuration
- Routing setup with React Router
- API service configuration (Axios)
- Dashboard skeleton

### Phase 2: Scenario Management (Week 3-4)
- Scenario list page with React Table
- Scenario editor with Monaco JSON editor
- Scenario CRUD operations
- Form validation and error handling

### Phase 3: Simulation Execution (Week 5-6)
- Simulation runner UI
- WebSocket integration for progress
- Simulation results viewer
- Result comparison and drill-down

### Phase 4: Advanced Features (Week 7-8)
- Coverage analysis page
- Dataset upload and management
- Settings page
- PDF export functionality

### Phase 5: Testing & Polish (Week 9-10)
- Unit tests with Vitest
- E2E tests with Playwright
- Mobile responsive refinement
- Accessibility audit and fixes
- Performance optimization

### Phase 6: Deployment (Week 11-12)
- Docker containerization
- CI/CD pipeline setup
- Documentation
- Production deployment

---

## Known Constraints

### Technical Constraints
- **React 18+ Required**: Leverages hooks and concurrent features
- **Modern Browser Only**: ES2022+ required (Chrome 90+, Firefox 88+, Safari 14+)
- **Single Page Application**: All routing client-side
- **Backend Dependency**: Requires simrule-api availability
- **No Offline Simulation**: Requires API connectivity

### Design Decisions
- **React over Angular**: More suitable for complex, dynamic UIs
- **MUI over Custom Components**: Faster development, accessibility built-in
- **React Query**: Server state management with caching
- **Vite over Webpack**: Faster builds and HMR
- **Monaco Editor**: Professional JSON/DRL editing experience

---

## Out of Scope

- Rule authoring and DRL editing (handled by N8N or Rule Inspector)
- POJO generation and compilation (handled by N8N)
- User management and authentication (external OAuth2)
- Administrative system monitoring (separate admin UI)
- Multi-tenancy and workspace management
- Real-time collaboration features

---

## Conclusion

Build an enterprise-grade testing platform that makes business rule validation comprehensive, visual, and accessible. SimRule must provide seamless test scenario management, batch simulation execution with real-time progress, rule coverage analysis, and detailed result visualization—all while maintaining high performance, accessibility, and mobile responsiveness.

The application integrates with simrule-api (port 8081) for all backend operations, which in turn communicates with Rule Inspector for actual rule execution. Use React 18+ with Material-UI for a modern, accessible interface, Monaco Editor for professional code editing, and WebSocket for real-time simulation progress updates.
