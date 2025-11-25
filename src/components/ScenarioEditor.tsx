import React, { useState, useEffect } from 'react';
import { Save, X, Play, ArrowLeft, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { useScenario } from '@/hooks/useScenarios';
import { scenarioService, simulationService } from '@/services';
import type {
  CreateScenarioRequest,
  UpdateScenarioRequest,
  AssertionDto,
  ExpectedResultDto,
  ScenarioStatus,
} from '@/types/api.types';

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

export function ScenarioEditor({ scenarioId, onNavigate, onSave, onCancel }: ScenarioEditorProps) {
  const isEditing = !!scenarioId;
  const { scenario, loading: loadingScenario, error: loadError } = useScenario(scenarioId || null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ruleSet, setRuleSet] = useState('');
  const [factType, setFactType] = useState('');
  const [testDataJson, setTestDataJson] = useState('{\n  \n}');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [expectedRulesFired, setExpectedRulesFired] = useState<string[]>([]);
  const [ruleInput, setRuleInput] = useState('');
  const [expectedValidationPassed, setExpectedValidationPassed] = useState(true);
  const [assertions, setAssertions] = useState<AssertionDto[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState<'metadata' | 'testdata' | 'expected' | 'assertions'>('metadata');
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Available rule sets (would come from API)
  const [availableRuleSets] = useState(['customer-validation', 'order-processing', 'pricing-rules', 'account-management', 'shipping-calculation']);

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
    }
  }, [scenario]);

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
  const addRule = () => {
    if (ruleInput.trim() && !expectedRulesFired.includes(ruleInput.trim())) {
      setExpectedRulesFired([...expectedRulesFired, ruleInput.trim()]);
      setRuleInput('');
    }
  };

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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-[var(--color-surface)] rounded transition-colors"
          >
            <ArrowLeft size={24} style={{ color: 'var(--color-primary)' }} />
          </button>
          <h1>{isEditing ? 'Edit Scenario' : 'Create Scenario'}</h1>
        </div>
        <div className="flex items-center gap-2">
          {isEditing && (
            <button
              onClick={handleTestRun}
              disabled={running}
              className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50"
              style={{ borderColor: 'var(--color-border)', fontSize: '14px' }}
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
          >
            <Save size={18} />
            Save Draft
          </button>
          <button
            onClick={() => handleSave('ACTIVE')}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-[var(--color-accent)] text-white rounded hover:bg-[#FC7857] transition-colors disabled:opacity-50"
            style={{ fontSize: '14px', fontWeight: 500 }}
          >
            <CheckCircle size={18} />
            {isEditing ? 'Save & Activate' : 'Create & Activate'}
          </button>
        </div>
      </div>

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
      <div className="bg-[var(--color-background)] rounded-lg overflow-hidden" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
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

              <div>
                <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                  Rule Set <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <select
                  value={ruleSet}
                  onChange={(e) => setRuleSet(e.target.value)}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                  style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                >
                  <option value="">Select a rule set</option>
                  {availableRuleSets.map((rs) => (
                    <option key={rs} value={rs}>{rs}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                  Fact Type <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={factType}
                  onChange={(e) => setFactType(e.target.value)}
                  placeholder="e.g., Customer, Order, Payment"
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                  style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                />
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
                {jsonError && (
                  <span className="text-sm" style={{ color: 'var(--color-error)' }}>{jsonError}</span>
                )}
              </div>
              <textarea
                value={testDataJson}
                onChange={(e) => {
                  setTestDataJson(e.target.value);
                  validateJson(e.target.value);
                }}
                rows={20}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                style={{
                  borderColor: jsonError ? 'var(--color-error)' : 'var(--color-border)',
                  fontSize: '14px',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                  fontFamily: 'monospace',
                }}
              />
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Enter the test data as a JSON object. This data will be passed to the rule engine.
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
                <div className="flex gap-2 mb-2 flex-wrap">
                  {expectedRulesFired.map((rule) => (
                    <span
                      key={rule}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full"
                      style={{ backgroundColor: '#E3F2FD', color: 'var(--color-primary)', fontSize: '12px' }}
                    >
                      {rule}
                      <button onClick={() => removeRule(rule)}>
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ruleInput}
                    onChange={(e) => setRuleInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRule())}
                    placeholder="Enter rule name"
                    className="flex-1 px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                  />
                  <button
                    onClick={addRule}
                    className="px-4 py-2 border rounded hover:bg-[var(--color-surface)] transition-colors"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <Plus size={18} />
                  </button>
                </div>
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
