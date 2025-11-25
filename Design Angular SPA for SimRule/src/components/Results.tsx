import React, { useState } from 'react';
import { Search, Download, FileText, Table, FileJson } from 'lucide-react';

const resultsData = [
  {
    id: 1,
    name: 'Customer Validation',
    status: 'pass',
    duration: '1.2s',
    rulesFired: '3/3',
    details: {
      scenarioId: 'SCEN_001',
      executedAt: '2025-11-22 14:23:46 UTC',
      inputData: { factType: 'Customer', factData: { customerId: 'CUST_001', age: 25, country: 'USA' } },
      rulesFiredList: ['AGE_VERIFICATION_RULE (12ms)', 'COUNTRY_ELIGIBILITY_RULE (8ms)', 'PREMIUM_ACCOUNT_BONUS (15ms)'],
      comparison: [
        { property: 'eligibilityScore', expected: '>= 80', actual: '85', match: true },
        { property: 'approvalStatus', expected: '"APPROVED"', actual: '"APPROVED"', match: true },
        { property: 'discount', expected: '>= 10%', actual: '15%', match: true },
      ],
    },
  },
  {
    id: 2,
    name: 'Order Processing',
    status: 'pass',
    duration: '2.1s',
    rulesFired: '5/5',
    details: null,
  },
  {
    id: 3,
    name: 'Pricing Rules',
    status: 'fail',
    duration: '1.8s',
    rulesFired: '2/4',
    errorMessage: 'Expected: discount >= 10%, Got: 5%',
    details: null,
  },
  {
    id: 4,
    name: 'Account Setup',
    status: 'warning',
    duration: '0.9s',
    rulesFired: '2/2',
    details: null,
  },
  {
    id: 5,
    name: 'Shipping Calculation',
    status: 'pass',
    duration: '1.5s',
    rulesFired: '4/4',
    details: null,
  },
];

export function Results() {
  const [selectedResult, setSelectedResult] = useState<typeof resultsData[0] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredResults = resultsData.filter(result => {
    const matchesSearch = result.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || result.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const passed = resultsData.filter(r => r.status === 'pass').length;
  const failed = resultsData.filter(r => r.status === 'fail').length;
  const warnings = resultsData.filter(r => r.status === 'warning').length;
  const totalDuration = '3m 24s';

  if (selectedResult?.details) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedResult(null)}
            className="text-[var(--color-primary)] hover:underline"
            style={{ fontSize: '14px', fontWeight: 500 }}
          >
            ← Back to Results
          </button>
          <h1>Scenario: {selectedResult.name}</h1>
        </div>

        {/* Execution Details */}
        <div className="bg-[var(--color-background)] rounded-lg p-6" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
          <h3 className="mb-4">Execution Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Scenario ID:</span>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{selectedResult.details.scenarioId}</p>
            </div>
            <div>
              <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Executed At:</span>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{selectedResult.details.executedAt}</p>
            </div>
            <div>
              <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Duration:</span>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{selectedResult.duration}</p>
            </div>
            <div>
              <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Status:</span>
              <p>
                <span
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: '#C3E770',
                    color: '#1B5E20',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  ✅ PASS
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Input Data */}
        <div className="bg-[var(--color-background)] rounded-lg p-6" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
          <h3 className="mb-4">Input Data</h3>
          <pre
            className="bg-[var(--color-surface)] p-4 rounded overflow-x-auto"
            style={{ fontFamily: 'Roboto Mono', fontSize: '12px', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            {JSON.stringify(selectedResult.details.inputData, null, 2)}
          </pre>
        </div>

        {/* Rules Fired */}
        <div className="bg-[var(--color-background)] rounded-lg p-6" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
          <h3 className="mb-4">Rules Fired</h3>
          <div className="space-y-2">
            {selectedResult.details.rulesFiredList.map((rule, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-3 rounded"
                style={{ fontSize: '14px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                <span style={{ color: '#C3E770', fontSize: '18px' }}>✅</span>
                <span style={{ fontFamily: 'Roboto Mono', color: 'var(--color-text-primary)' }}>{rule}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison */}
        <div className="bg-[var(--color-background)] rounded-lg p-6" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
          <h3 className="mb-4">Comparison: Expected vs Actual</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                  <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Property</th>
                  <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Expected</th>
                  <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Actual</th>
                  <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Match</th>
                </tr>
              </thead>
              <tbody>
                {selectedResult.details.comparison.map((item, index) => (
                  <tr
                    key={index}
                    className="border-b"
                    style={{
                      borderColor: 'var(--color-border)',
                      backgroundColor: item.match ? '#E8F5E9' : '#FFEBEE',
                    }}
                  >
                    <td className="p-4" style={{ fontSize: '14px', fontWeight: 500 }}>{item.property}</td>
                    <td className="p-4" style={{ fontSize: '14px', fontFamily: 'Roboto Mono' }}>{item.expected}</td>
                    <td className="p-4" style={{ fontSize: '14px', fontFamily: 'Roboto Mono' }}>{item.actual}</td>
                    <td className="p-4" style={{ fontSize: '14px' }}>
                      {item.match ? '✅' : '❌'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1>Results: Batch_20251122_143045</h1>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 border rounded hover:bg-[var(--color-surface)] transition-colors"
            style={{ borderColor: 'var(--color-border)', fontSize: '14px', fontWeight: 500 }}
          >
            📊 Overview
          </button>
          <button
            className="px-4 py-2 border rounded hover:bg-[var(--color-surface)] transition-colors"
            style={{ borderColor: 'var(--color-border)', fontSize: '14px', fontWeight: 500 }}
          >
            Details
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="bg-[#E3F2FD] rounded-lg p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '16px', fontWeight: 600 }}>✅ {passed} Passed</span>
          </div>
          <div className="h-6 w-px bg-[#87C1F1]"></div>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '16px', fontWeight: 600 }}>❌ {failed} Failed</span>
          </div>
          <div className="h-6 w-px bg-[#87C1F1]"></div>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '16px', fontWeight: 600 }}>⚠️ {warnings} Warnings</span>
          </div>
          <div className="h-6 w-px bg-[#87C1F1]"></div>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '16px', fontWeight: 600 }}>⏱️ {totalDuration}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[var(--color-background)] rounded-lg p-4 flex flex-col md:flex-row gap-4" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
        >
          <option value="all">All Status</option>
          <option value="pass">Pass</option>
          <option value="fail">Fail</option>
          <option value="warning">Warning</option>
        </select>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-muted)]" size={20} />
          <input
            type="text"
            placeholder="Search results..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
          />
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-[var(--color-background)] rounded-lg overflow-hidden" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Scenario Name</th>
                <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Status</th>
                <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Duration</th>
                <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Rules Fired</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((result) => (
                <React.Fragment key={result.id}>
                  <tr
                    className="border-b hover:bg-[var(--color-surface)] cursor-pointer transition-colors"
                    style={{ borderColor: 'var(--color-border)' }}
                    onClick={() => result.details && setSelectedResult(result)}
                  >
                    <td className="p-4" style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{result.name}</td>
                    <td className="p-4">
                      <span
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full"
                        style={{
                          backgroundColor:
                            result.status === 'pass'
                              ? '#C3E770'
                              : result.status === 'fail'
                              ? '#EF6F53'
                              : '#F7EA73',
                          color:
                            result.status === 'pass'
                              ? '#1B5E20'
                              : result.status === 'fail'
                              ? '#FFFFFF'
                              : '#5D4037',
                          fontSize: '12px',
                          fontWeight: 500,
                        }}
                      >
                        {result.status === 'pass' ? '✅ Pass' : result.status === 'fail' ? '❌ Fail' : '⚠️ Warn'}
                      </span>
                    </td>
                    <td
                      className="p-4"
                      style={{
                        fontSize: '14px',
                        color:
                          parseFloat(result.duration) < 1
                            ? '#1B5E20'
                            : parseFloat(result.duration) < 3
                            ? '#5D4037'
                            : 'var(--color-error)',
                        fontWeight: 500,
                      }}
                    >
                      {result.duration}
                    </td>
                    <td className="p-4" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{result.rulesFired}</td>
                  </tr>
                  {result.errorMessage && (
                    <tr className="border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: '#FFEBEE' }}>
                      <td colSpan={4} className="p-4 pl-12" style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--color-error)' }}>
                        └─ {result.errorMessage}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-[var(--color-background)] rounded-lg p-6" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
        <h3 className="mb-4">Export Options</h3>
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-6 py-3 border text-[var(--color-primary)] rounded hover:bg-[var(--color-surface)] transition-colors" style={{ fontSize: '14px', fontWeight: 500, borderColor: 'var(--color-border)' }}>
            <FileText size={18} />
            PDF Report
          </button>
          <button className="flex items-center gap-2 px-6 py-3 border text-[var(--color-primary)] rounded hover:bg-[var(--color-surface)] transition-colors" style={{ fontSize: '14px', fontWeight: 500, borderColor: 'var(--color-border)' }}>
            <Table size={18} />
            CSV Export
          </button>
          <button className="flex items-center gap-2 px-6 py-3 border text-[var(--color-primary)] rounded hover:bg-[var(--color-surface)] transition-colors" style={{ fontSize: '14px', fontWeight: 500, borderColor: 'var(--color-border)' }}>
            <FileJson size={18} />
            JSON Export
          </button>
        </div>
      </div>
    </div>
  );
}