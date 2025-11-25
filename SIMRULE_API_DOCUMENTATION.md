# SimRule API - Complete Endpoint Reference

**Version**: 1.0.0-SNAPSHOT
**Base URL**: `http://localhost:8081/api/v1`
**API Documentation**: http://localhost:8081/api/swagger-ui.html
**OpenAPI Spec**: http://localhost:8081/api/api-docs

---

## Table of Contents

1. [Authentication & Headers](#authentication--headers)
2. [Common Response Patterns](#common-response-patterns)
3. [Error Handling](#error-handling)
4. [Scenario Management Endpoints](#scenario-management-endpoints)
5. [Simulation Execution Endpoints](#simulation-execution-endpoints)
6. [Dataset Management Endpoints](#dataset-management-endpoints)
7. [Coverage Analysis Endpoints](#coverage-analysis-endpoints)
8. [Actuator Endpoints](#actuator-endpoints)

---

## Authentication & Headers

### Common Request Headers

All endpoints support the following optional headers for tracing and auditing:

| Header | Required | Default | Description |
|--------|----------|---------|-------------|
| `X-User-ID` | No | `system` | User identifier for audit logging |
| `X-Correlation-ID` | No | Auto-generated UUID | Request correlation ID for distributed tracing |
| `Content-Type` | Yes (POST/PUT) | `application/json` | Content type for request body |

### Security

- **Development Profile**: Authentication disabled
- **Production Profile**: JWT Bearer token required in `Authorization` header

---

## Common Response Patterns

### Success Responses

**200 OK** - Successful GET request
```json
{
  "id": "uuid",
  "status": "SUCCESS",
  "data": {}
}
```

**201 Created** - Successful POST request
```json
{
  "id": "uuid",
  "status": "CREATED",
  "timestamp": "2025-11-24T10:30:00Z"
}
```

**204 No Content** - Successful DELETE request (empty body)

### Pagination

List endpoints support pagination via query parameters:
- `page` - Page number (default: 0)
- `size` - Page size (default: 20, max: 100)
- `sort` - Sort field and direction (e.g., `createdAt,desc`)

---

## Error Handling

### Standard Error Response

All errors return a consistent error structure:

```json
{
  "timestamp": "2025-11-24T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed for scenario creation",
  "path": "/api/v1/scenarios",
  "correlationId": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
  "errors": [
    {
      "field": "name",
      "message": "Scenario name cannot be empty"
    }
  ]
}
```

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| **200** | OK | Successful GET request |
| **201** | Created | Successful POST request |
| **204** | No Content | Successful DELETE request |
| **400** | Bad Request | Invalid request parameters or body |
| **404** | Not Found | Resource does not exist |
| **409** | Conflict | Resource already exists or conflict in state |
| **422** | Unprocessable Entity | Validation failed |
| **500** | Internal Server Error | Server error |
| **503** | Service Unavailable | External service (Rule Inspector) unavailable |

### Common Error Scenarios

**Scenario Not Found (404)**
```json
{
  "timestamp": "2025-11-24T10:30:00Z",
  "status": 404,
  "error": "Not Found",
  "message": "Scenario with id 'abc123' not found",
  "path": "/api/v1/scenarios/abc123",
  "correlationId": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
}
```

**Validation Error (422)**
```json
{
  "timestamp": "2025-11-24T10:30:00Z",
  "status": 422,
  "error": "Unprocessable Entity",
  "message": "Validation failed",
  "path": "/api/v1/scenarios",
  "correlationId": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
  "errors": [
    {
      "field": "testData",
      "message": "Test data cannot be null"
    },
    {
      "field": "ruleSetId",
      "message": "Rule set ID must be provided"
    }
  ]
}
```

**Rule Inspector Unavailable (503)**
```json
{
  "timestamp": "2025-11-24T10:30:00Z",
  "status": 503,
  "error": "Service Unavailable",
  "message": "Rule Inspector service is currently unavailable. Circuit breaker is OPEN.",
  "path": "/api/v1/simulations",
  "correlationId": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
}
```

---

## Scenario Management Endpoints

Test scenarios define test cases with input data, expected results, and assertions.

---

### 1. Create Test Scenario

Create a new test scenario with test data and expected results.

**Endpoint**: `POST /api/v1/scenarios`

**Request Headers**:
- `Content-Type: application/json` (required)
- `X-User-ID: string` (optional, default: `system`)
- `X-Correlation-ID: string` (optional)

**Request Body**:
```json
{
  "name": "Test Premium Customer Discount",
  "description": "Verify that premium customers receive 15% discount on orders over $100",
  "ruleSetId": "customer-discount-rules-v1",
  "testData": {
    "customer": {
      "id": "CUST-001",
      "name": "John Doe",
      "membershipLevel": "PREMIUM",
      "joinDate": "2023-01-15"
    },
    "order": {
      "orderId": "ORD-12345",
      "items": [
        {
          "productId": "PROD-001",
          "quantity": 2,
          "unitPrice": 75.00
        }
      ],
      "subtotal": 150.00
    }
  },
  "expectedResults": {
    "discountApplied": true,
    "discountPercentage": 15,
    "finalTotal": 127.50
  },
  "assertions": [
    {
      "field": "discountApplied",
      "operator": "EQUALS",
      "expectedValue": true
    },
    {
      "field": "discountPercentage",
      "operator": "EQUALS",
      "expectedValue": 15
    },
    {
      "field": "finalTotal",
      "operator": "EQUALS",
      "expectedValue": 127.50
    }
  ],
  "tags": ["discount", "premium", "regression"],
  "status": "ACTIVE"
}
```

**Response**: `201 Created`
```json
{
  "scenarioId": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Test Premium Customer Discount",
  "description": "Verify that premium customers receive 15% discount on orders over $100",
  "ruleSetId": "customer-discount-rules-v1",
  "testData": {
    "customer": {
      "id": "CUST-001",
      "name": "John Doe",
      "membershipLevel": "PREMIUM",
      "joinDate": "2023-01-15"
    },
    "order": {
      "orderId": "ORD-12345",
      "items": [
        {
          "productId": "PROD-001",
          "quantity": 2,
          "unitPrice": 75.00
        }
      ],
      "subtotal": 150.00
    }
  },
  "expectedResults": {
    "discountApplied": true,
    "discountPercentage": 15,
    "finalTotal": 127.50
  },
  "assertions": [
    {
      "field": "discountApplied",
      "operator": "EQUALS",
      "expectedValue": true
    },
    {
      "field": "discountPercentage",
      "operator": "EQUALS",
      "expectedValue": 15
    },
    {
      "field": "finalTotal",
      "operator": "EQUALS",
      "expectedValue": 127.50
    }
  ],
  "tags": ["discount", "premium", "regression"],
  "status": "ACTIVE",
  "createdBy": "system",
  "createdAt": "2025-11-24T10:30:00Z",
  "updatedAt": "2025-11-24T10:30:00Z",
  "version": 1
}
```

**Supported Assertion Operators**:
- `EQUALS` - Exact match
- `NOT_EQUALS` - Not equal
- `GREATER_THAN` - Greater than (numeric)
- `LESS_THAN` - Less than (numeric)
- `GREATER_THAN_OR_EQUALS` - Greater than or equal (numeric)
- `LESS_THAN_OR_EQUALS` - Less than or equal (numeric)
- `CONTAINS` - String/array contains value
- `NOT_CONTAINS` - String/array does not contain value
- `STARTS_WITH` - String starts with value
- `ENDS_WITH` - String ends with value
- `MATCHES_REGEX` - Matches regular expression

**Supported Status Values**:
- `ACTIVE` - Scenario is active and can be executed
- `DRAFT` - Scenario is in draft state
- `ARCHIVED` - Scenario is archived (read-only)

---

### 2. Get Test Scenario

Retrieve details of a specific test scenario by ID.

**Endpoint**: `GET /api/v1/scenarios/{scenarioId}`

**Path Parameters**:
- `scenarioId` (required) - UUID of the scenario

**Response**: `200 OK`
```json
{
  "scenarioId": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Test Premium Customer Discount",
  "description": "Verify that premium customers receive 15% discount on orders over $100",
  "ruleSetId": "customer-discount-rules-v1",
  "testData": { },
  "expectedResults": { },
  "assertions": [ ],
  "tags": ["discount", "premium", "regression"],
  "status": "ACTIVE",
  "createdBy": "system",
  "createdAt": "2025-11-24T10:30:00Z",
  "updatedAt": "2025-11-24T10:30:00Z",
  "version": 1,
  "executionHistory": {
    "totalExecutions": 15,
    "lastExecutedAt": "2025-11-24T09:45:00Z",
    "passRate": 93.33
  }
}
```

**Error Response**: `404 Not Found`
```json
{
  "timestamp": "2025-11-24T10:30:00Z",
  "status": 404,
  "error": "Not Found",
  "message": "Scenario with id '550e8400-e29b-41d4-a716-446655440000' not found",
  "path": "/api/v1/scenarios/550e8400-e29b-41d4-a716-446655440000"
}
```

---

### 3. List Test Scenarios

Retrieve all test scenarios with optional filtering.

**Endpoint**: `GET /api/v1/scenarios`

**Query Parameters**:
- `status` (optional) - Filter by status (`ACTIVE`, `DRAFT`, `ARCHIVED`)
- `ruleSet` (optional) - Filter by rule set ID
- `tag` (optional) - Filter by tag (supports multiple, comma-separated)
- `page` (optional) - Page number (default: 0)
- `size` (optional) - Page size (default: 20, max: 100)
- `sort` (optional) - Sort field and direction (e.g., `createdAt,desc`)

**Example Requests**:
```
GET /api/v1/scenarios
GET /api/v1/scenarios?status=ACTIVE
GET /api/v1/scenarios?ruleSet=customer-discount-rules-v1
GET /api/v1/scenarios?tag=regression,smoke
GET /api/v1/scenarios?status=ACTIVE&page=0&size=50&sort=createdAt,desc
```

**Response**: `200 OK`
```json
[
  {
    "scenarioId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Test Premium Customer Discount",
    "description": "Verify that premium customers receive 15% discount",
    "ruleSetId": "customer-discount-rules-v1",
    "tags": ["discount", "premium", "regression"],
    "status": "ACTIVE",
    "createdBy": "system",
    "createdAt": "2025-11-24T10:30:00Z",
    "updatedAt": "2025-11-24T10:30:00Z",
    "version": 1
  },
  {
    "scenarioId": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Test Standard Customer No Discount",
    "description": "Verify that standard customers do not receive discount under $100",
    "ruleSetId": "customer-discount-rules-v1",
    "tags": ["discount", "standard", "regression"],
    "status": "ACTIVE",
    "createdBy": "john.doe",
    "createdAt": "2025-11-24T11:00:00Z",
    "updatedAt": "2025-11-24T11:00:00Z",
    "version": 1
  }
]
```

---

### 4. Update Test Scenario

Update an existing test scenario.

**Endpoint**: `PUT /api/v1/scenarios/{scenarioId}`

**Path Parameters**:
- `scenarioId` (required) - UUID of the scenario

**Request Headers**:
- `Content-Type: application/json` (required)
- `X-User-ID: string` (optional)
- `X-Correlation-ID: string` (optional)

**Request Body**: Same structure as Create Scenario (all fields optional for partial update)
```json
{
  "name": "Test Premium Customer Discount - Updated",
  "description": "Updated description",
  "status": "ACTIVE",
  "tags": ["discount", "premium", "regression", "updated"]
}
```

**Response**: `200 OK`
```json
{
  "scenarioId": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Test Premium Customer Discount - Updated",
  "description": "Updated description",
  "ruleSetId": "customer-discount-rules-v1",
  "testData": { },
  "expectedResults": { },
  "assertions": [ ],
  "tags": ["discount", "premium", "regression", "updated"],
  "status": "ACTIVE",
  "createdBy": "system",
  "createdAt": "2025-11-24T10:30:00Z",
  "updatedBy": "john.doe",
  "updatedAt": "2025-11-24T12:00:00Z",
  "version": 2
}
```

**Error Responses**:
- `404 Not Found` - Scenario does not exist
- `409 Conflict` - Version conflict (optimistic locking)

---

### 5. Delete Test Scenario

Delete a test scenario permanently.

**Endpoint**: `DELETE /api/v1/scenarios/{scenarioId}`

**Path Parameters**:
- `scenarioId` (required) - UUID of the scenario

**Request Headers**:
- `X-User-ID: string` (optional)
- `X-Correlation-ID: string` (optional)

**Response**: `204 No Content` (empty body)

**Error Response**: `404 Not Found`
```json
{
  "timestamp": "2025-11-24T10:30:00Z",
  "status": 404,
  "error": "Not Found",
  "message": "Scenario with id '550e8400-e29b-41d4-a716-446655440000' not found",
  "path": "/api/v1/scenarios/550e8400-e29b-41d4-a716-446655440000"
}
```

**Note**: Deleting a scenario does not delete historical simulation results that reference it.

---

### 6. Clone Test Scenario

Create a copy of an existing test scenario with a new ID.

**Endpoint**: `POST /api/v1/scenarios/{scenarioId}/clone`

**Path Parameters**:
- `scenarioId` (required) - UUID of the scenario to clone

**Request Headers**:
- `X-User-ID: string` (optional)
- `X-Correlation-ID: string` (optional)

**Response**: `201 Created`
```json
{
  "scenarioId": "770e8400-e29b-41d4-a716-446655440002",
  "name": "Test Premium Customer Discount (Copy)",
  "description": "Verify that premium customers receive 15% discount on orders over $100",
  "ruleSetId": "customer-discount-rules-v1",
  "testData": { },
  "expectedResults": { },
  "assertions": [ ],
  "tags": ["discount", "premium", "regression", "cloned"],
  "status": "DRAFT",
  "createdBy": "john.doe",
  "createdAt": "2025-11-24T13:00:00Z",
  "updatedAt": "2025-11-24T13:00:00Z",
  "version": 1,
  "clonedFrom": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Notes**:
- Cloned scenario gets a new UUID
- Status is set to `DRAFT` by default
- Name is appended with " (Copy)"
- Tags include "cloned"
- Execution history is not copied

---

## Simulation Execution Endpoints

Simulations execute test scenarios against the Rule Inspector service to validate rule behavior.

---

### 7. Execute Simulation

Execute a simulation with one or more test scenarios.

**Endpoint**: `POST /api/v1/simulations`

**Request Headers**:
- `Content-Type: application/json` (required)
- `X-User-ID: string` (optional)
- `X-Correlation-ID: string` (optional)

**Request Body**:
```json
{
  "name": "Discount Rules Regression Test",
  "description": "Full regression test of customer discount rules",
  "scenarioIds": [
    "550e8400-e29b-41d4-a716-446655440000",
    "660e8400-e29b-41d4-a716-446655440001",
    "770e8400-e29b-41d4-a716-446655440002"
  ],
  "executionMode": "PARALLEL",
  "maxConcurrency": 10,
  "continueOnFailure": true,
  "tags": ["regression", "nightly"]
}
```

**Request Fields**:
- `name` (required) - Simulation name
- `description` (optional) - Detailed description
- `scenarioIds` (required) - Array of scenario UUIDs to execute
- `executionMode` (optional) - `PARALLEL` (default) or `SEQUENTIAL`
- `maxConcurrency` (optional) - Max parallel executions (default: 10, max: 50)
- `continueOnFailure` (optional) - Continue if a scenario fails (default: true)
- `tags` (optional) - Tags for categorization

**Response**: `201 Created`
```json
{
  "simulationId": "880e8400-e29b-41d4-a716-446655440003",
  "name": "Discount Rules Regression Test",
  "description": "Full regression test of customer discount rules",
  "status": "RUNNING",
  "executionMode": "PARALLEL",
  "totalScenarios": 3,
  "completedScenarios": 0,
  "passedScenarios": 0,
  "failedScenarios": 0,
  "progress": 0.0,
  "startedAt": "2025-11-24T14:00:00Z",
  "tags": ["regression", "nightly"],
  "createdBy": "john.doe"
}
```

**Execution Modes**:
- **PARALLEL**: Execute scenarios concurrently (faster, recommended for independent scenarios)
- **SEQUENTIAL**: Execute scenarios one after another (slower, use when order matters)

**Simulation Status Values**:
- `PENDING` - Simulation queued but not started
- `RUNNING` - Simulation in progress
- `COMPLETED` - All scenarios executed successfully
- `FAILED` - One or more scenarios failed
- `CANCELLED` - Simulation was cancelled
- `ERROR` - System error occurred during execution

---

### 8. Get Simulation Details

Retrieve simulation details and results.

**Endpoint**: `GET /api/v1/simulations/{simulationId}`

**Path Parameters**:
- `simulationId` (required) - UUID of the simulation

**Response**: `200 OK` (while running)
```json
{
  "simulationId": "880e8400-e29b-41d4-a716-446655440003",
  "name": "Discount Rules Regression Test",
  "description": "Full regression test of customer discount rules",
  "status": "RUNNING",
  "executionMode": "PARALLEL",
  "totalScenarios": 3,
  "completedScenarios": 2,
  "passedScenarios": 2,
  "failedScenarios": 0,
  "progress": 66.67,
  "startedAt": "2025-11-24T14:00:00Z",
  "tags": ["regression", "nightly"],
  "createdBy": "john.doe",
  "scenarioResults": [
    {
      "scenarioId": "550e8400-e29b-41d4-a716-446655440000",
      "scenarioName": "Test Premium Customer Discount",
      "status": "PASSED",
      "executionTimeMs": 1234,
      "startedAt": "2025-11-24T14:00:01Z",
      "completedAt": "2025-11-24T14:00:02Z",
      "assertionResults": [
        {
          "field": "discountApplied",
          "operator": "EQUALS",
          "expectedValue": true,
          "actualValue": true,
          "passed": true
        },
        {
          "field": "discountPercentage",
          "operator": "EQUALS",
          "expectedValue": 15,
          "actualValue": 15,
          "passed": true
        }
      ]
    },
    {
      "scenarioId": "660e8400-e29b-41d4-a716-446655440001",
      "scenarioName": "Test Standard Customer No Discount",
      "status": "PASSED",
      "executionTimeMs": 987,
      "startedAt": "2025-11-24T14:00:01Z",
      "completedAt": "2025-11-24T14:00:02Z",
      "assertionResults": [ ]
    }
  ]
}
```

**Response**: `200 OK` (completed)
```json
{
  "simulationId": "880e8400-e29b-41d4-a716-446655440003",
  "name": "Discount Rules Regression Test",
  "description": "Full regression test of customer discount rules",
  "status": "COMPLETED",
  "executionMode": "PARALLEL",
  "totalScenarios": 3,
  "completedScenarios": 3,
  "passedScenarios": 3,
  "failedScenarios": 0,
  "progress": 100.0,
  "startedAt": "2025-11-24T14:00:00Z",
  "completedAt": "2025-11-24T14:00:05Z",
  "durationMs": 5000,
  "tags": ["regression", "nightly"],
  "createdBy": "john.doe",
  "scenarioResults": [ ],
  "summary": {
    "totalAssertions": 9,
    "passedAssertions": 9,
    "failedAssertions": 0,
    "averageExecutionTimeMs": 1150,
    "passRate": 100.0
  }
}
```

**Scenario Result Status Values**:
- `PENDING` - Not yet started
- `RUNNING` - Currently executing
- `PASSED` - All assertions passed
- `FAILED` - One or more assertions failed
- `ERROR` - Execution error occurred

---

### 9. List Simulations

Retrieve all simulations with optional filtering.

**Endpoint**: `GET /api/v1/simulations`

**Query Parameters**:
- `status` (optional) - Filter by status (`RUNNING`, `COMPLETED`, `FAILED`)
- `page` (optional) - Page number (default: 0)
- `size` (optional) - Page size (default: 20, max: 100)
- `sort` (optional) - Sort field and direction (e.g., `startedAt,desc`)

**Example Requests**:
```
GET /api/v1/simulations
GET /api/v1/simulations?status=RUNNING
GET /api/v1/simulations?status=COMPLETED&sort=startedAt,desc
```

**Response**: `200 OK`
```json
[
  {
    "simulationId": "880e8400-e29b-41d4-a716-446655440003",
    "name": "Discount Rules Regression Test",
    "status": "COMPLETED",
    "totalScenarios": 3,
    "passedScenarios": 3,
    "failedScenarios": 0,
    "progress": 100.0,
    "startedAt": "2025-11-24T14:00:00Z",
    "completedAt": "2025-11-24T14:00:05Z",
    "durationMs": 5000,
    "createdBy": "john.doe"
  },
  {
    "simulationId": "990e8400-e29b-41d4-a716-446655440004",
    "name": "Smoke Test",
    "status": "RUNNING",
    "totalScenarios": 10,
    "completedScenarios": 7,
    "passedScenarios": 7,
    "failedScenarios": 0,
    "progress": 70.0,
    "startedAt": "2025-11-24T14:10:00Z",
    "createdBy": "jane.smith"
  }
]
```

---

## Dataset Management Endpoints

Test datasets provide reusable collections of test data that can be used across multiple scenarios.

---

### 10. Upload Test Dataset

Upload a new test dataset with records.

**Endpoint**: `POST /api/v1/datasets`

**Request Headers**:
- `Content-Type: application/json` (required)
- `X-User-ID: string` (optional)
- `X-Correlation-ID: string` (optional)

**Request Body**:
```json
{
  "name": "Customer Test Data - Q4 2025",
  "description": "Sample customer data for testing discount rules",
  "factType": "Customer",
  "format": "JSON",
  "records": [
    {
      "id": "CUST-001",
      "name": "John Doe",
      "membershipLevel": "PREMIUM",
      "joinDate": "2023-01-15",
      "totalPurchases": 15000.00
    },
    {
      "id": "CUST-002",
      "name": "Jane Smith",
      "membershipLevel": "STANDARD",
      "joinDate": "2024-05-20",
      "totalPurchases": 2500.00
    },
    {
      "id": "CUST-003",
      "name": "Bob Johnson",
      "membershipLevel": "GOLD",
      "joinDate": "2022-08-10",
      "totalPurchases": 45000.00
    }
  ],
  "tags": ["customers", "q4-2025", "discount-testing"],
  "status": "ACTIVE"
}
```

**Request Fields**:
- `name` (required) - Dataset name
- `description` (optional) - Detailed description
- `factType` (required) - Type of fact/entity (e.g., Customer, Order, Product)
- `format` (required) - Data format (`JSON`, `CSV`, `EXCEL`)
- `records` (required) - Array of data records
- `tags` (optional) - Tags for categorization
- `status` (optional) - Dataset status (`ACTIVE`, `DRAFT`, `ARCHIVED`)

**Response**: `201 Created`
```json
{
  "datasetId": "aa0e8400-e29b-41d4-a716-446655440005",
  "name": "Customer Test Data - Q4 2025",
  "description": "Sample customer data for testing discount rules",
  "factType": "Customer",
  "format": "JSON",
  "recordCount": 3,
  "tags": ["customers", "q4-2025", "discount-testing"],
  "status": "ACTIVE",
  "createdBy": "john.doe",
  "createdAt": "2025-11-24T15:00:00Z",
  "updatedAt": "2025-11-24T15:00:00Z",
  "statistics": {
    "totalRecords": 3,
    "uniqueFields": ["id", "name", "membershipLevel", "joinDate", "totalPurchases"],
    "sizeBytes": 512
  }
}
```

**Supported Formats**:
- **JSON**: Array of JSON objects
- **CSV**: CSV data with headers
- **EXCEL**: Excel workbook (first sheet used)

---

### 11. Get Test Dataset

Retrieve details of a specific test dataset.

**Endpoint**: `GET /api/v1/datasets/{datasetId}`

**Path Parameters**:
- `datasetId` (required) - UUID of the dataset

**Query Parameters**:
- `includeRecords` (optional) - Include full record data (default: false)

**Response**: `200 OK`
```json
{
  "datasetId": "aa0e8400-e29b-41d4-a716-446655440005",
  "name": "Customer Test Data - Q4 2025",
  "description": "Sample customer data for testing discount rules",
  "factType": "Customer",
  "format": "JSON",
  "recordCount": 3,
  "tags": ["customers", "q4-2025", "discount-testing"],
  "status": "ACTIVE",
  "createdBy": "john.doe",
  "createdAt": "2025-11-24T15:00:00Z",
  "updatedAt": "2025-11-24T15:00:00Z",
  "statistics": {
    "totalRecords": 3,
    "uniqueFields": ["id", "name", "membershipLevel", "joinDate", "totalPurchases"],
    "sizeBytes": 512
  },
  "usageCount": 5,
  "lastUsedAt": "2025-11-24T14:00:00Z"
}
```

**Response with Records**: `200 OK` (when `includeRecords=true`)
```json
{
  "datasetId": "aa0e8400-e29b-41d4-a716-446655440005",
  "name": "Customer Test Data - Q4 2025",
  "records": [
    {
      "id": "CUST-001",
      "name": "John Doe",
      "membershipLevel": "PREMIUM",
      "joinDate": "2023-01-15",
      "totalPurchases": 15000.00
    }
  ]
}
```

---

### 12. List Test Datasets

Retrieve all test datasets with optional filtering.

**Endpoint**: `GET /api/v1/datasets`

**Query Parameters**:
- `factType` (optional) - Filter by fact type
- `status` (optional) - Filter by status (`ACTIVE`, `DRAFT`, `ARCHIVED`)
- `tag` (optional) - Filter by tag
- `page` (optional) - Page number (default: 0)
- `size` (optional) - Page size (default: 20, max: 100)
- `sort` (optional) - Sort field and direction (e.g., `createdAt,desc`)

**Example Requests**:
```
GET /api/v1/datasets
GET /api/v1/datasets?factType=Customer
GET /api/v1/datasets?status=ACTIVE&tag=q4-2025
GET /api/v1/datasets?page=0&size=50&sort=createdAt,desc
```

**Response**: `200 OK`
```json
[
  {
    "datasetId": "aa0e8400-e29b-41d4-a716-446655440005",
    "name": "Customer Test Data - Q4 2025",
    "factType": "Customer",
    "format": "JSON",
    "recordCount": 3,
    "status": "ACTIVE",
    "createdBy": "john.doe",
    "createdAt": "2025-11-24T15:00:00Z"
  },
  {
    "datasetId": "bb0e8400-e29b-41d4-a716-446655440006",
    "name": "Order Test Data",
    "factType": "Order",
    "format": "CSV",
    "recordCount": 50,
    "status": "ACTIVE",
    "createdBy": "jane.smith",
    "createdAt": "2025-11-24T16:00:00Z"
  }
]
```

---

### 13. Delete Test Dataset

Delete a test dataset permanently.

**Endpoint**: `DELETE /api/v1/datasets/{datasetId}`

**Path Parameters**:
- `datasetId` (required) - UUID of the dataset

**Request Headers**:
- `X-User-ID: string` (optional)
- `X-Correlation-ID: string` (optional)

**Response**: `204 No Content` (empty body)

**Error Response**: `409 Conflict` (if dataset is in use)
```json
{
  "timestamp": "2025-11-24T16:30:00Z",
  "status": 409,
  "error": "Conflict",
  "message": "Cannot delete dataset 'aa0e8400-e29b-41d4-a716-446655440005'. It is currently referenced by 5 active scenarios.",
  "path": "/api/v1/datasets/aa0e8400-e29b-41d4-a716-446655440005"
}
```

---

## Coverage Analysis Endpoints

Coverage analysis tracks which rules have been tested by simulations.

---

### 14. Generate Coverage Report

Generate a new coverage analysis report for a rule set.

**Endpoint**: `POST /api/v1/coverage/{ruleSet}`

**Path Parameters**:
- `ruleSet` (required) - Rule set identifier (e.g., `customer-discount-rules-v1`)

**Request Headers**:
- `X-User-ID: string` (optional)
- `X-Correlation-ID: string` (optional)

**Response**: `201 Created`
```json
{
  "reportId": "cc0e8400-e29b-41d4-a716-446655440007",
  "ruleSet": "customer-discount-rules-v1",
  "generatedAt": "2025-11-24T17:00:00Z",
  "generatedBy": "john.doe",
  "totalRules": 25,
  "testedRules": 22,
  "untestedRules": 3,
  "coveragePercentage": 88.0,
  "rulesCoverage": [
    {
      "ruleId": "DISCOUNT_PREMIUM_15",
      "ruleName": "Premium Customer 15% Discount",
      "tested": true,
      "testCount": 5,
      "lastTestedAt": "2025-11-24T14:00:00Z"
    },
    {
      "ruleId": "DISCOUNT_GOLD_20",
      "ruleName": "Gold Customer 20% Discount",
      "tested": true,
      "testCount": 3,
      "lastTestedAt": "2025-11-24T14:00:00Z"
    },
    {
      "ruleId": "DISCOUNT_SEASONAL",
      "ruleName": "Seasonal Discount Rule",
      "tested": false,
      "testCount": 0,
      "lastTestedAt": null
    }
  ],
  "untestedRulesList": [
    {
      "ruleId": "DISCOUNT_SEASONAL",
      "ruleName": "Seasonal Discount Rule"
    },
    {
      "ruleId": "DISCOUNT_BULK_ORDER",
      "ruleName": "Bulk Order Discount"
    },
    {
      "ruleId": "DISCOUNT_FIRST_TIME",
      "ruleName": "First Time Customer Discount"
    }
  ],
  "recommendedScenarios": [
    "Create test scenario for DISCOUNT_SEASONAL with seasonal date ranges",
    "Create test scenario for DISCOUNT_BULK_ORDER with order quantities > 100",
    "Create test scenario for DISCOUNT_FIRST_TIME with new customer data"
  ]
}
```

**Coverage Calculation**:
```
coveragePercentage = (testedRules / totalRules) * 100
```

---

### 15. Get Latest Coverage Report

Retrieve the most recent coverage report for a rule set.

**Endpoint**: `GET /api/v1/coverage/{ruleSet}/latest`

**Path Parameters**:
- `ruleSet` (required) - Rule set identifier

**Response**: `200 OK` (same structure as Generate Coverage Report)

**Error Response**: `404 Not Found`
```json
{
  "timestamp": "2025-11-24T17:30:00Z",
  "status": 404,
  "error": "Not Found",
  "message": "No coverage reports found for rule set 'customer-discount-rules-v1'",
  "path": "/api/v1/coverage/customer-discount-rules-v1/latest"
}
```

---

### 16. List Coverage Reports

Retrieve all coverage reports for a rule set (historical trend).

**Endpoint**: `GET /api/v1/coverage/{ruleSet}`

**Path Parameters**:
- `ruleSet` (required) - Rule set identifier

**Query Parameters**:
- `page` (optional) - Page number (default: 0)
- `size` (optional) - Page size (default: 20, max: 100)
- `sort` (optional) - Sort field and direction (e.g., `generatedAt,desc`)

**Response**: `200 OK`
```json
[
  {
    "reportId": "cc0e8400-e29b-41d4-a716-446655440007",
    "ruleSet": "customer-discount-rules-v1",
    "generatedAt": "2025-11-24T17:00:00Z",
    "totalRules": 25,
    "testedRules": 22,
    "coveragePercentage": 88.0
  },
  {
    "reportId": "dd0e8400-e29b-41d4-a716-446655440008",
    "ruleSet": "customer-discount-rules-v1",
    "generatedAt": "2025-11-23T17:00:00Z",
    "totalRules": 25,
    "testedRules": 20,
    "coveragePercentage": 80.0
  },
  {
    "reportId": "ee0e8400-e29b-41d4-a716-446655440009",
    "ruleSet": "customer-discount-rules-v1",
    "generatedAt": "2025-11-22T17:00:00Z",
    "totalRules": 25,
    "testedRules": 18,
    "coveragePercentage": 72.0
  }
]
```

**Use Case**: Track coverage improvement over time, visualize trends in test coverage.

---

## Actuator Endpoints

Spring Boot Actuator endpoints for application monitoring and health checks.

---

### 17. Health Check

Check application health status.

**Endpoint**: `GET /api/actuator/health`

**Response**: `200 OK`
```json
{
  "status": "UP",
  "components": {
    "mongo": {
      "status": "UP",
      "details": {
        "version": "7.0.4"
      }
    },
    "redis": {
      "status": "UP",
      "details": {
        "version": "7.2.3"
      }
    },
    "diskSpace": {
      "status": "UP",
      "details": {
        "total": 500000000000,
        "free": 250000000000,
        "threshold": 10485760
      }
    },
    "ruleInspector": {
      "status": "UP",
      "details": {
        "circuitBreakerState": "CLOSED",
        "lastCheckTime": "2025-11-24T17:45:00Z"
      }
    }
  }
}
```

**Response**: `503 Service Unavailable` (when unhealthy)
```json
{
  "status": "DOWN",
  "components": {
    "mongo": {
      "status": "DOWN",
      "details": {
        "error": "Connection refused to MongoDB at localhost:27017"
      }
    }
  }
}
```

---

### 18. Application Info

Get application information and version.

**Endpoint**: `GET /api/actuator/info`

**Response**: `200 OK`
```json
{
  "app": {
    "name": "SimRule API",
    "description": "Enterprise Rule Simulator for RuleWeaver",
    "version": "1.0.0-SNAPSHOT",
    "buildTime": "2025-11-24T10:00:00Z"
  },
  "java": {
    "version": "21.0.2",
    "vendor": "Eclipse Adoptium"
  },
  "spring": {
    "boot": {
      "version": "3.2.2"
    },
    "profiles": {
      "active": ["dev"]
    }
  }
}
```

---

### 19. Metrics

Get application metrics (Prometheus format).

**Endpoint**: `GET /api/actuator/metrics`

**Response**: `200 OK`
```json
{
  "names": [
    "jvm.memory.used",
    "jvm.memory.max",
    "jvm.threads.live",
    "process.uptime",
    "http.server.requests",
    "simrule.simulations.total",
    "simrule.simulations.active",
    "simrule.scenarios.total"
  ]
}
```

**Get Specific Metric**: `GET /api/actuator/metrics/{metricName}`

Example: `GET /api/actuator/metrics/simrule.simulations.total`

**Response**: `200 OK`
```json
{
  "name": "simrule.simulations.total",
  "description": "Total number of simulations executed",
  "baseUnit": "simulations",
  "measurements": [
    {
      "statistic": "COUNT",
      "value": 150
    }
  ]
}
```

---

### 20. Prometheus Metrics Export

Export all metrics in Prometheus format for scraping.

**Endpoint**: `GET /api/actuator/prometheus`

**Response**: `200 OK` (text/plain)
```
# HELP jvm_memory_used_bytes The amount of used memory
# TYPE jvm_memory_used_bytes gauge
jvm_memory_used_bytes{area="heap",id="G1 Eden Space",} 2.0971520E7

# HELP simrule_simulations_total Total number of simulations
# TYPE simrule_simulations_total counter
simrule_simulations_total 150.0

# HELP simrule_simulations_active Active simulations
# TYPE simrule_simulations_active gauge
simrule_simulations_active 3.0

# HELP simrule_scenarios_total Total scenarios
# TYPE simrule_scenarios_total counter
simrule_scenarios_total 45.0
```

---

## WebSocket Integration

For real-time simulation progress updates, connect to the WebSocket endpoint:

**WebSocket URL**: `ws://localhost:8081/ws`

**Subscribe to Simulation Updates**:
```javascript
const socket = new WebSocket('ws://localhost:8081/ws');

socket.onopen = () => {
  console.log('Connected to SimRule WebSocket');

  // Subscribe to simulation updates
  socket.send(JSON.stringify({
    action: 'subscribe',
    simulationId: '880e8400-e29b-41d4-a716-446655440003'
  }));
};

socket.onmessage = (event) => {
  const update = JSON.parse(event.data);
  console.log('Simulation Update:', update);

  // update = {
  //   simulationId: '880e8400-e29b-41d4-a716-446655440003',
  //   status: 'RUNNING',
  //   progress: 45.5,
  //   completedScenarios: 5,
  //   totalScenarios: 11
  // }
};
```

---

## Rate Limiting

Production profile enforces rate limiting on all endpoints:

| Endpoint Type | Rate Limit |
|--------------|------------|
| Scenario CRUD | 100 requests/minute per user |
| Simulation Execution | 10 requests/minute per user |
| Dataset Upload | 20 requests/minute per user |
| Coverage Reports | 30 requests/minute per user |
| Health/Metrics | Unlimited |

**Rate Limit Response**: `429 Too Many Requests`
```json
{
  "timestamp": "2025-11-24T18:00:00Z",
  "status": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in 45 seconds.",
  "path": "/api/v1/simulations",
  "retryAfter": 45
}
```

---

## API Versioning

The API uses URL-based versioning:
- **Current Version**: `v1` (all endpoints prefixed with `/api/v1`)
- **Version Format**: `/api/{version}/{resource}`

Future versions will be introduced as `/api/v2` while maintaining backward compatibility with v1.

---

## Testing the API

### Using cURL

**Create a Scenario**:
```bash
curl -X POST http://localhost:8081/api/v1/scenarios \
  -H "Content-Type: application/json" \
  -H "X-User-ID: john.doe" \
  -d '{
    "name": "Test Scenario",
    "ruleSetId": "test-rules",
    "testData": {"test": true},
    "expectedResults": {"result": "success"},
    "status": "ACTIVE"
  }'
```

**Get Scenario**:
```bash
curl http://localhost:8081/api/v1/scenarios/550e8400-e29b-41d4-a716-446655440000
```

**Execute Simulation**:
```bash
curl -X POST http://localhost:8081/api/v1/simulations \
  -H "Content-Type: application/json" \
  -H "X-User-ID: john.doe" \
  -d '{
    "name": "Test Simulation",
    "scenarioIds": ["550e8400-e29b-41d4-a716-446655440000"],
    "executionMode": "PARALLEL"
  }'
```

### Using Postman

Import the OpenAPI specification from `http://localhost:8081/v3/api-docs` into Postman to automatically generate a collection with all endpoints.

---

## Additional Resources

- **Swagger UI**: http://localhost:8081/swagger-ui.html - Interactive API documentation
- **OpenAPI Spec (JSON)**: http://localhost:8081/v3/api-docs
- **OpenAPI Spec (YAML)**: http://localhost:8081/v3/api-docs.yaml
- **Health Check**: http://localhost:8081/api/actuator/health
- **Application Metrics**: http://localhost:8081/api/actuator/metrics

---

## Support

For API questions or issues:
- **Email**: support@ruleweaver.com
- **GitHub Issues**: https://github.com/vladaguiar/ruleweaver-simrule-api/issues
- **Documentation**: See README.md and ARCHITECTURE.md

---

**Document Version**: 1.0.0
**Last Updated**: November 24, 2025
**API Version**: v1
