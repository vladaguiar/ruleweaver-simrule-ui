import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Play, Pause, Square, CheckCircle, XCircle, AlertTriangle, RefreshCw, Search, ChevronDown, ChevronUp, Download, Settings2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useScenarios } from '@/hooks/useScenarios';
import { useDebounce } from '@/hooks/useDebounce';
import { useRuleSets } from '@/hooks/useRuleSets';
import { simulationService, scenarioService } from '@/services';
import { websocketService, type WebSocketStatus, type SimulationWebSocket } from '@/services/websocket.service';
import { useAppContext } from '@/contexts/AppContext';
import type { ScenarioResponse, SimulationResponse, ExecutionMode, SimulationWebSocketMessage } from '@/types/api.types';

interface SimulationRunnerProps {
  onNavigate: (page: string, params?: { scenarioId?: string; simulationId?: string }) => void;
}

interface LogEntry {
  type: 'info' | 'success' | 'error' | 'warning';
  time: string;
  message: string;
  details?: string;
}

export function SimulationRunner({ onNavigate }: SimulationRunnerProps) {
  const { settings, addNotification } = useAppContext();

  // Configuration state
  const [availableScenarios, setAvailableScenarios] = useState<ScenarioResponse[]>([]);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [executionMode, setExecutionMode] = useState<ExecutionMode>(settings.defaultExecutionMode || 'SEQUENTIAL');
  const [concurrency, setConcurrency] = useState<number>(settings.maxConcurrentScenarios || 5);
  const [timeout, setTimeout] = useState<number>(settings.scenarioTimeoutSeconds || 60);
  const [simulationName, setSimulationName] = useState<string>('');

  // Execution state
  const [simulation, setSimulation] = useState<SimulationResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalScenarios, setTotalScenarios] = useState(0);
  const [completedScenarios, setCompletedScenarios] = useState(0);
  const [currentScenario, setCurrentScenario] = useState<string>('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);

  // Results state
  const [results, setResults] = useState({
    pass: 0,
    fail: 0,
    warn: 0,
    total: 0,
  });

  // Log state
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [scenarioSearch, setScenarioSearch] = useState('');
  const debouncedSearch = useDebounce(scenarioSearch, 300); // Debounce search input
  const [ruleSetFilter, setRuleSetFilter] = useState<string>('all');
  const { ruleSetIds: availableRuleSets } = useRuleSets();

  // Timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Simulation ID ref for cleanup (avoids stale closure issues)
  const simulationIdRef = useRef<string | null>(null);

  // Load available scenarios
  useEffect(() => {
    const loadScenarios = async () => {
      setLoading(true);
      try {
        // API returns array directly, not paginated response
        const scenarios = await scenarioService.getAll({ status: 'ACTIVE' });
        setAvailableScenarios(scenarios || []);
      } catch (e) {
        addNotification({
          type: 'error',
          title: 'Failed to Load',
          message: 'Could not load scenarios',
        });
        setAvailableScenarios([]);
      } finally {
        setLoading(false);
      }
    };
    loadScenarios();
  }, [addNotification]);

  // Filter scenarios - memoized to avoid recalculation on every render
  // Uses debounced search value to prevent excessive filtering during typing
  const filteredScenarios = useMemo(() => {
    return availableScenarios.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesRuleSet = ruleSetFilter === 'all' || s.ruleSet === ruleSetFilter;
      return matchesSearch && matchesRuleSet;
    });
  }, [availableScenarios, debouncedSearch, ruleSetFilter]);

  // WebSocket connection ref
  const wsConnectionRef = useRef<SimulationWebSocket | null>(null);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: SimulationWebSocketMessage) => {
    const now = new Date().toLocaleTimeString('en-US', { hour12: false });

    switch (message.type) {
      case 'PROGRESS':
        setProgress(message.percentage || 0);
        setCompletedScenarios(message.completedScenarios || 0);
        if (message.currentScenario) {
          setCurrentScenario(message.currentScenario);
        }
        break;

      case 'SCENARIO_COMPLETE': {
        const status = message.status?.toLowerCase() || 'unknown';
        const logType: LogEntry['type'] = status === 'passed' ? 'success' : status === 'failed' ? 'error' : 'warning';

        setLogs(prev => [...prev, {
          type: logType,
          time: now,
          message: `${message.scenarioName || message.scenarioId}: ${status.toUpperCase()}`,
          details: message.errorMessage,
        }]);

        // Update results
        setResults(prev => ({
          ...prev,
          pass: status === 'passed' ? prev.pass + 1 : prev.pass,
          fail: status === 'failed' ? prev.fail + 1 : prev.fail,
          warn: status === 'warning' ? prev.warn + 1 : prev.warn,
        }));
        break;
      }

      case 'SIMULATION_COMPLETE':
        setIsRunning(false);
        setProgress(100);
        setLogs(prev => [...prev, {
          type: 'info',
          time: now,
          message: `Simulation complete - Pass rate: ${message.passRate?.toFixed(1) || 0}%`,
        }]);
        addNotification({
          type: message.passRate === 100 ? 'success' : message.passRate && message.passRate >= 80 ? 'warning' : 'error',
          title: 'Simulation Complete',
          message: `Pass rate: ${message.passRate?.toFixed(1) || 0}%`,
        });
        stopTimer();
        break;

      case 'ERROR':
        setLogs(prev => [...prev, {
          type: 'error',
          time: now,
          message: message.message || 'An error occurred',
          details: message.errorMessage,
        }]);
        break;
    }

    // Auto-scroll log container
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [addNotification]);

  // Timer functions
  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Cleanup on unmount - use refs to avoid stale closure issues
  useEffect(() => {
    return () => {
      // Always stop timer on unmount
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      // Always disconnect WebSocket on unmount using ref
      if (simulationIdRef.current) {
        websocketService.disconnectFromSimulation(simulationIdRef.current);
        simulationIdRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures cleanup only runs on unmount

  // Start simulation
  const handleStart = async () => {
    if (selectedScenarios.length === 0) {
      addNotification({
        type: 'warning',
        title: 'No Scenarios',
        message: 'Please select at least one scenario to run',
      });
      return;
    }

    // Reset state
    setProgress(0);
    setCompletedScenarios(0);
    setElapsedTime(0);
    setResults({ pass: 0, fail: 0, warn: 0, total: selectedScenarios.length });
    setTotalScenarios(selectedScenarios.length);
    setLogs([{
      type: 'info',
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      message: `Starting simulation with ${selectedScenarios.length} scenarios`,
    }]);

    try {
      setIsRunning(true);
      startTimer();

      const name = simulationName || `Simulation - ${new Date().toLocaleString()}`;
      const response = await simulationService.executeScenarios(
        selectedScenarios,
        {
          name,
          executionMode,
          concurrency,
          timeoutSeconds: timeout,
        }
      );

      setSimulation(response);
      // Store simulation ID in ref for cleanup
      simulationIdRef.current = response.id;

      // Connect WebSocket for real-time updates
      wsConnectionRef.current = websocketService.connectToSimulation(response.id, {
        onMessage: handleWebSocketMessage,
        onStatusChange: (status: WebSocketStatus) => {
          if (status === 'connected') {
            setLogs(prev => [...prev, {
              type: 'info',
              time: new Date().toLocaleTimeString('en-US', { hour12: false }),
              message: 'Connected to simulation progress feed',
            }]);
          } else if (status === 'error') {
            setLogs(prev => [...prev, {
              type: 'warning',
              time: new Date().toLocaleTimeString('en-US', { hour12: false }),
              message: 'WebSocket connection issue - reconnecting...',
            }]);
          }
        },
        onError: (error) => {
          setLogs(prev => [...prev, {
            type: 'error',
            time: new Date().toLocaleTimeString('en-US', { hour12: false }),
            message: 'WebSocket connection error',
          }]);
        }
      });

      // Estimate time based on timeout and scenario count
      const estimatedSeconds = selectedScenarios.length * (executionMode === 'PARALLEL' ? (timeout / concurrency) : timeout);
      setEstimatedTime(Math.min(estimatedSeconds, 600)); // Cap at 10 minutes
    } catch (e) {
      setIsRunning(false);
      stopTimer();
      addNotification({
        type: 'error',
        title: 'Simulation Failed',
        message: e instanceof Error ? e.message : 'Failed to start simulation',
      });
      setLogs(prev => [...prev, {
        type: 'error',
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        message: 'Failed to start simulation',
        details: e instanceof Error ? e.message : undefined,
      }]);
    }
  };

  // Stop simulation
  const handleStop = async () => {
    if (!simulationIdRef.current) return;

    // Confirm cancellation
    const confirmed = window.confirm(
      'Are you sure you want to cancel this simulation? Progress will be lost for remaining scenarios.'
    );

    if (!confirmed) return;

    setIsCancelling(true);

    try {
      const result = await simulationService.cancel(simulationIdRef.current);

      // Disconnect WebSocket
      websocketService.disconnectFromSimulation(simulationIdRef.current);
      simulationIdRef.current = null;
      wsConnectionRef.current = null;

      // Stop timer and update state
      stopTimer();
      setIsRunning(false);
      setIsPaused(false);

      setLogs(prev => [...prev, {
        type: 'warning',
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        message: `Simulation cancelled: ${result.message || 'Cancelled by user'}`,
      }]);

      addNotification({
        type: 'warning',
        title: 'Simulation Cancelled',
        message: result.message || `Simulation was cancelled`,
      });

    } catch (error: unknown) {
      console.error('Failed to cancel simulation:', error);

      // Try to extract status code from error
      const apiError = error as { status?: number; message?: string };

      if (apiError.status === 409) {
        // Simulation already completed or in non-cancellable state
        addNotification({
          type: 'info',
          title: 'Cannot Cancel',
          message: 'Simulation has already completed or is in a non-cancellable state',
        });
      } else if (apiError.status === 404) {
        addNotification({
          type: 'error',
          title: 'Cancel Failed',
          message: 'Simulation not found',
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Cancel Failed',
          message: 'Unable to cancel simulation. It may have already completed.',
        });
      }

      // Still disconnect WebSocket as fallback
      if (simulationIdRef.current) {
        websocketService.disconnectFromSimulation(simulationIdRef.current);
        simulationIdRef.current = null;
      }
      wsConnectionRef.current = null;
      stopTimer();
      setIsRunning(false);
      setIsPaused(false);

      setLogs(prev => [...prev, {
        type: 'error',
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        message: 'Failed to cancel simulation - disconnected from progress feed',
      }]);
    } finally {
      setIsCancelling(false);
    }
  };

  // Export log
  const handleExportLog = () => {
    const logText = logs.map(log =>
      `[${log.type.toUpperCase()}] ${log.time} - ${log.message}${log.details ? `\n    ${log.details}` : ''}`
    ).join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulation-log-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Toggle scenario selection
  const toggleScenario = (id: string) => {
    setSelectedScenarios(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedScenarios.length === filteredScenarios.length) {
      setSelectedScenarios([]);
    } else {
      setSelectedScenarios(filteredScenarios.map(s => s.id));
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = totalScenarios > 0 ? (completedScenarios / totalScenarios) * 100 : 0;

  const pieData = [
    { name: 'Pass', value: results.pass, color: '#C3E770' },
    { name: 'Fail', value: results.fail, color: '#EF6F53' },
    { name: 'Warning', value: results.warn, color: '#F7EA73' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1>Simulation Runner</h1>
        <div className="flex gap-2">
          {isRunning && (
            <>
              <button
                onClick={handleStop}
                disabled={isCancelling}
                className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderColor: 'var(--color-error)', fontSize: '14px', fontWeight: 500, color: 'var(--color-error)' }}
              >
                {isCancelling ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <Square size={18} />
                    Stop
                  </>
                )}
              </button>
            </>
          )}
          {simulation && !isRunning && (
            <button
              onClick={() => onNavigate('results', { simulationId: simulation.id })}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded hover:bg-[#1D4261] transition-colors"
              style={{ fontSize: '14px', fontWeight: 500 }}
            >
              View Results
            </button>
          )}
        </div>
      </div>

      {/* Configuration Card */}
      <div className="bg-[var(--color-background)] rounded-lg p-6" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
        <h3 className="mb-4">Execution Configuration</h3>
        <div className="space-y-4">
          {/* Simulation Name */}
          <div>
            <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
              Simulation Name (Optional)
            </label>
            <input
              type="text"
              value={simulationName}
              onChange={(e) => setSimulationName(e.target.value)}
              placeholder="Enter a name for this simulation"
              disabled={isRunning}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors disabled:opacity-50"
              style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
            />
          </div>

          {/* Scenario Selection */}
          <div>
            <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
              Select Scenarios ({selectedScenarios.length} selected)
            </label>
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={18} style={{ color: 'var(--color-text-muted)' }} />
                <input
                  type="text"
                  value={scenarioSearch}
                  onChange={(e) => setScenarioSearch(e.target.value)}
                  placeholder="Search scenarios..."
                  disabled={isRunning}
                  className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors disabled:opacity-50"
                  style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                />
              </div>
              <select
                value={ruleSetFilter}
                onChange={(e) => setRuleSetFilter(e.target.value)}
                disabled={isRunning}
                className="px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors disabled:opacity-50"
                style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
              >
                <option value="all">All Rule Sets</option>
                {availableRuleSets.map(rs => (
                  <option key={rs} value={rs}>{rs}</option>
                ))}
              </select>
              <button
                onClick={selectAll}
                disabled={isRunning}
                className="px-4 py-2 border rounded hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50"
                style={{ borderColor: 'var(--color-border)', fontSize: '14px', color: 'var(--color-primary)' }}
              >
                {selectedScenarios.length === filteredScenarios.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {/* Scenario List */}
            <div
              className="border rounded max-h-48 overflow-y-auto"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="animate-spin" size={20} style={{ color: 'var(--color-primary)' }} />
                  <span className="ml-2" style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Loading scenarios...</span>
                </div>
              ) : filteredScenarios.length === 0 ? (
                <div className="text-center py-8" style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                  No active scenarios found
                </div>
              ) : (
                filteredScenarios.map(scenario => (
                  <label
                    key={scenario.id}
                    className={`flex items-center gap-3 px-4 py-2 hover:bg-[var(--color-background)] cursor-pointer border-b last:border-b-0 transition-colors ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedScenarios.includes(scenario.id)}
                      onChange={() => toggleScenario(scenario.id)}
                      disabled={isRunning}
                      style={{ accentColor: 'var(--color-primary)' }}
                    />
                    <span style={{ fontSize: '14px', color: 'var(--color-text-primary)', flex: 1 }}>{scenario.name}</span>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{scenario.ruleSet}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Execution Mode */}
          <div>
            <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
              Execution Mode
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  checked={executionMode === 'SEQUENTIAL'}
                  onChange={() => setExecutionMode('SEQUENTIAL')}
                  disabled={isRunning}
                  style={{ accentColor: 'var(--color-primary)' }}
                />
                <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>Sequential</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  checked={executionMode === 'PARALLEL'}
                  onChange={() => setExecutionMode('PARALLEL')}
                  disabled={isRunning}
                  style={{ accentColor: 'var(--color-primary)' }}
                />
                <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>Parallel</span>
              </label>
            </div>
          </div>

          {/* Advanced Settings */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-[var(--color-primary)] hover:underline"
            style={{ fontSize: '14px' }}
          >
            <Settings2 size={16} />
            Advanced Settings
            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div>
                <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                  Concurrency (Parallel Mode)
                </label>
                <select
                  value={concurrency}
                  onChange={(e) => setConcurrency(Number(e.target.value))}
                  disabled={isRunning || executionMode !== 'PARALLEL'}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors disabled:opacity-50"
                  style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-background)', color: 'var(--color-text-primary)' }}
                >
                  {[1, 2, 3, 5, 10, 20].map(n => (
                    <option key={n} value={n}>{n} concurrent scenarios</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                  Timeout per Scenario (seconds)
                </label>
                <input
                  type="number"
                  value={timeout}
                  onChange={(e) => setTimeout(Number(e.target.value))}
                  min={10}
                  max={300}
                  disabled={isRunning}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors disabled:opacity-50"
                  style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-background)', color: 'var(--color-text-primary)' }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={isRunning || selectedScenarios.length === 0}
            className="flex items-center gap-2 px-8 py-3 bg-[var(--color-primary)] text-white rounded hover:bg-[#1D4261] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontSize: '14px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}
          >
            <Play size={20} />
            Start Simulation ({selectedScenarios.length} scenarios)
          </button>
        </div>
      </div>

      {/* Progress Card - Only show when running or completed */}
      {(isRunning || completedScenarios > 0) && (
        <div className="bg-[var(--color-background)] rounded-lg p-6" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
          <h3 className="mb-4">Execution Progress</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: isRunning ? '#87C1F1' : progress === 100 ? '#C3E770' : '#C7CDD0',
                    color: isRunning ? '#0D47A1' : progress === 100 ? '#1B5E20' : '#212529',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  {isRunning ? '🟢 Running' : progress === 100 ? '✅ Complete' : '⚪ Stopped'}
                </span>
                <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                  Elapsed: {formatTime(elapsedTime)}
                </span>
                {isRunning && estimatedTime > 0 && (
                  <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                    ETA: {formatTime(Math.max(0, estimatedTime - elapsedTime))}
                  </span>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative">
              <div className="w-full h-8 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-surface)' }}>
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${progressPercent}%`,
                    background: 'linear-gradient(90deg, #285A84 0%, #87C1F1 100%)',
                  }}
                ></div>
              </div>
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ fontSize: '14px', fontWeight: 600, color: progressPercent > 50 ? '#FFFFFF' : 'var(--color-text-primary)' }}
              >
                {Math.round(progressPercent)}% ({completedScenarios}/{totalScenarios} scenarios)
              </div>
            </div>

            {currentScenario && isRunning && (
              <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                Current: Processing "{currentScenario}"...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Live Results - Only show when there are results */}
      {(results.pass > 0 || results.fail > 0 || results.warn > 0) && (
        <div className="bg-[var(--color-background)] rounded-lg p-6" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
          <h3 className="mb-4">Live Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2" style={{ fontSize: '18px', color: 'var(--color-text-primary)' }}>
                  <CheckCircle size={24} style={{ color: '#C3E770' }} />
                  <span style={{ fontWeight: 700 }}>Pass:</span>
                </span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {results.pass} scenarios ({results.total > 0 ? ((results.pass / results.total) * 100).toFixed(1) : 0}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2" style={{ fontSize: '18px', color: 'var(--color-text-primary)' }}>
                  <XCircle size={24} style={{ color: '#EF6F53' }} />
                  <span style={{ fontWeight: 700 }}>Fail:</span>
                </span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {results.fail} scenarios ({results.total > 0 ? ((results.fail / results.total) * 100).toFixed(1) : 0}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2" style={{ fontSize: '18px', color: 'var(--color-text-primary)' }}>
                  <AlertTriangle size={24} style={{ color: '#F7EA73' }} />
                  <span style={{ fontWeight: 700 }}>Warn:</span>
                </span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {results.warn} scenarios ({results.total > 0 ? ((results.warn / results.total) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            </div>
            {pieData.length > 0 && (
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Execution Log */}
      {logs.length > 0 && (
        <div className="bg-[var(--color-background)] rounded-lg p-6" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
          <div className="flex justify-between items-center mb-4">
            <h3>Execution Log</h3>
            <button
              onClick={handleExportLog}
              className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-[var(--color-surface)] transition-colors"
              style={{ borderColor: 'var(--color-border)', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}
            >
              <Download size={16} />
              Export Log
            </button>
          </div>
          <div
            ref={logContainerRef}
            className="bg-[var(--color-surface)] rounded p-4 overflow-y-auto"
            style={{ maxHeight: '400px', border: '1px solid var(--color-border)', fontFamily: 'monospace', fontSize: '12px' }}
          >
            {logs.map((log, index) => (
              <div key={index} className="mb-2">
                <div className="flex items-start gap-2">
                  <span
                    style={{
                      color:
                        log.type === 'info'
                          ? 'var(--color-primary)'
                          : log.type === 'success'
                          ? '#1B5E20'
                          : log.type === 'error'
                          ? 'var(--color-error)'
                          : '#5D4037',
                    }}
                  >
                    [{log.type === 'success' ? 'PASS' : log.type === 'error' ? 'FAIL' : log.type === 'warning' ? 'WARN' : 'INFO'}]
                  </span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{log.time}</span>
                  <span style={{ color: 'var(--color-text-primary)' }}>- {log.message}</span>
                </div>
                {log.details && (
                  <div className="ml-16" style={{ color: 'var(--color-text-secondary)' }}>
                    └─ {log.details}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
