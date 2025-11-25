# SimRule UI - Claude Code Quick Reference

## 🎯 Mission Summary

**ENHANCE** the existing **SimRule UI** in the `vladaguiar/ruleweaver-simrule-ui` GitHub repository.

### ⚠️ CRITICAL RULES:
1. **ANALYZE FIRST** - Examine what's already in the repo before coding
2. **PRESERVE DESIGN** - Do NOT change any visual styling from Figma export
3. **ADD FUNCTIONALITY** - Make the static UI dynamic with real API data
4. **DON'T REBUILD** - Enhance existing code, don't replace it

---

## 🔍 REQUIRED FIRST STEP

```bash
# Clone and analyze BEFORE coding
git clone https://github.com/vladaguiar/ruleweaver-simrule-ui.git
cd ruleweaver-simrule-ui

# Examine what exists
cat package.json
cat README.md
ls -la src/

# Document findings before proceeding
```

---

## ⚡ Target Version Requirements (If Converting)

| Package | Version |
|---------|---------|
| Angular | 17.3.0 |
| Angular CLI | 17.3.0 |
| TypeScript | 5.4.0 |
| Node.js | 22.16.0 |
| npm | 10.5.0 |
| Angular Material | 17.3.0 |
| Angular CDK | 17.3.10 |
| RxJS | 7.8.0 |
| Monaco Editor | 0.52.2 |
| Karma | 6.4.0 |
| Playwright | 1.55.1 |

---

## ✅ What You CAN Do

- Add Angular directives (*ngIf, *ngFor, @if, @for)
- Add event bindings (click), (submit), etc.
- Add property bindings [value], [disabled], etc.
- Add routing configuration
- Add service injections
- Add state management
- Add form controls and validation
- Add loading states (matching existing style)
- Add error states (matching existing style)
- Create new service files
- Create new interceptor files
- Add TypeScript interfaces/models

## ❌ What You CANNOT Do

- Modify existing CSS/SCSS files
- Change color values
- Adjust spacing, margins, padding
- Change font families or sizes
- Restructure component HTML layouts
- Replace existing class names
- Reorganize assets folder
- Delete any existing files without explicit reason

---

## 🎨 Brand Colors (Reference Only - Use Existing)

```scss
// Primary
$primary-blue: #285A84;
$accent-coral: #FD9071;

// Semantic
$success: #C3E770;
$error: #EF6F53;
$warning: #F7EA73;
$info: #87C1F1;
```

---

## 📱 Screens to Build (7 Total)

| Screen | Route | Purpose |
|--------|-------|---------|
| Dashboard | `/` | KPIs, charts, recent activity |
| Scenario List | `/scenarios` | Browse/filter scenarios |
| Scenario Editor | `/scenarios/new`, `/scenarios/:id/edit` | Create/edit scenarios |
| Simulation Runner | `/simulations/run` | Execute with WebSocket progress |
| Results Viewer | `/results/:id` | Analyze results, drill-down |
| Coverage Report | `/coverage` | Rule coverage heatmap |
| Dataset Manager | `/datasets` | Upload/manage test data |

---

## 🔌 API Endpoints (simrule-api on port 8081)

**Scenarios**
- `POST /api/v1/scenarios` - Create
- `GET /api/v1/scenarios` - List
- `GET /api/v1/scenarios/{id}` - Get
- `PUT /api/v1/scenarios/{id}` - Update
- `DELETE /api/v1/scenarios/{id}` - Delete
- `POST /api/v1/scenarios/{id}/clone` - Clone

**Simulations**
- `POST /api/v1/simulations` - Execute
- `GET /api/v1/simulations/{id}` - Get status/results
- `GET /api/v1/simulations` - List
- `WS /ws/simulations/{id}` - Real-time progress

**Datasets**
- `POST /api/v1/datasets` - Upload
- `GET /api/v1/datasets` - List
- `GET /api/v1/datasets/{id}` - Get
- `DELETE /api/v1/datasets/{id}` - Delete

**Coverage**
- `POST /api/v1/coverage/{ruleSet}` - Generate
- `GET /api/v1/coverage/{ruleSet}/latest` - Latest report
- `GET /api/v1/coverage/{ruleSet}` - List reports

---

## ✅ Acceptance Checklist

### Phase 1: Analysis (REQUIRED FIRST)
- [ ] Clone repository
- [ ] Analyze existing structure & technology
- [ ] Document what exists vs. what's missing
- [ ] Determine conversion strategy (if needed)

### Functional (Add to Existing)
- [ ] All 7 screens have API integration
- [ ] WebSocket progress updates working
- [ ] All CRUD operations functional
- [ ] Export functionality working

### Quality
- [ ] 80%+ unit test coverage
- [ ] E2E tests passing
- [ ] No TypeScript errors
- [ ] Existing design preserved 100%

### Deployment
- [ ] Docker image builds
- [ ] Container runs correctly
- [ ] Nginx proxy working
- [ ] Health checks passing

### Documentation
- [ ] README.md updated
- [ ] CLAUDE.md created
- [ ] API_INTEGRATION.md created

---

## 🐳 Docker Commands

```bash
# Build
docker build -t simrule-ui:latest -f docker/Dockerfile .

# Run
docker run -d --name simrule-ui \
  --network ruleweaver-network \
  -p 4200:80 \
  simrule-ui:latest

# With docker-compose
docker-compose up -d
```

---

## 📁 Key Directories

```
src/app/
├── core/           # Services, interceptors, guards
├── shared/         # Reusable components, pipes
├── features/       # Feature modules (lazy-loaded)
│   ├── dashboard/
│   ├── scenarios/
│   ├── simulations/
│   ├── results/
│   ├── coverage/
│   ├── datasets/
│   └── settings/
├── models/         # TypeScript interfaces
└── app.routes.ts   # Route configuration
```

---

## 🚀 Development Commands

```bash
# Install
npm install

# Dev server
ng serve

# Test
npm test

# E2E
npx playwright test

# Build
ng build --configuration=docker

# Analyze bundle
npm run analyze
```

---

## ⚠️ Important Notes

1. **ANALYZE FIRST**: Always examine what's in the repo before writing code
2. **PRESERVE ALL STYLING**: Do NOT modify existing CSS/SCSS/colors/fonts
3. **PRESERVE COMPONENTS**: Keep existing component HTML structure intact
4. **PRESERVE ASSETS**: Keep all images, icons, logos from Figma export
5. **ADD, DON'T REPLACE**: Add Angular directives, services, routing - don't rebuild
6. **API Proxy**: Configure Nginx to proxy `/api/*` and `/ws/*` to simrule-api:8081

---

**Full detailed prompt**: `SimRule_UI_Claude_Code_Prompt_v2.md`
