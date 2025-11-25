import React, { useState } from 'react';
import { Search, Plus, Filter, Play, Copy, Trash2, Check } from 'lucide-react';

const scenariosData = [
  { id: 1, name: 'Customer Onboarding', status: 'active', ruleSet: 'CustVal', lastRun: '2h ago', tags: ['customer', 'onboarding'] },
  { id: 2, name: 'Order Pricing', status: 'draft', ruleSet: 'Pricing', lastRun: '1d ago', tags: ['pricing', 'orders'] },
  { id: 3, name: 'Account Setup', status: 'active', ruleSet: 'Account', lastRun: '3h ago', tags: ['account', 'setup'] },
  { id: 4, name: 'Shipping Calculation', status: 'active', ruleSet: 'Shipping', lastRun: '5h ago', tags: ['shipping'] },
  { id: 5, name: 'Payment Validation', status: 'draft', ruleSet: 'Payment', lastRun: '2d ago', tags: ['payment', 'validation'] },
  { id: 6, name: 'Inventory Check', status: 'active', ruleSet: 'Inventory', lastRun: '1h ago', tags: ['inventory'] },
  { id: 7, name: 'Discount Rules', status: 'archived', ruleSet: 'Pricing', lastRun: '7d ago', tags: ['discount', 'pricing'] },
  { id: 8, name: 'Tax Calculation', status: 'active', ruleSet: 'Tax', lastRun: '4h ago', tags: ['tax'] },
];

export function Scenarios() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScenarios, setSelectedScenarios] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredScenarios = scenariosData.filter(scenario => {
    const matchesSearch = scenario.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || scenario.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleScenario = (id: number) => {
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
        <h1>Scenarios</h1>
        <button
          className="flex items-center gap-2 px-6 py-2 bg-[var(--color-accent)] text-white rounded hover:bg-[#FC7857] transition-colors"
          style={{ boxShadow: 'var(--shadow-1)', fontSize: '14px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}
        >
          <Plus size={18} />
          Create
        </button>
      </div>

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
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            style={{ 
              borderColor: 'var(--color-border)', 
              fontSize: '14px',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)'
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <button className="px-4 py-2 border rounded hover:bg-[var(--color-surface)] transition-colors" style={{ borderColor: 'var(--color-border)' }}>
            <Filter size={20} style={{ color: 'var(--color-text-secondary)' }} />
          </button>
        </div>
      </div>

      {/* Filter Tags */}
      <div className="bg-[var(--color-surface)] rounded-lg p-4" style={{ border: '1px solid var(--color-border)' }}>
        <div className="flex flex-wrap gap-2">
          <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Tags:</span>
          {['customer-rules', 'pricing', 'validation', 'payment'].map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full cursor-pointer hover:bg-[var(--color-primary)] hover:text-white transition-colors"
              style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-primary)', fontSize: '12px', fontWeight: 500, border: '1px solid var(--color-border)' }}
            >
              🏷️ {tag}
              <span className="cursor-pointer">×</span>
            </span>
          ))}
        </div>
      </div>

      {/* Scenarios Table */}
      <div className="bg-[var(--color-background)] rounded-lg overflow-hidden" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
        <div className="overflow-x-auto">
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
                <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Last Run</th>
                <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredScenarios.map((scenario, index) => (
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
                    <button className="hover:underline text-[var(--color-primary)]" style={{ fontSize: '14px', fontWeight: 500 }}>
                      {scenario.name}
                    </button>
                  </td>
                  <td className="p-4">
                    <span
                      className="inline-block px-3 py-1 rounded-full"
                      style={{
                        backgroundColor:
                          scenario.status === 'active'
                            ? '#C3E770'
                            : scenario.status === 'draft'
                            ? '#C7CDD0'
                            : '#ADB5BD',
                        color:
                          scenario.status === 'active'
                            ? '#1B5E20'
                            : scenario.status === 'draft'
                            ? '#212529'
                            : '#FFFFFF',
                        fontSize: '12px',
                        fontWeight: 500,
                      }}
                    >
                      {scenario.status.charAt(0).toUpperCase() + scenario.status.slice(1)}
                    </span>
                  </td>
                  <td className="p-4" style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{scenario.ruleSet}</td>
                  <td className="p-4" style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>{scenario.lastRun}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-[var(--color-surface)] rounded transition-colors" title="Run">
                        <Play size={18} style={{ color: 'var(--color-primary)' }} />
                      </button>
                      <button className="p-2 hover:bg-[var(--color-surface)] rounded transition-colors" title="Clone">
                        <Copy size={18} style={{ color: 'var(--color-text-secondary)' }} />
                      </button>
                      <button className="p-2 hover:bg-[var(--color-surface)] rounded transition-colors" title="Delete">
                        <Trash2 size={18} style={{ color: 'var(--color-error)' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-2 p-4 border-t" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <button className="px-3 py-1 rounded hover:bg-[var(--color-background)] transition-colors" style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            Previous
          </button>
          {[1, 2, 3, '...', 10].map((page, index) => (
            <button
              key={index}
              className="px-3 py-1 rounded transition-colors"
              style={{
                fontSize: '14px',
                backgroundColor: page === 1 ? 'var(--color-primary)' : 'transparent',
                color: page === 1 ? '#FFFFFF' : 'var(--color-primary)',
              }}
            >
              {page}
            </button>
          ))}
          <button className="px-3 py-1 rounded hover:bg-[var(--color-background)] transition-colors" style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            Next
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedScenarios.length > 0 && (
        <div className="fixed bottom-0 left-60 right-0 bg-[var(--color-primary)] text-white p-4 flex items-center justify-between" style={{ boxShadow: 'var(--shadow-3)' }}>
          <span style={{ fontSize: '14px', fontWeight: 500 }}>
            {selectedScenarios.length} selected
          </span>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-white rounded hover:bg-white/10 transition-colors" style={{ fontSize: '14px', fontWeight: 500 }}>
              <Play size={18} />
              Run
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-white rounded hover:bg-white/10 transition-colors" style={{ fontSize: '14px', fontWeight: 500 }}>
              <Copy size={18} />
              Clone
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-white rounded hover:bg-white/10 transition-colors" style={{ fontSize: '14px', fontWeight: 500 }}>
              <Trash2 size={18} />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}