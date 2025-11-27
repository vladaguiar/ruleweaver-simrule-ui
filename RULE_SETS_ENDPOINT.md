# Rule Sets Endpoint API Documentation

## Overview

The Rule Sets endpoint provides a paginated list of available rule sets from Rule Inspector. This endpoint proxies requests to the Rule Inspector service and is optimized for frontend dropdown and progressive scrolling use cases.

## Endpoint Details

| Property | Value |
|----------|-------|
| **URL** | `GET /api/v1/rules/sets` |
| **Method** | GET |
| **Authentication** | Required (production profile) |
| **Content-Type** | `application/json` |

## Request Parameters

### Query Parameters

| Parameter | Type | Required | Default | Min | Max | Description |
|-----------|------|----------|---------|-----|-----|-------------|
| `page` | integer | No | 0 | 0 | - | Page number (0-indexed) |
| `size` | integer | No | 100 | 1 | 1000 | Number of rule sets per page |

## Response Format

### Success Response (200 OK)

Returns a paginated response containing rule set metadata.

```json
{
  "ruleSets": [
    {
      "ruleSetId": "commercial-lines-underwriting",
      "ruleCount": 6,
      "lastUpdated": "2024-01-15T10:30:00Z",
      "version": 2,
      "active": true,
      "description": null,
      "environment": null
    },
    {
      "ruleSetId": "personal-lines-auto",
      "ruleCount": 12,
      "lastUpdated": "2024-01-14T15:45:00Z",
      "version": 3,
      "active": true,
      "description": null,
      "environment": null
    }
  ],
  "totalCount": 4,
  "page": 0,
  "size": 100,
  "hasMore": false
}
```

### Response Fields

#### Root Object

| Field | Type | Description |
|-------|------|-------------|
| `ruleSets` | array | List of rule set metadata objects |
| `totalCount` | integer | Total number of distinct rule sets available |
| `page` | integer | Current page number (0-indexed) |
| `size` | integer | Number of items per page |
| `hasMore` | boolean | Indicates if more pages are available (for progressive scrolling) |

#### RuleSet Object

| Field | Type | Description |
|-------|------|-------------|
| `ruleSetId` | string | Unique identifier for the rule set |
| `ruleCount` | integer | Number of rules in this set |
| `lastUpdated` | string (ISO 8601) | Timestamp of most recent rule update |
| `version` | integer | Maximum version number across all rules in the set |
| `active` | boolean | True if at least one rule in the set is active |
| `description` | string | Rule set description (may be null) |
| `environment` | string | Environment designation (may be null) |

### Error Response (503 Service Unavailable)

Returned when the Rule Inspector service is unavailable or unreachable.

```json
{
  "error": "Service Unavailable",
  "message": "Unable to connect to Rule Inspector",
  "status": 503
}
```

### Error Response (500 Internal Server Error)

Returned when an unexpected server error occurs.

```json
{
  "error": "Internal Server Error",
  "message": "Failed to retrieve rule sets",
  "status": 500
}
```

## Usage Examples

### Get All Rule Sets (Default Pagination)

Retrieves the first page with 100 rule sets (default settings).

```bash
curl -X GET "http://localhost:8081/api/v1/rules/sets"
```

### Get Rule Sets with Custom Page Size

Retrieves 10 rule sets per page for a compact dropdown.

```bash
curl -X GET "http://localhost:8081/api/v1/rules/sets?page=0&size=10"
```

### Progressive Scrolling (Load More)

Retrieves the second page of results.

```bash
curl -X GET "http://localhost:8081/api/v1/rules/sets?page=1&size=10"
```

### Load All Rule Sets at Once

Retrieves all rule sets in a single request (useful for small datasets).

```bash
curl -X GET "http://localhost:8081/api/v1/rules/sets?size=1000"
```

## Frontend Integration Example (React)

### Basic Dropdown Component

```jsx
import React, { useState, useEffect } from 'react';

function RuleSetDropdown({ value, onChange }) {
  const [ruleSets, setRuleSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/v1/rules/sets')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load rule sets');
        }
        return response.json();
      })
      .then(data => {
        setRuleSets(data.ruleSets);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <span>Loading...</span>;
  if (error) return <span>Error: {error}</span>;

  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select a rule set...</option>
      {ruleSets.map(ruleSet => (
        <option key={ruleSet.ruleSetId} value={ruleSet.ruleSetId}>
          {ruleSet.ruleSetId} ({ruleSet.ruleCount} rules)
        </option>
      ))}
    </select>
  );
}

export default RuleSetDropdown;
```

### Progressive Scrolling Example

```jsx
import React, { useState, useCallback } from 'react';

function RuleSetList() {
  const [ruleSets, setRuleSets] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/v1/rules/sets?page=${page}&size=10`);
      const data = await response.json();

      setRuleSets(prev => [...prev, ...data.ruleSets]);
      setHasMore(data.hasMore);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Failed to load rule sets:', error);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore]);

  return (
    <div>
      <ul>
        {ruleSets.map(ruleSet => (
          <li key={ruleSet.ruleSetId}>
            {ruleSet.ruleSetId} - {ruleSet.ruleCount} rules
            {ruleSet.active && <span className="badge">Active</span>}
          </li>
        ))}
      </ul>
      {hasMore && (
        <button onClick={loadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}

export default RuleSetList;
```

## Architecture Notes

### Data Flow

```
Frontend SPA → SimRule API → Rule Inspector
     ↑                            ↓
     └─────────── Response ───────┘
```

1. Frontend sends GET request to SimRule API (`/api/v1/rules/sets`)
2. SimRule API proxies request to Rule Inspector (`/api/v1/rules/sets`)
3. Rule Inspector queries MongoDB for rule set metadata
4. Response flows back through SimRule API to frontend

### Rule Inspector Endpoint

This endpoint proxies to the Rule Inspector service:

- **Rule Inspector URL**: `http://localhost:8000/api/v1/rules/sets`
- **Configuration**: `ruleweaver.rule-inspector.url` property

### Error Handling

The endpoint returns:
- **200 OK**: Rule sets retrieved successfully
- **503 Service Unavailable**: Rule Inspector is unreachable or returned an error
- **500 Internal Server Error**: Unexpected server error

### Caching

Currently, no caching is implemented. Each request queries Rule Inspector directly. Consider adding Redis caching in production for improved performance.

## OpenAPI Specification

The endpoint is fully documented in the OpenAPI specification. Access Swagger UI at:

- **Local Development**: `http://localhost:8081/swagger-ui.html`
- **Docker Environment**: `http://localhost:8081/swagger-ui.html`

## Related Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/schemas` | List all fact type schemas |
| `GET /api/v1/scenarios` | List test scenarios |
| `POST /api/v1/simulations` | Execute rule simulations |
