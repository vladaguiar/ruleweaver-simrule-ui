# Required Changes for Rule Inspector

**Date**: 2025-11-28
**Related To**: Backend API Issues (BACKEND_API_ISSUES.md)
**Status**: PENDING - Changes made but NOT committed

---

## Overview

This document describes a required change to the **Rule Inspector** project that fixes Issue #1 from the Backend API Issues report. This change must be applied separately in the Rule Inspector project.

---

## Issue #1: Overly Restrictive Fact Type Schemas (CRITICAL)

### Problem

The Rule Inspector's ObjectMapper is configured with default settings, which causes Jackson to fail when deserializing JSON data that contains fields not defined in the target POJO class.

**Error Example**:
```
Validation processing failed: Fact transformation failed: Unrecognized field "coverageAmount"
(class com.ruleweaver.facts.InsurancePolicy), not marked as ignorable
(4 known properties: "customerAge", "monthlyPremium", "policyNumber", "policyStatus")
```

### Root Cause

The `ApplicationConfiguration.java` in Rule Inspector does not disable `DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES`, causing Jackson to reject any JSON fields not explicitly defined in the fact type POJO.

### Required Fix

**File**: `rule-inspector/src/main/java/com/ruleweaver/inspector/config/ApplicationConfiguration.java`

**Change**:

```java
package com.ruleweaver.inspector.config;

import com.fasterxml.jackson.databind.DeserializationFeature;  // ADD THIS IMPORT
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ApplicationConfiguration {

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.enable(SerializationFeature.INDENT_OUTPUT);
        // FIX: Allow test scenarios to include additional fields not defined in fact schemas
        // This enables flexible testing where scenarios can include extra business fields
        // without failing validation. The extra fields are simply ignored during deserialization.
        mapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);  // ADD THIS LINE
        return mapper;
    }
}
```

### Impact of This Fix

1. **Enables Flexible Testing**: Test scenarios can include additional business fields (e.g., `coverageAmount`, `premium`, `deductible`) without failing validation
2. **Unblocks Rule Execution**: Facts will be successfully transformed, allowing the Drools rule engine to evaluate them
3. **Fixes Issue #3**: Rules will start firing because fact transformation will succeed
4. **Maintains Type Safety**: Known fields are still type-checked; only unknown fields are ignored

### Affected Services

- **FactService.java** - Uses `objectMapper.convertValue()` for fact transformation
- **FactTransformationService.java** - Uses `objectMapper.treeToValue()` for fact transformation

---

## Deployment Steps

1. Apply the change to `ApplicationConfiguration.java` in Rule Inspector
2. Build: `mvn clean package -DskipTests`
3. Rebuild Docker image: `docker build -t rule-inspector:latest .`
4. Restart container (standalone, not docker-compose)

---

## Note

This change was identified during SimRule API backend issue investigation. The change should be committed and deployed separately in the Rule Inspector project repository.
