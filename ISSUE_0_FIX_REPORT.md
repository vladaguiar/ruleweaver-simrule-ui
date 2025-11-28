# Issue #0 Fix Report: Rules Fired Data Mapping

**Date**: 2025-11-28
**Commit**: `0c60e8d`
**Status**: FIXED and DEPLOYED

---

## Summary

Fixed the critical bug where `scenarioExecutions[].rulesFired[]` was always returning an empty array despite rules firing successfully in Rule Inspector.

---

## Root Cause

The `extractRulesFired()` method in `SimulationEngine.java` was incorrectly checking if `validationResponse.rulesFired` was a `List` type. However, Rule Inspector returns:
- `rulesFired`: **Integer** (count of rules fired)
- `results`: **Array** of `RuleExecutionResult` objects containing the actual rule details

The old code expected `rulesFired` to be a list of rule names, but it's just a numeric count.

### Old Code (Broken)

```java
private List<String> extractRulesFired(Map<String, Object> validationResponse) {
    Object rulesFiredObj = validationResponse.get("rulesFired");
    if (rulesFiredObj instanceof List) {  // Always false - it's an Integer!
        return (List<String>) rulesFiredObj;
    }
    return new ArrayList<>();  // Always returned empty
}
```

### New Code (Fixed)

```java
@SuppressWarnings("unchecked")
private List<String> extractRulesFired(Map<String, Object> validationResponse) {
    List<String> ruleNames = new ArrayList<>();

    // Rule names are in the 'results' array, each with 'ruleId' and 'ruleName'
    Object resultsObj = validationResponse.get("results");
    if (resultsObj instanceof List) {
        List<?> results = (List<?>) resultsObj;
        for (Object result : results) {
            if (result instanceof Map) {
                Map<String, Object> resultMap = (Map<String, Object>) result;
                // Prefer ruleId, fall back to ruleName
                String ruleId = (String) resultMap.get("ruleId");
                if (ruleId != null && !ruleId.isEmpty()) {
                    ruleNames.add(ruleId);
                } else {
                    String ruleName = (String) resultMap.get("ruleName");
                    if (ruleName != null && !ruleName.isEmpty()) {
                        ruleNames.add(ruleName);
                    }
                }
            }
        }
    }

    log.debug("Extracted {} rule names from validation response: {}",
              ruleNames.size(), ruleNames);
    return ruleNames;
}
```

---

## What Changed

| Aspect | Before | After |
|--------|--------|-------|
| Data Source | `validationResponse.rulesFired` | `validationResponse.results[]` |
| Expected Type | List<String> | Array of RuleExecutionResult objects |
| Rule Identifier | N/A (was broken) | Uses `ruleId`, falls back to `ruleName` |
| Debug Logging | None | Logs extracted rule names |

---

## API Response Changes

### Before (Broken)

```json
{
  "scenarioExecutions": [{
    "validationResponse": {
      "rulesFired": 2  // Count was there
    },
    "rulesFired": []    // But names were always empty
  }]
}
```

### After (Fixed)

```json
{
  "scenarioExecutions": [{
    "validationResponse": {
      "rulesFired": 2
    },
    "rulesFired": ["RULE_004", "RULE_005"]  // Now properly populated
  }]
}
```

---

## Expected Impact

### Coverage Reports

| Metric | Before | After |
|--------|--------|-------|
| RULE_004 tested | false | true |
| RULE_005 tested | false | true |
| hitCount | 0 | Actual count |
| Coverage % | 0.0% | Accurate % |

### UI Display

| Element | Before | After |
|---------|--------|-------|
| Rules Fired count | 0 | Correct count |
| Rule names list | Empty | Populated |
| Coverage percentage | 0% | Accurate |

---

## Files Modified

1. **SimulationEngine.java** (`src/main/java/com/ruleweaver/simrule/service/SimulationEngine.java`)
   - Updated `extractRulesFired()` method at line ~350
   - Added debug logging for rule extraction

---

## Deployment

- Docker image rebuilt: `simrule-api:latest`
- Container restarted via `docker-compose up -d simrule-api`
- Health check: PASSING
- Commit pushed to GitHub

---

## Testing Verification

Frontend team should verify:

1. **Run a simulation** with a scenario that triggers rules
2. **Check API response** at `GET /api/v1/simulations/{id}`
   - Verify `scenarioExecutions[].rulesFired[]` contains rule IDs
3. **Check coverage report** at `GET /api/v1/coverage/{ruleSet}`
   - Verify `testedRules` count matches fired rules
   - Verify `coverage` percentage is non-zero
4. **UI displays** correct "Rules Fired" count and list

---

## Related Issues

- **Issue #0**: FIXED (this report)
- **Issue #1**: FIXED (schema validation)
- **Issue #3**: INVALIDATED (rules ARE firing)
- **Issue #4**: FIXED (success calculation)

---

## Contact

For questions, refer to:
- `CRITICAL_BUG_RULES_FIRED_MAPPING.md` - Original bug report
- `BACKEND_API_ISSUES.md` - Full issues list
- `SESSION_3_COMPLETION_REPORT.md` - Testing session report

---

**Report Generated**: 2025-11-28
**Backend Team**: SimRule API
