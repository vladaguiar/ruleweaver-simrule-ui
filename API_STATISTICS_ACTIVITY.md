# Statistics Activity Endpoint API Documentation

## Overview

The Statistics Activity endpoint provides daily simulation activity statistics for dashboard timeline visualization. It aggregates data from the `simulation_results` MongoDB collection to show test execution trends over a configurable time period.

## Endpoint Details

| Property | Value |
|----------|-------|
| **URL** | `GET /api/v1/statistics/activity` |
| **Method** | GET |
| **Authentication** | Required (production profile) |
| **Content-Type** | `application/json` |

## Request Parameters

### Query Parameters

| Parameter | Type | Required | Default | Min | Max | Description |
|-----------|------|----------|---------|-----|-----|-------------|
| `days` | integer | No | 7 | 1 | 30 | Number of days to retrieve statistics for |

## Response Format

### Success Response (200 OK)

Returns an array of daily activity objects ordered chronologically (oldest first, newest last).

```json
[
  { "date": "Mon", "tests": 24, "passed": 22 },
  { "date": "Tue", "tests": 31, "passed": 28 },
  { "date": "Wed", "tests": 28, "passed": 26 },
  { "date": "Thu", "tests": 35, "passed": 32 },
  { "date": "Fri", "tests": 42, "passed": 38 },
  { "date": "Sat", "tests": 18, "passed": 17 },
  { "date": "Sun", "tests": 15, "passed": 15 }
]
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `date` | string | Day of week abbreviation (Mon, Tue, Wed, Thu, Fri, Sat, Sun) |
| `tests` | integer | Total number of scenarios executed on that day |
| `passed` | integer | Number of scenarios that passed on that day |

### Error Response (400 Bad Request)

Returned when the `days` parameter is invalid (less than 1 or greater than 30).

```json
{
  "error": "Bad Request",
  "message": "days parameter must be between 1 and 30",
  "status": 400
}
```

### Error Response (500 Internal Server Error)

Returned when an unexpected server error occurs.

```json
{
  "error": "Internal Server Error",
  "message": "Failed to retrieve activity statistics",
  "status": 500
}
```

## Business Rules

1. **Included Simulation Statuses**: Only simulations with status `COMPLETED`, `FAILED`, or `CANCELLED` are counted. Simulations with status `PENDING` or `RUNNING` are excluded.

2. **Days with Zero Activity**: Days with no simulation activity are included in the response with `tests: 0` and `passed: 0`.

3. **Date Range**: The endpoint returns data starting from `(today - days + 1)` to today, inclusive.

4. **Chronological Order**: Results are always ordered chronologically with the oldest day first and today last.

5. **No Caching**: Data is always queried fresh from the database.

## Usage Examples

### Get Default 7-Day Activity

```bash
curl -X GET "http://localhost:8081/api/v1/statistics/activity"
```

### Get 14-Day Activity

```bash
curl -X GET "http://localhost:8081/api/v1/statistics/activity?days=14"
```

### Get Single Day Activity (Today)

```bash
curl -X GET "http://localhost:8081/api/v1/statistics/activity?days=1"
```

### Get Maximum 30-Day Activity

```bash
curl -X GET "http://localhost:8081/api/v1/statistics/activity?days=30"
```

## Data Source

The endpoint aggregates data from the `simulation_results` MongoDB collection using the following fields:

- `startedAt` or `createdAt` (Instant) - Used to determine which day the simulation belongs to
- `status` (SimulationStatus) - Used to filter simulations (only COMPLETED, FAILED, CANCELLED)
- `metrics.totalScenarios` (Integer) - Summed for the `tests` count
- `metrics.scenariosPassed` (Integer) - Summed for the `passed` count

## OpenAPI/Swagger

This endpoint is fully documented in OpenAPI format and can be viewed in Swagger UI:

```
http://localhost:8081/swagger-ui.html
```

Navigate to the **Statistics** tag to find the endpoint documentation.

## Related Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/simulations` | List all simulation results |
| `GET /api/v1/coverage/{ruleSet}` | Get rule coverage report |
| `GET /api/v1/scenarios` | List all test scenarios |
