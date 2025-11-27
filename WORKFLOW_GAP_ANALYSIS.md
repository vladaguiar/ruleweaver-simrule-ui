# SimRule UI Workflow Gap Analysis

**Date:** November 26, 2025
**Test Environment:** simrule-ui (localhost:3000) connected to simrule-api (localhost:8081)

## Executive Summary

The complete user workflow was tested end-to-end. While many features work correctly, **3 critical gaps** and **2 backend issues** were identified that impact the user experience.

---

## Workflow Steps Tested

### Step 1: Create Test Scenarios - PASSED
**Status:** Working correctly

**What works:**
- Scenarios can be created via API with all required fields (name, ruleSet, factType, testData, assertions)
- Scenarios display correctly in the Scenarios page
- Status filtering (Draft/Active/Archived) works
- Rule set filtering works
- Tags display correctly
- Pagination works
- Activate/Edit/Delete actions work

**Evidence:**
- Screenshot: `step1_scenarios_created.png`
- 3 scenarios created and displayed in UI

---

### Step 2: Upload Dataset from Excel - PASSED
**Status:** Working correctly

**What works:**
- Multi-step upload wizard (Select File > Configure > Preview)
- Excel file parsing works correctly
- Data preview shows parsed records with all columns
- Dataset metadata (name, factType, description, tags) can be configured
- Upload completes successfully with success notification
- Dataset displays in Datasets page with correct stats
- View, Edit, Export actions available

**Evidence:**
- Screenshot: `step2_dataset_preview.png`
- Screenshot: `step2_dataset_uploaded.png`
- Excel file with 5 records uploaded successfully

---

### Step 3: Run Simulations - PARTIAL

**What works:**
- Simulation Runner page displays available scenarios
- Scenario selection (individual and "Select All") works
- Execution mode selection (Sequential/Parallel) works
- Simulation starts and executes on the backend
- Execution log shows real-time entries
- Stop/Cancel functionality available

**GAP 1: WebSocket Connection Failure (CRITICAL)**
- **Issue:** WebSocket connection to `ws://localhost:8081/ws/simulations/{id}` fails repeatedly
- **Impact:** Real-time progress updates don't work; UI shows "0% (0/3 scenarios)" even after simulation completes
- **Root Cause:** Backend WebSocket endpoint not available or misconfigured
- **Location:** `src/services/websocket.service.ts`
- **Evidence:** Screenshot `step3_simulation_running_ws_error.png`

**GAP 2: No Fallback Polling Mechanism**
- **Issue:** When WebSocket fails, there's no HTTP polling fallback to check simulation status
- **Impact:** User must manually stop/refresh to see completed simulation
- **Recommendation:** Add periodic polling as fallback when WebSocket disconnects

**Evidence:**
- Screenshot: `step3_simulation_config.png`
- Screenshot: `step3_simulation_completed_ws_issue.png`
- Simulation completed on backend (verified via API) but UI didn't update

---

### Step 4: Analyze Results - PARTIAL

**What works:**
- Simulation Results list displays completed simulations
- Simulation name, status (COMPLETED), pass rate, duration, date all display correctly
- Export options (CSV, JSON) available
- Pagination works

**GAP 3: Scenario Results Not Displaying (CRITICAL)**
- **Issue:** When viewing a simulation's details, shows "0 Passed", "0 Failed", "0 Errors" and "No scenario results found"
- **Root Cause:** Code mismatch between API response and UI expectation
  - API returns: `scenarioExecutions` (array of `ScenarioExecutionDto`)
  - UI expects: `results` (array of `ScenarioResultDto`)
- **Location:** `src/components/Results.tsx:127`
  ```typescript
  // Current code (WRONG):
  const filteredScenarioResults = selectedSimulation?.results?.filter(...)

  // Should be:
  const filteredScenarioResults = selectedSimulation?.scenarioExecutions?.filter(...)
  ```
- **Impact:** Users cannot see individual scenario pass/fail status, assertion results, or error messages
- **Evidence:** Screenshot `step4_results_empty_gap.png`

**Additional Type Mismatch:**
- `ScenarioResultDto` type doesn't exist in `api.types.ts`
- Should use `ScenarioExecutionDto` instead
- Properties also differ: `status` vs `success`, `executionTimeMs` vs `durationMs`

---

### Step 5: Coverage & Reports - BLOCKED (Backend Issue)

**What works:**
- Coverage page loads with rule set dropdown
- Rule sets from API populate correctly

**Backend Issue 1: Coverage API Returns 500 Errors**
- **Issue:** All coverage endpoints return 500 Internal Server Error
- **Error Message:** `"Failed to retrieve active rules: 500 Internal Server Error from GET http://rule-inspector:8000/api/v1/rules/active"`
- **Root Cause:** simrule-api cannot connect to Rule Inspector service
- **Impact:** Cannot generate or view any coverage reports
- **Note:** This is a backend/infrastructure issue, not a UI bug

**Evidence:** Screenshot `step5_coverage_api_error.png`

---

## Dashboard Verification - PASSED

**What works:**
- Total Scenarios count updates correctly (3)
- Recent Runs count updates correctly (1)
- Pass rate displays correctly (0%)
- Trend indicators (+100.0%) show
- Recent Activity Timeline chart updates
- Recent Simulations table shows the simulation with status, duration, results
- Quick Actions navigate correctly

**Evidence:** Screenshot `step5_dashboard_after_simulation.png`

---

## Summary of Gaps

| # | Gap | Severity | Component | Fix Required |
|---|-----|----------|-----------|--------------|
| 1 | WebSocket connection fails | Critical | `websocket.service.ts` | Backend WebSocket endpoint configuration |
| 2 | No polling fallback | Medium | `Simulations.tsx` | Add HTTP polling when WS disconnects |
| 3 | Scenario results not displaying | Critical | `Results.tsx:127` | Change `results` to `scenarioExecutions` |

---

## Backend Issues (Not UI Bugs)

| # | Issue | Service | Impact |
|---|-------|---------|--------|
| 1 | Coverage API 500 errors | simrule-api | Cannot generate coverage reports |
| 2 | Rule Inspector connectivity | rule-inspector | Coverage feature blocked |

---

## Screenshots Generated

1. `step1_scenarios_created.png` - Scenarios page with 3 created scenarios
2. `step2_dataset_preview.png` - Dataset upload preview step
3. `step2_dataset_uploaded.png` - Dataset successfully uploaded
4. `step3_simulation_config.png` - Simulation runner with scenarios selected
5. `step3_simulation_running_ws_error.png` - WebSocket errors during simulation
6. `step3_simulation_completed_ws_issue.png` - Simulation completed but UI not updated
7. `step4_results_empty_gap.png` - Results page showing empty scenario results
8. `step4_results_list.png` - Simulation results list view
9. `step5_coverage_api_error.png` - Coverage page with API error
10. `step5_dashboard_after_simulation.png` - Dashboard after simulation completed

---

## Recommended Fixes (Priority Order)

### Priority 1: Fix Results Display (GAP 3)
**File:** `src/components/Results.tsx`

Change all references from `results` to `scenarioExecutions`:
- Line 127: `selectedSimulation?.results` -> `selectedSimulation?.scenarioExecutions`
- Line 139: `selectedSimulation.results?.map` -> `selectedSimulation.scenarioExecutions?.map`
- Lines 327-329: Update the pass/fail/error calculations

Also update type imports:
- Remove `ScenarioResultDto`
- Use `ScenarioExecutionDto` instead
- Map properties correctly (`success` instead of `status`, `durationMs` instead of `executionTimeMs`)

### Priority 2: Add Polling Fallback (GAP 2)
**File:** `src/components/Simulations.tsx`

Add a fallback HTTP polling mechanism:
```typescript
// When WebSocket fails, poll every 2 seconds
if (!wsConnected && simulationId) {
  const pollInterval = setInterval(async () => {
    const status = await simulationService.getById(simulationId);
    if (status.status === 'COMPLETED' || status.status === 'FAILED') {
      clearInterval(pollInterval);
      updateUIWithResults(status);
    }
  }, 2000);
}
```

### Priority 3: Fix WebSocket Configuration (GAP 1)
**Backend:** Verify WebSocket endpoint is properly configured and accessible
**Frontend:** Check `src/config/api.config.ts` WebSocket URL configuration
