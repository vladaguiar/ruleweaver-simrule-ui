import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export function SimulationRunner() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [logs, setLogs] = useState<Array<{ type: string; time: string; message: string; details?: string }>>([
    { type: 'info', time: '14:23:45', message: 'Started simulation batch' },
  ]);

  const results = {
    pass: 68,
    fail: 10,
    warn: 4,
    total: 120,
  };

  const pieData = [
    { name: 'Pass', value: results.pass, color: '#C3E770' },
    { name: 'Fail', value: results.fail, color: '#EF6F53' },
    { name: 'Warning', value: results.warn, color: '#F7EA73' },
  ];

  useEffect(() => {
    if (isRunning && progress < 68) {
      const timer = setTimeout(() => {
        setProgress(prev => Math.min(prev + 1, 68));
        setElapsedTime(prev => prev + 1);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isRunning, progress]);

  const handleStart = () => {
    setIsRunning(true);
    if (logs.length === 1) {
      setTimeout(() => {
        setLogs(prev => [
          ...prev,
          { type: 'success', time: '14:23:46', message: 'Customer Validation: PASS (1.2s)' },
        ]);
      }, 1000);
      setTimeout(() => {
        setLogs(prev => [
          ...prev,
          { type: 'success', time: '14:23:47', message: 'Order Processing: PASS (2.1s)' },
        ]);
      }, 2000);
      setTimeout(() => {
        setLogs(prev => [
          ...prev,
          { type: 'error', time: '14:23:49', message: 'Pricing Rules: FAIL (1.8s)', details: 'Expected: discount >= 10%, Got: 5%' },
        ]);
      }, 3000);
      setTimeout(() => {
        setLogs(prev => [
          ...prev,
          { type: 'warning', time: '14:23:50', message: 'Account Setup: WARNING (0.9s)', details: 'Performance threshold exceeded' },
        ]);
      }, 4000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = (progress / results.total) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1>Simulation Runner</h1>
        <div className="flex gap-2">
          <button
            disabled={!isRunning}
            className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderColor: 'var(--color-border)', fontSize: '14px', fontWeight: 500 }}
          >
            <Pause size={18} />
            Pause
          </button>
          <button
            disabled={!isRunning}
            className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderColor: 'var(--color-border)', fontSize: '14px', fontWeight: 500 }}
          >
            <Square size={18} />
            Stop
          </button>
        </div>
      </div>

      {/* Configuration Card */}
      <div className="bg-[var(--color-background)] rounded-lg p-6" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
        <h3 className="mb-4">Execution Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
              Select Scenarios
            </label>
            <select
              className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
            >
              <option>12 scenarios selected</option>
            </select>
          </div>

          <div>
            <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
              Execution Mode
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="mode" defaultChecked style={{ accentColor: 'var(--color-primary)' }} />
                <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>Sequential</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="mode" style={{ accentColor: 'var(--color-primary)' }} />
                <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>Parallel</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
              Concurrency
            </label>
            <select
              className="px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
            >
              <option>5 concurrent simulations</option>
              <option>10 concurrent simulations</option>
              <option>20 concurrent simulations</option>
            </select>
          </div>

          <button
            onClick={handleStart}
            disabled={isRunning}
            className="flex items-center gap-2 px-8 py-3 bg-[var(--color-primary)] text-white rounded hover:bg-[#1D4261] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontSize: '14px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}
          >
            <Play size={20} />
            Start Simulation
          </button>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-[var(--color-background)] rounded-lg p-6" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
        <h3 className="mb-4">Execution Progress</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full"
                style={{
                  backgroundColor: isRunning ? '#87C1F1' : '#C7CDD0',
                  color: isRunning ? '#0D47A1' : '#212529',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                {isRunning ? '🟢 Running' : '⚪ Ready'}
              </span>
              <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)', fontFamily: 'Roboto Mono' }}>
                Elapsed: {formatTime(elapsedTime)}
              </span>
              <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)', fontFamily: 'Roboto Mono' }}>
                ETA: {formatTime(Math.max(0, 154 - elapsedTime))}
              </span>
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
              {Math.round(progressPercent)}% ({progress}/{results.total} scenarios)
            </div>
          </div>

          <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            Current: Processing "Order Pricing Validation"...
          </div>
        </div>
      </div>

      {/* Live Results */}
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
                {results.pass} scenarios (82.9%)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2" style={{ fontSize: '18px', color: 'var(--color-text-primary)' }}>
                <XCircle size={24} style={{ color: '#EF6F53' }} />
                <span style={{ fontWeight: 700 }}>Fail:</span>
              </span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-primary)' }}>
                {results.fail} scenarios (12.2%)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2" style={{ fontSize: '18px', color: 'var(--color-text-primary)' }}>
                <AlertTriangle size={24} style={{ color: '#F7EA73' }} />
                <span style={{ fontWeight: 700 }}>Warn:</span>
              </span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-primary)' }}>
                {results.warn} scenarios (4.9%)
              </span>
            </div>
          </div>
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
        </div>
      </div>

      {/* Execution Log */}
      <div className="bg-[var(--color-background)] rounded-lg p-6" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
        <div className="flex justify-between items-center mb-4">
          <h3>Execution Log</h3>
          <button className="px-4 py-2 border rounded hover:bg-[var(--color-surface)] transition-colors" style={{ borderColor: 'var(--color-border)', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
            📥 Export Log
          </button>
        </div>
        <div
          className="bg-[var(--color-surface)] rounded p-4 overflow-y-auto"
          style={{ maxHeight: '400px', border: '1px solid var(--color-border)', fontFamily: 'Roboto Mono', fontSize: '12px' }}
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
                  [{log.type === 'success' ? '✅' : log.type === 'error' ? '❌' : log.type === 'warning' ? '⚠️' : 'INFO'}]
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
    </div>
  );
}