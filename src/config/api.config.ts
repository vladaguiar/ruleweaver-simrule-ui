// API Configuration for SimRule UI

export interface ApiConfig {
  baseUrl: string;
  wsBaseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

// Get environment variables with fallbacks
const getEnvVar = (key: keyof ImportMetaEnv, defaultValue: string): string => {
  return import.meta.env[key] ?? defaultValue;
};

// Development configuration
const developmentConfig: ApiConfig = {
  baseUrl: 'http://localhost:8081/api/v1',
  wsBaseUrl: 'ws://localhost:8081/ws',
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
};

// Production configuration
const productionConfig: ApiConfig = {
  baseUrl: getEnvVar('VITE_API_BASE_URL', 'https://simrule-api.example.com/api/v1'),
  wsBaseUrl: getEnvVar('VITE_WS_BASE_URL', 'wss://simrule-api.example.com/ws'),
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 2000,
};

// Docker configuration
const dockerConfig: ApiConfig = {
  baseUrl: 'http://simrule-api:8081/api/v1',
  wsBaseUrl: 'ws://simrule-api:8081/ws',
  timeout: 15000,
  retryAttempts: 3,
  retryDelay: 1000,
};

// Get current environment
const getEnvironment = (): 'development' | 'production' | 'docker' => {
  const mode = getEnvVar('MODE', 'development');
  if (mode === 'docker') return 'docker';
  if (mode === 'production') return 'production';
  return 'development';
};

// Export current configuration based on environment
export const getApiConfig = (): ApiConfig => {
  const env = getEnvironment();
  switch (env) {
    case 'production':
      return productionConfig;
    case 'docker':
      return dockerConfig;
    default:
      return developmentConfig;
  }
};

// Export default config
export const apiConfig = getApiConfig();

// API Endpoints
export const API_ENDPOINTS = {
  // Scenarios
  SCENARIOS: '/scenarios',
  SCENARIO_BY_ID: (id: string) => `/scenarios/${id}`,
  SCENARIO_CLONE: (id: string) => `/scenarios/${id}/clone`,
  SCENARIOS_BULK_DELETE: '/scenarios/bulk',

  // Simulations
  SIMULATIONS: '/simulations',
  SIMULATION_BY_ID: (id: string) => `/simulations/${id}`,
  SIMULATION_CANCEL: (id: string) => `/simulations/${id}/cancel`,

  // Datasets
  DATASETS: '/datasets',
  DATASET_BY_ID: (id: string) => `/datasets/${id}`,

  // Coverage
  COVERAGE: (ruleSet: string) => `/coverage/${ruleSet}`,
  COVERAGE_LATEST: (ruleSet: string) => `/coverage/${ruleSet}/latest`,

  // Statistics
  STATISTICS_ACTIVITY: '/statistics/activity',
  STATISTICS_OVERVIEW: '/statistics/overview',
  STATISTICS_TRENDS: '/statistics/trends',

  // Schemas
  SCHEMAS: '/schemas',
  SCHEMA_BY_FACT_TYPE: (factType: string) => `/schemas/${encodeURIComponent(factType)}`,
  SCHEMA_SAMPLE: (factType: string) => `/schemas/${encodeURIComponent(factType)}/sample`,

  // Rule Sets
  RULE_SETS: '/rules/sets',

  // Health - actuator is under /api not /api/v1
  HEALTH: '/actuator/health',
  METRICS: '/actuator/metrics',
} as const;

// Actuator base URL (Spring Boot actuators are under /api)
export const getActuatorBaseUrl = (): string => {
  // Strip /v1 to get the /api URL for Spring Boot actuators
  // Actuator endpoints are at /api/actuator/health, not /actuator/health
  return apiConfig.baseUrl.replace('/v1', '');
};

// WebSocket Endpoints
export const WS_ENDPOINTS = {
  SIMULATION: (simulationId: string) => `/simulations/${simulationId}`,
} as const;

// Request Headers
export const getDefaultHeaders = (correlationId?: string, userId?: string): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (correlationId) {
    headers['X-Correlation-ID'] = correlationId;
  } else {
    headers['X-Correlation-ID'] = crypto.randomUUID();
  }

  if (userId) {
    headers['X-User-ID'] = userId;
  } else {
    headers['X-User-ID'] = 'system';
  }

  return headers;
};
