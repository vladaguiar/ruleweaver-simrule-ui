import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Filter, Play, Copy, Trash2, Check, RefreshCw, AlertCircle, Edit2, Archive, MoreVertical, X, Download } from 'lucide-react';
import { useScenarios } from '@/hooks/useScenarios';
import { useRuleSets } from '@/hooks/useRuleSets';
import { scenarioService, simulationService } from '@/services';
import { useAppContext } from '@/contexts/AppContext';
import { Pagination } from '@/components/ui/Pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportToCSV, formatArrayForExport, formatDateForExport } from '@/utils/export';
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

  // Pagination state (0-based page index)
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(settings.defaultPageSize || 10);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | ScenarioStatus>('all');
  const [ruleSetFilter, setRuleSetFilter] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Available filter options (loaded from API)
  const { ruleSetIds: availableRuleSets } = useRuleSets();
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  // Load scenarios - uses server-side pagination with client-side fallback
  const loadScenarios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: Record<string, string | undefined> = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (ruleSetFilter !== 'all') filters.ruleSet = ruleSetFilter;

      // Try server-side pagination first (with fallback in the service)
      const result = await scenarioService.getPaginated(
        { page: currentPage, size: pageSize },
        filters as any
      );

      setScenarios(result.content);
      setTotalPages(result.totalPages || 1);
      setTotalItems(result.totalElements);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load scenarios');
      setScenarios([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, statusFilter, ruleSetFilter, selectedTags]);

  // Load tags filter options
  useEffect(() => {
    const loadTags = async () => {
      try {
        const tags = await scenarioService.getTags();
        setAvailableTags(tags);
      } catch (e) {
        console.error('Failed to load tags:', e);
      }
    };
    loadTags();
  }, []);

  // Load scenarios on mount and when filters change
  useEffect(() => {
    loadScenarios();
  }, [loadScenarios]);

  // Filter scenarios by search term and tags (client-side for instant feedback)
  const filteredScenarios = scenarios.filter(scenario => {
    // Search term filter
    const matchesSearch = searchTerm === '' ||
      scenario.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scenario.description?.toLowerCase().includes(searchTerm.toLowerCase());

    // Tag filter - scenario must have ALL selected tags
    const matchesTags = selectedTags.length === 0 ||
      selectedTags.every(tag => scenario.tags?.includes(tag));

    return matchesSearch && matchesTags;
  });

  // Calculate tag counts for badges
  const tagCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    scenarios.forEach(scenario => {
      scenario.tags?.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return counts;
  }, [scenarios]);

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

    // Confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedScenarios.length} scenario(s)? This action cannot be undone.`
    );
    if (!confirmed) return;

    setProcessing('bulk');
    try {
      const result = await scenarioService.bulkDelete(selectedScenarios);

      // Show appropriate notification based on results
      if (result.failureCount === 0) {
        addNotification({
          type: 'success',
          title: 'Scenarios Deleted',
          message: `Successfully deleted ${result.successCount} scenario(s)`,
        });
      } else if (result.successCount > 0) {
        addNotification({
          type: 'warning',
          title: 'Partial Success',
          message: `Deleted ${result.successCount} scenario(s), but ${result.failureCount} failed`,
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Delete Failed',
          message: `Failed to delete ${result.failureCount} scenario(s)`,
        });
      }

      // Clear selection and reload regardless of partial success
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

  // Pagination handlers
  const handlePageChange = useCallback((page: number) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(0); // Reset to first page when changing page size
  }, []);

  // Export scenarios to CSV
  const handleExportCSV = useCallback(async () => {
    try {
      // Get all scenarios for export (not just paginated)
      const filters: Record<string, string | undefined> = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (ruleSetFilter !== 'all') filters.ruleSet = ruleSetFilter;

      const allScenarios = await scenarioService.getAll(filters as any);

      // Apply tag filter if set
      const filteredForExport = selectedTags.length > 0
        ? allScenarios.filter(s => selectedTags.every(tag => s.tags?.includes(tag)))
        : allScenarios;

      // Define columns for export
      const columns: { key: keyof ScenarioResponse; header: string }[] = [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Name' },
        { key: 'description', header: 'Description' },
        { key: 'status', header: 'Status' },
        { key: 'ruleSet', header: 'Rule Set' },
        { key: 'factType', header: 'Fact Type' },
        { key: 'agendaGroup', header: 'Agenda Group' },
        { key: 'tags', header: 'Tags' },
        { key: 'createdAt', header: 'Created At' },
        { key: 'updatedAt', header: 'Updated At' },
      ];

      // Transform data for export
      const exportData = filteredForExport.map(scenario => ({
        ...scenario,
        tags: formatArrayForExport(scenario.tags),
        createdAt: formatDateForExport(scenario.createdAt),
        updatedAt: formatDateForExport(scenario.updatedAt),
      }));

      const filename = `scenarios-${new Date().toISOString().slice(0, 10)}.csv`;
      exportToCSV(exportData as unknown as Record<string, unknown>[], columns as any, filename);

      addNotification({
        type: 'success',
        title: 'Export Complete',
        message: `Exported ${filteredForExport.length} scenarios to CSV`,
      });
    } catch (e) {
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: e instanceof Error ? e.message : 'Failed to export scenarios',
      });
    }
  }, [statusFilter, ruleSetFilter, selectedTags, addNotification]);

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
            onClick={handleExportCSV}
            disabled={loading || totalItems === 0}
            className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50"
            style={{ borderColor: 'var(--color-border)', fontSize: '14px' }}
            title="Export scenarios to CSV"
          >
            <Download size={18} />
            Export
          </button>
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
                  <span
                    className="ml-1 px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: selectedTags.includes(tag) ? 'rgba(255,255,255,0.2)' : 'var(--color-surface)',
                      fontSize: '10px',
                      fontWeight: 600,
                      minWidth: '18px',
                      textAlign: 'center'
                    }}
                  >
                    {tagCounts[tag] || 0}
                  </span>
                  {selectedTags.includes(tag) && <X size={12} />}
                </button>
              ))
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>No tags available</span>
            )}
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="ml-2 text-xs hover:underline"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Clear tags
              </button>
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
                  <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Tags</th>
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
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {scenario.tags && scenario.tags.length > 0 ? (
                          scenario.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              onClick={() => toggleTagFilter(tag)}
                              className="inline-flex items-center px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                              style={{
                                backgroundColor: selectedTags.includes(tag) ? 'var(--color-primary)' : 'var(--color-surface)',
                                color: selectedTags.includes(tag) ? '#FFFFFF' : 'var(--color-text-secondary)',
                                fontSize: '11px',
                                border: '1px solid var(--color-border)'
                              }}
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>—</span>
                        )}
                        {scenario.tags && scenario.tags.length > 3 && (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: 'var(--color-surface)',
                              color: 'var(--color-text-muted)',
                              fontSize: '11px',
                              border: '1px solid var(--color-border)'
                            }}
                          >
                            +{scenario.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="p-2 hover:bg-[var(--color-surface)] rounded transition-colors"
                              title="More actions"
                            >
                              <MoreVertical size={18} style={{ color: 'var(--color-text-secondary)' }} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="min-w-[150px]"
                            style={{
                              backgroundColor: 'var(--color-background)',
                              border: '1px solid var(--color-border)',
                              boxShadow: 'var(--shadow-2)'
                            }}
                          >
                            <DropdownMenuItem
                              onClick={() => handleClone(scenario.id)}
                              className="cursor-pointer"
                              style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}
                            >
                              <Copy size={16} className="mr-2" /> Clone
                            </DropdownMenuItem>
                            {scenario.status !== 'ACTIVE' && (
                              <DropdownMenuItem
                                onClick={() => handleActivate(scenario.id)}
                                className="cursor-pointer"
                                style={{ fontSize: '14px', color: 'var(--color-success)' }}
                              >
                                <Check size={16} className="mr-2" /> Activate
                              </DropdownMenuItem>
                            )}
                            {scenario.status !== 'ARCHIVED' && (
                              <DropdownMenuItem
                                onClick={() => handleArchive(scenario.id)}
                                className="cursor-pointer"
                                style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}
                              >
                                <Archive size={16} className="mr-2" /> Archive
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator style={{ backgroundColor: 'var(--color-border)' }} />
                            <DropdownMenuItem
                              onClick={() => setConfirmDelete(scenario.id)}
                              className="cursor-pointer"
                              variant="destructive"
                              style={{ fontSize: '14px', color: 'var(--color-error)' }}
                            >
                              <Trash2 size={16} className="mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="p-4 border-t" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalElements={totalItems}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              pageSizeOptions={[5, 10, 20, 50, 100]}
              showPageSizeSelector={true}
              showPageInfo={true}
              showFirstLast={true}
            />
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

    </div>
  );
}