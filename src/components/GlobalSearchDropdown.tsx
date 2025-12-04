// GlobalSearchDropdown - Displays categorized search results in a dropdown

import React from 'react';
import { ClipboardList, Play, RefreshCw, Search, AlertCircle } from 'lucide-react';
import type { GlobalSearchResults } from '@/hooks/useGlobalSearch';
import type { ScenarioResponse, SimulationResponse } from '@/types/api.types';

interface GlobalSearchDropdownProps {
  results: GlobalSearchResults;
  query: string;
  onSelectScenario: (scenario: ScenarioResponse) => void;
  onSelectSimulation: (simulation: SimulationResponse) => void;
  onClose: () => void;
}

export function GlobalSearchDropdown({
  results,
  query,
  onSelectScenario,
  onSelectSimulation,
  onClose,
}: GlobalSearchDropdownProps) {
  const { scenarios, simulations, loading, error } = results;
  const hasResults = scenarios.length > 0 || simulations.length > 0;

  // Don't render if query is too short
  if (query.length < 2) {
    return null;
  }

  return (
    <div
      className="absolute top-full left-0 right-0 mt-2 rounded-lg overflow-hidden z-50"
      style={{
        backgroundColor: 'var(--color-background)',
        boxShadow: 'var(--shadow-3)',
        border: '1px solid var(--color-border)',
        maxHeight: '400px',
        overflowY: 'auto',
      }}
    >
      {/* Loading State */}
      {loading && (
        <div className="flex items-center gap-2 p-4" style={{ color: 'var(--color-text-secondary)' }}>
          <RefreshCw size={16} className="animate-spin" />
          <span style={{ fontSize: '14px' }}>Searching...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex items-center gap-2 p-4" style={{ color: 'var(--color-error)' }}>
          <AlertCircle size={16} />
          <span style={{ fontSize: '14px' }}>{error}</span>
        </div>
      )}

      {/* No Results */}
      {!loading && !error && !hasResults && (
        <div className="flex items-center gap-2 p-4" style={{ color: 'var(--color-text-muted)' }}>
          <Search size={16} />
          <span style={{ fontSize: '14px' }}>No results found for "{query}"</span>
        </div>
      )}

      {/* Scenarios Section */}
      {!loading && scenarios.length > 0 && (
        <div>
          <div
            className="px-4 py-2 flex items-center gap-2"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <ClipboardList size={14} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Scenarios
            </span>
            <span
              className="ml-auto px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                fontSize: '10px',
                fontWeight: 600,
              }}
            >
              {scenarios.length}
            </span>
          </div>
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => {
                onSelectScenario(scenario);
                onClose();
              }}
              className="w-full text-left px-4 py-3 hover:bg-[var(--color-surface)] transition-colors flex items-start gap-3"
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              <ClipboardList size={16} style={{ color: 'var(--color-text-muted)', marginTop: '2px' }} />
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                  {highlightMatch(scenario.name, query)}
                </div>
                {scenario.description && (
                  <div
                    className="truncate"
                    style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}
                  >
                    {scenario.description}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="px-2 py-0.5 rounded-full"
                    style={{
                      fontSize: '10px',
                      backgroundColor: scenario.status === 'ACTIVE' ? '#C3E770' : '#C7CDD0',
                      color: scenario.status === 'ACTIVE' ? '#1B5E20' : '#212529',
                    }}
                  >
                    {scenario.status}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    {scenario.ruleSet}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Simulations Section */}
      {!loading && simulations.length > 0 && (
        <div>
          <div
            className="px-4 py-2 flex items-center gap-2"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <Play size={14} style={{ color: 'var(--color-accent)' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Simulations
            </span>
            <span
              className="ml-auto px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: 'var(--color-accent)',
                color: 'white',
                fontSize: '10px',
                fontWeight: 600,
              }}
            >
              {simulations.length}
            </span>
          </div>
          {simulations.map((simulation) => (
            <button
              key={simulation.id}
              onClick={() => {
                onSelectSimulation(simulation);
                onClose();
              }}
              className="w-full text-left px-4 py-3 hover:bg-[var(--color-surface)] transition-colors flex items-start gap-3"
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              <Play size={16} style={{ color: 'var(--color-text-muted)', marginTop: '2px' }} />
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                  {highlightMatch(simulation.name || `Simulation ${simulation.id.slice(0, 8)}`, query)}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="px-2 py-0.5 rounded-full"
                    style={{
                      fontSize: '10px',
                      backgroundColor: getStatusColor(simulation.status).bg,
                      color: getStatusColor(simulation.status).text,
                    }}
                  >
                    {simulation.status}
                  </span>
                  {simulation.metrics && (
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {simulation.metrics.scenariosPassed}/{simulation.metrics.totalScenarios} passed
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Highlight matching text in a string
 */
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) return text;

  return (
    <>
      {text.slice(0, index)}
      <span style={{ backgroundColor: '#FFF59D', color: '#000' }}>
        {text.slice(index, index + query.length)}
      </span>
      {text.slice(index + query.length)}
    </>
  );
}

/**
 * Get status colors for simulation status
 */
function getStatusColor(status: string): { bg: string; text: string } {
  switch (status) {
    case 'COMPLETED':
      return { bg: '#C3E770', text: '#1B5E20' };
    case 'FAILED':
      return { bg: '#EF6F53', text: '#FFFFFF' };
    case 'RUNNING':
    case 'PENDING':
      return { bg: '#87C1F1', text: '#0D47A1' };
    case 'CANCELLED':
      return { bg: '#F7EA73', text: '#5D4037' };
    default:
      return { bg: '#C7CDD0', text: '#212529' };
  }
}
