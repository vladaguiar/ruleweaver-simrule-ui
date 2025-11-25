import React, { useState } from 'react';
import { Search, Upload, Eye, Edit, Download, Trash2, Database } from 'lucide-react';

const datasetsData = [
  {
    id: 1,
    name: 'Customer Data',
    type: 'JSON Array',
    records: 250,
    size: '2.4 MB',
    version: '2.1',
    updated: '2h ago',
    scenarios: ['Customer Onboarding (SCEN_001)', 'Account Validation (SCEN_015)', 'Premium Upgrade (SCEN_032)'],
  },
  {
    id: 2,
    name: 'Order Samples',
    type: 'CSV',
    records: 180,
    size: '1.8 MB',
    version: '1.3',
    updated: '1d ago',
    scenarios: ['Order Processing (SCEN_002)', 'Pricing Rules (SCEN_003)'],
  },
  {
    id: 3,
    name: 'Payment Records',
    type: 'JSON',
    records: 320,
    size: '3.1 MB',
    version: '1.0',
    updated: '3h ago',
    scenarios: ['Payment Validation (SCEN_005)'],
  },
  {
    id: 4,
    name: 'Shipping Data',
    type: 'Excel',
    records: 150,
    size: '2.2 MB',
    version: '2.0',
    updated: '5h ago',
    scenarios: ['Shipping Calculation (SCEN_004)'],
  },
];

export function Datasets() {
  const [selectedDataset, setSelectedDataset] = useState<typeof datasetsData[0] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDatasets = datasetsData.filter(dataset =>
    dataset.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeColor = (type: string) => {
    if (type.includes('JSON')) return 'var(--color-primary)';
    if (type === 'CSV') return '#C3E770';
    if (type === 'Excel') return '#87C1F1';
    return 'var(--color-text-secondary)';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 style={{ color: 'var(--color-text-primary)' }}>Test Datasets</h1>
        <button
          className="flex items-center gap-2 px-6 py-2 bg-[var(--color-accent)] text-white rounded hover:bg-[#FC7857] transition-colors"
          style={{ boxShadow: 'var(--shadow-1)', fontSize: '14px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}
        >
          <Upload size={18} />
          Upload
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-[var(--color-background)] rounded-lg p-4" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-muted)]" size={20} />
          <input
            type="text"
            placeholder="Search datasets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
          />
        </div>
      </div>

      {/* Datasets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ marginTop: '5px', marginBottom: '5px', gap: '10px' }}>
        {filteredDatasets.map((dataset) => (
          <div
            key={dataset.id}
            className="bg-[var(--color-background)] rounded-lg p-6 cursor-pointer transition-all border-2 hover:bg-[var(--color-surface)]"
            style={{ boxShadow: 'var(--shadow-1)', borderColor: 'transparent' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'transparent';
            }}
            onClick={() => setSelectedDataset(dataset)}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: `${getTypeColor(dataset.type)}15` }}
              >
                <Database size={32} style={{ color: getTypeColor(dataset.type) }} />
              </div>
              <span
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: '#E3F2FD', color: 'var(--color-primary)', fontSize: '12px', fontWeight: 500 }}
              >
                v{dataset.version}
              </span>
            </div>
            <h4 className="mb-2" style={{ color: 'var(--color-text-primary)' }}>{dataset.name}</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2" style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                <span>📊</span>
                <span>{dataset.records} records</span>
              </div>
              <div className="flex items-center gap-2" style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                <span>📁</span>
                <span>{dataset.type}</span>
              </div>
              <div className="flex items-center gap-2" style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                <span>💾</span>
                <span>{dataset.size}</span>
              </div>
              <div className="flex items-center gap-2" style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                <span>🕒</span>
                <span>Updated {dataset.updated}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border rounded hover:bg-[var(--color-surface)] transition-colors"
                style={{ borderColor: 'var(--color-border)', fontSize: '13px', color: 'var(--color-text-primary)' }}
              >
                <Eye size={16} />
                View
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border rounded hover:bg-[var(--color-surface)] transition-colors"
                style={{ borderColor: 'var(--color-border)', fontSize: '13px', color: 'var(--color-text-primary)' }}
              >
                <Edit size={16} />
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Panel */}
      {selectedDataset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6" onClick={() => setSelectedDataset(null)}>
          <div
            className="bg-[var(--color-background)] rounded-lg p-8 max-w-2xl w-full"
            style={{ boxShadow: 'var(--shadow-4)', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--color-border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <h2 style={{ color: 'var(--color-text-primary)' }}>{selectedDataset.name}</h2>
              <button
                onClick={() => setSelectedDataset(null)}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                style={{ fontSize: '24px' }}
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Name:</span>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{selectedDataset.name}</p>
                </div>
                <div>
                  <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Type:</span>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{selectedDataset.type}</p>
                </div>
                <div>
                  <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Records:</span>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{selectedDataset.records}</p>
                </div>
                <div>
                  <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Size:</span>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{selectedDataset.size}</p>
                </div>
                <div>
                  <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Version:</span>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{selectedDataset.version}</p>
                </div>
                <div>
                  <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Last Modified:</span>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{selectedDataset.updated}</p>
                </div>
              </div>

              <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <h5 className="mb-3" style={{ color: 'var(--color-text-primary)' }}>Used In Scenarios:</h5>
                <ul className="space-y-2">
                  {selectedDataset.scenarios.map((scenario, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span style={{ color: 'var(--color-primary)' }}>•</span>
                      <button
                        className="text-[var(--color-primary)] hover:underline"
                        style={{ fontSize: '14px' }}
                      >
                        {scenario}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-3 pt-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <button className="flex items-center gap-2 px-4 py-2 border border-[var(--color-primary)] text-[var(--color-primary)] rounded hover:bg-[var(--color-surface)] transition-colors" style={{ fontSize: '14px', fontWeight: 500 }}>
                  <Eye size={18} />
                  Preview Records
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-[var(--color-primary)] text-[var(--color-primary)] rounded hover:bg-[var(--color-surface)] transition-colors" style={{ fontSize: '14px', fontWeight: 500 }}>
                  <Download size={18} />
                  Download
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-[var(--color-error)] text-[var(--color-error)] rounded hover:bg-[#FFEBEE] transition-colors" style={{ fontSize: '14px', fontWeight: 500 }}>
                  <Trash2 size={18} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Instructions */}
      <div className="bg-[#E3F2FD] rounded-lg p-6 border-2 border-dashed" style={{ borderColor: 'var(--color-primary)' }}>
        <div className="text-center">
          <Upload size={48} style={{ color: 'var(--color-primary)', margin: '0 auto 16px' }} />
          <h4 className="mb-2">Upload New Dataset</h4>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
            Drag and drop your files here, or click the Upload button above
          </p>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Supported formats: JSON, CSV, Excel (.xlsx)
          </p>
        </div>
      </div>
    </div>
  );
}