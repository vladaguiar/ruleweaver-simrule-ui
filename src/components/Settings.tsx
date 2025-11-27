import React, { useState, useEffect, useCallback } from 'react';
import { Save, User, Bell, Lock, Database, Palette, Server, RefreshCw, CheckCircle, XCircle, AlertCircle, Download, Upload, RotateCcw } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAppContext } from '@/contexts/AppContext';
import { useTheme, Theme } from '@/contexts/ThemeContext';
import { apiService } from '@/services/api.service';
import type { AppSettings, ExecutionMode } from '@/types/api.types';

// Default settings
const DEFAULT_SETTINGS: AppSettings = {
  apiBaseUrl: 'http://localhost:8081/api/v1',
  wsBaseUrl: 'ws://localhost:8081/ws',
  defaultRuleSet: undefined,
  defaultPageSize: 10,
  autoRefreshInterval: 30000,
  autoSaveInterval: 30000,
  theme: 'light',
  defaultExecutionMode: 'SEQUENTIAL',
  scenarioTimeoutSeconds: 60,
  maxConcurrentScenarios: 5,
  editorTheme: 'vs-light',
  tableDensity: 'standard',
};

type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error';

export function Settings() {
  const [activeTab, setActiveTab] = useState('api');
  const [settings, setSettings, resetSettings] = useLocalStorage<AppSettings>('simrule_settings', DEFAULT_SETTINGS);
  const [apiStatus, setApiStatus] = useState<ConnectionStatus>('idle');
  const [apiError, setApiError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const { addNotification } = useAppContext();
  const { theme, setTheme } = useTheme();

  // Form state
  const [formData, setFormData] = useState<AppSettings>(settings);

  // Track changes
  useEffect(() => {
    setHasChanges(JSON.stringify(formData) !== JSON.stringify(settings));
  }, [formData, settings]);

  // Update form field
  const updateField = <K extends keyof AppSettings>(field: K, value: AppSettings[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Save settings
  const handleSave = () => {
    setSettings(formData);
    addNotification({ type: 'success', title: 'Settings Saved', message: 'Settings saved successfully' });
    setHasChanges(false);
  };

  // Reset to defaults
  const handleReset = () => {
    setFormData(DEFAULT_SETTINGS);
    setSettings(DEFAULT_SETTINGS);
    addNotification({ type: 'info', title: 'Settings Reset', message: 'Settings reset to defaults' });
    setHasChanges(false);
  };

  // Test API connection
  const testApiConnection = async () => {
    setApiStatus('testing');
    setApiError(null);

    try {
      // Test health endpoint - actuator is at /api/actuator/health
      const actuatorUrl = formData.apiBaseUrl.replace('/api/v1', '/api');
      const response = await fetch(`${actuatorUrl}/actuator/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'UP') {
          setApiStatus('success');
          addNotification({ type: 'success', title: 'Connection Successful', message: 'SimRule API is healthy and connected' });
        } else {
          setApiStatus('error');
          setApiError(`API status: ${data.status}`);
        }
      } else {
        setApiStatus('error');
        setApiError(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      setApiStatus('error');
      setApiError(err instanceof Error ? err.message : 'Connection failed');
    }
  };

  // Export settings
  const handleExport = () => {
    const content = JSON.stringify(settings, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'simrule-settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addNotification({ type: 'success', title: 'Export Complete', message: 'Settings exported successfully' });
  };

  // Import settings
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string) as Partial<AppSettings>;
        const merged = { ...DEFAULT_SETTINGS, ...imported };
        setFormData(merged);
        setSettings(merged);
        addNotification({ type: 'success', title: 'Import Complete', message: 'Settings imported successfully' });
      } catch (err) {
        addNotification({ type: 'error', title: 'Import Failed', message: 'Invalid settings file' });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const tabs = [
    { id: 'api', label: 'API Configuration', icon: Server },
    { id: 'execution', label: 'Execution', icon: Database },
    { id: 'display', label: 'Display', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 style={{ color: 'var(--color-text-primary)' }}>Settings</h1>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-[var(--color-surface)] transition-colors cursor-pointer" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', fontSize: '14px' }}>
            <Upload size={18} />
            Import
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-[var(--color-surface)] transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', fontSize: '14px' }}
          >
            <Download size={18} />
            Export
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-[var(--color-surface)] transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', fontSize: '14px' }}
          >
            <RotateCcw size={18} />
            Reset
          </button>
        </div>
      </div>

      {/* Tabs and Content */}
      <div className="bg-[var(--color-background)] rounded-lg overflow-hidden" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
        {/* Tabs */}
        <div className="flex border-b overflow-x-auto" style={{ borderColor: 'var(--color-border)' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-b-3'
                    : 'hover:bg-[var(--color-surface)]'
                }`}
                style={{
                  fontSize: '14px',
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  borderBottom: activeTab === tab.id ? '3px solid var(--color-primary)' : 'none',
                }}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* API Configuration Tab */}
          {activeTab === 'api' && (
            <div className="space-y-6 max-w-2xl">
              <div className="flex items-center justify-between">
                <h3 style={{ color: 'var(--color-text-primary)' }}>API Configuration</h3>
                <button
                  onClick={testApiConnection}
                  disabled={apiStatus === 'testing'}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ fontSize: '14px' }}
                >
                  {apiStatus === 'testing' ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <Server size={18} />
                  )}
                  Test Connection
                </button>
              </div>

              {/* Connection Status */}
              {apiStatus !== 'idle' && (
                <div
                  className="flex items-center gap-3 p-4 rounded-lg"
                  style={{
                    backgroundColor: apiStatus === 'success' ? '#E8F5E9' : apiStatus === 'error' ? '#FFEBEE' : '#E3F2FD',
                    border: `1px solid ${apiStatus === 'success' ? 'var(--color-success)' : apiStatus === 'error' ? 'var(--color-error)' : 'var(--color-primary)'}`,
                  }}
                >
                  {apiStatus === 'testing' && <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--color-primary)' }} />}
                  {apiStatus === 'success' && <CheckCircle size={20} style={{ color: 'var(--color-success)' }} />}
                  {apiStatus === 'error' && <XCircle size={20} style={{ color: 'var(--color-error)' }} />}
                  <div>
                    <p style={{ fontWeight: 500, color: apiStatus === 'success' ? 'var(--color-success)' : apiStatus === 'error' ? 'var(--color-error)' : 'var(--color-primary)' }}>
                      {apiStatus === 'testing' && 'Testing connection...'}
                      {apiStatus === 'success' && 'Connection successful'}
                      {apiStatus === 'error' && 'Connection failed'}
                    </p>
                    {apiError && (
                      <p style={{ fontSize: '13px', color: 'var(--color-error)', marginTop: '4px' }}>{apiError}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                    SimRule API Base URL
                  </label>
                  <input
                    type="text"
                    value={formData.apiBaseUrl}
                    onChange={(e) => updateField('apiBaseUrl', e.target.value)}
                    placeholder="http://localhost:8081/api/v1"
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                  />
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    The base URL for the SimRule API server
                  </p>
                </div>

                <div>
                  <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                    WebSocket URL
                  </label>
                  <input
                    type="text"
                    value={formData.wsBaseUrl}
                    onChange={(e) => updateField('wsBaseUrl', e.target.value)}
                    placeholder="ws://localhost:8081/ws"
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                  />
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    WebSocket endpoint for real-time simulation updates
                  </p>
                </div>

                <div>
                  <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                    Default Rule Set
                  </label>
                  <input
                    type="text"
                    value={formData.defaultRuleSet || ''}
                    onChange={(e) => updateField('defaultRuleSet', e.target.value || undefined)}
                    placeholder="e.g., customer-rules"
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                  />
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Pre-selected rule set for new scenarios and simulations
                  </p>
                </div>

                <div className="p-4 bg-[#E3F2FD] rounded" style={{ border: '1px solid var(--color-info)' }}>
                  <div className="flex items-start gap-2">
                    <AlertCircle size={18} style={{ color: 'var(--color-primary)', marginTop: '2px' }} />
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                        Backend Services
                      </p>
                      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        SimRule UI connects to <strong>simrule-api</strong> (port 8081). The API handles all communication with Rule Inspector internally.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Execution Settings Tab */}
          {activeTab === 'execution' && (
            <div className="space-y-6 max-w-2xl">
              <h3 style={{ color: 'var(--color-text-primary)' }}>Execution Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                    Default Execution Mode
                  </label>
                  <select
                    value={formData.defaultExecutionMode}
                    onChange={(e) => updateField('defaultExecutionMode', e.target.value as ExecutionMode)}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                  >
                    <option value="SEQUENTIAL">Sequential</option>
                    <option value="PARALLEL">Parallel</option>
                  </select>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    How scenarios are executed during simulations
                  </p>
                </div>

                <div>
                  <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                    Scenario Timeout (seconds)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={300}
                    value={formData.scenarioTimeoutSeconds}
                    onChange={(e) => updateField('scenarioTimeoutSeconds', parseInt(e.target.value) || 60)}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                  />
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Maximum time allowed for each scenario execution (5-300 seconds)
                  </p>
                </div>

                <div>
                  <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                    Max Concurrent Scenarios
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={formData.maxConcurrentScenarios}
                    onChange={(e) => updateField('maxConcurrentScenarios', parseInt(e.target.value) || 5)}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                  />
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Number of scenarios to run concurrently in parallel mode (1-20)
                  </p>
                </div>

                <div>
                  <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                    Auto-Refresh Interval
                  </label>
                  <select
                    value={formData.autoRefreshInterval}
                    onChange={(e) => updateField('autoRefreshInterval', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                  >
                    <option value={15000}>15 seconds</option>
                    <option value={30000}>30 seconds</option>
                    <option value={60000}>1 minute</option>
                    <option value={120000}>2 minutes</option>
                    <option value={300000}>5 minutes</option>
                    <option value={0}>Disabled</option>
                  </select>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    How often the dashboard automatically refreshes data
                  </p>
                </div>

                <div>
                  <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                    Auto-Save Interval (Scenario Editor)
                  </label>
                  <select
                    value={formData.autoSaveInterval}
                    onChange={(e) => updateField('autoSaveInterval', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                  >
                    <option value={15000}>15 seconds</option>
                    <option value={30000}>30 seconds</option>
                    <option value={60000}>1 minute</option>
                    <option value={120000}>2 minutes</option>
                    <option value={0}>Disabled</option>
                  </select>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    How often scenario editor drafts are auto-saved to browser storage. Auto-saved data can be recovered if browser closes unexpectedly.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Display Settings Tab */}
          {activeTab === 'display' && (
            <div className="space-y-6 max-w-2xl">
              <h3 style={{ color: 'var(--color-text-primary)' }}>Display Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                    Theme
                  </label>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as Theme)}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                  >
                    <option value="light">Light Mode</option>
                    <option value="dark">Dark Mode</option>
                    <option value="auto">Auto (System Default)</option>
                  </select>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    {theme === 'auto' ? 'Theme will follow your system preference' : `Using ${theme} theme`}
                  </p>
                </div>

                <div>
                  <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                    Editor Theme
                  </label>
                  <select
                    value={formData.editorTheme}
                    onChange={(e) => updateField('editorTheme', e.target.value as 'vs-light' | 'vs-dark' | 'hc-black')}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                  >
                    <option value="vs-light">Light</option>
                    <option value="vs-dark">Dark</option>
                    <option value="hc-black">High Contrast</option>
                  </select>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Theme for JSON editors in scenario forms
                  </p>
                </div>

                <div>
                  <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                    Table Density
                  </label>
                  <select
                    value={formData.tableDensity}
                    onChange={(e) => updateField('tableDensity', e.target.value as 'compact' | 'standard' | 'comfortable')}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                  >
                    <option value="compact">Compact</option>
                    <option value="standard">Standard</option>
                    <option value="comfortable">Comfortable</option>
                  </select>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Row spacing in data tables
                  </p>
                </div>

                <div>
                  <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                    Default Page Size
                  </label>
                  <select
                    value={formData.defaultPageSize}
                    onChange={(e) => updateField('defaultPageSize', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                  >
                    <option value={5}>5 items per page</option>
                    <option value={10}>10 items per page</option>
                    <option value={20}>20 items per page</option>
                    <option value={50}>50 items per page</option>
                    <option value={100}>100 items per page</option>
                  </select>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Default number of items shown in paginated tables
                  </p>
                </div>

                <div className="p-6 rounded" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <h5 className="mb-3" style={{ color: 'var(--color-text-primary)' }}>Theme Preview</h5>
                  <div className="space-y-2">
                    <div className="p-3 bg-[var(--color-primary)] text-white rounded">
                      Primary Color: #285A84
                    </div>
                    <div className="p-3 rounded" style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}>
                      Accent Color: #FD9071
                    </div>
                    <div className="p-3 rounded" style={{ backgroundColor: 'var(--color-success)', color: 'white' }}>
                      Success Color
                    </div>
                    <div className="p-3 rounded" style={{ backgroundColor: 'var(--color-error)', color: 'white' }}>
                      Error Color
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 max-w-2xl">
              <h3 style={{ color: 'var(--color-text-primary)' }}>Notification Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[var(--color-surface)] rounded" style={{ border: '1px solid var(--color-border)' }}>
                  <div>
                    <h5 style={{ color: 'var(--color-text-primary)' }}>Browser Notifications</h5>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                      Receive browser notifications for important events
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-[var(--color-surface)] rounded" style={{ border: '1px solid var(--color-border)' }}>
                  <div>
                    <h5 style={{ color: 'var(--color-text-primary)' }}>Simulation Completion</h5>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                      Get notified when simulations complete
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-[var(--color-surface)] rounded" style={{ border: '1px solid var(--color-border)' }}>
                  <div>
                    <h5 style={{ color: 'var(--color-text-primary)' }}>Failed Scenarios</h5>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                      Immediate alerts for failed scenario executions
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-[var(--color-surface)] rounded" style={{ border: '1px solid var(--color-border)' }}>
                  <div>
                    <h5 style={{ color: 'var(--color-text-primary)' }}>Sound Effects</h5>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                      Play sound on notifications
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-2xl">
              <h3 style={{ color: 'var(--color-text-primary)' }}>Profile Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    defaultValue="John Doe"
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    defaultValue="john.doe@tekweaver.com"
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                    Role
                  </label>
                  <input
                    type="text"
                    defaultValue="Senior Test Engineer"
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                    Department
                  </label>
                  <select
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                  >
                    <option>Quality Assurance</option>
                    <option>Engineering</option>
                    <option>Operations</option>
                    <option>Management</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          {hasChanges && (
            <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center justify-between">
                <p style={{ fontSize: '14px', color: 'var(--color-warning)' }}>
                  You have unsaved changes
                </p>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-2 bg-[var(--color-accent)] text-white rounded hover:bg-[#FC7857] transition-colors"
                  style={{ fontSize: '14px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                >
                  <Save size={18} />
                  Save All Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Version Info */}
      <div className="text-center" style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
        SimRule UI v0.1.0 | SimRule API: {formData.apiBaseUrl}
      </div>
    </div>
  );
}
