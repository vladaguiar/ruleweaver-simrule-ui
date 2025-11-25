import React from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FileText, Mail, Download, AlertCircle } from 'lucide-react';

const ruleSetCoverage = [
  { name: 'customer-validation', coverage: 95, color: '#C3E770' },
  { name: 'order-processing', coverage: 78, color: '#87C1F1' },
  { name: 'pricing-rules', coverage: 85, color: '#87C1F1' },
  { name: 'account-management', coverage: 62, color: '#F7EA73' },
  { name: 'shipping-calculation', coverage: 89, color: '#C3E770' },
];

const heatmapData = [
  { rule: 'AGE_VERIFY', hits: 45, status: 'covered', color: '#285A84' },
  { rule: 'COUNTRY_CHECK', hits: 30, status: 'covered', color: '#87C1F1' },
  { rule: 'CREDIT_SCORE', hits: 42, status: 'covered', color: '#285A84' },
  { rule: 'PREMIUM_BONUS', hits: 8, status: 'low', color: '#F7EA73' },
  { rule: 'VIP_DISCOUNT', hits: 0, status: 'untested', color: '#E9ECEF' },
];

const untestedRules = [
  { name: 'VIP_DISCOUNT_RULE', ruleSet: 'pricing-rules', risk: 'high' },
  { name: 'ENTERPRISE_SETUP', ruleSet: 'account-management', risk: 'medium' },
  { name: 'INTERNATIONAL_SHIPPING', ruleSet: 'shipping-calculation', risk: 'low' },
];

const trendData = [
  { date: 'Nov 1', coverage: 72 },
  { date: 'Nov 8', coverage: 76 },
  { date: 'Nov 15', coverage: 81 },
  { date: 'Nov 22', coverage: 87 },
];

export function Coverage() {
  const overallCoverage = 87;
  const totalRules = 156;
  const testedRules = 136;
  const untestedCount = 20;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1>Coverage Report</h1>
        <div className="flex items-center gap-2 px-4 py-2 bg-[#E3F2FD] rounded">
          <span style={{ fontSize: '14px', color: 'var(--color-primary)', fontWeight: 500 }}>📅 Last 30 Days</span>
        </div>
      </div>

      {/* Coverage Overview */}
      <div className="bg-[var(--color-background)] rounded-lg p-6" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
        <h3 className="mb-6 text-center" style={{ color: 'var(--color-text-primary)' }}>Coverage Overview</h3>
        <div className="flex flex-col items-center">
          <div className="relative" style={{ width: '200px', height: '200px' }}>
            {/* Circular Progress */}
            <svg className="transform -rotate-90" viewBox="0 0 200 200" style={{ width: '200px', height: '200px' }}>
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="var(--color-surface)"
                strokeWidth="20"
              />
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="20"
                strokeDasharray={`${(overallCoverage / 100) * 502.4} 502.4`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span style={{ fontSize: '48px', fontWeight: 700, color: 'var(--color-primary)' }}>
                {overallCoverage}%
              </span>
            </div>
          </div>
          <div className="flex gap-8 mt-6">
            <div className="text-center">
              <span
                className="inline-block px-4 py-2 rounded"
                style={{ backgroundColor: 'var(--color-surface)', fontSize: '14px', fontWeight: 600, border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              >
                Total Rules: {totalRules}
              </span>
            </div>
            <div className="text-center">
              <span
                className="inline-block px-4 py-2 rounded"
                style={{ backgroundColor: '#E8F5E9', fontSize: '14px', fontWeight: 600, color: '#1B5E20' }}
              >
                Tested: {testedRules}
              </span>
            </div>
            <div className="text-center">
              <span
                className="inline-block px-4 py-2 rounded"
                style={{ backgroundColor: '#FFEBEE', fontSize: '14px', fontWeight: 600, color: 'var(--color-error)' }}
              >
                Untested: {untestedCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Coverage by Rule Set */}
      <div className="bg-[var(--color-background)] rounded-lg p-6" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
        <h3 className="mb-4" style={{ color: 'var(--color-text-primary)' }}>Coverage by Rule Set</h3>
        <div className="space-y-4">
          {ruleSetCoverage.map((ruleSet, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{ruleSet.name}</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>
                  {ruleSet.coverage}%
                </span>
              </div>
              <div className="relative w-full h-8 rounded overflow-hidden" style={{ backgroundColor: 'var(--color-surface)' }}>
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-500"
                  style={{
                    width: `${ruleSet.coverage}%`,
                    backgroundColor: ruleSet.color,
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Coverage Heatmap */}
      <div className="bg-[var(--color-background)] rounded-lg p-6" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
        <div className="flex justify-between items-center mb-4">
          <h3 style={{ color: 'var(--color-text-primary)' }}>Coverage Heatmap</h3>
          <select
            className="px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
          >
            <option>customer-validation</option>
            <option>order-processing</option>
            <option>pricing-rules</option>
            <option>account-management</option>
          </select>
        </div>
        <div className="space-y-3">
          {heatmapData.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 rounded"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <div className="flex-1">
                <span style={{ fontSize: '14px', fontWeight: 500, fontFamily: 'Roboto Mono', color: 'var(--color-text-primary)' }}>
                  {item.rule}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-48 h-6 rounded overflow-hidden border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                  <div
                    className="h-full"
                    style={{
                      width: `${Math.min((item.hits / 50) * 100, 100)}%`,
                      backgroundColor: item.color,
                    }}
                  ></div>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', width: '60px' }}>
                  {item.hits} hits
                </span>
                <span
                  className="inline-block px-3 py-1 rounded-full"
                  style={{
                    backgroundColor:
                      item.status === 'covered'
                        ? '#C3E770'
                        : item.status === 'low'
                        ? '#F7EA73'
                        : '#EF6F53',
                    color:
                      item.status === 'covered'
                        ? '#1B5E20'
                        : item.status === 'low'
                        ? '#5D4037'
                        : '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 500,
                    width: '100px',
                    textAlign: 'center',
                  }}
                >
                  {item.status === 'covered' ? '✅ Covered' : item.status === 'low' ? '⚠️ Low' : '❌ Untested'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Untested Rules */}
      <div className="bg-[var(--color-background)] rounded-lg p-6" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
        <div className="flex justify-between items-center mb-4">
          <h3 style={{ color: 'var(--color-text-primary)' }}>Untested Rules</h3>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-white rounded hover:bg-[#FC7857] transition-colors"
            style={{ fontSize: '14px', fontWeight: 500 }}
          >
            + Create Scenarios
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Rule Name</th>
                <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Rule Set</th>
                <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Risk</th>
              </tr>
            </thead>
            <tbody>
              {untestedRules.map((rule, index) => (
                <tr
                  key={index}
                  className="border-b hover:bg-[var(--color-surface)] cursor-pointer transition-colors"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <td className="p-4" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{rule.name}</td>
                  <td className="p-4" style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{rule.ruleSet}</td>
                  <td className="p-4">
                    <span className="flex items-center gap-2">
                      <span
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor:
                            rule.risk === 'high'
                              ? '#EF6F53'
                              : rule.risk === 'medium'
                              ? '#F7EA73'
                              : '#C3E770',
                        }}
                      ></span>
                      <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                        {rule.risk === 'high' ? '🔴 High' : rule.risk === 'medium' ? '🟡 Med' : '🟢 Low'}
                      </span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Coverage Trend */}
      <div className="bg-[var(--color-background)] rounded-lg p-6" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
        <h3 className="mb-4" style={{ color: 'var(--color-text-primary)' }}>Coverage Trend</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="colorCoverage" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#285A84" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#285A84" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="date" stroke="var(--color-text-secondary)" style={{ fontSize: '12px' }} />
            <YAxis stroke="var(--color-text-secondary)" style={{ fontSize: '12px' }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-2)',
                color: 'var(--color-text-primary)',
              }}
            />
            {/* Goal Line at 90% */}
            <line
              x1="0%"
              y1="10%"
              x2="100%"
              y2="10%"
              stroke="#C3E770"
              strokeDasharray="5 5"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="coverage"
              stroke="#285A84"
              strokeWidth={2}
              fill="url(#colorCoverage)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Actions */}
      <div className="bg-[var(--color-background)] rounded-lg p-6" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
        <h3 className="mb-4" style={{ color: 'var(--color-text-primary)' }}>Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-6 py-3 border text-[var(--color-primary)] rounded hover:bg-[var(--color-surface)] transition-colors" style={{ fontSize: '14px', fontWeight: 500, borderColor: 'var(--color-border)' }}>
            <FileText size={18} />
            Generate PDF Report
          </button>
          <button className="flex items-center gap-2 px-6 py-3 border text-[var(--color-primary)] rounded hover:bg-[var(--color-surface)] transition-colors" style={{ fontSize: '14px', fontWeight: 500, borderColor: 'var(--color-border)' }}>
            <Mail size={18} />
            Email Report
          </button>
          <button className="flex items-center gap-2 px-6 py-3 border text-[var(--color-primary)] rounded hover:bg-[var(--color-surface)] transition-colors" style={{ fontSize: '14px', fontWeight: 500, borderColor: 'var(--color-border)' }}>
            <Download size={18} />
            Export
          </button>
        </div>
      </div>
    </div>
  );
}