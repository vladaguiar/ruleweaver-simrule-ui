# CRITICAL BUG: Rules Fired Data Mapping Issue

**Date**: 2025-11-28 17:55 UTC
**Severity**: CRITICAL
**Component**: SimRule API - Simulation/Validation Response Mapping
**Impact**: Coverage tracking completely broken despite successful rule execution

---

## Executive Summary

**Rules ARE firing successfully in Rule Inspector**, but SimRule API is not properly extracting and mapping the `rulesFired` data from Rule Inspector's validation response to the scenario execution results. This causes **0% coverage reports** despite successful rule execution.

---

## Evidence

### 1. Rule Inspector Logs (Provided by User)

```
2025-11-28 17:53:54 [RULE_004] APPLIED - Risk category MEDIUM assigned to policy CL-2025-001-VALID
2025-11-28 17:53:54 [RULE_005] APPLIED - Multi-coverage discount: $12500.00 for policy CL-2025-001-VALID with 4 coverages
2025-11-28 17:54:02 [RULE_004] APPLIED - Risk category MEDIUM assigned to policy CL-2025-001-VALID
2025-11-28 17:54:02 [RULE_005] APPLIED - Multi-coverage discount: $12500.00 for policy CL-2025-001-VALID with 4 coverages
2025-11-28 17:54:12 [RULE_004] APPLIED - Risk category MEDIUM assigned to policy CL-2025-001-VALID
2025-11-28 17:54:12 [RULE_005] APPLIED - Multi-coverage discount: $12500.00 for policy CL-2025-001-VALID with 4 coverages
2025-11-28 17:54:15 [RULE_004] APPLIED - Risk category MEDIUM assigned to policy CL-2025-001-VALID
2025-11-28 17:54:15 [RULE_005] APPLIED - Multi-coverage discount: $12500.00 for policy CL-2025-001-VALID with 4 coverages
2025-11-28 17:54:18 [RULE_004] APPLIED - Risk category MEDIUM assigned to policy CL-2025-001-VALID
2025-11-28 17:54:18 [RULE_005] APPLIED - Multi-coverage discount: $12500.00 for policy CL-2025-001-VALID with 4 coverages
```

**Analysis**: RULE_004 and RULE_005 fired 5 times, matching exactly 5 simulations executed at those timestamps.

### 2. SimRule API Logs (Provided by User)

```
2025-11-28 17:53:54.XXX INFO  [ValidationServiceImpl] Validation completed successfully for scenario: 692a1e97a5421b6292857f7e
2025-11-28 17:53:54.XXX INFO  [CoverageService] Built coverage report for rule set 'commercial-lines-underwriting': totalRules=6, tested=0, untested=6, coverage=0.0%
```

**Analysis**: SimRule API reports validation success but coverage shows 0 rules tested.

### 3. SimRule API Response (GET /api/v1/simulations/692a2802a5421b6292857fb7)

```json
{
  "simulationId": "692a2802a5421b6292857fb7",
  "status": "COMPLETED",
  "scenarioExecutions": [
    {
      "scenarioId": "692a1e97a5421b6292857f7e",
      "success": true,
      "validationResponse": {
        "metadata": {
          "ruleSet": "commercial-lines-underwriting",
          "factType": "CommercialLinesPolicy"
        },
        "executionTimeMs": 3,
        "isValid": true,
        "errors": [],
        "rulesFired": 2,          // ✅ CORRECT - Shows 2 rules fired
        "warnings": []
      },
      "rulesFired": [],              // ❌ BUG - Should contain ["RULE_004", "RULE_005"]
      "assertions": null,
      "durationMs": 15
    }
  ],
  "metrics": {
    "totalScenarios": 1,
    "passedScenarios": 1,
    "failedScenarios": 0,
    "successRate": 100.0,
    "totalDurationMs": 15
  }
}
```

**Key Finding**:
- `validationResponse.rulesFired: 2` ✅ Correct count received from Rule Inspector
- `scenarioExecutions[].rulesFired: []` ❌ Empty array instead of `["RULE_004", "RULE_005"]`

### 4. Coverage Report (GET /api/v1/coverage/commercial-lines-underwriting)

```json
{
  "ruleSet": "commercial-lines-underwriting",
  "totalRules": 6,
  "testedRules": 0,              // ❌ Should be 2
  "untestedRules": 6,            // ❌ Should be 4
  "coverage": 0.0,               // ❌ Should be 33.3% (2/6)
  "rules": [
    {
      "ruleName": "RULE_001",
      "tested": false,
      "hitCount": 0
    },
    {
      "ruleName": "RULE_002",
      "tested": false,
      "hitCount": 0
    },
    {
      "ruleName": "RULE_003",
      "tested": false,
      "hitCount": 0
    },
    {
      "ruleName": "RULE_004",
      "tested": false,           // ❌ Should be true
      "hitCount": 0              // ❌ Should be 5
    },
    {
      "ruleName": "RULE_005",
      "tested": false,           // ❌ Should be true
      "hitCount": 0              // ❌ Should be 5
    },
    {
      "ruleName": "RULE_006",
      "tested": false,
      "hitCount": 0
    }
  ]
}
```

---

## Root Cause Analysis

The SimRule API is:

1. ✅ Calling Rule Inspector successfully
2. ✅ Receiving validation response with `rulesFired: 2` (numeric count)
3. ✅ Storing this numeric count in `validationResponse.rulesFired`
4. ❌ **FAILING** to extract the actual rule names from Rule Inspector's response
5. ❌ **FAILING** to populate `scenarioExecutions[].rulesFired[]` array
6. ❌ Leaving the array empty `[]` even when rules fire successfully

The coverage calculation reads from the empty `scenarioExecutions[].rulesFired[]` array, resulting in 0 rules tracked.

---

## Expected Behavior

### What Should Happen

**Rule Inspector Response** (what SimRule API receives):
```json
{
  "rulesFired": 2,
  "rulesFiredNames": ["RULE_004", "RULE_005"]  // Assuming this field exists
}
```

**SimRule API Response** (what should be stored):
```json
{
  "scenarioExecutions": [{
    "validationResponse": {
      "rulesFired": 2
    },
    "rulesFired": ["RULE_004", "RULE_005"]  // Should be populated
  }]
}
```

**Coverage Calculation**:
- Reads `["RULE_004", "RULE_005"]` from `scenarioExecutions[].rulesFired[]`
- Marks RULE_004 as tested (hitCount: 5)
- Marks RULE_005 as tested (hitCount: 5)
- Calculates coverage: 2/6 = 33.3%

---

## Affected Simulations (Test Evidence)

All 5 simulations from Session 3 exhibit this bug:

| Simulation ID | Duration | Status | validationResponse.rulesFired | scenarioExecutions[].rulesFired | Expected |
|--------------|----------|--------|-------------------------------|--------------------------------|----------|
| 692a2802a5421b6292857fb7 | 15ms | COMPLETED | 2 | [] | ["RULE_004", "RULE_005"] |
| 692a280aa5421b6292857fb9 | 10ms | COMPLETED | 2 | [] | ["RULE_004", "RULE_005"] |
| 692a2814a5421b6292857fbb | 10ms | COMPLETED | 2 | [] | ["RULE_004", "RULE_005"] |
| 692a2817a5421b6292857fbd | 8ms | COMPLETED | 2 | [] | ["RULE_004", "RULE_005"] |
| 692a281aa5421b6292857fbf | 9ms | COMPLETED | 2 | [] | ["RULE_004", "RULE_005"] |

All used scenario: "CL Policy Validation" (692a1e97a5421b6292857f7e)

---

## Suspected Code Location

Based on the architecture, the bug is likely in one of these files:

### Option 1: SimulationService / ValidationService

**File**: `simrule-api/src/main/java/com/ruleweaver/simrule/service/SimulationServiceImpl.java`

**Suspected Code**:
```java
// Current (BROKEN)
ScenarioExecution execution = new ScenarioExecution();
ValidationResponse validationResp = ruleInspectorClient.validate(scenario);

execution.setValidationResponse(validationResp);  // Stores entire response
execution.setRulesFired(new ArrayList<>());       // Always empty - BUG!
```

**Required Fix**:
```java
// Fixed
ScenarioExecution execution = new ScenarioExecution();
ValidationResponse validationResp = ruleInspectorClient.validate(scenario);

execution.setValidationResponse(validationResp);
// Extract rule names from validation response
List<String> rulesFiredNames = validationResp.getRulesFiredNames();  // Or similar
execution.setRulesFired(rulesFiredNames != null ? rulesFiredNames : new ArrayList<>());
```

### Option 2: Response Mapping

**File**: `simrule-api/src/main/java/com/ruleweaver/simrule/mapper/ValidationResponseMapper.java`

The mapper may be failing to extract `rulesFiredNames` from Rule Inspector's response.

### Option 3: Rule Inspector Client

**File**: `simrule-api/src/main/java/com/ruleweaver/simrule/client/RuleInspectorClient.java`

The WebClient may not be deserializing the `rulesFiredNames` field from Rule Inspector's response.

---

## Required Fix

### Step 1: Verify Rule Inspector Response Format

Add debug logging to capture the exact JSON response from Rule Inspector:

```java
logger.debug("Rule Inspector response: {}", validationResponse);
```

Verify the response includes a field with rule names (e.g., `rulesFiredNames`, `firedRules`, or similar).

### Step 2: Update Response Mapping

Ensure the mapping extracts rule names:

```java
// In SimulationServiceImpl or ValidationService
List<String> rulesFiredNames = validationResp.getRulesFiredNames();
if (rulesFiredNames == null) {
    logger.warn("Rule Inspector did not return rulesFiredNames. Check response format.");
    rulesFiredNames = new ArrayList<>();
}
execution.setRulesFired(rulesFiredNames);
```

### Step 3: Update Coverage Calculation

Ensure `CoverageService` reads from the correct field:

```java
// In CoverageService
for (ScenarioExecution exec : simulation.getScenarioExecutions()) {
    List<String> rulesFired = exec.getRulesFired();  // Should NOT be empty
    for (String ruleName : rulesFired) {
        coverageData.markRuleTested(ruleName);
        coverageData.incrementHitCount(ruleName);
    }
}
```

---

## Testing Plan

### Unit Tests

Create unit tests for the mapping:

```java
@Test
void testRulesFiredMappingFromValidationResponse() {
    // Given
    ValidationResponse validationResp = new ValidationResponse();
    validationResp.setRulesFired(2);
    validationResp.setRulesFiredNames(Arrays.asList("RULE_004", "RULE_005"));

    // When
    ScenarioExecution execution = mapper.mapToScenarioExecution(validationResp);

    // Then
    assertThat(execution.getRulesFired()).hasSize(2);
    assertThat(execution.getRulesFired()).containsExactly("RULE_004", "RULE_005");
}
```

### Integration Tests

1. Run simulation 692a2802a5421b6292857fb7 again after fix
2. Verify `GET /api/v1/simulations/692a2802a5421b6292857fb7` returns:
   ```json
   {
     "scenarioExecutions": [{
       "rulesFired": ["RULE_004", "RULE_005"]
     }]
   }
   ```
3. Verify `GET /api/v1/coverage/commercial-lines-underwriting` returns:
   ```json
   {
     "coverage": 33.3,
     "testedRules": 2,
     "rules": [
       {"ruleName": "RULE_004", "tested": true, "hitCount": 5},
       {"ruleName": "RULE_005", "tested": true, "hitCount": 5}
     ]
   }
   ```

---

## Impact

### Current Impact

- ❌ Coverage reports always show 0.0%
- ❌ UI displays "Rules Fired: 0" for all scenarios
- ❌ Cannot track which rules have been tested
- ❌ Cannot identify untested rules
- ❌ Coverage-based reporting completely broken
- ❌ Business users cannot validate rule testing completeness

### Post-Fix Impact

- ✅ Coverage reports will show accurate percentages
- ✅ UI will display correct "Rules Fired" counts
- ✅ Can track rule testing progress
- ✅ Can identify coverage gaps
- ✅ Coverage reports become actionable for business users

---

## Priority

**CRITICAL - HIGHEST PRIORITY**

This bug invalidates the entire coverage tracking system. While rules are executing successfully, the lack of coverage data makes it impossible to:
- Validate that critical business rules have been tested
- Identify coverage gaps
- Meet compliance requirements for rule testing

**Recommendation**: Fix immediately before addressing other issues, as this bug masks the true state of rule execution and coverage.

---

## Related Issues

- Issue #3 (Rules Never Fire): **INVALIDATED** - Rules ARE firing, this issue was a false diagnosis
- Issue #1 (Restrictive Schemas): **FIXED** - Schema validation now works for CommercialLinesPolicy
- Issue #4 (Success/Validation Inconsistency): **FIXED** - Success calculation now includes validation

---

## Contact

For questions or clarifications, refer to:
- **Full Backend Issues Report**: `BACKEND_API_ISSUES.md`
- **Frontend Testing Plan**: `sharded-hatching-mist.md`
- **Rule Inspector Changes**: `RULE_INSPECTOR_REQUIRED_CHANGES.md`

---

**Report End**
