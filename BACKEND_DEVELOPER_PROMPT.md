# Backend Developer Prompt: Fix Coverage Tracking Bug

**Priority**: CRITICAL - BLOCKING ISSUE
**Estimated Effort**: 2-4 hours
**Affected Service**: SimRule API (Coverage Calculation Service)
**Issue Reference**: E2E Testing Gap Analysis Report - Issue #1

---

## Your Mission

Fix the critical coverage tracking bug in the SimRule API. The coverage calculation service currently returns 0.0% coverage despite rules firing successfully in 100+ simulations. Your task is to investigate, fix, test, commit, rebuild, and redeploy the SimRule API with the corrected coverage calculation logic.

---

## Background Context

### What We Know

✅ **Rules ARE Firing Correctly**:
- RULE_004 (Risk Category Assignment) fires in simulations
- RULE_005 (Multi Coverage Discount) fires in simulations
- Confirmed via Rule Inspector logs and SimRule API responses

✅ **SimRule API Issue #0 Fix is Working**:
- `scenarioExecutions[].rulesFired[]` arrays are correctly populated
- Example: `["RULE_004", "RULE_005"]`
- Data structure is correct

❌ **Coverage Calculation is Broken**:
- Endpoint: `POST /api/v1/coverage/commercial-lines-underwriting`
- Returns: 0.0% coverage
- Returns: All 6 rules marked as "Untested" with "0 hits"
- Expected: ~33% coverage (2/6 rules tested)

### Test Evidence

**Total Simulations in Database**: 308
**Simulations Where Rules Fired**: 100+
**Expected Coverage**: At least 33% (RULE_004 and RULE_005 tested)
**Actual Coverage**: 0.0% (BUG)

---

## Task Breakdown

You will perform the following tasks in order:

### Phase 1: Investigation (30-60 min)

1. **Locate Coverage Service**
   - Find the service responsible for coverage calculation
   - Likely files:
     - `CoverageService.java`
     - `CoverageCalculationService.java`
     - `CoverageController.java`

2. **Analyze Current Implementation**
   - Understand how coverage is currently calculated
   - Identify where it's reading data from
   - Check if it's querying simulations collection
   - Check for any aggregation logic

3. **Add Debug Logging**
   - Add detailed logging to trace execution
   - Log: simulations found, rules aggregated, coverage calculated
   - This will help identify where the logic breaks

4. **Identify Root Cause**
   - Determine why coverage shows 0%
   - Possible causes:
     - Not querying simulations collection
     - Rule ID mapping mismatch
     - Aggregation logic bug
     - Only tracking on scenario creation (not simulation execution)
     - Null pointer or exception being swallowed

### Phase 2: Implementation (60-90 min)

1. **Fix Coverage Calculation Logic**

   The coverage service should:
   ```java
   public CoverageReport calculateCoverage(String ruleSet) {
       // 1. Query all simulations for this rule set
       List<Simulation> simulations = simulationRepository.findByRuleSet(ruleSet);

       // 2. Aggregate rulesFired from all scenarioExecutions
       Map<String, RuleCoverageStats> ruleStats = new HashMap<>();
       for (Simulation sim : simulations) {
           for (ScenarioExecution exec : sim.getScenarioExecutions()) {
               if (exec.getRulesFired() != null) {
                   for (String ruleId : exec.getRulesFired()) {
                       ruleStats.putIfAbsent(ruleId, new RuleCoverageStats(ruleId));
                       ruleStats.get(ruleId).incrementHitCount();
                       ruleStats.get(ruleId).updateLastExecutedAt(exec.getCompletedAt());
                   }
               }
           }
       }

       // 3. Calculate coverage
       List<RuleDefinition> allRules = ruleDefinitionRepository.findByRuleSet(ruleSet);
       int totalRules = allRules.size();
       int testedRules = ruleStats.size();
       double coveragePercentage = (double) testedRules / totalRules * 100;

       // 4. Build and return coverage report
       return buildCoverageReport(ruleSet, allRules, ruleStats, coveragePercentage);
   }
   ```

2. **Update Repository Methods (if needed)**
   - Add `findByRuleSet(String ruleSet)` to SimulationRepository if missing
   - Ensure it can query simulations by rule set

3. **Handle Edge Cases**
   - No simulations exist for rule set
   - Simulation has null rulesFired array
   - Empty rulesFired arrays
   - Rule definitions not found

### Phase 3: Testing (45-60 min)

1. **Write Unit Tests**
   ```java
   @Test
   public void testCoverageCalculation_withRulesFired() {
       // Given: Mock simulations with rules fired
       List<Simulation> simulations = createMockSimulations();
       when(simulationRepository.findByRuleSet("commercial-lines-underwriting"))
           .thenReturn(simulations);

       // When: Calculate coverage
       CoverageReport report = coverageService.calculateCoverage("commercial-lines-underwriting");

       // Then: Verify accuracy
       assertEquals(33.3, report.getCoveragePercentage(), 0.1);
       assertEquals(2, report.getTestedRules());
       assertEquals(4, report.getUntestedRules());

       RuleCoverage rule004 = findRule(report, "RULE_004");
       assertTrue(rule004.isCovered());
       assertTrue(rule004.getExecutionCount() > 0);
       assertNotNull(rule004.getLastExecutedAt());
   }

   @Test
   public void testCoverageCalculation_noSimulations() {
       // Given: No simulations
       when(simulationRepository.findByRuleSet("commercial-lines-underwriting"))
           .thenReturn(Collections.emptyList());

       // When: Calculate coverage
       CoverageReport report = coverageService.calculateCoverage("commercial-lines-underwriting");

       // Then: Should show 0% coverage gracefully
       assertEquals(0.0, report.getCoveragePercentage());
       assertEquals(0, report.getTestedRules());
   }
   ```

2. **Run Unit Tests**
   ```bash
   ./mvnw test -Dtest=CoverageServiceTest
   ```

3. **Integration Test**
   ```bash
   # Start the API
   ./mvnw spring-boot:run

   # Test the endpoint
   curl -X POST http://localhost:8081/api/v1/coverage/commercial-lines-underwriting \
     -H "Content-Type: application/json"

   # Expected: Coverage > 0%, testedRules: 2, RULE_004 and RULE_005 covered
   ```

4. **Manual UI Test**
   - Navigate to http://localhost:3000
   - Go to Coverage page
   - Select "commercial-lines-underwriting"
   - Click "Generate Report"
   - **Verify**: Coverage shows ~33%, RULE_004 and RULE_005 are "Tested"

### Phase 4: Commit Changes (15 min)

1. **Review Changes**
   ```bash
   git status
   git diff
   ```

2. **Stage Files**
   ```bash
   git add src/main/java/com/ruleweaver/simrule/service/CoverageService.java
   git add src/test/java/com/ruleweaver/simrule/service/CoverageServiceTest.java
   # Add any other modified files
   ```

3. **Commit with Detailed Message**
   ```bash
   git commit -m "$(cat <<'EOF'
   Fix coverage tracking calculation bug

   Problem: Coverage endpoint returned 0.0% despite rules firing in 100+ simulations
   Root Cause: [DESCRIBE WHAT YOU FOUND]

   Solution:
   - Updated CoverageService to query simulations collection
   - Aggregate rulesFired arrays from scenarioExecutions
   - Calculate coverage based on actual simulation results
   - Added proper logging for debugging

   Changes:
   - CoverageService.java: [DESCRIBE CHANGES]
   - SimulationRepository.java: [IF MODIFIED]
   - CoverageServiceTest.java: Added unit tests

   Testing:
   - Unit tests: PASS (X tests)
   - Integration test: Coverage now shows 33% for commercial-lines-underwriting
   - Manual UI test: Coverage page displays correctly

   Fixes: Issue #1 from E2E Testing Gap Analysis Report

   🤖 Generated with Claude Code

   Co-Authored-By: Claude <noreply@anthropic.com>
   EOF
   )"
   ```

4. **Push to Repository**
   ```bash
   git push origin main
   ```

### Phase 5: Rebuild & Redeploy (15-30 min)

1. **Build Docker Image**
   ```bash
   # Build the application
   ./mvnw clean package -DskipTests

   # Build Docker image
   docker build -t simrule-api:coverage-fix .

   # Tag with version
   docker tag simrule-api:coverage-fix simrule-api:latest
   ```

2. **Restart Service**
   ```bash
   # Stop current container
   docker-compose stop simrule-api

   # Remove old container
   docker-compose rm -f simrule-api

   # Start with new image
   docker-compose up -d simrule-api

   # Check logs
   docker-compose logs -f simrule-api
   ```

3. **Verify Deployment**
   ```bash
   # Health check
   curl http://localhost:8081/actuator/health

   # Test coverage endpoint
   curl -X POST http://localhost:8081/api/v1/coverage/commercial-lines-underwriting
   ```

### Phase 6: Generate Response Report (15-30 min)

Create a file named `COVERAGE_FIX_REPORT.md` with the following content:

```markdown
# Coverage Tracking Fix Report

**Date**: 2025-11-28
**Developer**: [YOUR NAME]
**Issue**: Coverage Tracking Returns 0% Despite Rules Firing
**Priority**: CRITICAL
**Status**: FIXED ✅

---

## Root Cause Identified

[Describe what was actually causing the issue. Examples:]
- Coverage service was not querying simulations collection
- Coverage was calculated only from scenario definitions, not simulation results
- Rule ID mapping had a case-sensitivity issue
- Aggregation query was filtering out all results due to [reason]

---

## Files Modified

1. **CoverageService.java** (`src/main/java/com/ruleweaver/simrule/service/CoverageService.java`)
   - Modified `calculateCoverage()` method to query simulations collection
   - Added aggregation logic for rulesFired arrays
   - Added debug logging for troubleshooting

2. **SimulationRepository.java** (`src/main/java/com/ruleweaver/simrule/repository/SimulationRepository.java`)
   - Added `findByRuleSet(String ruleSet)` method [IF ADDED]
   - [OR] No changes needed - method already existed

3. **CoverageServiceTest.java** (`src/test/java/com/ruleweaver/simrule/service/CoverageServiceTest.java`)
   - Added unit tests for coverage calculation with rules fired
   - Added unit test for empty simulation list
   - Added test for null rulesFired arrays

---

## Code Changes Summary

### Before (Broken)
```java
// Example of what was wrong
public CoverageReport calculateCoverage(String ruleSet) {
    // Was reading from wrong source or not aggregating correctly
    return new CoverageReport(0.0, 0, totalRules);
}
```

### After (Fixed)
```java
public CoverageReport calculateCoverage(String ruleSet) {
    // Now correctly queries simulations and aggregates rulesFired
    List<Simulation> simulations = simulationRepository.findByRuleSet(ruleSet);
    Map<String, Integer> ruleExecutionCounts = aggregateRulesFired(simulations);
    return buildCoverageReport(ruleSet, ruleExecutionCounts);
}
```

---

## Test Results

### Unit Tests
```
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0
```

Test cases:
- ✅ `testCoverageCalculation_withRulesFired()` - PASS
- ✅ `testCoverageCalculation_noSimulations()` - PASS
- ✅ `testCoverageCalculation_nullRulesFired()` - PASS
- ✅ `testCoverageCalculation_multipleSimulations()` - PASS
- ✅ `testCoverageCalculation_allRulesCovered()` - PASS

### Integration Test

**Request**:
```bash
curl -X POST http://localhost:8081/api/v1/coverage/commercial-lines-underwriting
```

**Response**:
```json
{
  "ruleSet": "commercial-lines-underwriting",
  "coveragePercentage": 33.3,
  "totalRules": 6,
  "testedRules": 2,
  "untestedRules": 4,
  "ruleCoverage": [
    {
      "ruleId": "RULE_004",
      "ruleName": "Risk Category Assignment",
      "covered": true,
      "executionCount": 112,
      "lastExecutedAt": "2025-11-28T00:56:00.000Z"
    },
    {
      "ruleId": "RULE_005",
      "ruleName": "Multi Coverage Discount",
      "covered": true,
      "executionCount": 112,
      "lastExecutedAt": "2025-11-28T00:56:00.000Z"
    },
    {
      "ruleId": "RULE_001",
      "ruleName": "Minimum Years In Business Requirement",
      "covered": false,
      "executionCount": 0,
      "lastExecutedAt": null
    }
    // ... other untested rules
  ]
}
```

✅ **Result**: Coverage now correctly shows 33.3% (2 out of 6 rules tested)

### Manual UI Test

1. Navigated to http://localhost:3000
2. Clicked "Coverage" in sidebar
3. Selected "commercial-lines-underwriting" from dropdown
4. Clicked "Generate Report"

**Result**:
- ✅ Coverage shows: 33.3%
- ✅ Tested: 2
- ✅ Untested: 4
- ✅ RULE_004 shows green "Tested" badge with "112 hits"
- ✅ RULE_005 shows green "Tested" badge with "112 hits"
- ✅ Other rules show red "Untested" badges with "0 hits"

[ATTACH SCREENSHOT HERE IF POSSIBLE]

---

## Coverage Verification

### Database Query Verification

Queried MongoDB to confirm data:

```javascript
// Count simulations with rulesFired containing RULE_004
db.simulations.countDocuments({
  "scenarioExecutions.rulesFired": "RULE_004"
})
// Result: 112

// Count simulations with rulesFired containing RULE_005
db.simulations.countDocuments({
  "scenarioExecutions.rulesFired": "RULE_005"
})
// Result: 112
```

✅ Data exists in database, coverage calculation now reads it correctly

---

## Performance Metrics

- Coverage calculation time: ~150ms for 308 simulations
- Memory usage: No significant increase
- Database queries: Optimized with proper indexing
- API response time: < 200ms

---

## Deployment

### Build Information
- **Branch**: main
- **Commit**: [GIT COMMIT HASH]
- **Build Time**: 2025-11-28 [TIMESTAMP]
- **Maven Build**: SUCCESS

### Docker Deployment
- **Docker Image**: `simrule-api:coverage-fix`
- **Tag**: `simrule-api:latest`
- **Container**: Restarted successfully
- **Health Check**: PASS
- **Logs**: No errors, coverage endpoint responding correctly

### Environment
- **Deployed To**: Development environment
- **API URL**: http://localhost:8081
- **MongoDB**: Connected successfully
- **Rule Inspector**: Connected successfully

---

## Additional Issues Found

[NONE - OR list any related issues discovered during investigation]

Examples:
- None - coverage fix was isolated issue
- OR: Found performance issue with query, added index on scenarioExecutions.rulesFired
- OR: Discovered similar issue with statistics endpoint, will address separately

---

## Validation Checklist

All items verified:

- [x] Coverage percentage is non-zero for commercial-lines-underwriting
- [x] RULE_004 (Risk Category Assignment) shows as "covered: true"
- [x] RULE_005 (Multi Coverage Discount) shows as "covered: true"
- [x] Both rules have executionCount > 0
- [x] Both rules have lastExecutedAt timestamp
- [x] Untested rules show as "covered: false"
- [x] Coverage percentage matches: (testedRules / totalRules) * 100
- [x] Running additional simulations updates coverage counts
- [x] Coverage report generation is performant
- [x] Unit tests pass
- [x] Integration tests pass
- [x] UI displays updated coverage correctly
- [x] Changes committed to git
- [x] Docker image rebuilt
- [x] Service redeployed
- [x] Health check passes

---

## Next Steps

1. ✅ Fix deployed and verified
2. ✅ Frontend team notified
3. [ ] Monitor production logs for any issues
4. [ ] Consider adding similar fix to statistics endpoint if needed

---

**Report Generated**: 2025-11-28 [TIMESTAMP]
**Developer**: [YOUR NAME]
**Status**: COMPLETE ✅
```

---

## Acceptance Criteria

Your work is complete when ALL of the following are true:

1. ✅ Coverage endpoint returns accurate coverage percentage (should be ~33%)
2. ✅ RULE_004 and RULE_005 show as "covered: true" with executionCount > 0
3. ✅ Unit tests written and passing
4. ✅ Integration test confirms correct API response
5. ✅ Manual UI test shows correct coverage display
6. ✅ Code changes committed to git with detailed commit message
7. ✅ Docker image rebuilt with the fix
8. ✅ SimRule API service redeployed and healthy
9. ✅ Response report generated (COVERAGE_FIX_REPORT.md)
10. ✅ No regression issues introduced (all existing tests still pass)

---

## Time Estimates

| Phase | Estimated Time |
|-------|----------------|
| Investigation | 30-60 min |
| Implementation | 60-90 min |
| Testing | 45-60 min |
| Commit Changes | 15 min |
| Rebuild & Redeploy | 15-30 min |
| Response Report | 15-30 min |
| **TOTAL** | **2-4 hours** |

---

## Support & Resources

### Reference Documents

1. **BACKEND_ISSUES_INSTRUCTIONS.md** - Detailed technical context
2. **E2E_TESTING_GAP_ANALYSIS.md** - Full testing report
3. **SIMRULE_UI_INTEGRATION_GUIDE.md** - Backend fix documentation

### Sample Data for Testing

**Simulation IDs to Query**:
- `692a449c5d4f1f5e48e2db25` - Contains RULE_004, RULE_005
- `692a44a05d4f1f5e48e2db29` - Single scenario test
- Query all: 308 simulations exist in database

**Expected Rules in commercial-lines-underwriting**:
1. RULE_001 - Minimum Years In Business Requirement
2. RULE_002 - High Value Property Surcharge
3. RULE_003 - Deductible Ratio Validation
4. RULE_004 - Risk Category Assignment (FIRES in tests)
5. RULE_005 - Multi Coverage Discount (FIRES in tests)
6. RULE_006 - High Value Property Surcharge - Updated

### MongoDB Queries for Debugging

```javascript
// Find simulations with rules fired
db.simulations.find({
  "scenarioExecutions.rulesFired": { $ne: [] }
}).limit(5);

// Count simulations per rule
db.simulations.aggregate([
  { $unwind: "$scenarioExecutions" },
  { $unwind: "$scenarioExecutions.rulesFired" },
  { $group: {
      _id: "$scenarioExecutions.rulesFired",
      count: { $sum: 1 }
  }}
]);
```

### Logging Commands

```bash
# Watch API logs in real-time
docker-compose logs -f simrule-api

# Check coverage endpoint logs specifically
docker-compose logs simrule-api | grep -i coverage

# Check for errors
docker-compose logs simrule-api | grep -i error
```

---

## Questions?

If you encounter issues or need clarification:

1. Review `BACKEND_ISSUES_INSTRUCTIONS.md` for detailed technical analysis
2. Check `E2E_TESTING_GAP_ANALYSIS.md` for full test evidence
3. Query the database directly to verify data exists
4. Add debug logging to trace execution flow
5. Check existing unit tests for patterns to follow

---

## Final Deliverables Checklist

Before marking this task complete, ensure you have:

- [ ] Fixed the coverage calculation logic
- [ ] Written and run unit tests (all passing)
- [ ] Run integration test (API returns correct coverage)
- [ ] Tested via UI (coverage displays correctly)
- [ ] Committed changes with detailed message
- [ ] Pushed to git repository
- [ ] Rebuilt Docker image
- [ ] Redeployed SimRule API service
- [ ] Verified service health
- [ ] Generated `COVERAGE_FIX_REPORT.md` response document
- [ ] Verified all acceptance criteria met

---

**Good luck! This is a critical fix that will unblock the regression testing workflow. Take your time to ensure it's done correctly.**

---

**Prompt Version**: 1.0
**Last Updated**: 2025-11-28
**Priority**: CRITICAL
**Estimated Effort**: 2-4 hours
