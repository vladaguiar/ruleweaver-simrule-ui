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
  // Data-driven testing fields
  /** If true, scenario uses dataset records instead of testData */
  useDataset?: boolean;
  /** Maps dataset fields to fact type fields */
  fieldMappings?: FieldMapping[];
  /** Dataset field to use as record identifier in results */
  recordIdentifierField?: string;
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
  // Data-driven testing fields
  /** If true, scenario uses dataset records instead of testData */
  useDataset?: boolean;
  /** Maps dataset fields to fact type fields */
  fieldMappings?: FieldMapping[];
  /** Dataset field to use as record identifier in results */
  recordIdentifierField?: string;
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
  // Data-driven testing fields
  /** If true, scenario uses dataset records instead of testData */
  useDataset?: boolean;
  /** Maps dataset fields to fact type fields */
  fieldMappings?: FieldMapping[];
  /** Dataset field to use as record identifier in results */
  recordIdentifierField?: string;
  /** Resolved dataset name for display */
  datasetName?: string;
  /** Number of records in linked dataset */
  datasetRecordCount?: number;
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
  // Data-driven execution fields
  /** True if this was a data-driven execution */
  dataDriven?: boolean;
  /** Dataset ID used for data-driven execution */
  datasetId?: string;
  /** Number of records processed */
  totalRecords?: number;
  /** Number of records that passed */
  recordsPassed?: number;
  /** Number of records that failed */
  recordsFailed?: number;
  /** Per-record execution results */
  recordExecutions?: RecordExecutionResult[];
  /** Fact object after rule execution (shows rule modifications) */
  modifiedFact?: Record<string, unknown>;
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
  // Data-driven metrics
  /** Count of data-driven scenarios executed */
  dataDrivenScenarios?: number;
  /** Total records across all data-driven scenarios */
  totalRecordsProcessed?: number;
  /** Records that passed validation */
  totalRecordsPassed?: number;
  /** Records that failed validation */
  totalRecordsFailed?: number;
  /** Success rate for data-driven records (0.0 - 1.0) */
  recordSuccessRate?: number;
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
  ruleId: string;  // NEW: Direct field (was in metadata)
  ruleName: string;
  ruleDescription: string | null;
  covered: boolean;  // NEW: Indicates if rule is tested
  executionCount: number;
  lastExecutedAt: string | null;
  scenarioIds: string[];
}

// CoverageMetricsDto interface removed - no longer used in v2.0 API

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
  generatedBy: string;
  // All metrics now at root level (flat structure)
  totalRules: number;  // Was: metrics.totalRules
  testedRules: number;  // Was: metrics.rulesTested (TYPE CHANGE: array → integer)
  untestedRules: number;  // Was: metrics.rulesUntested (TYPE CHANGE: array → integer)
  coveragePercentage: number;  // Was: metrics.coveragePercentage
  totalScenarios: number;  // Was: metrics.totalScenarios
  totalSimulations: number;  // Was: metrics.totalSimulations
  avgRuleExecutions: number;  // Was: metrics.avgRuleExecutions
  // New combined array replacing separate testedRules/untestedRules arrays
  ruleCoverage: RuleCoverageDto[];  // NEW: Combined array with covered boolean
  simulationIds: string[];
  periodFrom: string;
  periodTo: string;
  // Note: trends array removed - use separate trends endpoint
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
  autoSaveInterval: number;
  theme: 'light' | 'dark' | 'auto';
  defaultExecutionMode: ExecutionMode;
  scenarioTimeoutSeconds: number;
  maxConcurrentScenarios: number;
  editorTheme: 'vs-light' | 'vs-dark' | 'hc-black';
  tableDensity: 'compact' | 'standard' | 'comfortable';
}

// ============================================
// Simulation Cancellation Types
// ============================================

export interface CancellationResponse {
  id: string;
  name?: string;
  status: SimulationStatus;
  completedAt?: string;
  message?: string;
}

// ============================================
// Dataset Update Types
// ============================================

export interface UpdateDatasetRequest {
  name?: string;
  description?: string;
  records?: Record<string, unknown>[];
  tags?: string[];
  status?: DatasetStatus;
}

// ============================================
// Statistics Types
// ============================================

export type TrendDirection = 'UP' | 'DOWN' | 'STABLE';

export interface TrendDataPoint {
  date: string;
  simulations: number;
  scenarios: number;
  successRate: number;
  avgExecutionTime: number;
}

export interface TrendSummary {
  totalSimulations: number;
  totalScenarios: number;
  avgSuccessRate: number;
  trend: TrendDirection;
  percentageChange: number;
}

export interface TrendsResponse {
  period: string;
  dataPoints: TrendDataPoint[];
  summary: TrendSummary;
}

export interface OverviewResponse {
  totalScenarios: number;
  activeScenarios: number;
  totalSimulations: number;
  simulationsToday: number;
  runningSimulations: number;
  overallSuccessRate: number;
  todaySuccessRate: number;
  totalDatasets: number;
  activeDatasets: number;
  statusBreakdown: Record<SimulationStatus, number>;
  lastSimulationAt?: string;
  avgExecutionTimeMs: number;
  totalScenariosExecuted: number;
  totalScenariosPassed: number;
}

export interface DailyActivity {
  date: string;
  tests: number;
  passed: number;
}

// ============================================
// Bulk Delete Types
// ============================================

export interface BulkDeleteRequest {
  scenarioIds: string[];
}

export interface BulkDeleteFailure {
  scenarioId: string;
  reason: string;
}

export interface BulkDeleteResponse {
  totalRequested: number;
  successCount: number;
  failureCount: number;
  deletedIds: string[];
  failures: BulkDeleteFailure[];
}

// ============================================
// Schema Types
// ============================================

export interface FieldConstraints {
  pattern?: string;
  allowedValues?: string[];
  min?: number;
  max?: number;
}

export interface FieldDefinition {
  name: string;
  type: string;
  description?: string;
  required: boolean;
  exampleValue?: unknown;
  constraints?: FieldConstraints;
}

export interface SchemaMetadata {
  source: string;
  retrievedAt: string;
  version?: string;
}

export interface FactTypeSchema {
  factType: string;
  displayName?: string;
  description?: string;
  packageName?: string;
  fields: FieldDefinition[];
  associatedRuleSets?: string[];
  fieldCount: number;
  requiredFieldCount: number;
  metadata?: SchemaMetadata;
}

export interface SampleDataResponse {
  factType: string;
  sampleData: Record<string, unknown>;
  variations?: Record<string, unknown>[];
  count: number;
  seed?: number;
  generatedAt: string;
  notes?: string;
}

// ============================================
// Rule Set Types
// ============================================

export interface RuleSetInfo {
  ruleSetId: string;
  ruleCount: number;
  lastUpdated: string;
  version: number;
  active: boolean;
  description: string | null;
  environment: string | null;
}

export interface RuleSetsResponse {
  ruleSets: RuleSetInfo[];
  totalCount: number;
  page: number;
  size: number;
  hasMore: boolean;
}

export interface RuleInfo {
  ruleId: string;
  ruleName: string;
  ruleSet: string;
  agendaGroup?: string;
  salience?: number;
  enabled: boolean;
  version?: number;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
}

// ============================================
// Data-Driven Testing Types
// ============================================

/**
 * Field mapping configuration for data-driven scenarios.
 * Maps dataset fields to fact type fields with optional transformations.
 */
export interface FieldMapping {
  /** Source field name in dataset record */
  datasetField: string;
  /** Target field name in fact type */
  factField: string;
  /** Optional data type transformation */
  transformation?: 'STRING' | 'INTEGER' | 'LONG' | 'DOUBLE' | 'BOOLEAN' | 'DATE';
  /** Optional default value if source field is null/missing */
  defaultValue?: unknown;
}

/**
 * Dataset field information for schema display
 */
export interface DatasetFieldInfo {
  name: string;
  inferredType: 'STRING' | 'INTEGER' | 'DOUBLE' | 'BOOLEAN' | 'OBJECT' | 'ARRAY';
  sampleValues: unknown[];
  nullable: boolean;
}

/**
 * Dataset schema response containing field information
 */
export interface DatasetSchemaResponse {
  datasetId: string;
  factType: string;
  fields: DatasetFieldInfo[];
  recordCount: number;
}

/**
 * Result of executing a scenario against a single dataset record
 */
export interface RecordExecutionResult {
  /** 0-based position in dataset */
  recordIndex: number;
  /** Record identifier (from recordIdentifierField or index) */
  recordId: string;
  /** Original dataset record */
  originalRecord?: Record<string, unknown>;
  /** Transformed fact data sent to Rule Inspector */
  inputData?: Record<string, unknown>;
  /** Whether this record passed validation */
  success: boolean;
  /** Rule Inspector response */
  validationResponse?: Record<string, unknown>;
  /** Assertion results for this record */
  assertionResults?: AssertionResultDto[];
  /** Rules that fired for this record */
  rulesFired?: string[];
  /** Execution time in milliseconds */
  durationMs?: number;
  /** Error message if failed */
  errorMessage?: string;
  /** Fact object after rule execution (shows rule modifications) */
  modifiedFact?: Record<string, unknown>;
}

/**
 * Detailed rule execution result from validationResponse.results
 */
export interface RuleExecutionResult {
  /** Rule identifier (e.g., "RULE_004") */
  ruleId: string;
  /** Full rule name (e.g., "RULE_004 - Risk Category Assignment") */
  ruleName: string;
  /** Execution status */
  status: 'APPLIED' | 'PASSED' | 'FAILED' | 'SKIPPED' | 'ERROR';
  /** Execution message */
  message: string;
  /** Execution time in milliseconds */
  executionTimeMs?: number;
  /** Rule priority/salience */
  priority?: number;
  /** ISO timestamp when rule executed */
  executedAt: string;
  /** Key-value outputs from rule */
  outputs?: Record<string, unknown>;
  /** Agenda group if applicable */
  agendaGroup?: string;
}

/**
 * Request for scenario preview (dry run)
 */
export interface ScenarioPreviewRequest {
  /** Maximum number of records to preview */
  maxRecords?: number;
  /** Specific record indices to preview */
  recordIndices?: number[];
}

/**
 * Response from scenario preview
 */
export interface ScenarioPreviewResponse {
  scenarioId: string;
  previewResults: RecordExecutionResult[];
  totalRecords: number;
  previewCount: number;
}
