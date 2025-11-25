import React, { useState } from 'react';
import { Save, User, Bell, Lock, Database, Palette } from 'lucide-react';

export function Settings() {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 style={{ color: 'var(--color-text-primary)' }}>Settings</h1>

      {/* Tabs and Content */}
      <div className="bg-[var(--color-background)] rounded-lg overflow-hidden" style={{ boxShadow: 'var(--shadow-1)', border: '1px solid var(--color-border)' }}>
        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: 'var(--color-border)' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 transition-all ${
                  activeTab === tab.id
                    ? 'border-b-3'
                    : 'hover:bg-[var(--color-surface)]'
                }`}
                style={{
                  fontSize: '14px',
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  borderBottom: activeTab === tab.id ? '3px solid var(--color-primary)' : 'none',
                }}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-2xl">
              <h3 style={{ color: 'var(--color-text-primary)' }}>Profile Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    defaultValue="John Doe"
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    defaultValue="john.doe@tekweaver.com"
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                    Role
                  </label>
                  <input
                    type="text"
                    defaultValue="Senior Test Engineer"
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                    Department
                  </label>
                  <select
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                  >
                    <option>Quality Assurance</option>
                    <option>Engineering</option>
                    <option>Operations</option>
                    <option>Management</option>
                  </select>
                </div>
              </div>
              <button
                className="flex items-center gap-2 px-6 py-2 bg-[var(--color-primary)] text-white rounded hover:bg-[#1D4261] transition-colors"
                style={{ fontSize: '14px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}
              >
                <Save size={18} />
                Save Changes
              </button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6 max-w-2xl">
              <h3 style={{ color: 'var(--color-text-primary)' }}>Notification Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[var(--color-surface)] rounded" style={{ border: '1px solid var(--color-border)' }}>
                  <div>
                    <h5 style={{ color: 'var(--color-text-primary)' }}>Email Notifications</h5>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                      Receive email updates about simulation results
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-[var(--color-surface)] rounded" style={{ border: '1px solid var(--color-border)' }}>
                  <div>
                    <h5 style={{ color: 'var(--color-text-primary)' }}>Test Completion Alerts</h5>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                      Get notified when simulations complete
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-[var(--color-surface)] rounded" style={{ border: '1px solid var(--color-border)' }}>
                  <div>
                    <h5 style={{ color: 'var(--color-text-primary)' }}>Failed Test Alerts</h5>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                      Immediate alerts for failed scenarios
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-[var(--color-surface)] rounded" style={{ border: '1px solid var(--color-border)' }}>
                  <div>
                    <h5 style={{ color: 'var(--color-text-primary)' }}>Weekly Summary Reports</h5>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                      Receive weekly coverage and performance reports
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
                  </label>
                </div>
              </div>
              <button
                className="flex items-center gap-2 px-6 py-2 bg-[var(--color-primary)] text-white rounded hover:bg-[#1D4261] transition-colors"
                style={{ fontSize: '14px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}
              >
                <Save size={18} />
                Save Preferences
              </button>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 max-w-2xl">
              <h3 style={{ color: 'var(--color-text-primary)' }}>Security Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                    Current Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                  />
                </div>
                <div className="p-4 bg-[#E3F2FD] rounded" style={{ border: '1px solid var(--color-info)' }}>
                  <p style={{ fontSize: '14px', color: 'var(--color-primary)' }}>
                    💡 Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters.
                  </p>
                </div>
              </div>
              <button
                className="flex items-center gap-2 px-6 py-2 bg-[var(--color-primary)] text-white rounded hover:bg-[#1D4261] transition-colors"
                style={{ fontSize: '14px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}
              >
                <Save size={18} />
                Update Password
              </button>
            </div>
          )}

          {activeTab === 'database' && (
            <div className="space-y-6 max-w-2xl">
              <h3 style={{ color: 'var(--color-text-primary)' }}>Database Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                    Database Host
                  </label>
                  <input
                    type="text"
                    defaultValue="localhost"
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                    Database Port
                  </label>
                  <input
                    type="text"
                    defaultValue="5432"
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                    Database Name
                  </label>
                  <input
                    type="text"
                    defaultValue="simrule_db"
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                  />
                </div>
                <div className="p-4 bg-[#FFF3E0] rounded" style={{ border: '1px solid var(--color-warning)' }}>
                  <p style={{ fontSize: '14px', color: '#5D4037' }}>
                    ⚠️ Changing database settings requires system restart. Ensure you have proper backups before making changes.
                  </p>
                </div>
              </div>
              <button
                className="flex items-center gap-2 px-6 py-2 bg-[var(--color-primary)] text-white rounded hover:bg-[#1D4261] transition-colors"
                style={{ fontSize: '14px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}
              >
                <Save size={18} />
                Save Configuration
              </button>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6 max-w-2xl">
              <h3 style={{ color: 'var(--color-text-primary)' }}>Appearance Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                    Theme
                  </label>
                  <select
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                  >
                    <option>Light Mode</option>
                    <option>Dark Mode (Coming Soon)</option>
                    <option>Auto (System Default)</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                    Sidebar Display
                  </label>
                  <select
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                  >
                    <option>Expanded</option>
                    <option>Collapsed</option>
                    <option>Auto-hide</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>
                    Density
                  </label>
                  <select
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    style={{ borderColor: 'var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                  >
                    <option>Comfortable</option>
                    <option>Compact</option>
                    <option>Spacious</option>
                  </select>
                </div>
                <div className="p-6 rounded" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <h5 className="mb-3" style={{ color: 'var(--color-text-primary)' }}>Preview</h5>
                  <div className="space-y-2">
                    <div className="p-3 bg-[var(--color-primary)] text-white rounded">
                      Primary Color: #285A84
                    </div>
                    <div className="p-3 rounded" style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}>
                      Accent Color: #FD9071
                    </div>
                  </div>
                </div>
              </div>
              <button
                className="flex items-center gap-2 px-6 py-2 bg-[var(--color-primary)] text-white rounded hover:bg-[#1D4261] transition-colors"
                style={{ fontSize: '14px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}
              >
                <Save size={18} />
                Apply Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}