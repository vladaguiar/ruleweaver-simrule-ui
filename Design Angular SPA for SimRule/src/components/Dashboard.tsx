import React from 'react';
import { TrendingUp, Activity, Target, CheckCircle, Plus } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const kpiData = [
  { label: 'Total Scenarios', value: '156', trend: '+12%', icon: Activity, color: 'var(--color-primary)' },
  { label: 'Active Sims', value: '12', status: 'Live', icon: Activity, color: 'var(--color-accent)' },
  { label: 'Coverage Score', value: '87%', trend: '+5%', icon: Target, color: 'var(--color-success)' },
  { label: 'Recent Runs', value: '45', status: '42 Pass', icon: CheckCircle, color: 'var(--color-info)' },
];

const activityData = [
  { date: 'Mon', tests: 24, passed: 22 },
  { date: 'Tue', tests: 31, passed: 28 },
  { date: 'Wed', tests: 28, passed: 26 },
  { date: 'Thu', tests: 35, passed: 32 },
  { date: 'Fri', tests: 42, passed: 38 },
  { date: 'Sat', tests: 18, passed: 17 },
  { date: 'Sun', tests: 15, passed: 15 },
];

const recentSimulations = [
  { name: 'Customer Validation', status: 'pass', duration: '2.4s', results: '45/45' },
  { name: 'Order Processing', status: 'fail', duration: '3.1s', results: '23/30' },
  { name: 'Pricing Rules', status: 'warning', duration: '1.8s', results: '28/30' },
  { name: 'Account Setup', status: 'pass', duration: '1.2s', results: '20/20' },
  { name: 'Shipping Calculation', status: 'pass', duration: '2.7s', results: '35/35' },
];

const coverageData = [
  { name: 'Covered', value: 136, color: '#C3E770' },
  { name: 'Untested', value: 20, color: '#EF6F53' },
];

export function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1>Dashboard</h1>
        <button
          className="flex items-center gap-2 px-6 py-2 bg-[var(--color-accent)] text-white rounded hover:bg-[#FC7857] transition-colors"
          style={{ boxShadow: 'var(--shadow-1)', fontSize: '14px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}
        >
          <Plus size={18} />
          New Scenario
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4" style={{ gap: '5px' }}>
        {kpiData.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div
              key={index}
              className="bg-[var(--color-background)] rounded-lg p-6"
              style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: `${kpi.color}15` }}>
                  <Icon size={24} style={{ color: kpi.color }} />
                </div>
                {kpi.trend && (
                  <span className="flex items-center gap-1 text-[var(--color-success)]" style={{ fontSize: '12px', fontWeight: 500 }}>
                    <TrendingUp size={14} />
                    {kpi.trend}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1 }}>
                {kpi.value}
              </div>
              <div className="mt-2" style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                {kpi.label}
              </div>
              {kpi.status && (
                <div className="mt-2 inline-block px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary)', fontSize: '12px', fontWeight: 500, border: '1px solid var(--color-border)' }}>
                  {kpi.status}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ marginTop: '5px', marginBottom: '5px', gap: '5px' }}>
        {/* Activity Timeline */}
        <div className="bg-[var(--color-background)] rounded-lg p-6" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
          <h3 className="mb-4">Recent Activity Timeline</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" stroke="var(--color-text-secondary)" style={{ fontSize: '12px' }} />
              <YAxis stroke="var(--color-text-secondary)" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-2)',
                  color: 'var(--color-text-primary)',
                }}
              />
              <Line type="monotone" dataKey="tests" stroke="#285A84" strokeWidth={2} name="Total Tests" />
              <Line type="monotone" dataKey="passed" stroke="#87C1F1" strokeWidth={2} name="Passed" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Coverage Chart */}
        <div className="bg-[var(--color-background)] rounded-lg p-6" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
          <h3 className="mb-4">Rule Coverage Overview</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={coverageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {coverageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-2)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {coverageData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                  {item.name}: {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-[var(--color-background)] rounded-lg p-6" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
        <h3 className="mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button className="px-6 py-3 bg-[var(--color-primary)] text-white rounded hover:bg-[#1D4261] transition-colors" style={{ fontSize: '14px', fontWeight: 500 }}>
            Create Scenario
          </button>
          <button className="px-6 py-3 bg-[var(--color-accent)] text-white rounded hover:bg-[#FC7857] transition-colors" style={{ fontSize: '14px', fontWeight: 500 }}>
            Run Simulation
          </button>
          <button className="px-6 py-3 border text-[var(--color-primary)] rounded hover:bg-[var(--color-surface)] transition-colors" style={{ fontSize: '14px', fontWeight: 500, borderColor: 'var(--color-border)' }}>
            View Reports
          </button>
          <button className="px-6 py-3 border text-[var(--color-primary)] rounded hover:bg-[var(--color-surface)] transition-colors" style={{ fontSize: '14px', fontWeight: 500, borderColor: 'var(--color-border)' }}>
            Manage Datasets
          </button>
        </div>
      </div>

      {/* Recent Simulations */}
      <div className="bg-[var(--color-background)] rounded-lg p-6" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)', marginTop: '5px' }}>
        <div className="flex justify-between items-center mb-4">
          <h3>Recent Simulations</h3>
          <button className="text-[var(--color-primary)] hover:underline" style={{ fontSize: '14px', fontWeight: 500 }}>
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Scenario Name</th>
                <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Status</th>
                <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Duration</th>
                <th className="text-left p-4" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Results</th>
              </tr>
            </thead>
            <tbody>
              {recentSimulations.map((sim, index) => (
                <tr
                  key={index}
                  className="border-b hover:bg-[var(--color-surface)] cursor-pointer transition-colors"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <td className="p-4" style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{sim.name}</td>
                  <td className="p-4">
                    <span
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full"
                      style={{
                        backgroundColor:
                          sim.status === 'pass'
                            ? '#C3E770'
                            : sim.status === 'fail'
                            ? '#EF6F53'
                            : '#F7EA73',
                        color:
                          sim.status === 'pass'
                            ? '#1B5E20'
                            : sim.status === 'fail'
                            ? '#FFFFFF'
                            : '#5D4037',
                        fontSize: '12px',
                        fontWeight: 500,
                      }}
                    >
                      {sim.status === 'pass' ? '✅' : sim.status === 'fail' ? '❌' : '⚠️'}
                      {sim.status === 'pass' ? 'Pass' : sim.status === 'fail' ? 'Fail' : 'Warning'}
                    </span>
                  </td>
                  <td className="p-4" style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{sim.duration}</td>
                  <td className="p-4" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{sim.results}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}