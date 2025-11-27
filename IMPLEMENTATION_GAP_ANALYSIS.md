# SimRule UI - Implementation Gap Analysis Report

**Generated:** 2025-01-26
**Purpose:** Identify gaps between SPA implementation and available/required API functionality
**Audience:** Backend developers, Frontend developers, Project managers

---

## Executive Summary

This report identifies implementation gaps in the SimRule UI application. Each gap is categorized by:
- **Type**: Backend (requires API work) | Frontend (SPA work only) | Both
- **Priority**: Critical | High | Medium | Low
- **Component**: Affected UI component(s)

### Quick Stats
| Category | Count |
|----------|-------|
| Backend Required | 8 |
| Frontend Only | 15 |
| Both Required | 5 |
| **Total Gaps** | **28** |

---

## Table of Contents

1. [Dashboard Gaps](#1-dashboard-gaps)
2. [Scenario Management Gaps](#2-scenario-management-gaps)
3. [Simulation Execution Gaps](#3-simulation-execution-gaps)
4. [Results Viewer Gaps](#4-results-viewer-gaps)
5. [Coverage Analysis Gaps](#5-coverage-analysis-gaps)
6. [Dataset Management Gaps](#6-dataset-management-gaps)
7. [Settings & Configuration Gaps](#7-settings--configuration-gaps)
8. [Cross-Cutting Concerns](#8-cross-cutting-concerns)

---

## 1. Dashboard Gaps

### GAP-D01: Auto-Refresh Not Implemented
| Property | Value |
|----------|-------|
| **Type** | Frontend |
| **Priority** | Low |
| **Current State** | Manual refresh button exists, but auto-refresh interval from Settings is not used |
| **Expected Behavior** | Dashboard should auto-refresh based on user-configured interval (default 30s) |

**Solution:**
- Frontend: Add `useEffect` with interval timer that calls refresh functions
- Read interval from `useAppContext()` or localStorage settings
- Clear interval on component unmount

---

### GAP-D02: KPI Trend Indicators Hardcoded
| Property | Value |
|----------|-------|
| **Type** | Both |
| **Priority** | Medium |
| **Current State** | "+12%" trend indicator is hardcoded in Dashboard.tsx line 183 |
| **Expected Behavior** | Trend should be calculated from historical data |

**Solution:**
- Backend: Add endpoint `GET /api/v1/statistics/trends` returning period-over-period comparisons
- Frontend: Replace hardcoded trend with API-derived value

---

### GAP-D03: Rule Inspector Health Status Not Shown
| Property | Value |
|----------|-------|
| **Type** | Backend |
| **Priority** | Low |
| **Current State** | Only SimRule API health is checked and displayed |
| **Expected Behavior** | Dashboard should show health of both SimRule API and Rule Inspector |

**Solution:**
- Backend: Add Rule Inspector health proxy endpoint or include in existing health response
- Frontend: Display separate status indicator for Rule Inspector

---

## 2. Scenario Management Gaps

### GAP-S01: Tag Filtering Not Functional
| Property | Value |
|----------|-------|
| **Type** | Frontend |
| **Priority** | High |
| **Current State** | Tag filter UI exists in Scenarios.tsx but selected tags are not sent to API |
| **Expected Behavior** | Filtering by tags should filter the scenario list |

**Solution:**
- Frontend: Update `useScenarios` hook to include `tags` parameter in API query
- API already supports `tag` query parameter per documentation

---

### GAP-S02: FactType Filtering Missing
| Property | Value |
|----------|-------|
| **Type** | Frontend |
| **Priority** | Medium |
| **Current State** | No UI to filter scenarios by fact type |
| **Expected Behavior** | Users should be able to filter scenarios by fact type |

**Solution:**
- Frontend: Add fact type dropdown filter to Scenarios.tsx
- Use existing `scenarioService.getAll({ factType: ... })` capability

---

### GAP-S03: CSV Export Not Implemented
| Property | Value |
|----------|-------|
| **Type** | Frontend |
| **Priority** | Medium |
| **Current State** | CLAUDE.md mentions "Export scenario list as CSV" but feature is missing |
| **Expected Behavior** | Button to export current scenario list as CSV file |

**Solution:**
- Frontend: Add export button that generates CSV from loaded scenarios
- Use client-side CSV generation (no backend required)

---

### GAP-S04: Server-Side Pagination Not Used
| Property | Value |
|----------|-------|
| **Type** | Frontend |
| **Priority** | Medium |
| **Current State** | All scenarios fetched, then paginated client-side |
| **Expected Behavior** | Use server-side pagination for large datasets |

**Solution:**
- Frontend: Update `scenarioService.getAll()` calls to include `page` and `size` parameters
- API already supports `page`, `size`, and `sort` parameters

---

### GAP-S05: Monaco Editor Not Integrated in Scenario Editor
| Property | Value |
|----------|-------|
| **Type** | Frontend |
| **Priority** | High |
| **Current State** | Basic textarea used for JSON test data input |
| **Expected Behavior** | Monaco Editor with syntax highlighting, validation, auto-complete |

**Solution:**
- Frontend: Install `@monaco-editor/react` package
- Replace textarea with Monaco Editor component
- Configure JSON language support and validation

---

### GAP-S06: Auto-Save Not Implemented in Scenario Editor
| Property | Value |
|----------|-------|
| **Type** | Frontend |
| **Priority** | Medium |
| **Current State** | No auto-save functionality |
| **Expected Behavior** | Auto-save to localStorage every 30 seconds with unsaved changes warning |

**Solution:**
- Frontend: Add debounced localStorage save on form changes
- Add `beforeunload` event listener for unsaved changes warning
- Display "Last saved" indicator

---

### GAP-S07: Keyboard Shortcuts Missing
| Property | Value |
|----------|-------|
| **Type** | Frontend |
| **Priority** | Low |
| **Current State** | No keyboard shortcuts in Scenario Editor |
| **Expected Behavior** | Ctrl+S to save, Ctrl+Enter to run |

**Solution:**
- Frontend: Add keyboard event listeners for shortcuts
- Display shortcut hints in UI

---

### GAP-S08: Generate Sample Data Not Implemented
| Property | Value |
|----------|-------|
| **Type** | Both |
| **Priority** | Low |
| **Current State** | No "Generate sample data" button in Scenario Editor |
| **Expected Behavior** | Button to generate sample JSON data based on fact type schema |

**Solution:**
- Backend: Add endpoint `GET /api/v1/schemas/{factType}/sample` to generate sample data
- Frontend: Add button that calls endpoint and populates test data field

---

## 3. Simulation Execution Gaps

### GAP-X01: Simulation Cancellation Not Implemented
| Property | Value |
|----------|-------|
| **Type** | Both |
| **Priority** | High |
| **Current State** | Stop button only disconnects WebSocket locally; doesn't cancel on backend |
| **Expected Behavior** | Cancel button should stop simulation execution on server |

**Solution:**
- Backend: Add endpoint `POST /api/v1/simulations/{id}/cancel`
- Frontend: Call cancel endpoint when stop button clicked, then disconnect WebSocket

---

### GAP-X02: Pause/Resume Not Available
| Property | Value |
|----------|-------|
| **Type** | Backend |
| **Priority** | Low |
| **Current State** | No pause/resume functionality |
| **Expected Behavior** | Ability to pause and resume long-running simulations |

**Solution:**
- Backend: Add endpoints `POST /api/v1/simulations/{id}/pause` and `POST /api/v1/simulations/{id}/resume`
- Frontend: Add pause/resume buttons with state management

---

### GAP-X03: Rule Set Filter Not Applied to Scenario Selection
| Property | Value |
|----------|-------|
| **Type** | Frontend |
| **Priority** | Medium |
| **Current State** | Rule set selector loads but doesn't filter scenarios in selection list |
| **Expected Behavior** | Selecting a rule set should filter available scenarios |

**Solution:**
- Frontend: Add filter logic to scenario list based on selected rule set
- Update scenario fetching to include `ruleSet` filter parameter

---

## 4. Results Viewer Gaps

### GAP-R01: PDF Export Not Implemented
| Property | Value |
|----------|-------|
| **Type** | Frontend |
| **Priority** | Medium |
| **Current State** | CSV and JSON export work, PDF export mentioned in CLAUDE.md is missing |
| **Expected Behavior** | Generate formatted PDF report of simulation results |

**Solution:**
- Frontend: Integrate PDF generation library (e.g., `jspdf`, `react-pdf`)
- Create PDF template with charts and tables
- No backend required

---

### GAP-R02: Side-by-Side JSON Diff Viewer Missing
| Property | Value |
|----------|-------|
| **Type** | Frontend |
| **Priority** | Medium |
| **Current State** | Expected vs actual shown in table, no visual diff |
| **Expected Behavior** | Side-by-side JSON comparison with highlighted differences |

**Solution:**
- Frontend: Integrate diff library (e.g., `react-diff-viewer`, `monaco-editor` diff)
- Add toggle to switch between table view and diff view

---

### GAP-R03: Simulation Comparison View Not Implemented
| Property | Value |
|----------|-------|
| **Type** | Frontend |
| **Priority** | Low |
| **Current State** | Can only view one simulation at a time |
| **Expected Behavior** | Compare results between two simulations |

**Solution:**
- Frontend: Add multi-select for simulations
- Create comparison component showing side-by-side metrics

---

### GAP-R04: Re-Run Scenario from Results Not Available
| Property | Value |
|----------|-------|
| **Type** | Frontend |
| **Priority** | Medium |
| **Current State** | Cannot re-run a specific failed scenario from results view |
| **Expected Behavior** | "Re-run" button on each scenario result |

**Solution:**
- Frontend: Add re-run button that calls `simulationService.executeScenario(scenarioId)`
- Navigate to simulation runner or show inline progress

---

### GAP-R05: Date Range Filter Missing
| Property | Value |
|----------|-------|
| **Type** | Frontend |
| **Priority** | Medium |
| **Current State** | No date range filter for simulations list |
| **Expected Behavior** | Filter simulations by date range |

**Solution:**
- Frontend: Add date picker components for from/to dates
- API supports date filtering (needs verification)

---

### GAP-R06: Breadcrumb Navigation Not Implemented
| Property | Value |
|----------|-------|
| **Type** | Frontend |
| **Priority** | Low |
| **Current State** | Only back button available |
| **Expected Behavior** | Breadcrumb trail: Simulations → Simulation Detail → Scenario Detail |

**Solution:**
- Frontend: Add breadcrumb component tracking navigation path
- Maintain navigation state in context or URL

---

## 5. Coverage Analysis Gaps

### GAP-C01: Full Untested Rules List Not Viewable
| Property | Value |
|----------|-------|
| **Type** | Frontend |
| **Priority** | Medium |
| **Current State** | Only first 10 untested rules shown with "...and X more" |
| **Expected Behavior** | Expandable/paginated list of all untested rules |

**Solution:**
- Frontend: Add "View All" button or pagination for untested rules
- Create modal or expanded section showing full list

---

### GAP-C02: Coverage Gap Suggestions Not Implemented
| Property | Value |
|----------|-------|
| **Type** | Both |
| **Priority** | Low |
| **Current State** | CLAUDE.md mentions "Suggest scenarios to improve coverage" - not implemented |
| **Expected Behavior** | System suggests which scenarios to create to cover untested rules |

**Solution:**
- Backend: Add endpoint that analyzes untested rules and suggests test scenarios
- Frontend: Display suggestions with "Create Scenario" action buttons

---

### GAP-C03: Rule Dependency Visualization Missing
| Property | Value |
|----------|-------|
| **Type** | Both |
| **Priority** | Low |
| **Current State** | No visualization of rule dependencies |
| **Expected Behavior** | Graph or tree showing rule dependencies and risk assessment |

**Solution:**
- Backend: Add endpoint returning rule dependency graph
- Frontend: Integrate graph visualization library (e.g., `reactflow`, `d3`)

---

## 6. Dataset Management Gaps

### GAP-DS01: Dataset Update/Edit Not Implemented
| Property | Value |
|----------|-------|
| **Type** | Both |
| **Priority** | High |
| **Current State** | No PUT endpoint for datasets, no edit functionality in UI |
| **Expected Behavior** | Edit dataset metadata and records |

**Solution:**
- Backend: Add endpoint `PUT /api/v1/datasets/{id}`
- Frontend: Add edit mode to dataset detail view

---

### GAP-DS02: Record Editing Not Available
| Property | Value |
|----------|-------|
| **Type** | Both |
| **Priority** | Medium |
| **Current State** | Records displayed read-only, cannot add/edit/delete individual records |
| **Expected Behavior** | Inline editing of dataset records |

**Solution:**
- Backend: Add endpoints for record CRUD within dataset
- Frontend: Add editable data grid with save/cancel actions

---

### GAP-DS03: CSV Column Mapping Wizard Missing
| Property | Value |
|----------|-------|
| **Type** | Frontend |
| **Priority** | Medium |
| **Current State** | CSV uploaded with auto-detected columns, no manual mapping |
| **Expected Behavior** | Wizard to map CSV columns to fact type fields |

**Solution:**
- Frontend: Add step in upload wizard for column mapping
- Allow user to specify column → field mappings
- Preview transformed data before final upload

---

### GAP-DS04: Schema Validation Not Implemented
| Property | Value |
|----------|-------|
| **Type** | Both |
| **Priority** | Medium |
| **Current State** | Records not validated against fact type schema |
| **Expected Behavior** | Validate dataset records match expected schema |

**Solution:**
- Backend: Add endpoint `GET /api/v1/schemas/{factType}` returning JSON schema
- Frontend: Validate records against schema, show validation errors

---

### GAP-DS05: Tag Filtering Not Functional
| Property | Value |
|----------|-------|
| **Type** | Frontend |
| **Priority** | Low |
| **Current State** | Tags loaded but filtering by tags not implemented |
| **Expected Behavior** | Filter datasets by tags |

**Solution:**
- Frontend: Add tags filter dropdown, include in API query

---

## 7. Settings & Configuration Gaps

### GAP-SET01: Dark Mode Not Functional
| Property | Value |
|----------|-------|
| **Type** | Frontend |
| **Priority** | High |
| **Current State** | Dark mode option shows "Coming Soon", theme toggle exists but incomplete |
| **Expected Behavior** | Fully functional dark mode theme |

**Solution:**
- Frontend: Complete CSS variables for dark theme
- Ensure all components respect theme variables
- Persist theme preference to localStorage

---

### GAP-SET02: Notification Preferences Not Wired
| Property | Value |
|----------|-------|
| **Type** | Frontend |
| **Priority** | Medium |
| **Current State** | Toggle switches visible but have no backing state or functionality |
| **Expected Behavior** | Notification preferences saved and respected |

**Solution:**
- Frontend: Add state management for notification preferences
- Integrate with notification system
- Persist to localStorage

---

### GAP-SET03: Profile Settings Hardcoded
| Property | Value |
|----------|-------|
| **Type** | Both |
| **Priority** | Low |
| **Current State** | Profile tab shows hardcoded demo data ("John Doe", etc.) |
| **Expected Behavior** | Display actual user profile from authentication |

**Solution:**
- Backend: Integrate with authentication system
- Frontend: Fetch and display user profile from auth context

---

### GAP-SET04: Rule Inspector URL Configuration Missing
| Property | Value |
|----------|-------|
| **Type** | Frontend |
| **Priority** | Medium |
| **Current State** | Only SimRule API URL configurable, Rule Inspector URL not exposed |
| **Expected Behavior** | Separate configuration for Rule Inspector connectivity |

**Solution:**
- Frontend: Add Rule Inspector URL field in Settings
- Add separate connectivity test button

---

## 8. Cross-Cutting Concerns

### GAP-CC01: Bulk Operations Use Sequential Calls
| Property | Value |
|----------|-------|
| **Type** | Backend |
| **Priority** | Medium |
| **Current State** | Bulk delete calls individual DELETE endpoints in loop |
| **Expected Behavior** | Single bulk operation endpoint for efficiency |

**Solution:**
- Backend: Add endpoint `DELETE /api/v1/scenarios/bulk` accepting array of IDs
- Frontend: Update service to use bulk endpoint

---

### GAP-CC02: Error Notification Signature Issues
| Property | Value |
|----------|-------|
| **Type** | Frontend |
| **Priority** | High |
| **Current State** | Multiple components call `addNotification` with wrong signature |
| **Expected Behavior** | Consistent notification API usage |

**Solution:**
- Frontend: Audit all `addNotification` calls
- Fix to match expected interface: `{ title, message, type }`

---

### GAP-CC03: No Request Retry Logic in UI
| Property | Value |
|----------|-------|
| **Type** | Frontend |
| **Priority** | Low |
| **Current State** | API config has retry settings but not implemented |
| **Expected Behavior** | Automatic retry for transient failures |

**Solution:**
- Frontend: Implement retry logic in API service
- Use exponential backoff for retries

---

### GAP-CC04: No Offline Support
| Property | Value |
|----------|-------|
| **Type** | Frontend |
| **Priority** | Low |
| **Current State** | App requires constant API connectivity |
| **Expected Behavior** | Basic offline support with cached data |

**Solution:**
- Frontend: Add service worker for caching
- Implement offline-first patterns for read operations
- Queue writes for sync when online

---

## Priority Summary

### Critical Priority
*None identified*

### High Priority
| Gap ID | Description | Type |
|--------|-------------|------|
| GAP-S01 | Tag Filtering Not Functional | Frontend |
| GAP-S05 | Monaco Editor Not Integrated | Frontend |
| GAP-X01 | Simulation Cancellation Not Implemented | Both |
| GAP-DS01 | Dataset Update/Edit Not Implemented | Both |
| GAP-SET01 | Dark Mode Not Functional | Frontend |
| GAP-CC02 | Error Notification Signature Issues | Frontend |

### Medium Priority
| Gap ID | Description | Type |
|--------|-------------|------|
| GAP-D02 | KPI Trend Indicators Hardcoded | Both |
| GAP-S02 | FactType Filtering Missing | Frontend |
| GAP-S03 | CSV Export Not Implemented | Frontend |
| GAP-S04 | Server-Side Pagination Not Used | Frontend |
| GAP-S06 | Auto-Save Not Implemented | Frontend |
| GAP-X03 | Rule Set Filter Not Applied | Frontend |
| GAP-R01 | PDF Export Not Implemented | Frontend |
| GAP-R02 | JSON Diff Viewer Missing | Frontend |
| GAP-R04 | Re-Run Scenario from Results | Frontend |
| GAP-R05 | Date Range Filter Missing | Frontend |
| GAP-C01 | Full Untested Rules List | Frontend |
| GAP-DS02 | Record Editing Not Available | Both |
| GAP-DS03 | CSV Column Mapping Wizard | Frontend |
| GAP-DS04 | Schema Validation Not Implemented | Both |
| GAP-SET02 | Notification Preferences Not Wired | Frontend |
| GAP-SET04 | Rule Inspector URL Configuration | Frontend |
| GAP-CC01 | Bulk Operations Use Sequential Calls | Backend |

### Low Priority
| Gap ID | Description | Type |
|--------|-------------|------|
| GAP-D01 | Auto-Refresh Not Implemented | Frontend |
| GAP-D03 | Rule Inspector Health Status | Backend |
| GAP-S07 | Keyboard Shortcuts Missing | Frontend |
| GAP-S08 | Generate Sample Data | Both |
| GAP-X02 | Pause/Resume Not Available | Backend |
| GAP-R03 | Simulation Comparison View | Frontend |
| GAP-R06 | Breadcrumb Navigation | Frontend |
| GAP-C02 | Coverage Gap Suggestions | Both |
| GAP-C03 | Rule Dependency Visualization | Both |
| GAP-DS05 | Dataset Tag Filtering | Frontend |
| GAP-SET03 | Profile Settings Hardcoded | Both |
| GAP-CC03 | No Request Retry Logic | Frontend |
| GAP-CC04 | No Offline Support | Frontend |

---

## Recommended Implementation Order

### Phase 1: High-Impact Frontend Fixes (1-2 weeks)
1. GAP-CC02 - Fix notification signature issues
2. GAP-SET01 - Complete dark mode implementation
3. GAP-S01 - Enable tag filtering
4. GAP-S05 - Integrate Monaco Editor

### Phase 2: Backend API Additions (2-3 weeks)
1. GAP-X01 - Simulation cancellation endpoint
2. GAP-DS01 - Dataset update endpoint
3. GAP-CC01 - Bulk operation endpoints
4. GAP-DS04 - Schema endpoints

### Phase 3: Enhanced UX Features (2-3 weeks)
1. GAP-S03 - CSV export
2. GAP-R01 - PDF export
3. GAP-R02 - JSON diff viewer
4. GAP-DS03 - Column mapping wizard

### Phase 4: Polish & Nice-to-Have (Ongoing)
1. GAP-S06 - Auto-save
2. GAP-S07 - Keyboard shortcuts
3. GAP-D01 - Auto-refresh
4. Remaining low-priority items

---

## Appendix: API Endpoints Status

### Fully Implemented in SPA
| Endpoint | Service Method |
|----------|----------------|
| `GET /api/v1/scenarios` | `scenarioService.getAll()` |
| `GET /api/v1/scenarios/{id}` | `scenarioService.getById()` |
| `POST /api/v1/scenarios` | `scenarioService.create()` |
| `PUT /api/v1/scenarios/{id}` | `scenarioService.update()` |
| `DELETE /api/v1/scenarios/{id}` | `scenarioService.delete()` |
| `POST /api/v1/scenarios/{id}/clone` | `scenarioService.clone()` |
| `GET /api/v1/simulations` | `simulationService.getAll()` |
| `GET /api/v1/simulations/{id}` | `simulationService.getById()` |
| `POST /api/v1/simulations` | `simulationService.execute()` |
| `GET /api/v1/datasets` | `datasetService.getAll()` |
| `GET /api/v1/datasets/{id}` | `datasetService.getById()` |
| `POST /api/v1/datasets` | `datasetService.upload()` |
| `DELETE /api/v1/datasets/{id}` | `datasetService.delete()` |
| `GET /api/v1/coverage/{ruleSet}` | `coverageService.getReports()` |
| `GET /api/v1/coverage/{ruleSet}/latest` | `coverageService.getLatest()` |
| `POST /api/v1/coverage/{ruleSet}` | `coverageService.generate()` |
| `GET /api/v1/statistics/activity` | `statisticsService.getActivity()` |
| `GET /actuator/health` | `apiService.checkHealth()` |
| `WS /ws/simulations/{id}` | `websocketService.connectToSimulation()` |

### Missing API Endpoints (Backend Work Required)
| Endpoint | Purpose |
|----------|---------|
| `PUT /api/v1/datasets/{id}` | Update dataset |
| `POST /api/v1/simulations/{id}/cancel` | Cancel running simulation |
| `POST /api/v1/simulations/{id}/pause` | Pause simulation |
| `POST /api/v1/simulations/{id}/resume` | Resume simulation |
| `DELETE /api/v1/scenarios/bulk` | Bulk delete scenarios |
| `GET /api/v1/schemas/{factType}` | Get fact type schema |
| `GET /api/v1/schemas/{factType}/sample` | Generate sample data |
| `GET /api/v1/statistics/trends` | Get trend data |

---

*End of Report*
