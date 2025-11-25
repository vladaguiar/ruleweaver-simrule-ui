import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Filter, Play, Copy, Trash2, Check, RefreshCw, AlertCircle, Edit2, Archive, MoreVertical, X } from 'lucide-react';
import { useScenarios } from '@/hooks/useScenarios';
import { scenarioService, simulationService } from '@/services';
import { useAppContext } from '@/contexts/AppContext';
import type { ScenarioResponse, ScenarioStatus, PaginatedResponse } from '@/types/api.types';

interface ScenariosProps {
  onNavigate: (page: string, params?: { scenarioId?: string; simulationId?: string }) => void;
}

// Helper function to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function Scenarios({ onNavigate }: ScenariosProps) {
  const { addNotification, settings } = useAppContext();

  // State for scenarios data
  const [scenarios, setScenarios] = useState<ScenarioResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = settings.defaultPageSize || 10;

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | ScenarioStatus>('all');
  const [ruleSetFilter, setRuleSetFilter] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Available filter options (loaded from API)
  const [availableRuleSets, setAvailableRuleSets] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  // Load scenarios
  const loadScenarios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: Record<string, string> = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (ruleSetFilter !== 'all') filters.ruleSet = ruleSetFilter;
      if (selectedTags.length > 0) filters.tags = selectedTags.join(',');

      const response = await scenarioService.getAll(currentPage - 1, pageSize, filters);
      setScenarios(response.content);
      setTotalPages(response.totalPages);
      setTotalItems(response.totalElements);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load scenarios');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, statusFilter, ruleSetFilter, selectedTags]);

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [ruleSets, tags] = await Promise.all([
          scenarioService.getRuleSets(),
          scenarioService.getTags(),
        ]);
        setAvailableRuleSets(ruleSets);
        setAvailableTags(tags);
      } catch (e) {
        console.error('Failed to load filter options:', e);
      }
    };
    loadFilterOptions();
  }, []);

  // Load scenarios on mount and when filters change
  useEffect(() => {
    loadScenarios();
  }, [loadScenarios]);

  // Filter scenarios by search term (client-side for instant feedback)
  const filteredScenarios = scenarios.filter(scenario =>
    scenario.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scenario.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Selection handlers
  const toggleScenario = (id: string) => {
    setSelectedScenarios(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedScenarios.length === filteredScenarios.length) {
      setSelectedScenarios([]);
    } else {
      setSelectedScenarios(filteredScenarios.map(s => s.id));
    }
  };

  // Action handlers
  const handleRun = async (scenarioId: string) => {
    setProcessing(scenarioId);
    try {
      const scenario = scenarios.find(s => s.id === scenarioId);
      const simulation = await simulationService.executeScenario(
        scenarioId,
        `Run: ${scenario?.name || scenarioId}`
      );
      addNotification({
        type: 'success',
        title: 'Simulation Started',
        message: `Running scenario: ${scenario?.name}`,
      });
      onNavigate('results', { simulationId: simulation.id });
    } catch (e) {
      addNotification({
        type: 'error',
        title: 'Failed to Run',
        message: e instanceof Error ? e.message : 'Failed to start simulation',
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleClone = async (scenarioId: string) => {
    setProcessing(scenarioId);
    try {
      const scenario = scenarios.find(s => s.id === scenarioId);
      const cloned = await scenarioService.clone(scenarioId, `${scenario?.name} (Copy)`);
      addNotification({
        type: 'success',
        title: 'Scenario Cloned',
        message: `Created: ${cloned.name}`,
      });
      loadScenarios();
    } catch (e) {
      addNotification({
        type: 'error',
        title: 'Clone Failed',
        message: e instanceof Error ? e.message : 'Failed to clone scenario',
      });
    } finally {
      setProcessing(null);
      setActionMenuOpen(null);
    }
  };

  const handleDelete = async (scenarioId: string) => {
    setProcessing(scenarioId);
    try {
      await scenarioService.delete(scenarioId);
      addNotification({
        type: 'success',
        title: 'Scenario Deleted',
        message: 'Scenario has been deleted',
      });
      setConfirmDelete(null);
      loadScenarios();
    } catch (e) {
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: e instanceof Error ? e.message : 'Failed to delete scenario',
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedScenarios.length === 0) return;
    setProcessing('bulk');
    try {
      await scenarioService.bulkDelete(selectedScenarios);
      addNotification({
        type: 'success',
        title: 'Scenarios Deleted',
        message: `Deleted ${selectedScenarios.length} scenarios`,
      });
      setSelectedScenarios([]);
      loadScenarios();
    } catch (e) {
      addNotification({
        type: 'error',
        title: 'Bulk Delete Failed',
        message: e instanceof Error ? e.message : 'Failed to delete scenarios',
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleArchive = async (scenarioId: string) => {
    setProcessing(scenarioId);
    try {
      await scenarioService.archive(scenarioId);
      addNotification({
        type: 'success',
        title: 'Scenario Archived',
        message: 'Scenario has been archived',
      });
      loadScenarios();
    } catch (e) {
      addNotification({
        type: 'error',
        title: 'Archive Failed',
        message: e instanceof Error ? e.message : 'Failed to archive scenario',
      });
    } finally {
      setProcessing(null);
      setActionMenuOpen(null);
    }
  };

  const handleActivate = async (scenarioId: string) => {
    setProcessing(scenarioId);
    try {
      await scenarioService.activate(scenarioId);
      addNotification({
        type: 'success',
        title: 'Scenario Activated',
        message: 'Scenario is now active',
      });
      loadScenarios();
    } catch (e) {
      addNotification({
        type: 'error',
        title: 'Activation Failed',
        message: e instanceof Error ? e.message : 'Failed to activate scenario',
      });
    } finally {
      setProcessing(null);
      setActionMenuOpen(null);
    }
  };

  const handleBulkRun = async () => {
    if (selectedScenarios.length === 0) return;
    setProcessing('bulk');
    try {
      const simulation = await simulationService.executeScenarios(
        selectedScenarios,
        `Batch Run: ${selectedScenarios.length} scenarios`
      );
      addNotification({
        type: 'success',
        title: 'Batch Simulation Started',
        message: `Running ${selectedScenarios.length} scenarios`,
      });
      onNavigate('results', { simulationId: simulation.id });
    } catch (e) {
      addNotification({
        type: 'error',
        title: 'Batch Run Failed',
        message: e instanceof Error ? e.message : 'Failed to start batch simulation',
      });
    } finally {
      setProcessing(null);
    }
  };

  // Tag filter handlers
  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setRuleSetFilter('all');
    setSelectedTags([]);
    setSearchTerm('');
  };

  // Pagination
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPaginationButtons = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
      pages.push(
        <button key={1} onClick={() => goToPage(1)} className="px-3 py-1 rounded transition-colors" style={{ fontSize: '14px', color: 'var(--color-primary)' }}>
          1
        </button>
      );
      if (start > 2) {
        pages.push(<span key="start-ellipsis" className="px-2" style={{ color: 'var(--color-text-muted)' }}>...</span>);
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
          className="px-3 py-1 rounded transition-colors"
          style={{
            fontSize: '14px',
            backgroundColor: i === currentPage ? 'var(--color-primary)' : 'transparent',
            color: i === currentPage ? '#FFFFFF' : 'var(--color-primary)',
          }}
        >
          {i}
        </button>
      );
    }

    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push(<span key="end-ellipsis" className="px-2" style={{ color: 'var(--color-text-muted)' }}>...</span>);
      }
      pages.push(
        <button key={totalPages} onClick={() => goToPage(totalPages)} className="px-3 py-1 rounded transition-colors" style={{ fontSize: '14px', color: 'var(--color-primary)' }}>
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  const CustomCheckbox = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <div
      onClick={onChange}
      className="w-5 h-5 cursor-pointer flex items-center justify-center mx-auto"
      style={{
        backgroundColor: 'white',
        border: '2px solid black',
        marginLeft: 'calc(50% + 2px)',
        transform: 'translateX(-50%)',
      }}
    >
      {checked && <Check size={14} strokeWidth={3} color="black" />}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1>Scenarios</h1>
          <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            {totalItems} total
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadScenarios}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50"
            style={{ borderColor: 'var(--color-border)', fontSize: '14px' }}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => onNavigate('scenario-editor')}
            className="flex items-center gap-2 px-6 py-2 bg-[var(--color-accent)] text-white rounded hover:bg-[#FC7857] transition-colors"
            style={{ boxShadow: 'var(--shadow-1)', fontSize: '14px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}
          >
            <Plus size={18} />
            Create
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded flex items-center gap-2" style={{ backgroundColor: '#FFEBEE', color: 'var(--color-error)' }}>
          <AlertCircle size={20} />
          {error}
          <button onClick={loadScenarios} className="ml-auto px-3 py-1 border rounded" style={{ borderColor: 'var(--color-error)' }}>
            Retry
          </button>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="bg-[var(--color-background)] rounded-lg p-4 flex flex-col md:flex-row gap-4" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-muted)]" size={20} />
          <input
            type="text"
            placeholder="Search scenarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            style={{
              borderColor: 'var(--color-border)',
              fontSize: '14px',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)'
            }}
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | ScenarioStatus)}
            className="px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            style={{
              borderColor: 'var(--color-border)',
              fontSize: '14px',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)'
            }}
          >
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <select
            value={ruleSetFilter}
            onChange={(e) => setRuleSetFilter(e.target.value)}
            className="px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            style={{
              borderColor: 'var(--color-border)',
              fontSize: '14px',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)'
            }}
          >
            <option value="all">All Rule Sets</option>
            {availableRuleSets.map(rs => (
              <option key={rs} value={rs}>{rs}</option>
            ))}
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded hover:bg-[var(--color-surface)] transition-colors ${showFilters ? 'bg-[var(--color-surface)]' : ''}`}
            style={{ borderColor: 'var(--color-border)' }}
          >
            <Filter size={20} style={{ color: showFilters ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} />
          </button>
          {(statusFilter !== 'all' || ruleSetFilter !== 'all' || selectedTags.length > 0) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 border rounded hover:bg-[var(--color-surface)] transition-colors"
              style={{ borderColor: 'var(--color-border)', fontSize: '14px', color: 'var(--color-text-secondary)' }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Filter Tags */}
      {(showFilters || selectedTags.length > 0) && (
        <div className="bg-[var(--color-surface)] rounded-lg p-4" style={{ border: '1px solid var(--color-border)' }}>
          <div className="flex flex-wrap gap-2 items-center">
            <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Tags:</span>
            {availableTags.length > 0 ? (
              availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTagFilter(tag)}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full cursor-pointer transition-colors"
                  style={{
                    backgroundColor: selectedTags.includes(tag) ? 'var(--color-primary)' : 'var(--color-background)',
                    color: selectedTags.includes(tag) ? '#FFFFFF' : 'var(--color-primary)',
                    fontSize: '12px',
                    fontWeight: 500,
                    border: '1px solid var(--color-border)'
                  }}
                >
                  {tag}
                  {selectedTags.includes(tag) && <X size={12} />}
                </button>
              ))
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>No tags available</span>
            )}
          </div>
        </div>
      )}

      {/* Scenarios Table */}
      <div className="bg-[var(--color-background)] rounded-lg overflow-hidden" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="animate-spin" size={24} style={{ color: 'var(--color-primary)' }} />
              <span className="ml-2" style={{ color: 'var(--color-text-secondary)' }}>Loading scenarios...</span>
            </div>
          ) : filteredScenarios.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle size={48} style={{ color: 'var(--color-text-muted)', margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '16px' }}>
                {searchTerm ? 'No scenarios match your search' : 'No scenarios found'}
              </p>
              <button
                onClick={() => onNavigate('scenario-editor')}
                className="mt-4 px-6 py-2 bg-[var(--color-primary)] text-white rounded hover:bg-[#1D4261] transition-colors"
                style={{ fontSize: '14px' }}
              >
                Create Your First Scenario
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                  <th className="p-4 w-12 text-center">
                    <CustomCheckbox
                      checked={selectedScenarios.length === filteredScenarios.length && filteredScenarios.length > 0}
                      onChange={toggleAll}
                    />
                  </th>
                  <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Name</th>
                  <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Status</th>
                  <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>RuleSet</th>
                  <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Fact Type</th>
                  <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Updated</th>
                  <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredScenarios.map((scenario) => (
                  <tr
                    key={scenario.id}
                    className="border-b hover:bg-[var(--color-surface)] transition-colors"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <td className="p-4 text-center">
                      <CustomCheckbox
                        checked={selectedScenarios.includes(scenario.id)}
                        onChange={() => toggleScenario(scenario.id)}
                      />
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => onNavigate('scenario-editor', { scenarioId: scenario.id })}
                        className="hover:underline text-[var(--color-primary)]"
                        style={{ fontSize: '14px', fontWeight: 500 }}
                      >
                        {scenario.name}
                      </button>
                      {scenario.description && (
                        <p className="mt-1 text-ellipsis overflow-hidden whitespace-nowrap max-w-xs" style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                          {scenario.description}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className="inline-block px-3 py-1 rounded-full"
                        style={{
                          backgroundColor:
                            scenario.status === 'ACTIVE'
                              ? '#C3E770'
                              : scenario.status === 'DRAFT'
                              ? '#C7CDD0'
                              : '#ADB5BD',
                          color:
                            scenario.status === 'ACTIVE'
                              ? '#1B5E20'
                              : scenario.status === 'DRAFT'
                              ? '#212529'
                              : '#FFFFFF',
                          fontSize: '12px',
                          fontWeight: 500,
                        }}
                      >
                        {scenario.status.charAt(0) + scenario.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="p-4" style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{scenario.ruleSet}</td>
                    <td className="p-4" style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{scenario.factType}</td>
                    <td className="p-4" style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                      {formatRelativeTime(scenario.updatedAt)}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1 relative">
                        <button
                          onClick={() => handleRun(scenario.id)}
                          disabled={processing === scenario.id || scenario.status !== 'ACTIVE'}
                          className="p-2 hover:bg-[var(--color-surface)] rounded transition-colors disabled:opacity-50"
                          title={scenario.status !== 'ACTIVE' ? 'Activate to run' : 'Run'}
                        >
                          <Play size={18} style={{ color: 'var(--color-primary)' }} className={processing === scenario.id ? 'animate-pulse' : ''} />
                        </button>
                        <button
                          onClick={() => onNavigate('scenario-editor', { scenarioId: scenario.id })}
                          className="p-2 hover:bg-[var(--color-surface)] rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={18} style={{ color: 'var(--color-text-secondary)' }} />
                        </button>
                        <button
                          onClick={() => setActionMenuOpen(actionMenuOpen === scenario.id ? null : scenario.id)}
                          className="p-2 hover:bg-[var(--color-surface)] rounded transition-colors"
                          title="More actions"
                        >
                          <MoreVertical size={18} style={{ color: 'var(--color-text-secondary)' }} />
                        </button>

                        {/* Action Menu Dropdown */}
                        {actionMenuOpen === scenario.id && (
                          <div
                            className="absolute right-0 top-full mt-1 py-2 bg-[var(--color-background)] rounded-lg z-10"
                            style={{ boxShadow: 'var(--shadow-2)', border: '1px solid var(--color-border)', minWidth: '150px' }}
                          >
                            <button
                              onClick={() => handleClone(scenario.id)}
                              className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-[var(--color-surface)] transition-colors"
                              style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}
                            >
                              <Copy size={16} /> Clone
                            </button>
                            {scenario.status !== 'ACTIVE' && (
                              <button
                                onClick={() => handleActivate(scenario.id)}
                                className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-[var(--color-surface)] transition-colors"
                                style={{ fontSize: '14px', color: 'var(--color-success)' }}
                              >
                                <Check size={16} /> Activate
                              </button>
                            )}
                            {scenario.status !== 'ARCHIVED' && (
                              <button
                                onClick={() => handleArchive(scenario.id)}
                                className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-[var(--color-surface)] transition-colors"
                                style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}
                              >
                                <Archive size={16} /> Archive
                              </button>
                            )}
                            <hr className="my-2" style={{ borderColor: 'var(--color-border)' }} />
                            <button
                              onClick={() => {
                                setActionMenuOpen(null);
                                setConfirmDelete(scenario.id);
                              }}
                              className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-[var(--color-surface)] transition-colors"
                              style={{ fontSize: '14px', color: 'var(--color-error)' }}
                            >
                              <Trash2 size={16} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center gap-2 p-4 border-t" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
            <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalItems)} of {totalItems}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded hover:bg-[var(--color-background)] transition-colors disabled:opacity-50"
                style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}
              >
                Previous
              </button>
              {renderPaginationButtons()}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded hover:bg-[var(--color-background)] transition-colors disabled:opacity-50"
                style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--color-background)] rounded-lg p-6 max-w-md w-full mx-4" style={{ boxShadow: 'var(--shadow-3)' }}>
            <h3 className="mb-4" style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-primary)' }}>
              Confirm Delete
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
              Are you sure you want to delete this scenario? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 border rounded hover:bg-[var(--color-surface)] transition-colors"
                style={{ borderColor: 'var(--color-border)', fontSize: '14px' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={processing === confirmDelete}
                className="px-4 py-2 bg-[var(--color-error)] text-white rounded hover:opacity-90 transition-colors disabled:opacity-50"
                style={{ fontSize: '14px' }}
              >
                {processing === confirmDelete ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedScenarios.length > 0 && (
        <div className="fixed bottom-0 left-60 right-0 bg-[var(--color-primary)] text-white p-4 flex items-center justify-between z-40" style={{ boxShadow: 'var(--shadow-3)' }}>
          <div className="flex items-center gap-4">
            <span style={{ fontSize: '14px', fontWeight: 500 }}>
              {selectedScenarios.length} selected
            </span>
            <button
              onClick={() => setSelectedScenarios([])}
              className="text-white/80 hover:text-white transition-colors"
              style={{ fontSize: '14px' }}
            >
              Clear selection
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleBulkRun}
              disabled={processing === 'bulk'}
              className="flex items-center gap-2 px-4 py-2 border border-white rounded hover:bg-white/10 transition-colors disabled:opacity-50"
              style={{ fontSize: '14px', fontWeight: 500 }}
            >
              <Play size={18} className={processing === 'bulk' ? 'animate-pulse' : ''} />
              Run Selected
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={processing === 'bulk'}
              className="flex items-center gap-2 px-4 py-2 border border-white rounded hover:bg-white/10 transition-colors disabled:opacity-50"
              style={{ fontSize: '14px', fontWeight: 500 }}
            >
              <Trash2 size={18} />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close action menu */}
      {actionMenuOpen && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setActionMenuOpen(null)}
        />
      )}
    </div>
  );
}