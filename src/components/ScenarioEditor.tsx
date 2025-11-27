import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Save, X, Play, ArrowLeft, Plus, Trash2, AlertCircle, CheckCircle, Clock, Keyboard, Wand2 } from 'lucide-react';
import { useScenario } from '@/hooks/useScenarios';
import { useRuleSets } from '@/hooks/useRuleSets';
import { useSchemas } from '@/hooks/useSchemas';
import { scenarioService, simulationService, schemaService, type ValidationError } from '@/services';
import { MonacoJsonEditor } from '@/components/ui/MonacoJsonEditor';
import { RuleMultiSelect } from '@/components/ui/RuleMultiSelect';
import type { FactTypeSchema } from '@/types/api.types';
import { useAppContext } from '@/contexts/AppContext';
import { useKeyboardShortcuts, formatShortcut } from '@/hooks/useKeyboardShortcuts';
import type {
  CreateScenarioRequest,
  UpdateScenarioRequest,
  AssertionDto,
  ExpectedResultDto,
  ScenarioStatus,
} from '@/types/api.types';

// Auto-save storage key prefix
const AUTO_SAVE_KEY_PREFIX = 'simrule_scenario_autosave_';

interface ScenarioEditorProps {
  scenarioId?: string;
  onNavigate: (page: string, params?: { scenarioId?: string; simulationId?: string }) => void;
  onSave: () => void;
  onCancel: () => void;
}

const ASSERTION_OPERATORS = [
  { value: 'EQUALS', label: 'Equals' },
  { value: 'NOT_EQUALS', label: 'Not Equals' },
  { value: 'GREATER_THAN', label: 'Greater Than' },
  { value: 'GREATER_THAN_OR_EQUALS', label: 'Greater Than or Equals' },
  { value: 'LESS_THAN', label: 'Less Than' },
  { value: 'LESS_THAN_OR_EQUALS', label: 'Less Than or Equals' },
  { value: 'CONTAINS', label: 'Contains' },
  { value: 'NOT_CONTAINS', label: 'Not Contains' },
  { value: 'IS_NULL', label: 'Is Null' },
  { value: 'IS_NOT_NULL', label: 'Is Not Null' },
];

// Interface for auto-saved data
interface AutoSaveData {
  name: string;
  description: string;
  ruleSet: string;
  factType: string;
  testDataJson: string;
  tags: string[];
  expectedRulesFired: string[];
  expectedValidationPassed: boolean;
  assertions: AssertionDto[];
  savedAt: number;
}

export function ScenarioEditor({ scenarioId, onNavigate, onSave, onCancel }: ScenarioEditorProps) {
  const isEditing = !!scenarioId;
  const { scenario, loading: loadingScenario, error: loadError } = useScenario(scenarioId || null);
  const { settings } = useAppContext();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ruleSet, setRuleSet] = useState('');
  const [factType, setFactType] = useState('');
  const [testDataJson, setTestDataJson] = useState('{\n  \n}');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [expectedRulesFired, setExpectedRulesFired] = useState<string[]>([]);
  const [expectedValidationPassed, setExpectedValidationPassed] = useState(true);
  const [assertions, setAssertions] = useState<AssertionDto[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState<'metadata' | 'testdata' | 'expected' | 'assertions'>('metadata');
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonValidationErrors, setJsonValidationErrors] = useState<string[]>([]);

  // Schema validation state
  const [schema, setSchema] = useState<FactTypeSchema | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaValidationErrors, setSchemaValidationErrors] = useState<ValidationError[]>([]);
  const [generatingSample, setGeneratingSample] = useState(false);

  // Auto-save state
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);
  const [recoveredData, setRecoveredData] = useState<AutoSaveData | null>(null);
  const initialLoadRef = useRef(true);
  const autoSaveIntervalRef = useRef<number | null>(null);

  // Available rule sets from Rule Inspector API
  const { ruleSetIds: availableRuleSets, loading: ruleSetsLoading } = useRuleSets();

  // Available schemas from Rule Inspector API
  const { schemas, factTypes, loading: schemasLoading, error: schemasError, getRuleSetsForFactType } = useSchemas();

  // Filtered rule sets based on selected fact type
  const [filteredRuleSets, setFilteredRuleSets] = useState<string[]>([]);

  // Get auto-save key for current scenario
  const autoSaveKey = useMemo(() => {
    return `${AUTO_SAVE_KEY_PREFIX}${scenarioId || 'new'}`;
  }, [scenarioId]);

  // Current form data for comparison and saving
  const currentFormData = useMemo((): AutoSaveData => ({
    name,
    description,
    ruleSet,
    factType,
    testDataJson,
    tags,
    expectedRulesFired,
    expectedValidationPassed,
    assertions,
    savedAt: Date.now(),
  }), [name, description, ruleSet, factType, testDataJson, tags, expectedRulesFired, expectedValidationPassed, assertions]);

  // Check for auto-saved data on mount
  useEffect(() => {
    const savedData = localStorage.getItem(autoSaveKey);
    if (savedData) {
      try {
        const parsed: AutoSaveData = JSON.parse(savedData);
        // Only show recovery if data is less than 24 hours old
        const ageInHours = (Date.now() - parsed.savedAt) / (1000 * 60 * 60);
        if (ageInHours < 24 && parsed.name) {
          setRecoveredData(parsed);
          setShowRecoveryPrompt(true);
        } else {
          // Clear old auto-save data
          localStorage.removeItem(autoSaveKey);
        }
      } catch {
        localStorage.removeItem(autoSaveKey);
      }
    }
  }, [autoSaveKey]);

  // Auto-save to localStorage
  const performAutoSave = useCallback(() => {
    if (!hasUnsavedChanges) return;

    try {
      localStorage.setItem(autoSaveKey, JSON.stringify(currentFormData));
      setLastAutoSave(new Date());
    } catch (err) {
      console.error('Auto-save failed:', err);
    }
  }, [autoSaveKey, currentFormData, hasUnsavedChanges]);

  // Set up auto-save interval (default 30 seconds)
  useEffect(() => {
    const interval = settings?.autoSaveInterval ?? 30000;

    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
    }

    autoSaveIntervalRef.current = window.setInterval(performAutoSave, interval);

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [performAutoSave, settings?.autoSaveInterval]);

  // Track unsaved changes
  useEffect(() => {
    if (initialLoadRef.current) return;
    setHasUnsavedChanges(true);
  }, [name, description, ruleSet, factType, testDataJson, tags, expectedRulesFired, expectedValidationPassed, assertions]);

  // Warn about unsaved changes on navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Clear auto-save after successful save
  const clearAutoSave = useCallback(() => {
    localStorage.removeItem(autoSaveKey);
    setHasUnsavedChanges(false);
    setLastAutoSave(null);
  }, [autoSaveKey]);

  // Recover auto-saved data
  const recoverAutoSave = useCallback(() => {
    if (recoveredData) {
      setName(recoveredData.name);
      setDescription(recoveredData.description);
      setRuleSet(recoveredData.ruleSet);
      setFactType(recoveredData.factType);
      setTestDataJson(recoveredData.testDataJson);
      setTags(recoveredData.tags);
      setExpectedRulesFired(recoveredData.expectedRulesFired);
      setExpectedValidationPassed(recoveredData.expectedValidationPassed);
      setAssertions(recoveredData.assertions);
      setHasUnsavedChanges(true);
    }
    setShowRecoveryPrompt(false);
    setRecoveredData(null);
  }, [recoveredData]);

  // Discard auto-saved data
  const discardAutoSave = useCallback(() => {
    localStorage.removeItem(autoSaveKey);
    setShowRecoveryPrompt(false);
    setRecoveredData(null);
  }, [autoSaveKey]);

  // Show keyboard shortcuts hint
  const [showShortcutsHint, setShowShortcutsHint] = useState(false);

  // Keyboard shortcuts
  const shortcuts = useMemo(() => [
    {
      key: 's',
      ctrl: true,
      action: () => handleSaveRef.current?.('DRAFT'),
      description: 'Save Draft',
    },
    {
      key: 'Enter',
      ctrl: true,
      action: () => {
        if (isEditing && scenarioId) {
          handleTestRunRef.current?.();
        }
      },
      description: 'Test Run',
      enabled: isEditing,
    },
    {
      key: 's',
      ctrl: true,
      shift: true,
      action: () => handleSaveRef.current?.('ACTIVE'),
      description: 'Save & Activate',
    },
    {
      key: '?',
      shift: true,
      action: () => setShowShortcutsHint(prev => !prev),
      description: 'Toggle Shortcuts Help',
    },
  ], [isEditing, scenarioId]);

  // Refs for handlers to avoid stale closures in shortcuts
  const handleSaveRef = useRef<((status: ScenarioStatus) => Promise<void>) | null>(null);
  const handleTestRunRef = useRef<(() => Promise<void>) | null>(null);

  useKeyboardShortcuts({ shortcuts });

  // Load scenario data when editing
  useEffect(() => {
    if (scenario) {
      setName(scenario.name);
      setDescription(scenario.description || '');
      setRuleSet(scenario.ruleSet);
      setFactType(scenario.factType);
      setTestDataJson(JSON.stringify(scenario.testData, null, 2));
      setTags(scenario.tags || []);
      setExpectedRulesFired(scenario.expectedResult?.rulesFired || []);
      setExpectedValidationPassed(scenario.expectedResult?.validationPassed ?? true);
      setAssertions(scenario.assertions || []);
      // Mark initial load as complete after loading scenario data
      setTimeout(() => {
        initialLoadRef.current = false;
      }, 100);
    }
  }, [scenario]);

  // Mark initial load complete for new scenarios
  useEffect(() => {
    if (!isEditing && !loadingScenario) {
      setTimeout(() => {
        initialLoadRef.current = false;
      }, 100);
    }
  }, [isEditing, loadingScenario]);

  // Load schema when factType changes
  useEffect(() => {
    if (!factType.trim()) {
      setSchema(null);
      setSchemaValidationErrors([]);
      return;
    }

    const abortController = new AbortController();
    setSchemaLoading(true);

    const loadSchema = async () => {
      try {
        const fetchedSchema = await schemaService.getSchema(factType, { signal: abortController.signal });
        if (!abortController.signal.aborted) {
          setSchema(fetchedSchema);
          // Re-validate test data with new schema
          if (fetchedSchema && testDataJson) {
            try {
              const data = JSON.parse(testDataJson);
              const errors = schemaService.validateData(data, fetchedSchema);
              setSchemaValidationErrors(errors);
            } catch {
              // JSON parse error handled elsewhere
            }
          } else {
            setSchemaValidationErrors([]);
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.error('Failed to load schema:', error);
        if (!abortController.signal.aborted) {
          setSchema(null);
          setSchemaValidationErrors([]);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setSchemaLoading(false);
        }
      }
    };
    loadSchema();

    return () => {
      abortController.abort();
    };
  }, [factType, testDataJson]);

  // Filter rule sets based on selected fact type
  useEffect(() => {
    if (!factType.trim()) {
      // No fact type selected: show all rule sets
      setFilteredRuleSets(availableRuleSets);
      return;
    }

    // Get associated rule sets for the selected fact type
    const associatedRuleSets = getRuleSetsForFactType(factType);

    if (associatedRuleSets.length === 0) {
      // No associations defined: show all rule sets (graceful degradation)
      setFilteredRuleSets(availableRuleSets);
    } else {
      // Filter to only show associated rule sets that exist
      const filtered = availableRuleSets.filter(rs => associatedRuleSets.includes(rs));
      setFilteredRuleSets(filtered);
    }
  }, [factType, schemas, availableRuleSets, getRuleSetsForFactType]);

  // Clear rule set if it becomes invalid for the selected fact type
  useEffect(() => {
    if (ruleSet && filteredRuleSets.length > 0 && !filteredRuleSets.includes(ruleSet)) {
      // Current rule set is not compatible with selected fact type
      setRuleSet('');
    }
  }, [filteredRuleSets, ruleSet]);

  // Clear expected rules when rule set changes
  useEffect(() => {
    setExpectedRulesFired([]);
  }, [ruleSet]);

  // Validate test data against schema when JSON changes
  const validateAgainstSchema = useCallback((json: string) => {
    if (!schema || !json) {
      setSchemaValidationErrors([]);
      return;
    }
    try {
      const data = JSON.parse(json);
      const errors = schemaService.validateData(data, schema);
      setSchemaValidationErrors(errors);
    } catch {
      // JSON parse error handled by validateJson
      setSchemaValidationErrors([]);
    }
  }, [schema]);

  // Generate sample data from schema
  const handleGenerateSample = async () => {
    if (!factType.trim()) {
      setError('Please specify a Fact Type first');
      setActiveTab('metadata');
      return;
    }

    setGeneratingSample(true);
    setError(null);

    try {
      const sampleResponse = await schemaService.getSampleData(factType);
      if (sampleResponse?.sampleData) {
        const formattedJson = JSON.stringify(sampleResponse.sampleData, null, 2);
        setTestDataJson(formattedJson);
        validateAgainstSchema(formattedJson);
        setSuccess('Sample data generated successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Sample data generation not available for this fact type');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate sample data');
    } finally {
      setGeneratingSample(false);
    }
  };

  // Validate JSON
  const validateJson = (json: string): boolean => {
    try {
      JSON.parse(json);
      setJsonError(null);
      return true;
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : 'Invalid JSON');
      return false;
    }
  };

  // Handle Monaco editor validation callback
  const handleJsonValidation = useCallback((isValid: boolean, errors: string[]) => {
    setJsonValidationErrors(errors);
    if (isValid) {
      setJsonError(null);
    } else if (errors.length > 0) {
      setJsonError(errors[0]);
    }
  }, []);

  // Handle JSON content change from Monaco
  const handleJsonChange = useCallback((newValue: string) => {
    setTestDataJson(newValue);
    // Trigger schema validation on JSON change
    validateAgainstSchema(newValue);
  }, [validateAgainstSchema]);

  // Handle save
  const handleSave = async (status: ScenarioStatus = 'DRAFT') => {
    setError(null);
    setSuccess(null);

    // Validate required fields
    if (!name.trim()) {
      setError('Name is required');
      setActiveTab('metadata');
      return;
    }
    if (!ruleSet.trim()) {
      setError('Rule Set is required');
      setActiveTab('metadata');
      return;
    }
    if (!factType.trim()) {
      setError('Fact Type is required');
      setActiveTab('metadata');
      return;
    }
    if (!validateJson(testDataJson)) {
      setError('Test data contains invalid JSON');
      setActiveTab('testdata');
      return;
    }

    setSaving(true);

    try {
      const expectedResult: ExpectedResultDto = {
        validationPassed: expectedValidationPassed,
        rulesFired: expectedRulesFired,
      };

      if (isEditing && scenarioId) {
        const updateRequest: UpdateScenarioRequest = {
          name,
          description: description || undefined,
          ruleSet,
          factType,
          testData: JSON.parse(testDataJson),
          expectedResult,
          assertions,
          tags,
          status,
        };
        await scenarioService.update(scenarioId, updateRequest);
        setSuccess('Scenario updated successfully');
      } else {
        const createRequest: CreateScenarioRequest = {
          name,
          description: description || undefined,
          ruleSet,
          factType,
          testData: JSON.parse(testDataJson),
          expectedResult,
          assertions,
          tags,
        };
        const created = await scenarioService.create(createRequest);

        // If status is ACTIVE, update it
        if (status === 'ACTIVE') {
          await scenarioService.activate(created.id);
        }

        setSuccess('Scenario created successfully');
      }

      // Clear auto-save after successful save
      clearAutoSave();

      setTimeout(() => {
        onSave();
      }, 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save scenario');
    } finally {
      setSaving(false);
    }
  };

  // Handle test run
  const handleTestRun = async () => {
    if (!isEditing || !scenarioId) {
      setError('Please save the scenario first before running a test');
      return;
    }

    setRunning(true);
    setError(null);

    try {
      const simulation = await simulationService.executeScenario(scenarioId, `Test Run: ${name}`);
      setSuccess('Test run started');
      setTimeout(() => {
        onNavigate('results', { simulationId: simulation.id });
      }, 500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start test run');
    } finally {
      setRunning(false);
    }
  };

  // Update refs for keyboard shortcuts
  useEffect(() => {
    handleSaveRef.current = handleSave;
    handleTestRunRef.current = handleTestRun;
  });

  // Tag management
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  // Rule management
  const removeRule = (rule: string) => {
    setExpectedRulesFired(expectedRulesFired.filter((r) => r !== rule));
  };

  // Assertion management
  const addAssertion = () => {
    setAssertions([
      ...assertions,
      { fieldPath: '', operator: 'EQUALS', expectedValue: '', description: '' },
    ]);
  };

  const updateAssertion = (index: number, field: keyof AssertionDto, value: unknown) => {
    const updated = [...assertions];
    updated[index] = { ...updated[index], [field]: value };
    setAssertions(updated);
  };

  const removeAssertion = (index: number) => {
    setAssertions(assertions.filter((_, i) => i !== index));
  };

  if (loadingScenario) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
        <span className="ml-2" style={{ color: 'var(--color-text-secondary)' }}>Loading scenario...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle size={48} style={{ color: 'var(--color-error)' }} />
        <p className="mt-4" style={{ color: 'var(--color-error)' }}>{loadError}</p>
        <button
          onClick={onCancel}
          className="mt-4 px-4 py-2 border rounded hover:bg-[var(--color-surface)] transition-colors"
          style={{ borderColor: 'var(--color-border)' }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Auto-Save Recovery Prompt */}
      {showRecoveryPrompt && recoveredData && (
        <div
          className="p-4 rounded-lg flex items-center justify-between"
          style={{ backgroundColor: '#FFF3E0', border: '1px solid #FFB74D' }}
        >
          <div className="flex items-center gap-3">
            <Clock size={20} style={{ color: '#F57C00' }} />
            <div>
              <p style={{ fontWeight: 500, color: '#E65100', fontSize: '14px' }}>
                Unsaved changes found
              </p>
              <p style={{ fontSize: '12px', color: '#8D6E63' }}>
                Auto-saved {new Date(recoveredData.savedAt).toLocaleString()}
                {recoveredData.name && ` - "${recoveredData.name}"`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={discardAutoSave}
              className="px-3 py-1.5 text-sm rounded hover:bg-[#FFE0B2] transition-colors"
              style={{ color: '#E65100' }}
            >
              Discard
            </button>
            <button
              onClick={recoverAutoSave}
              className="px-3 py-1.5 text-sm rounded text-white transition-colors"
              style={{ backgroundColor: '#F57C00' }}
            >
              Recover
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-[var(--color-surface)] rounded transition-colors"
          >
            <ArrowLeft size={24} style={{ color: 'var(--color-primary)' }} />
          </button>
          <div>
            <h1>{isEditing ? 'Edit Scenario' : 'Create Scenario'}</h1>
            {/* Auto-save status indicator */}
            <div className="flex items-center gap-2 mt-1">
              {hasUnsavedChanges && (
                <span
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: '#FFF3E0', color: '#F57C00' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                  Unsaved changes
                </span>
              )}
              {lastAutoSave && (
                <span
                  className="inline-flex items-center gap-1 text-xs"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <Clock size={12} />
                  Auto-saved {lastAutoSave.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowShortcutsHint(prev => !prev)}
            className="p-2 border rounded hover:bg-[var(--color-surface)] transition-colors"
            style={{ borderColor: 'var(--color-border)' }}
            title="Keyboard Shortcuts (Shift+?)"
          >
            <Keyboard size={18} style={{ color: showShortcutsHint ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} />
          </button>
          {isEditing && (
            <button
              onClick={handleTestRun}
              disabled={running}
              className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50"
              style={{ borderColor: 'var(--color-border)', fontSize: '14px' }}
              title={`Test Run (${formatShortcut({ key: 'Enter', ctrl: true })})`}
            >
              <Play size={18} className={running ? 'animate-pulse' : ''} />
              Test Run
            </button>
          )}
          <button
            onClick={() => handleSave('DRAFT')}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50"
            style={{ borderColor: 'var(--color-border)', fontSize: '14px' }}
            title={`Save Draft (${formatShortcut({ key: 'S', ctrl: true })})`}
          >
            <Save size={18} />
            Save Draft
          </button>
          <button
            onClick={() => handleSave('ACTIVE')}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-[var(--color-accent)] text-white rounded hover:bg-[#FC7857] transition-colors disabled:opacity-50"
            style={{ fontSize: '14px', fontWeight: 500 }}
            title={`Save & Activate (${formatShortcut({ key: 'S', ctrl: true, shift: true })})`}
          >
            <CheckCircle size={18} />
            {isEditing ? 'Save & Activate' : 'Create & Activate'}
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Hint */}
      {showShortcutsHint && (
        <div
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Keyboard size={18} style={{ color: 'var(--color-primary)' }} />
              <h4 style={{ color: 'var(--color-text-primary)', fontSize: '14px', fontWeight: 600 }}>
                Keyboard Shortcuts
              </h4>
            </div>
            <button
              onClick={() => setShowShortcutsHint(false)}
              className="p-1 rounded hover:bg-[var(--color-background)] transition-colors"
            >
              <X size={16} style={{ color: 'var(--color-text-secondary)' }} />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2">
              <kbd
                className="px-2 py-1 rounded text-xs font-mono"
                style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              >
                {formatShortcut({ key: 'S', ctrl: true })}
              </kbd>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Save Draft</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd
                className="px-2 py-1 rounded text-xs font-mono"
                style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              >
                {formatShortcut({ key: 'S', ctrl: true, shift: true })}
              </kbd>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Save & Activate</span>
            </div>
            {isEditing && (
              <div className="flex items-center gap-2">
                <kbd
                  className="px-2 py-1 rounded text-xs font-mono"
                  style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                >
                  {formatShortcut({ key: 'Enter', ctrl: true })}
                </kbd>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Test Run</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <kbd
                className="px-2 py-1 rounded text-xs font-mono"
                style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              >
                {formatShortcut({ key: 'F', ctrl: true, shift: true })}
              </kbd>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Format JSON</span>
            </div>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="p-4 rounded flex items-center gap-2" style={{ backgroundColor: '#FFEBEE', color: 'var(--color-error)' }}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 rounded flex items-center gap-2" style={{ backgroundColor: '#E8F5E9', color: '#1B5E20' }}>
          <CheckCircle size={20} />
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-[var(--color-background)] rounded-lg overflow-visible" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
        <div className="flex border-b" style={{ borderColor: 'var(--color-border)' }}>
          {[
            { id: 'metadata', label: 'Metadata' },
            { id: 'testdata', label: 'Test Data' },
            { id: 'expected', label: 'Expected Results' },
            { id: 'assertions', label: 'Assertions' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className="px-6 py-4 transition-all"
              style={{
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                borderBottom: activeTab === tab.id ? '3px solid var(--color-primary)' : 'none',
                backgroundColor: activeTab === tab.id ? 'var(--color-surface)' : 'transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Metadata Tab */}
          {activeTab === 'metadata' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                  Name <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter scenario name"
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                  style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                />
              </div>

              <div>
                <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description"
                  rows={3}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                  style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                />
              </div>

              {/* Fact Type Field - NOW FIRST */}
              <div>
                <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                  Fact Type <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <select
                  value={factType}
                  onChange={(e) => setFactType(e.target.value)}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                  style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                  disabled={schemasLoading}
                >
                  <option value="">Select a fact type</option>
                  {factType && !factTypes.includes(factType) && (
                    <option key={factType} value={factType}>
                      {factType} (Not in schema registry)
                    </option>
                  )}
                  {factTypes.map((ft) => {
                    const schema = schemas.find(s => s.factType === ft);
                    const displayLabel = schema?.displayName || ft;
                    return (
                      <option key={ft} value={ft}>
                        {displayLabel}
                      </option>
                    );
                  })}
                </select>
                {schemasLoading && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    Loading fact types...
                  </p>
                )}
                {schemasError && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>
                    Failed to load fact types: {schemasError}
                  </p>
                )}
              </div>

              {/* Rule Set Field - NOW SECOND */}
              <div>
                <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                  Rule Set <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <select
                  value={ruleSet}
                  onChange={(e) => setRuleSet(e.target.value)}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                  style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                  disabled={ruleSetsLoading || !factType}
                >
                  <option value="">Select a rule set</option>
                  {filteredRuleSets.map((rs) => (
                    <option key={rs} value={rs}>{rs}</option>
                  ))}
                </select>
                {!factType && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    Select a fact type first to see compatible rule sets
                  </p>
                )}
                {factType && filteredRuleSets.length === 0 && !ruleSetsLoading && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    All rule sets available (no specific associations defined)
                  </p>
                )}
              </div>

              <div>
                <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                  Tags
                </label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full"
                      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', fontSize: '12px' }}
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)}>
                        <X size={14} style={{ color: 'var(--color-text-secondary)' }} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add a tag"
                    className="flex-1 px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                  />
                  <button
                    onClick={addTag}
                    className="px-4 py-2 border rounded hover:bg-[var(--color-surface)] transition-colors"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Test Data Tab */}
          {activeTab === 'testdata' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                  Test Data (JSON) <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <div className="flex items-center gap-3">
                  {jsonError && (
                    <span className="text-sm" style={{ color: 'var(--color-error)' }}>{jsonError}</span>
                  )}
                  <button
                    onClick={handleGenerateSample}
                    disabled={generatingSample || !factType.trim()}
                    className="flex items-center gap-2 px-3 py-1.5 border rounded hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ borderColor: 'var(--color-border)', fontSize: '13px' }}
                    title={factType.trim() ? 'Generate sample data based on fact type schema' : 'Please specify a Fact Type first'}
                  >
                    <Wand2 size={16} className={generatingSample ? 'animate-pulse' : ''} />
                    {generatingSample ? 'Generating...' : 'Generate Sample'}
                  </button>
                </div>
              </div>
              <MonacoJsonEditor
                value={testDataJson}
                onChange={handleJsonChange}
                onValidate={handleJsonValidation}
                height={400}
              />
              {jsonValidationErrors.length > 1 && (
                <div className="p-3 rounded" style={{ backgroundColor: '#FFEBEE' }}>
                  <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-error)', marginBottom: '4px' }}>
                    Validation Errors:
                  </p>
                  <ul className="list-disc list-inside">
                    {jsonValidationErrors.slice(0, 5).map((err, idx) => (
                      <li key={idx} style={{ fontSize: '12px', color: 'var(--color-error)' }}>{err}</li>
                    ))}
                    {jsonValidationErrors.length > 5 && (
                      <li style={{ fontSize: '12px', color: 'var(--color-error)' }}>
                        ...and {jsonValidationErrors.length - 5} more errors
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Schema Validation Section */}
              {schema && (
                <div className="p-3 rounded" style={{ backgroundColor: '#E3F2FD', border: '1px solid #90CAF9' }}>
                  <div className="flex items-center justify-between mb-2">
                    <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-primary)' }}>
                      Schema: {schema.factType}
                    </p>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                      {schema.fieldCount} fields ({schema.requiredFieldCount} required)
                    </span>
                  </div>
                  {schemaValidationErrors.length > 0 ? (
                    <div className="mt-2 p-2 rounded" style={{ backgroundColor: '#FFF3E0', border: '1px solid #FFB74D' }}>
                      <p style={{ fontSize: '11px', fontWeight: 500, color: '#E65100', marginBottom: '4px' }}>
                        Schema Validation Issues:
                      </p>
                      <ul className="list-disc list-inside">
                        {schemaValidationErrors.slice(0, 5).map((err, idx) => (
                          <li key={idx} style={{ fontSize: '11px', color: '#E65100' }}>
                            <strong>{err.field}:</strong> {err.message}
                          </li>
                        ))}
                        {schemaValidationErrors.length > 5 && (
                          <li style={{ fontSize: '11px', color: '#E65100' }}>
                            ...and {schemaValidationErrors.length - 5} more issues
                          </li>
                        )}
                      </ul>
                    </div>
                  ) : (
                    <p style={{ fontSize: '11px', color: '#1B5E20' }}>
                      ✓ Test data validates against schema
                    </p>
                  )}
                </div>
              )}

              {schemaLoading && (
                <div className="p-3 rounded flex items-center gap-2" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Loading schema for {factType}...</span>
                </div>
              )}

              {!schema && !schemaLoading && factType && (
                <div className="p-3 rounded" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    No schema available for "{factType}". Test data will not be validated against a schema.
                  </p>
                </div>
              )}

              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Enter the test data as a JSON object. This data will be passed to the rule engine.
                Use <kbd style={{ backgroundColor: 'var(--color-surface)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>Ctrl+Shift+F</kbd> to format the JSON.
              </p>
            </div>
          )}

          {/* Expected Results Tab */}
          {activeTab === 'expected' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                  Expected Validation Result
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={expectedValidationPassed}
                      onChange={() => setExpectedValidationPassed(true)}
                      style={{ accentColor: 'var(--color-primary)' }}
                    />
                    <span style={{ fontSize: '14px' }}>Pass (Valid)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!expectedValidationPassed}
                      onChange={() => setExpectedValidationPassed(false)}
                      style={{ accentColor: 'var(--color-primary)' }}
                    />
                    <span style={{ fontSize: '14px' }}>Fail (Invalid)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                  Expected Rules to Fire
                </label>

                {/* Multi-select dropdown */}
                <RuleMultiSelect
                  ruleSet={ruleSet}
                  value={expectedRulesFired}
                  onChange={setExpectedRulesFired}
                  disabled={!ruleSet}
                  placeholder="Select expected rules..."
                />

                {/* Selected rules display (chips/tags) */}
                {expectedRulesFired.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {expectedRulesFired.map((rule) => (
                      <span
                        key={rule}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full"
                        style={{ backgroundColor: '#E3F2FD', color: 'var(--color-primary)', fontSize: '12px' }}
                      >
                        {rule}
                        <button
                          onClick={() => removeRule(rule)}
                          className="hover:opacity-70 transition-opacity"
                          aria-label={`Remove ${rule}`}
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Helper text when no rule set selected */}
                {!ruleSet && (
                  <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                    Select a rule set first to choose expected rules
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Assertions Tab */}
          {activeTab === 'assertions' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                  Define assertions to validate specific field values after rule execution.
                </p>
                <button
                  onClick={addAssertion}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded hover:bg-[#1D4261] transition-colors"
                  style={{ fontSize: '14px' }}
                >
                  <Plus size={18} />
                  Add Assertion
                </button>
              </div>

              {assertions.length === 0 ? (
                <div className="text-center py-8 border rounded" style={{ borderColor: 'var(--color-border)', borderStyle: 'dashed' }}>
                  <p style={{ color: 'var(--color-text-muted)' }}>No assertions defined. Click "Add Assertion" to create one.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assertions.map((assertion, index) => (
                    <div
                      key={index}
                      className="p-4 rounded border"
                      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                          Assertion #{index + 1}
                        </span>
                        <button onClick={() => removeAssertion(index)}>
                          <Trash2 size={18} style={{ color: 'var(--color-error)' }} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block mb-1" style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            Field Path
                          </label>
                          <input
                            type="text"
                            value={assertion.fieldPath}
                            onChange={(e) => updateAssertion(index, 'fieldPath', e.target.value)}
                            placeholder="e.g., result.discount"
                            className="w-full px-3 py-2 border rounded"
                            style={{ borderColor: 'var(--color-border)', fontSize: '14px' }}
                          />
                        </div>
                        <div>
                          <label className="block mb-1" style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            Operator
                          </label>
                          <select
                            value={assertion.operator}
                            onChange={(e) => updateAssertion(index, 'operator', e.target.value)}
                            className="w-full px-3 py-2 border rounded"
                            style={{ borderColor: 'var(--color-border)', fontSize: '14px' }}
                          >
                            {ASSERTION_OPERATORS.map((op) => (
                              <option key={op.value} value={op.value}>{op.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block mb-1" style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            Expected Value
                          </label>
                          <input
                            type="text"
                            value={String(assertion.expectedValue || '')}
                            onChange={(e) => updateAssertion(index, 'expectedValue', e.target.value)}
                            placeholder="Expected value"
                            className="w-full px-3 py-2 border rounded"
                            style={{ borderColor: 'var(--color-border)', fontSize: '14px' }}
                          />
                        </div>
                        <div>
                          <label className="block mb-1" style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            Description
                          </label>
                          <input
                            type="text"
                            value={assertion.description || ''}
                            onChange={(e) => updateAssertion(index, 'description', e.target.value)}
                            placeholder="Optional description"
                            className="w-full px-3 py-2 border rounded"
                            style={{ borderColor: 'var(--color-border)', fontSize: '14px' }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
