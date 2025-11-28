# Backend API Issues Report

**Generated**: 2025-11-28
**Source**: SimRule UI E2E Testing Gap Analysis
**Testing Period**: 18:10 - 19:42 UTC
**Total Tests Executed**: 40+ (17 Scenarios, 30 Simulations)

---

## Executive Summary

**CRITICAL UPDATE (2025-11-28 17:55 UTC)**: The root cause of 0% coverage has been identified. **Rules ARE firing successfully** in Rule Inspector, but SimRule API has a data mapping bug that prevents rulesFired data from being extracted from the validation response.

During comprehensive E2E testing of the SimRule UI frontend, multiple backend API integration issues were identified. While the frontend UI is production-ready and all three GAP fixes are validated, **coverage tracking is broken due to a critical data mapping bug (Issue #0)**.

**Previous Assessment (INVALIDATED)**:
- ~~❌ 0% rule coverage achieved across all rule sets~~ ⚠️ Rules firing, not tracked
- ~~❌ 0 rules successfully fired across 190+ scenario executions~~ ✅ Rules ARE firing
- ~~❌ All scenarios with assertions failed validation~~ ⚠️ Some still failing
- ~~❌ Cannot test API_HTTP_METHOD_EVAL or any rules due to schema restrictions~~ ⚠️ Can test, but not tracked

**Current Status (CORRECTED)**:
- ✅ Rules execute successfully in Rule Inspector (confirmed via logs)
- ✅ Issue #1 (schema validation) FIXED - CommercialLinesPolicy validates correctly
- ✅ Issue #4 (success/validation inconsistency) FIXED
- ❌ **Issue #0 (NEW)**: SimRule API not extracting rulesFired data from validation response
- ❌ Coverage reports show 0.0% due to empty `scenarioExecutions[].rulesFired[]` arrays
- ❌ UI displays "Rules Fired: 0" even when rules fire successfully

---

## Issue #0: Rules Fired Data Mapping Bug (CRITICAL - NEWLY DISCOVERED)

### Severity: **CRITICAL** - Breaks Coverage Tracking

### Status: ✅ IDENTIFIED (2025-11-28 17:55 UTC)

### Description

**BREAKING DISCOVERY**: Rules ARE firing successfully in Rule Inspector, but SimRule API is not properly extracting and mapping the `rulesFired` data from Rule Inspector's validation response to the scenario execution results. This causes 0% coverage reports despite successful rule execution.

### Evidence

**Rule Inspector Logs** (provided by user):
```
2025-11-28 17:53:54 [RULE_004] APPLIED - Risk category MEDIUM assigned to policy CL-2025-001-VALID
2025-11-28 17:53:54 [RULE_005] APPLIED - Multi-coverage discount: $12500.00 for policy CL-2025-001-VALID with 4 coverages
2025-11-28 17:54:02 [RULE_004] APPLIED - Risk category MEDIUM assigned...
2025-11-28 17:54:02 [RULE_005] APPLIED - Multi-coverage discount...
[Pattern repeats 5 times matching 5 simulations]
```

**SimRule API Response** (GET /api/v1/simulations/692a2802a5421b6292857fb7):
```json
{
  "scenarioExecutions": [{
    "validationResponse": {
      "rulesFired": 2           // ✅ CORRECT - Shows 2 rules fired
    },
    "rulesFired": []              // ❌ BUG - Should contain ["RULE_004", "RULE_005"]
  }]
}
```

**Coverage Report** (GET /api/v1/coverage/commercial-lines-underwriting):
```json
{
  "totalRules": 6,
  "testedRules": 0,              // ❌ Should be 2
  "untestedRules": 6,            // ❌ Should be 4
  "coverage": 0.0                // ❌ Should be 33.3%
}
```

### Root Cause Analysis

The SimRule API is receiving correct `rulesFired` data from Rule Inspector (numeric count: 2), storing it in `validationResponse.rulesFired`, but failing to:

1. Extract the rule names from Rule Inspector's response
2. Populate the `scenarioExecutions[].rulesFired[]` array with rule names
3. This array remains empty `[]` even when rules fire successfully

The coverage calculation logic reads from the empty `scenarioExecutions[].rulesFired[]` array, resulting in 0 rules tracked.

### Impact

- ✅ Rules ARE executing successfully in Rule Inspector
- ✅ Rule Inspector IS returning rulesFired data
- ❌ Coverage reports show 0.0% (should show ~33.3%)
- ❌ UI displays "Rules Fired: 0" (should show "Rules Fired: 2")
- ❌ Cannot track which rules have been tested
- ❌ Cannot identify untested rules
- ❌ Coverage-based reporting completely broken

### Affected API Endpoints

- `POST /api/v1/simulations` - Creates simulations with empty rulesFired arrays
- `GET /api/v1/simulations/{id}` - Returns empty rulesFired arrays
- `GET /api/v1/coverage/{ruleSet}` - Calculates 0% due to empty arrays

### Test Evidence

**5 Successful Simulations Executed**:
- 692a2802a5421b6292857fb7 - 15ms, 100% pass, rulesFired: [] (should be ["RULE_004", "RULE_005"])
- 692a280aa5421b6292857fb9 - 10ms, 100% pass, rulesFired: [] (should be ["RULE_004", "RULE_005"])
- 692a2814a5421b6292857fbb - 10ms, 100% pass, rulesFired: [] (should be ["RULE_004", "RULE_005"])
- 692a2817a5421b6292857fbd - 8ms, 100% pass, rulesFired: [] (should be ["RULE_004", "RULE_005"])
- 692a281aa5421b6292857fbf - 9ms, 100% pass, rulesFired: [] (should be ["RULE_004", "RULE_005"])

All used scenario: "CL Policy Validation" (692a1e97a5421b6292857f7e)

### Required Fix

**File**: SimRule API - Response mapping logic (likely in validation/simulation service)

**Fix**: Ensure `scenarioExecutions[].rulesFired[]` array is populated from Rule Inspector's validation response:

```java
// Example pseudo-code fix
ScenarioExecution execution = new ScenarioExecution();
ValidationResponse validationResp = ruleInspectorClient.validate(...);

// Current (BROKEN):
execution.setRulesFired(new ArrayList<>());  // Always empty

// Required (FIXED):
execution.setRulesFired(validationResp.getRulesFiredNames());  // Actual rule names
```

The mapping should extract the actual rule names (e.g., ["RULE_004", "RULE_005"]) from Rule Inspector's response, not just the count.

### Recommended Priority

**CRITICAL - HIGHEST PRIORITY**

This issue invalidates Issues #3 and parts of Issues #1 and #2. Rules ARE firing, but the data is not being captured. Fixing this will:
1. Immediately restore coverage tracking functionality
2. Reveal true rule execution status
3. Allow validation of other fixes (schema validation, etc.)

---

## Issue #1: Overly Restrictive Fact Type Schemas (CRITICAL)

### Severity: **CRITICAL** - Blocks Core Functionality

### Status: ✅ FIXED (Rule Inspector - FAIL_ON_UNKNOWN_PROPERTIES disabled)

### Description

Backend Drools fact type schemas are rejecting valid test data fields, preventing scenarios from executing and rules from firing. The schemas appear to use strict field whitelisting that rejects any unrecognized fields, even if they're valid business data.

**UPDATE**: This issue has been FIXED in Rule Inspector by disabling FAIL_ON_UNKNOWN_PROPERTIES in ObjectMapper configuration.

### Evidence from Testing

**InsurancePolicy Schema Restriction**:
```
Error: "Validation processing failed: Fact transformation failed: Unrecognized field \"coverageAmount\"
(class com.ruleweaver.facts.InsurancePolicy), not marked as ignorable
(4 known properties: \"customerAge\", \"monthlyPremium\", \"policyNumber\", \"policyStatus\"])"
```

**Only 4 Fields Accepted**: `customerAge`, `monthlyPremium`, `policyNumber`, `policyStatus`

**Rejected Fields** (valid business fields):
- `coverageAmount` - Essential for insurance calculations
- `premium` - Core insurance data
- `deductible` - Important policy attribute
- `policyType` - Needed for rule categorization
- `membershipTier` - Business logic field
- `businessType` - Commercial lines requirement

### Impact

1. **Cannot Test Real Business Scenarios**: The 4-field restriction makes InsurancePolicy unusable for realistic insurance business logic testing
2. **All Assertion Tests Failed**: 5 scenarios with assertions all failed validation before assertions could be evaluated
3. **Zero Rule Coverage**: No rules can fire because data is rejected before reaching the rule engine
4. **Blocks UI Validation**: Frontend assertion and expected results features cannot be tested

### Test Data Examples That Failed

**Scenario: Premium Calculation - Should Pass**
```json
{
  "policyNumber": "POL-2025-001",
  "customerAge": 35,
  "premium": 1200.00,        // REJECTED
  "coverageAmount": 500000,  // REJECTED
  "policyType": "Term Life"  // REJECTED
}
```

**Scenario: Coverage Amount Validation - Should Fail**
```json
{
  "policyNumber": "POL-2025-003",
  "customerAge": 28,
  "coverageAmount": 2500000,  // REJECTED (field doesn't exist in schema)
  "premium": 850.00,          // REJECTED
  "deductible": 2500          // REJECTED
}
```

### Affected Fact Types

Based on testing, similar issues affect:
- ✅ **InsurancePolicy** - Confirmed (only 4 fields accepted)
- ⚠️ **ApiSpecification** - Suspected (validation failed for API_HTTP_METHOD_EVAL test)
- ⚠️ **CommercialLinesPolicy** - Suspected (field "businessType" rejected)
- ⚠️ **ConfigurationSpecification** - Suspected (field "configName" rejected)
- ⚠️ **Customer** - Potentially affected (not extensively tested)

### Recommended Fix

**Option 1: Enable Ignored Properties (Recommended)**
- Configure Jackson deserializer to ignore unknown properties
- Add `@JsonIgnoreProperties(ignoreUnknown = true)` to all fact classes
- Allows testing with flexible data while maintaining type safety for known fields

**Option 2: Expand Schemas**
- Add commonly used business fields to fact type classes
- Examples for InsurancePolicy:
  - `coverageAmount: BigDecimal`
  - `premium: BigDecimal`
  - `deductible: BigDecimal`
  - `policyType: String`
  - `membershipTier: String`

**Option 3: Dynamic Fact Types**
- Support Map-based or dynamic fact structures for testing
- Allow scenarios to define custom fact schemas
- Maintains strict validation for production facts

---

## Issue #2: ApiSpecification Validation Failure

### Severity: **HIGH** - Prevents API Rule Testing

### Description

Scenario specifically designed to test the `API_HTTP_METHOD_EVAL` rule failed validation, preventing the rule from being tested and counted toward coverage.

### Test Scenario Details

**Scenario**: API HTTP Method Validation Test
- **ID**: 6929fb1240ee0e6fa8816c13
- **Fact Type**: ApiSpecification
- **Rule Set**: api-specification
- **Expected**: API_HTTP_METHOD_EVAL rule should fire
- **Assertion**: `apiEndpoints[0].method EQUALS "GET"`

**Test Data Provided**:
```json
{
  "apiId": "api-001",
  "apiName": "Customer Management API",
  "apiVersion": "v1.0.0",
  "apiEndpoints": [
    {
      "endpointId": "ep-001",
      "path": "/api/customers",
      "method": "GET",
      "description": "Get all customers"
    },
    {
      "endpointId": "ep-002",
      "path": "/api/customers/{id}",
      "method": "POST",
      "description": "Create new customer"
    }
  ]
}
```

### Simulation Result

**Simulation ID**: 6929fb2e40ee0e6fa8816c16
- ❌ Status: FAILED
- ⏱️ Duration: 17ms
- 📊 Results: 0 Passed, 1 Failed
- 🔥 Rules Fired: 0
- ✅ Validation: Invalid

**Assertion Failure**:
```
Expected: apiEndpoints[0].method EQUALS "GET"
Actual: undefined
```

### Root Cause Analysis

The assertion received `undefined` for `apiEndpoints[0].method`, indicating:

1. **Fact Transformation Failed**: The JSON test data was not properly transformed into the ApiSpecification fact object
2. **Schema Validation Rejected Data**: Similar to InsurancePolicy, the schema likely rejected fields like `apiVersion`, `apiName`, or the `apiEndpoints` array structure
3. **Rule Engine Never Received Data**: Because validation failed, the rule engine never processed the fact, so API_HTTP_METHOD_EVAL never fired

### Impact

- ❌ Cannot test the only rule in the `api-specification` rule set
- ❌ Coverage remains at 0.0% for api-specification
- ❌ API_HTTP_METHOD_EVAL rule remains untested (0 hits)
- ❌ Cannot validate API specification validation functionality

### Recommended Fix

1. **Verify ApiSpecification Schema**: Review the Java class definition for ApiSpecification to confirm accepted fields
2. **Log Validation Errors**: Backend should log detailed validation errors showing which fields were rejected
3. **Update Schema or Test Data**: Either expand the ApiSpecification schema or provide sample valid test data in API documentation
4. **Enable Property Ignoring**: Apply `@JsonIgnoreProperties(ignoreUnknown = true)` to ApiSpecification class

---

## Issue #3: Rules Fired Count Always Zero

### Severity: ~~**HIGH**~~ **INVALIDATED** - See Issue #0

### Status: ⚠️ INVALIDATED - Root cause identified as Issue #0 (Data Mapping Bug)

### Description

~~Across **all 190+ scenario executions** in 30 simulations, the `rulesFired` field consistently returns `0` or an empty array, indicating that no rules are being fired by the Drools rule engine.~~

**CRITICAL UPDATE (2025-11-28)**: This issue has been INVALIDATED. Rules ARE firing successfully in Rule Inspector. The problem is a data mapping bug in SimRule API (see Issue #0).

### Test Evidence

**Session 1 Results** (9 simulations, 90+ scenario executions):
- All simulations: 100% pass rate
- All scenarios: `rulesFired: 0` or `[]`

**Session 2 Results** (21 simulations, 100+ scenario executions):
- All simulations: Mixed pass/fail due to validation
- All scenarios: `rulesFired: 0` or `[]`
- Even scenarios that showed `success: true` had zero rules fired

**Session 3 Results** (5 simulations, CommercialLinesPolicy):
- All simulations: 100% pass rate
- All scenarios: `rulesFired: []` (UI shows 0)
- **BUT** Rule Inspector logs show RULE_004 and RULE_005 fired successfully 5 times

### Actual Root Cause

~~**Original hypothesis**: Rules not firing in Drools engine~~

**ACTUAL ISSUE**: SimRule API data mapping bug (Issue #0). Rules ARE firing, but:
1. Rule Inspector executes rules successfully (confirmed via logs)
2. Rule Inspector returns `rulesFired: 2` in validation response
3. SimRule API stores this in `validationResponse.rulesFired` correctly
4. **BUG**: SimRule API fails to extract rule names and populate `scenarioExecutions[].rulesFired[]` array
5. Coverage calculation reads from empty array → 0% coverage

### Impact

- ✅ Rules ARE executing successfully
- ✅ Rule engine integration IS working
- ❌ Frontend displays "Rules Fired: 0" due to empty array
- ❌ Cannot achieve any rule coverage due to data mapping bug
- ❌ Coverage reports show 0.0% despite successful rule execution

### Resolution

**This issue is resolved by fixing Issue #0**. Once the data mapping bug is fixed:
- `scenarioExecutions[].rulesFired[]` will contain actual rule names
- Coverage reports will show correct percentages
- UI will display accurate "Rules Fired" counts

---

## Issue #4: Validation Response Inconsistency

### Severity: **MEDIUM** - Confusing Behavior

### Status: ✅ FIXED (SimRule API - commit 0646b55)

### Description

~~Scenarios can show `success: true` in simulation results while simultaneously showing `isValid: false` with validation errors. This creates confusing and contradictory status indicators.~~

**UPDATE**: This issue has been FIXED in SimRule API. Success calculation now includes validation status.

### Evidence

**Example from Session 1 Testing**:
```json
{
  "scenarioId": "6929e5d640ee0e6fa8816b97",
  "success": true,              // ✅ Marked as success
  "validationResult": {
    "isValid": false,            // ❌ But validation failed
    "errors": [
      "Unrecognized field 'membershipTier'..."
    ]
  },
  "rulesFired": 0,
  "durationMs": 45
}
```

### Impact

- Frontend displays scenario as "PASSED" (green checkmark) even though validation failed
- Users cannot distinguish between:
  - Scenario executed successfully with rules fired
  - Scenario "succeeded" but validation failed (no rules fired)
- Misleading success metrics (shows 100% pass rate when actually 100% validation fail rate)

### Expected Behavior

A scenario should **NOT** be marked as `success: true` if `validationResult.isValid: false`. The `success` flag should represent overall execution success including validation.

**Recommended Logic**:
```
success = (validationResult.isValid === true) && (no execution errors) && (assertions pass if present)
```

### Recommended Fix

1. **Update Success Calculation**: Modify simulation execution logic to set `success = false` when validation fails
2. **Separate Validation Status**: Return explicit validation status in response
3. **Add Status Enum**: Use status enum instead of boolean: `PASSED`, `FAILED_VALIDATION`, `FAILED_ASSERTION`, `FAILED_EXECUTION`

---

## Issue #5: Field Path Resolution for Assertions

### Severity: **MEDIUM** - Blocks Assertion Testing

### Description

Assertion field path evaluation returns `undefined` for valid field paths, preventing assertion testing functionality from working.

### Evidence

**Assertion Defined**:
```json
{
  "fieldPath": "apiEndpoints[0].method",
  "operator": "EQUALS",
  "expectedValue": "GET"
}
```

**Assertion Result**:
```json
{
  "fieldPath": "apiEndpoints[0].method",
  "operator": "EQUALS",
  "expectedValue": "GET",
  "actualValue": undefined,      // ❌ Should be "GET"
  "passed": false
}
```

### Root Cause

Most likely caused by **Issue #2** (schema validation failure). Since the fact was never properly created due to validation errors, the field path cannot resolve any values.

However, this could also indicate:
- Field path evaluation logic not handling array indices (`[0]`)
- Field path evaluation not handling nested objects (`apiEndpoints[0].method`)
- Field path evaluation happening before fact transformation

### Impact

- ❌ Cannot test assertion functionality
- ❌ All assertions fail even with correct expected values
- ❌ Frontend assertion display shows "undefined" for actual values

### Recommended Investigation

1. **Fix Schema Validation First**: Resolve Issue #1 and #2 to ensure facts are created
2. **Test Field Path Evaluation**: Verify that field paths like `apiEndpoints[0].method` are correctly evaluated
3. **Add Field Path Logging**: Log resolved field paths and values during assertion evaluation
4. **Support Nested Paths**: Ensure field path resolver supports:
   - Array indexing: `items[0]`, `items[5]`
   - Nested objects: `customer.address.city`
   - Combined: `orders[0].items[1].price`

---

## Issue #6: Schema Documentation Gap

### Severity: **LOW** - Developer Experience

### Description

Fact type schemas are not documented, making it impossible for frontend users or developers to know which fields are valid for each fact type.

### Impact

- Users cannot create valid scenarios without trial-and-error
- Frontend cannot provide schema-based validation or autocomplete
- No way to know the difference between `monthlyPremium` vs `premium` field names
- Wasted development time creating scenarios that will fail validation

### Evidence

During testing, we had to discover through errors that:
- InsurancePolicy only accepts: `customerAge`, `monthlyPremium`, `policyNumber`, `policyStatus`
- Other fact types have unknown schemas

### Recommended Fix

1. **Schema Endpoint**: Add API endpoint to retrieve JSON schemas for each fact type
   - `GET /api/v1/schemas/{factType}` - Returns JSON schema
   - Already exists in API: `/api/v1/schemas/{factType}`
   - **May already be available** - needs testing

2. **OpenAPI Documentation**: Document fact type schemas in Swagger/OpenAPI spec

3. **Sample Data Endpoint**: Provide example valid test data for each fact type
   - `GET /api/v1/schemas/{factType}/sample`

4. **Schema Validation Endpoint**: Allow frontend to validate data before scenario creation
   - `POST /api/v1/schemas/{factType}/validate` with request body

---

## Summary of Backend Issues

| Issue | Severity | Impact | Status | Blocks |
|-------|----------|--------|--------|--------|
| **#0: Rules Fired Data Mapping** | **CRITICAL** | Coverage tracking broken | ❌ **ACTIVE** | Coverage reports, Rule tracking |
| #1: Restrictive Fact Schemas | ~~CRITICAL~~ | Cannot create valid scenarios | ✅ **FIXED** | ~~Rule testing, Coverage, Assertions~~ |
| #2: ApiSpecification Validation | **HIGH** | Cannot test API rules | ❌ Unresolved | API rule coverage |
| ~~#3: Rules Never Fire~~ | ~~HIGH~~ | ~~No rule execution~~ | ⚠️ **INVALIDATED** | See Issue #0 |
| #4: Success/Validation Inconsistency | ~~MEDIUM~~ | Confusing status | ✅ **FIXED** | ~~UX, Metrics accuracy~~ |
| #5: Field Path Resolution | **MEDIUM** | Assertions don't work | ❌ Unresolved | Assertion testing |
| #6: Schema Documentation | **LOW** | Poor DX | ⚠️ Partial | Developer efficiency |

**KEY UPDATE (2025-11-28)**: Issue #0 discovered - Rules ARE firing in Rule Inspector, but SimRule API is not extracting rulesFired data from validation response. This is the root cause of 0% coverage.

---

## Testing Statistics

**Total Scenarios Created**: 22 (updated 2025-11-28)
- 11 in Session 1 (various rule sets)
- 6 in Session 2 (5 with assertions + 1 API test)
- 5 in Session 3 (CommercialLinesPolicy tests)

**Total Simulations Executed**: 35 (updated 2025-11-28)
- 9 in Session 1 (Sequential and Parallel modes)
- 21 in Session 2 (mixed combinations)
- 5 in Session 3 (CommercialLinesPolicy validation)

**Total Scenario Executions**: 195+

**Success Rate**:
- Simulations: 100% completed (no crashes)
- Scenarios: 100% "success: true" reported (but see Issue #0)
- ~~Validation: ~0% valid (all failed schema validation)~~ ✅ Fixed - CommercialLinesPolicy now validates
- ~~Rules Fired: 0% (0 rules fired across all executions)~~ ⚠️ Rules ARE firing (see Issue #0)
- Coverage Achieved: 0% (0 rules tracked due to Issue #0 data mapping bug)

---

## Recommended Priority Order

### Priority 1: Fix Coverage Tracking (CRITICAL - HIGHEST PRIORITY)

**NEW DISCOVERY**: Issue #0 is now the HIGHEST priority issue.

1. **Fix Issue #0**: Rules Fired Data Mapping Bug
   - SimRule API must extract rule names from Rule Inspector's validation response
   - Populate `scenarioExecutions[].rulesFired[]` array with actual rule names
   - This immediately restores all coverage tracking functionality
   - **IMPACT**: Rules are already firing successfully, we just need to capture the data

### Priority 1b: Validate Previous Fixes (VERIFICATION)

2. ~~**Fix Issue #1**: Add `@JsonIgnoreProperties(ignoreUnknown = true)` to all fact type classes~~
   - ✅ **COMPLETED** - Rule Inspector fix deployed
   - Verified working with CommercialLinesPolicy scenarios
   - Need to verify with other fact types (InsurancePolicy, ApiSpecification, etc.)

3. ~~**Fix Issue #3**: Investigate and enable rule firing~~
   - ⚠️ **INVALIDATED** - Rules ARE firing, this was a false diagnosis
   - Real issue is Issue #0 (data mapping bug)

### Priority 2: Improve Data Quality (HIGH)

3. **Fix Issue #2**: Resolve ApiSpecification validation
   - Document or fix the ApiSpecification schema
   - Ensure API_HTTP_METHOD_EVAL rule can be tested

4. **Fix Issue #4**: Correct success/validation logic
   - Scenarios should fail if validation fails
   - Improves metrics accuracy

### Priority 3: Developer Experience (MEDIUM)

5. **Fix Issue #5**: Enable assertion field path resolution
   - Test after Issues #1 and #2 are fixed
   - May resolve automatically

6. **Fix Issue #6**: Document fact type schemas
   - Add schema endpoint or documentation
   - Provide sample valid data

---

## Next Steps for Backend Team

1. **Review this report** and prioritize issues
2. **Reproduce issues** using provided test data and scenario IDs
3. **Enable debug logging** for:
   - Fact transformation/deserialization
   - Schema validation
   - Rule loading and execution
   - Assertion field path resolution
4. **Fix Issue #1 first** - This unblocks all other testing
5. **Provide updated fact type schemas** or sample data
6. **Test with frontend** after fixes to validate integration

---

**Report End**
