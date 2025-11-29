# Backend Issues - Instructions for SimRule API Team

**Date**: 2025-11-28
**Source**: E2E Testing Gap Analysis Report
**Priority**: CRITICAL
**Affected Service**: SimRule API (Coverage Calculation Service)
**Test Evidence**: 112 simulations executed via Playwright E2E testing

---

## Executive Summary

Comprehensive E2E testing of the SimRule UI has validated that **Issue #0 (rules fired data mapping) is working correctly**. The SimRule API now properly extracts rule IDs from `validationResponse.results[]` and populates `scenarioExecutions[].rulesFired[]` arrays as expected.

However, testing revealed a **CRITICAL bug in the coverage calculation service**: despite executing 112 simulations where rules successfully fired (RULE_004 and RULE_005 confirmed in multiple simulations), the coverage endpoint returns **0.0% coverage** with all rules marked as "Untested" with "0 hits".

This is a **BLOCKING ISSUE** for the regression testing workflow and must be fixed immediately.

---

## Issue #1: Coverage Tracking Not Working (CRITICAL)

### Problem Statement

The coverage calculation service is not correctly tracking which rules have been executed during simulations. Despite rules firing successfully in 100+ simulations, the coverage endpoint returns 0% coverage.

### Severity

🔴 **CRITICAL** - Blocking Issue

**Impact**:
- ❌ Users cannot track rule coverage
- ❌ Cannot identify untested rules
- ❌ Regression testing workflow is broken
- ❌ Coverage reports are completely useless
- ❌ Prevents validation of test completeness

### Evidence

#### What We Know is Working

1. **Rules ARE Firing** ✅
   - RULE_004 (Risk Category Assignment) fires in "CL Policy Validation" scenario
   - RULE_005 (Multi Coverage Discount) fires in "CL Policy Validation" scenario
   - Confirmed via Rule Inspector logs (from previous testing)
   - Confirmed via SimRule API response (see below)

2. **SimRule API is Correctly Extracting Rule Data** ✅
   - `scenarioExecutions[].rulesFired[]` arrays are populated with rule IDs
   - Example: `["RULE_004", "RULE_005"]`
   - This data flows correctly to the UI

3. **UI is Correctly Displaying Rule Data** ✅
   - Results page shows "Rules Fired: 2"
   - Scenario details show "Rules Fired (2)" with RULE_004 and RULE_005 listed
   - Screenshot evidence: `simulation-1-rules-fired-success.png`

#### What is NOT Working

1. **Coverage Calculation Returns Incorrect Data** ❌
   - Coverage endpoint: `POST /api/v1/coverage/commercial-lines-underwriting`
   - Returns: 0.0% coverage
   - Returns: 0 tested rules
   - Returns: All 6 rules marked as "Untested" with "0 hits"

2. **Coverage Does Not Update After Simulations** ❌
   - Ran 112 simulations where rules fired
   - Regenerated coverage report via UI
   - Coverage still shows 0.0%

### Sample Data

#### Simulation API Response (Working Correctly)

```json
{
  "id": "692a449c5d4f1f5e48e2db25",
  "name": "SEQ-Multi-Both-T75-Test-01",
  "executionMode": "SEQUENTIAL",
  "status": "COMPLETED",
  "scenarioIds": ["692a1e97a5421b6292857f7e", "<other-scenario-id>"],
  "scenarioExecutions": [
    {
      "scenarioId": "692a1e97a5421b6292857f7e",
      "scenarioName": "CL Policy Validation",
      "success": true,
      "durationMs": 10,
      "rulesFired": ["RULE_004", "RULE_005"],  // ✅ This is populated correctly!
      "validationResponse": {
        "isValid": true,
        "rulesFired": 2,
        "executionTimeMs": 3,
        "results": [
          {
            "ruleId": "RULE_004",
            "ruleName": "RULE_004 - Risk Category Assignment",
            "status": "APPLIED",
            "message": "Rule fired successfully",
            "executedAt": "2025-11-28T23:57:36.457Z"
          },
          {
            "ruleId": "RULE_005",
            "ruleName": "RULE_005 - Multi Coverage Discount",
            "status": "APPLIED",
            "message": "Rule fired successfully",
            "executedAt": "2025-11-28T23:57:36.457Z"
          }
        ]
      }
    }
  ],
  "metrics": {
    "totalScenarios": 2,
    "scenariosPassed": 2,
    "scenariosFailed": 0,
    "successRate": 100.0
  }
}
```

#### Coverage API Response (NOT Working - BUG)

```json
{
  "id": "692a450b5d4f1f5e48e2db2b",
  "ruleSet": "commercial-lines-underwriting",
  "generatedAt": "2025-11-29T00:57:47.123Z",
  "coveragePercentage": 0.0,  // ❌ Should be > 0%
  "totalRules": 6,
  "testedRules": 0,  // ❌ Should be at least 2 (RULE_004, RULE_005)
  "untestedRules": 6,  // ❌ Should be at most 4
  "ruleCoverage": [
    {
      "ruleId": "RULE_001",
      "ruleName": "Minimum Years In Business Requirement",
      "covered": false,
      "executionCount": 0,  // ✅ Correct - this rule didn't fire
      "lastExecutedAt": null
    },
    {
      "ruleId": "RULE_004",
      "ruleName": "Risk Category Assignment",
      "covered": false,  // ❌ Should be TRUE
      "executionCount": 0,  // ❌ Should be > 100
      "lastExecutedAt": null  // ❌ Should have a timestamp
    },
    {
      "ruleId": "RULE_005",
      "ruleName": "Multi Coverage Discount",
      "covered": false,  // ❌ Should be TRUE
      "executionCount": 0,  // ❌ Should be > 100
      "lastExecutedAt": null  // ❌ Should have a timestamp
    }
  ]
}
```

### Root Cause Analysis

The coverage calculation service is not correctly aggregating rule execution data from simulation results. Possible causes:

#### Hypothesis 1: Coverage Service Not Reading from Simulations Collection

**Likelihood**: HIGH

**Description**: The coverage service may be reading from a separate "coverage events" collection that is not being populated when simulations complete.

**Investigation Steps**:
1. Check if coverage service reads directly from `simulations` collection
2. Check if there's a separate collection for coverage tracking events
3. Verify if there's an event listener that should fire after simulation completion

**Expected Behavior**: Coverage service should:
- Query all simulations for the specified rule set
- Aggregate `scenarioExecutions[].rulesFired[]` arrays across all simulations
- Calculate coverage based on unique rules fired vs total rules in rule set

#### Hypothesis 2: Rule ID Mapping Mismatch

**Likelihood**: MEDIUM

**Description**: The coverage service may be expecting a different rule ID format than what's in the simulation results.

**Investigation Steps**:
1. Check what rule ID format coverage service expects
2. Verify rule IDs in rule definitions match those in simulation results
3. Check if there's a mapping table between rule IDs

**Evidence**:
- Simulation results use: `"RULE_004"`, `"RULE_005"`
- Coverage response uses: `"RULE_004"`, `"RULE_005"`
- These match, so this is less likely the issue

#### Hypothesis 3: Coverage Calculation Only Runs on Scenario Creation

**Likelihood**: MEDIUM

**Description**: Coverage may only be calculated based on scenario definitions (expectedRulesToFire) rather than actual simulation executions.

**Investigation Steps**:
1. Check when coverage service updates coverage data
2. Verify if coverage is based on scenario definitions or simulation results
3. Check if there's a scheduled job to recalculate coverage

**Expected Behavior**: Coverage should be based on **actual simulation results**, not scenario definitions.

#### Hypothesis 4: Coverage Aggregation Logic Bug

**Likelihood**: HIGH

**Description**: The coverage service has a bug in its aggregation logic that causes it to always return 0.

**Investigation Steps**:
1. Add debug logging to coverage calculation service
2. Check for null pointer exceptions or try-catch blocks swallowing errors
3. Verify database queries are returning data
4. Check if any filters are excluding all simulations

---

## Technical Details for Investigation

### Architecture Context

Based on the SimRule API architecture:

1. **Simulation Execution Flow**:
   ```
   UI → POST /api/v1/simulations → SimulationService
   → SimulationEngine.execute()
   → Rule Inspector (validates fact, rules fire)
   → Results stored in Simulations collection with rulesFired[]
   ```

2. **Coverage Calculation Flow** (Current):
   ```
   UI → POST /api/v1/coverage/{ruleSet} → CoverageService
   → ??? (Unknown what it reads)
   → Returns CoverageReport with 0.0%
   ```

3. **Expected Coverage Calculation Flow**:
   ```
   UI → POST /api/v1/coverage/{ruleSet} → CoverageService
   → Query Simulations collection for ruleSet
   → Aggregate scenarioExecutions[].rulesFired[] across all simulations
   → Calculate coverage: (unique rules fired / total rules) * 100
   → Return accurate CoverageReport
   ```

### Key Files to Investigate

Based on typical Spring Boot structure:

1. **Coverage Service** (likely one of):
   - `src/main/java/com/ruleweaver/simrule/service/CoverageService.java`
   - `src/main/java/com/ruleweaver/simrule/service/CoverageCalculationService.java`
   - `src/main/java/com/ruleweaver/simrule/service/CoverageReportService.java`

2. **Coverage Controller**:
   - `src/main/java/com/ruleweaver/simrule/controller/CoverageController.java`
   - Look for: `POST /api/v1/coverage/{ruleSet}` endpoint

3. **Coverage Model/Entity**:
   - `src/main/java/com/ruleweaver/simrule/model/CoverageReport.java`
   - `src/main/java/com/ruleweaver/simrule/entity/CoverageReport.java`

4. **Simulation Repository**:
   - `src/main/java/com/ruleweaver/simrule/repository/SimulationRepository.java`
   - Should have methods to query simulations by rule set

### Database Collections to Check

**MongoDB Collections**:

1. **simulations** - Should contain:
   ```javascript
   {
     _id: ObjectId("..."),
     name: "SEQ-Multi-Both-T75-Test-01",
     ruleSet: "commercial-lines-underwriting",  // or derived from scenarios
     scenarioExecutions: [
       {
         scenarioId: "692a1e97a5421b6292857f7e",
         rulesFired: ["RULE_004", "RULE_005"]  // This is populated!
       }
     ]
   }
   ```

2. **coverageReports** (if exists) - Check if it's being updated:
   ```javascript
   {
     _id: ObjectId("..."),
     ruleSet: "commercial-lines-underwriting",
     generatedAt: ISODate("2025-11-29T00:57:47.123Z"),
     ruleCoverage: [...]  // Check if this ever gets updated
   }
   ```

3. **Check for orphaned collections**:
   - `coverageEvents`
   - `ruleExecutions`
   - Any collection that might be used for tracking but not populated

### Logging to Add

Add debug logging to coverage service to trace execution:

```java
log.debug("Coverage calculation started for ruleSet: {}", ruleSet);

// When querying simulations
log.debug("Found {} simulations for ruleSet: {}", simulations.size(), ruleSet);

// When aggregating rules
log.debug("Aggregating rulesFired arrays from {} executions", totalExecutions);
log.debug("Unique rules fired: {}", uniqueRulesFired);

// When calculating coverage
log.debug("Total rules in set: {}, Tested rules: {}, Coverage: {}%",
          totalRules, testedRules, coveragePercentage);

// Final result
log.debug("Returning coverage report: {}", coverageReport);
```

---

## Expected Fix

### What Needs to Happen

The coverage service should be updated to:

1. **Query simulations** for the specified rule set
2. **Aggregate `rulesFired` arrays** from all `scenarioExecutions[]` in those simulations
3. **Calculate unique rules fired** from the aggregated data
4. **Update coverage report** with:
   - `coveragePercentage` = (unique rules fired / total rules in set) * 100
   - `testedRules` = count of unique rules fired
   - `untestedRules` = total rules - tested rules
   - For each rule in `ruleCoverage[]`:
     - `covered` = true if rule appears in any `rulesFired` array
     - `executionCount` = count of times rule appears across all simulations
     - `lastExecutedAt` = most recent execution timestamp

### Example Fix (Pseudocode)

```java
public CoverageReport calculateCoverage(String ruleSet) {
    // 1. Get all simulations that tested this rule set
    List<Simulation> simulations = simulationRepository.findByRuleSet(ruleSet);
    log.debug("Found {} simulations for ruleSet: {}", simulations.size(), ruleSet);

    // 2. Aggregate all rulesFired from all scenarioExecutions
    Map<String, RuleCoverageStats> ruleStats = new HashMap<>();

    for (Simulation sim : simulations) {
        for (ScenarioExecution exec : sim.getScenarioExecutions()) {
            List<String> rulesFired = exec.getRulesFired();
            if (rulesFired != null) {
                for (String ruleId : rulesFired) {
                    ruleStats.putIfAbsent(ruleId, new RuleCoverageStats(ruleId));
                    ruleStats.get(ruleId).incrementHitCount();
                    ruleStats.get(ruleId).updateLastExecutedAt(exec.getCompletedAt());
                }
            }
        }
    }

    log.debug("Unique rules fired: {}", ruleStats.keySet());

    // 3. Get total rules from rule definitions
    List<RuleDefinition> allRules = ruleDefinitionRepository.findByRuleSet(ruleSet);
    int totalRules = allRules.size();
    int testedRules = ruleStats.size();

    // 4. Build coverage report
    CoverageReport report = new CoverageReport();
    report.setRuleSet(ruleSet);
    report.setTotalRules(totalRules);
    report.setTestedRules(testedRules);
    report.setUntestedRules(totalRules - testedRules);
    report.setCoveragePercentage((double) testedRules / totalRules * 100);

    // 5. Build per-rule coverage details
    List<RuleCoverage> ruleCoverageList = new ArrayList<>();
    for (RuleDefinition rule : allRules) {
        RuleCoverage rc = new RuleCoverage();
        rc.setRuleId(rule.getRuleId());
        rc.setRuleName(rule.getRuleName());

        RuleCoverageStats stats = ruleStats.get(rule.getRuleId());
        if (stats != null) {
            rc.setCovered(true);
            rc.setExecutionCount(stats.getHitCount());
            rc.setLastExecutedAt(stats.getLastExecutedAt());
        } else {
            rc.setCovered(false);
            rc.setExecutionCount(0);
            rc.setLastExecutedAt(null);
        }

        ruleCoverageList.add(rc);
    }

    report.setRuleCoverage(ruleCoverageList);

    log.debug("Coverage calculation complete: {}% ({}/{})",
              report.getCoveragePercentage(), testedRules, totalRules);

    return report;
}
```

---

## Testing Instructions

After implementing the fix, follow these steps to validate:

### 1. Unit Tests

Create unit tests for the coverage calculation service:

```java
@Test
public void testCoverageCalculation_withRulesFired() {
    // Given: Simulations where RULE_004 and RULE_005 fired
    List<Simulation> simulations = createTestSimulations();
    when(simulationRepository.findByRuleSet("commercial-lines-underwriting"))
        .thenReturn(simulations);

    // When: Calculate coverage
    CoverageReport report = coverageService.calculateCoverage("commercial-lines-underwriting");

    // Then: Coverage should be accurate
    assertEquals(33.3, report.getCoveragePercentage(), 0.1);  // 2/6 rules
    assertEquals(2, report.getTestedRules());
    assertEquals(4, report.getUntestedRules());

    // Verify RULE_004 is marked as covered
    RuleCoverage rule004 = findRuleCoverage(report, "RULE_004");
    assertTrue(rule004.isCovered());
    assertNotNull(rule004.getLastExecutedAt());
    assertTrue(rule004.getExecutionCount() > 0);
}
```

### 2. Integration Tests

Test the full endpoint:

```bash
# Run a simulation first
curl -X POST http://localhost:8081/api/v1/simulations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Coverage Test",
    "scenarioIds": ["692a1e97a5421b6292857f7e"],
    "executionMode": "SEQUENTIAL"
  }'

# Wait for completion (or poll for COMPLETED status)

# Generate coverage report
curl -X POST http://localhost:8081/api/v1/coverage/commercial-lines-underwriting

# Expected response should show:
# - coveragePercentage > 0 (likely 33.3% for 2/6 rules)
# - testedRules: 2
# - untestedRules: 4
# - RULE_004 and RULE_005 with covered: true, executionCount > 0
```

### 3. Manual UI Testing

Use the SimRule UI to verify:

1. Navigate to http://localhost:3000
2. Go to Simulations page
3. Run a simulation with "CL Policy Validation" scenario
4. Wait for completion
5. Go to Coverage page
6. Select "commercial-lines-underwriting" from dropdown
7. Click "Generate Report"
8. **Verify**:
   - Coverage percentage is > 0% (should be ~33%)
   - "Tested: 2" (or more if other simulations exist)
   - RULE_004 and RULE_005 show with green "Tested" badge
   - Hit counts are > 0 for tested rules

### 4. Verify Against Test Data

After the fix, coverage should show:

| Rule ID | Rule Name | Should Show As | Execution Count |
|---------|-----------|----------------|-----------------|
| RULE_001 | Minimum Years In Business Requirement | ❌ Untested | 0 |
| RULE_002 | High Value Property Surcharge | ❌ Untested | 0 |
| RULE_003 | Deductible Ratio Validation | ❌ Untested | 0 |
| RULE_004 | Risk Category Assignment | ✅ **Tested** | **> 100** |
| RULE_005 | Multi Coverage Discount | ✅ **Tested** | **> 100** |
| RULE_006 | High Value Property Surcharge - Updated | ❌ Untested | 0 |

**Expected Coverage**: ~33.3% (2 out of 6 rules tested)

---

## Validation Checklist

After implementing the fix, verify the following:

- [ ] Coverage percentage is non-zero for commercial-lines-underwriting
- [ ] RULE_004 (Risk Category Assignment) shows as "covered: true"
- [ ] RULE_005 (Multi Coverage Discount) shows as "covered: true"
- [ ] Both rules have executionCount > 0
- [ ] Both rules have lastExecutedAt timestamp
- [ ] Untested rules (RULE_001, RULE_002, RULE_003, RULE_006) show as "covered: false"
- [ ] Coverage percentage matches: (testedRules / totalRules) * 100
- [ ] Running additional simulations updates coverage counts
- [ ] Coverage report generation is performant (< 1 second for 300+ simulations)
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] UI displays updated coverage correctly

---

## Response Expected

After implementing and testing the fix, please provide a response document that includes:

1. **Root Cause Identified**: What was actually causing the issue?
2. **Files Modified**: List of Java files changed with brief description
3. **Code Changes**: Summary of key changes made (not full diff)
4. **Test Results**: Results of unit tests, integration tests, manual tests
5. **Coverage Verification**: Screenshot or API response showing correct coverage
6. **Deployment Status**: Confirmation that changes are deployed to dev/test environment
7. **Additional Issues Found**: Any related issues discovered during investigation

### Response Template

```markdown
# Coverage Tracking Fix Report

## Root Cause
[Describe what was wrong]

## Files Modified
1. CoverageService.java - [What changed]
2. SimulationRepository.java - [What changed]

## Code Changes Summary
[Brief description of the fix]

## Test Results
- Unit Tests: PASS (X tests)
- Integration Tests: PASS (X tests)
- Manual UI Test: PASS

## Coverage Verification
[Screenshot or API response showing coverage > 0%]

## Deployment
- Deployed to: dev environment
- Timestamp: 2025-11-28 HH:MM:SS
- Docker image: simrule-api:vX.Y.Z

## Additional Issues
[None / List any other issues found]
```

---

## Support

If you need clarification or have questions:

1. **Frontend Test Evidence**: See `E2E_TESTING_GAP_ANALYSIS.md` for full testing report
2. **Screenshots**:
   - `simulation-1-rules-fired-success.png` - Rules firing correctly
   - `coverage-0-percent-issue.png` - Coverage bug evidence
3. **Sample Simulation IDs** to query:
   - `692a449c5d4f1f5e48e2db25` (SEQ-Multi-Both-T75-Test-01)
   - `692a44a05d4f1f5e48e2db29` (SEQ-Single-CLUnder-T75-01)
   - Any of the 308 simulations in the system

---

**Document Version**: 1.0
**Last Updated**: 2025-11-28
**Contact**: Frontend Team (via E2E Testing Gap Analysis)
