# SimRule API - New Endpoints Guide

This document provides comprehensive documentation for the newly implemented API endpoints in the SimRule API service. These endpoints enhance the statistics, schema management, and bulk operations capabilities.

## Table of Contents

1. [Statistics Endpoints](#statistics-endpoints)
   - [Get Statistics Overview](#get-statistics-overview)
   - [Get Statistics Trends](#get-statistics-trends)
   - [Get Daily Activity](#get-daily-activity)
2. [Schema Endpoints](#schema-endpoints)
   - [List All Schemas](#list-all-schemas)
   - [Get Schema by Fact Type](#get-schema-by-fact-type)
   - [Generate Sample Data](#generate-sample-data)
3. [Bulk Operations](#bulk-operations)
   - [Bulk Delete Scenarios](#bulk-delete-scenarios)
4. [Dataset Management](#dataset-management)
   - [Update Dataset](#update-dataset)
5. [Simulation Management](#simulation-management)
   - [Cancel Simulation](#cancel-simulation)
6. [Error Handling](#error-handling)
7. [Common Headers](#common-headers)

---

## Statistics Endpoints

### Get Statistics Overview

Retrieve a comprehensive overview of the system's simulation statistics for dashboard display.

**Endpoint:** `GET /api/v1/statistics/overview`

**Description:** Returns aggregated statistics including total scenarios, simulations, success rates, dataset counts, and status breakdown. Ideal for populating dashboard summary cards.

**Request:**
```http
GET /api/v1/statistics/overview HTTP/1.1
Host: localhost:8081
Accept: application/json
```

**Response:**
```json
{
  "totalScenarios": 156,
  "activeScenarios": 142,
  "totalSimulations": 1247,
  "simulationsToday": 23,
  "runningSimulations": 2,
  "overallSuccessRate": 87.5,
  "todaySuccessRate": 92.3,
  "totalDatasets": 34,
  "activeDatasets": 28,
  "statusBreakdown": {
    "COMPLETED": 1150,
    "FAILED": 85,
    "CANCELLED": 10,
    "RUNNING": 2,
    "PENDING": 0
  },
  "lastSimulationAt": "2025-01-15T10:30:00Z",
  "avgExecutionTimeMs": 2450,
  "totalScenariosExecuted": 15678,
  "totalScenariosPassed": 13720
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `totalScenarios` | Long | Total number of test scenarios in the system |
| `activeScenarios` | Long | Number of scenarios with ACTIVE status |
| `totalSimulations` | Long | Total number of simulations executed |
| `simulationsToday` | Long | Number of simulations executed today (completed statuses only) |
| `runningSimulations` | Long | Number of currently running simulations |
| `overallSuccessRate` | Double | Overall success rate percentage (0-100) |
| `todaySuccessRate` | Double | Today's success rate percentage |
| `totalDatasets` | Long | Total number of datasets |
| `activeDatasets` | Long | Number of active datasets |
| `statusBreakdown` | Map | Count of simulations by status |
| `lastSimulationAt` | Instant | Timestamp of the most recent simulation |
| `avgExecutionTimeMs` | Long | Average execution time in milliseconds |
| `totalScenariosExecuted` | Long | Total scenarios executed across all simulations |
| `totalScenariosPassed` | Long | Total scenarios that passed |

**Status Codes:**
- `200 OK` - Successfully retrieved overview
- `500 Internal Server Error` - Server error occurred

---

### Get Statistics Trends

Retrieve trend data for simulations over a specified period with comparison to the previous period.

**Endpoint:** `GET /api/v1/statistics/trends`

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `days` | Integer | No | 7 | Number of days to retrieve (1-30) |

**Request:**
```http
GET /api/v1/statistics/trends?days=7 HTTP/1.1
Host: localhost:8081
Accept: application/json
```

**Response:**
```json
{
  "period": "7 days",
  "dataPoints": [
    {
      "date": "Mon",
      "simulations": 5,
      "scenarios": 45,
      "successRate": 88.5,
      "avgExecutionTime": 2340
    },
    {
      "date": "Tue",
      "simulations": 8,
      "scenarios": 72,
      "successRate": 91.2,
      "avgExecutionTime": 2150
    },
    {
      "date": "Wed",
      "simulations": 6,
      "scenarios": 54,
      "successRate": 85.3,
      "avgExecutionTime": 2560
    }
  ],
  "summary": {
    "totalSimulations": 42,
    "totalScenarios": 378,
    "avgSuccessRate": 89.3,
    "trend": "UP",
    "percentageChange": 12.5
  }
}
```

**Trend Direction Values:**
- `UP` - Current period has >5% more simulations than previous period
- `DOWN` - Current period has >5% fewer simulations than previous period
- `STABLE` - Change is within ±5%

**Status Codes:**
- `200 OK` - Successfully retrieved trends
- `400 Bad Request` - Invalid days parameter (must be 1-30)
- `500 Internal Server Error` - Server error occurred

---

### Get Daily Activity

Retrieve daily simulation activity statistics showing tests executed and passed per day.

**Endpoint:** `GET /api/v1/statistics/activity`

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `days` | Integer | No | 7 | Number of days to retrieve (1-30) |

**Request:**
```http
GET /api/v1/statistics/activity?days=7 HTTP/1.1
Host: localhost:8081
Accept: application/json
```

**Response:**
```json
[
  {"date": "Mon", "tests": 24, "passed": 22},
  {"date": "Tue", "tests": 31, "passed": 28},
  {"date": "Wed", "tests": 28, "passed": 26},
  {"date": "Thu", "tests": 35, "passed": 32},
  {"date": "Fri", "tests": 42, "passed": 38},
  {"date": "Sat", "tests": 18, "passed": 17},
  {"date": "Sun", "tests": 15, "passed": 15}
]
```

**Notes:**
- Results are ordered chronologically (oldest first)
- Days with no activity are included with `tests=0` and `passed=0`
- Only COMPLETED, FAILED, and CANCELLED simulations are counted (not PENDING or RUNNING)

---

## Schema Endpoints

### List All Schemas

Retrieve schema information for all registered fact types from Rule Inspector.

**Endpoint:** `GET /api/v1/schemas`

**Request:**
```http
GET /api/v1/schemas HTTP/1.1
Host: localhost:8081
Accept: application/json
```

**Response:**
```json
[
  {
    "factType": "CustomerDiscount",
    "displayName": "Customer Discount",
    "description": "Customer discount eligibility data",
    "packageName": "com.ruleweaver.facts.discount",
    "fields": [...],
    "associatedRuleSets": ["customer-discount-rules-v1"],
    "fieldCount": 12,
    "requiredFieldCount": 5,
    "metadata": {
      "source": "rule-inspector",
      "retrievedAt": "2025-01-15T10:30:00Z"
    }
  }
]
```

---

### Get Schema by Fact Type

Retrieve detailed schema information for a specific fact type.

**Endpoint:** `GET /api/v1/schemas/{factType}`

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `factType` | String | Fact type identifier (case-sensitive) |

**Request:**
```http
GET /api/v1/schemas/CustomerDiscount HTTP/1.1
Host: localhost:8081
Accept: application/json
```

**Response:**
```json
{
  "factType": "CustomerDiscount",
  "displayName": "Customer Discount",
  "description": "Represents customer discount eligibility data",
  "packageName": "com.ruleweaver.facts.discount",
  "fields": [
    {
      "name": "customerId",
      "type": "String",
      "description": "Unique customer identifier",
      "required": true,
      "exampleValue": "CUST-12345",
      "constraints": {
        "pattern": "^CUST-\\d{5}$"
      }
    },
    {
      "name": "tierLevel",
      "type": "String",
      "required": true,
      "constraints": {
        "allowedValues": ["GOLD", "SILVER", "BRONZE"]
      }
    },
    {
      "name": "totalPurchases",
      "type": "Double",
      "required": false,
      "constraints": {
        "min": 0,
        "max": 1000000
      }
    }
  ],
  "associatedRuleSets": ["customer-discount-rules-v1"],
  "fieldCount": 3,
  "requiredFieldCount": 2,
  "metadata": {
    "source": "rule-inspector",
    "retrievedAt": "2025-01-15T10:30:00Z",
    "version": "1.0"
  }
}
```

**Status Codes:**
- `200 OK` - Schema retrieved successfully
- `404 Not Found` - Fact type not found
- `503 Service Unavailable` - Rule Inspector unavailable

---

### Generate Sample Data

Generate sample data matching the schema of a specific fact type. Useful for creating test scenarios.

**Endpoint:** `GET /api/v1/schemas/{factType}/sample`

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `factType` | String | Fact type identifier |

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `count` | Integer | No | 1 | Number of samples to generate (1-100) |
| `seed` | Long | No | Current time | Random seed for reproducible generation |

**Request:**
```http
GET /api/v1/schemas/CustomerDiscount/sample?count=3&seed=12345 HTTP/1.1
Host: localhost:8081
Accept: application/json
```

**Response:**
```json
{
  "factType": "CustomerDiscount",
  "sampleData": {
    "customerId": "CUST-54321",
    "tierLevel": "GOLD",
    "totalPurchases": 1500.50,
    "memberSince": "2023-01-15T00:00:00Z"
  },
  "variations": [
    {"customerId": "CUST-54321", "tierLevel": "GOLD", "totalPurchases": 1500.50},
    {"customerId": "CUST-12987", "tierLevel": "SILVER", "totalPurchases": 750.25},
    {"customerId": "CUST-67432", "tierLevel": "BRONZE", "totalPurchases": 250.00}
  ],
  "count": 3,
  "seed": 12345,
  "generatedAt": "2025-01-15T10:30:00Z",
  "notes": "Sample data generated based on schema definition. Values are representative examples and may need adjustment for specific test scenarios."
}
```

**Features:**
- Generated values respect field constraints (min/max, allowed values, patterns)
- Email fields generate valid email formats
- ID fields include recognizable prefixes
- Using the same `seed` produces identical results (for reproducibility)

**Status Codes:**
- `200 OK` - Sample data generated successfully
- `400 Bad Request` - Invalid count parameter
- `404 Not Found` - Fact type not found

---

## Bulk Operations

### Bulk Delete Scenarios

Delete multiple scenarios in a single request. Returns detailed results for each deletion.

**Endpoint:** `DELETE /api/v1/scenarios/bulk`

**Request Body:**
```json
{
  "scenarioIds": [
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002",
    "550e8400-e29b-41d4-a716-446655440003"
  ]
}
```

**Constraints:**
- Maximum 100 scenarios per request
- At least 1 scenario ID required

**Headers:**

| Header | Required | Description |
|--------|----------|-------------|
| `X-User-ID` | No | User ID for audit tracking (defaults to "system") |
| `X-Correlation-ID` | No | Correlation ID for request tracing |

**Response:**
```json
{
  "totalRequested": 3,
  "successCount": 2,
  "failureCount": 1,
  "deletedIds": [
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002"
  ],
  "failures": [
    {
      "scenarioId": "550e8400-e29b-41d4-a716-446655440003",
      "reason": "Scenario not found"
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Bulk delete completed (check response for individual results)
- `400 Bad Request` - Empty list or exceeds maximum

---

## Dataset Management

### Update Dataset

Update an existing dataset's metadata or records.

**Endpoint:** `PUT /api/v1/datasets/{datasetId}`

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `datasetId` | String | Dataset UUID |

**Request Body:**
```json
{
  "name": "Updated Dataset Name",
  "description": "Updated description",
  "records": [
    {"field1": "value1", "field2": "value2"},
    {"field1": "value3", "field2": "value4"}
  ],
  "tags": ["production", "customer-data"],
  "status": "ACTIVE"
}
```

**Notes:**
- All fields are optional (partial update supported)
- Updating `records` also updates `recordCount` automatically
- Version is incremented on each update

**Headers:**

| Header | Required | Description |
|--------|----------|-------------|
| `X-User-ID` | No | User ID for audit tracking |
| `X-Correlation-ID` | No | Correlation ID for request tracing |

**Response:**
```json
{
  "id": "dataset-uuid",
  "name": "Updated Dataset Name",
  "description": "Updated description",
  "factType": "CustomerDiscount",
  "status": "ACTIVE",
  "recordCount": 2,
  "tags": ["production", "customer-data"],
  "version": 2,
  "createdAt": "2025-01-10T08:00:00Z",
  "updatedAt": "2025-01-15T10:30:00Z",
  "createdBy": "john.doe",
  "lastModifiedBy": "jane.smith"
}
```

**Status Codes:**
- `200 OK` - Dataset updated successfully
- `404 Not Found` - Dataset not found
- `409 Conflict` - Version conflict or state conflict

---

## Simulation Management

### Cancel Simulation

Cancel a running or pending simulation.

**Endpoint:** `DELETE /api/v1/simulations/{simulationId}/cancel`

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `simulationId` | String | Simulation UUID |

**Headers:**

| Header | Required | Description |
|--------|----------|-------------|
| `X-User-ID` | No | User ID for audit tracking |
| `X-Correlation-ID` | No | Correlation ID for request tracing |

**Request:**
```http
DELETE /api/v1/simulations/550e8400-e29b-41d4-a716-446655440000/cancel HTTP/1.1
Host: localhost:8081
X-User-ID: john.doe
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Bulk Customer Validation",
  "status": "CANCELLED",
  "completedAt": "2025-01-15T10:30:00Z",
  "message": "Simulation cancelled by user"
}
```

**Constraints:**
- Can only cancel simulations with status PENDING or RUNNING
- COMPLETED, FAILED, or already CANCELLED simulations cannot be cancelled

**Status Codes:**
- `200 OK` - Simulation cancelled successfully
- `404 Not Found` - Simulation not found
- `409 Conflict` - Simulation cannot be cancelled (wrong status)

---

## Error Handling

All endpoints return structured error responses:

```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Detailed error message",
  "path": "/api/v1/statistics/trends"
}
```

### Common Error Codes

| Status Code | Error | Common Causes |
|-------------|-------|---------------|
| 400 | Bad Request | Invalid parameters, validation failures |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Operation conflicts with current state |
| 500 | Internal Server Error | Unexpected server errors |
| 503 | Service Unavailable | External service (Rule Inspector) unavailable |

---

## Common Headers

### Request Headers

| Header | Required | Description | Example |
|--------|----------|-------------|---------|
| `Content-Type` | Yes (for POST/PUT) | Request body format | `application/json` |
| `Accept` | No | Desired response format | `application/json` |
| `X-User-ID` | No | User identifier for audit | `john.doe` |
| `X-Correlation-ID` | No | Request tracing ID | `a1b2c3d4-e5f6-7890` |

### Response Headers

| Header | Description |
|--------|-------------|
| `Content-Type` | Response format (always `application/json`) |
| `X-Correlation-ID` | Echoed correlation ID if provided |

---

## Usage Examples

### cURL Examples

**Get Statistics Overview:**
```bash
curl -X GET "http://localhost:8081/api/v1/statistics/overview" \
  -H "Accept: application/json"
```

**Get Weekly Trends:**
```bash
curl -X GET "http://localhost:8081/api/v1/statistics/trends?days=7" \
  -H "Accept: application/json"
```

**Get Schema for Fact Type:**
```bash
curl -X GET "http://localhost:8081/api/v1/schemas/CustomerDiscount" \
  -H "Accept: application/json"
```

**Generate Sample Data:**
```bash
curl -X GET "http://localhost:8081/api/v1/schemas/CustomerDiscount/sample?count=5&seed=12345" \
  -H "Accept: application/json"
```

**Bulk Delete Scenarios:**
```bash
curl -X DELETE "http://localhost:8081/api/v1/scenarios/bulk" \
  -H "Content-Type: application/json" \
  -H "X-User-ID: admin" \
  -d '{"scenarioIds": ["id1", "id2", "id3"]}'
```

**Cancel Simulation:**
```bash
curl -X DELETE "http://localhost:8081/api/v1/simulations/simulation-uuid/cancel" \
  -H "X-User-ID: admin"
```

**Update Dataset:**
```bash
curl -X PUT "http://localhost:8081/api/v1/datasets/dataset-uuid" \
  -H "Content-Type: application/json" \
  -H "X-User-ID: admin" \
  -d '{"name": "Updated Name", "status": "ACTIVE"}'
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-15 | Initial release with statistics, schema, and bulk operation endpoints |

---

## Support

For issues or questions:
- **GitHub Issues:** https://github.com/anthropics/claude-code/issues
- **API Documentation (Swagger UI):** http://localhost:8081/swagger-ui.html
- **Health Check:** http://localhost:8081/api/actuator/health
