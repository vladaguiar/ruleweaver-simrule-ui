// API Response Types based on SimRule API OpenAPI 3.0.1 specification

// ============================================
// Common Types
// ============================================

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

// ============================================
// Assertion Types
// ============================================

export interface AssertionDto {
  fieldPath: string;
  operator: string;
  expectedValue: unknown;
  description?: string;
}

export interface AssertionResultDto {
  description?: string;
  fieldPath: string;
  operator: string;
  expectedValue: unknown;
  actualValue: unknown;
  passed: boolean;
  failureMessage?: string;
}

// ============================================
// Expected Result Types
// ============================================

export interface ExpectedResultDto {
  validationPassed?: boolean;
  rulesFired?: string[];
  expectedFields?: Record<string, unknown>;
  expectedErrors?: string[];
}

// ============================================
// Scenario Types
// ============================================

export type ScenarioStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED';

export interface CreateScenarioRequest {
  name: string;
  description?: string;
  ruleSet: string;
  factType: string;
  testData: Record<string, unknown>;
  expectedResult?: ExpectedResultDto;
  assertions?: AssertionDto[];
  tags?: string[];
  datasetId?: string;
}

export interface UpdateScenarioRequest {
  name?: string;
  description?: string;
  ruleSet?: string;
  factType?: string;
  testData?: Record<string, unknown>;
  expectedResult?: ExpectedResultDto;
  assertions?: AssertionDto[];
  tags?: string[];
  status?: ScenarioStatus;
  datasetId?: string;
}

export interface ScenarioResponse {
  id: string;
  name: string;
  description?: string;
  ruleSet: string;
  factType: string;
  testData: Record<string, unknown>;
  expectedResult?: ExpectedResultDto;
  assertions?: AssertionDto[];
  tags?: string[];
  status: ScenarioStatus;
  version: number;
  parentScenarioId?: string;
  datasetId?: string;
  executionCount: number;
  lastExecutionAt?: string;
  successRate?: number;
  createdBy: string;
  lastModifiedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScenarioFilters {
  status?: ScenarioStatus;
  ruleSet?: string;
}

// ============================================
// Simulation Types
// ============================================

export type SimulationStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type ExecutionMode = 'SEQUENTIAL' | 'PARALLEL';

export interface ExecuteSimulationRequest {
  name?: string;
  description?: string;
  scenarioIds: string[];
  executionMode?: ExecutionMode;
  concurrency?: number;
  timeoutSeconds?: number;
  correlationId?: string;
}

export interface ScenarioExecutionDto {
  scenarioId: string;
  scenarioName: string;
  success: boolean;
  validationResponse?: Record<string, unknown>;
  assertionResults?: AssertionResultDto[];
  startedAt?: string;
  completedAt?: string;
  durationMs: number;
  errorMessage?: string;
  rulesFired?: string[];
}

export interface ExecutionMetricsDto {
  totalScenarios: number;
  scenariosPassed: number;
  scenariosFailed: number;
  successRate: number;
  totalDurationMs: number;
  averageDurationMs: number;
  totalAssertions: number;
  assertionsPassed: number;
  assertionsFailed: number;
  assertionSuccessRate: number;
}

export interface SimulationResponse {
  id: string;
  name?: string;
  description?: string;
  executionMode: ExecutionMode;
  status: SimulationStatus;
  scenarioIds: string[];
  scenarioExecutions?: ScenarioExecutionDto[];
  metrics?: ExecutionMetricsDto;
  correlationId?: string;
  executedBy: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  errorMessage?: string;
}

export interface SimulationFilters {
  status?: SimulationStatus;
}

// ============================================
// WebSocket Types
// ============================================

export type WebSocketMessageType =
  | 'PROGRESS'
  | 'SCENARIO_COMPLETE'
  | 'SIMULATION_COMPLETE'
  | 'ERROR';

export interface SimulationProgressMessage {
  type: 'PROGRESS';
  simulationId: string;
  percentage: number;
  completedScenarios: number;
  totalScenarios: number;
  currentScenario?: string;
}

export interface ScenarioCompleteMessage {
  type: 'SCENARIO_COMPLETE';
  simulationId: string;
  scenarioId: string;
  scenarioName: string;
  status: 'PASSED' | 'FAILED' | 'ERROR';
  durationMs: number;
  errorMessage?: string;
}

export interface SimulationCompleteMessage {
  type: 'SIMULATION_COMPLETE';
  simulationId: string;
  status: SimulationStatus;
  passRate: number;
  totalDurationMs: number;
}

export interface SimulationErrorMessage {
  type: 'ERROR';
  simulationId: string;
  message: string;
}

export type SimulationWebSocketMessage =
  | SimulationProgressMessage
  | ScenarioCompleteMessage
  | SimulationCompleteMessage
  | SimulationErrorMessage;

// ============================================
// Dataset Types
// ============================================

export type DatasetFormat = 'JSON' | 'CSV' | 'EXCEL';
export type DatasetStatus = 'ACTIVE' | 'ARCHIVED';

export interface NumericRangeDto {
  min: number;
  max: number;
  avg: number;
  stdDev?: number;
}

export interface DatasetStatisticsDto {
  fieldNames?: string[];
  fieldTypes?: Record<string, string>;
  nullCounts?: Record<string, number>;
  uniqueValueCounts?: Record<string, number>;
  numericRanges?: Record<string, NumericRangeDto>;
}

export interface UploadDatasetRequest {
  name: string;
  description?: string;
  factType: string;
  format: DatasetFormat;
  records: Record<string, unknown>[];
  tags?: string[];
}

export interface DatasetResponse {
  id: string;
  name: string;
  description?: string;
  factType: string;
  format: DatasetFormat;
  records: Record<string, unknown>[];
  recordCount: number;
  status: DatasetStatus;
  version: number;
  statistics?: DatasetStatisticsDto;
  tags?: string[];
  usageCount: number;
  usedByScenarios?: string[];
  createdBy: string;
  lastModifiedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DatasetFilters {
  factType?: string;
  status?: DatasetStatus;
}

// ============================================
// Coverage Types
// ============================================

export interface RuleCoverageDto {
  ruleName: string;
  ruleDescription?: string;
  executionCount: number;
  lastExecutedAt?: string;
  scenarioIds?: string[];
  successRate?: number;
  metadata?: Record<string, unknown>;
}

export interface CoverageMetricsDto {
  totalRules: number;
  rulesTested: number;
  rulesUntested: number;
  coveragePercentage: number;
  totalScenarios: number;
  totalSimulations: number;
  avgRuleExecutions?: number;
}

export interface CoverageTrendDto {
  timestamp: string;
  coveragePercentage: number;
  rulesTested: number;
  scenarioCount: number;
}

export interface CoverageReportResponse {
  id: string;
  ruleSet: string;
  generatedAt: string;
  metrics: CoverageMetricsDto;
  testedRules: RuleCoverageDto[];
  untestedRules: RuleCoverageDto[];
  trends?: CoverageTrendDto[];
  generatedBy: string;
  simulationIds?: string[];
  periodFrom?: string;
  periodTo?: string;
}

// ============================================
// Dashboard Types
// ============================================

export interface DashboardStats {
  totalScenarios: number;
  activeSimulations: number;
  coveragePercentage: number;
  recentRuns: number;
  passedRuns: number;
}

export interface RecentSimulation {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'warning';
  duration: string;
  results: string;
  executedAt: string;
}

// ============================================
// Health Check Types
// ============================================

export interface HealthStatus {
  status: 'UP' | 'DOWN' | 'UNKNOWN';
  components?: Record<string, {
    status: 'UP' | 'DOWN' | 'UNKNOWN';
    details?: Record<string, unknown>;
  }>;
}

// ============================================
// Settings Types
// ============================================

export interface AppSettings {
  apiBaseUrl: string;
  wsBaseUrl: string;
  defaultRuleSet?: string;
  defaultPageSize: number;
  autoRefreshInterval: number;
  theme: 'light' | 'dark' | 'auto';
  defaultExecutionMode: ExecutionMode;
  scenarioTimeoutSeconds: number;
  maxConcurrentScenarios: number;
  editorTheme: 'vs-light' | 'vs-dark' | 'hc-black';
  tableDensity: 'compact' | 'standard' | 'comfortable';
}
