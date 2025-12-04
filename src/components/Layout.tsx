import image_59e9396d40de986427c610e93570952e90e5ca14 from 'figma:asset/59e9396d40de986427c610e93570952e90e5ca14.png';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Menu, Search, Bell, Settings, User, ChevronDown, LayoutDashboard, ClipboardList, Play, BarChart3, Target, Database, Settings as SettingsIcon, Moon, Sun } from 'lucide-react';
import logoImage from 'figma:asset/158e83f25311585383422c644adbd27e0e9a7b0b.png';
import { useTheme } from '@/contexts/ThemeContext';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { GlobalSearchDropdown } from '@/components/GlobalSearchDropdown';
import type { ScenarioResponse, SimulationResponse } from '@/types/api.types';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string, params?: { scenarioId?: string; simulationId?: string }) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'scenarios', label: 'Scenarios', icon: ClipboardList },
  { id: 'simulations', label: 'Simulations', icon: Play },
  { id: 'results', label: 'Results', icon: BarChart3 },
  { id: 'coverage', label: 'Coverage', icon: Target },
  { id: 'datasets', label: 'Datasets', icon: Database },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { effectiveTheme, toggleTheme } = useTheme();
  const darkMode = effectiveTheme === 'dark';

  // Global search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchResults = useGlobalSearch(searchQuery);

  // Handle clicks outside search dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle scenario selection from search
  const handleSelectScenario = useCallback((scenario: ScenarioResponse) => {
    setSearchQuery('');
    setShowSearchDropdown(false);
    onNavigate('scenario-editor', { scenarioId: scenario.id });
  }, [onNavigate]);

  // Handle simulation selection from search
  const handleSelectSimulation = useCallback((simulation: SimulationResponse) => {
    setSearchQuery('');
    setShowSearchDropdown(false);
    onNavigate('results', { simulationId: simulation.id });
  }, [onNavigate]);

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value.length >= 2) {
      setShowSearchDropdown(true);
    }
  }, []);

  // Handle search input focus
  const handleSearchFocus = useCallback(() => {
    if (searchQuery.length >= 2) {
      setShowSearchDropdown(true);
    }
  }, [searchQuery]);

  // Handle Escape key to close dropdown
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowSearchDropdown(false);
      (e.target as HTMLInputElement).blur();
    }
  }, []);

  return (
    <div className={`min-h-screen bg-[var(--color-surface)] ${darkMode ? 'dark' : ''}`}>
      {/* Top Navigation Bar */}
      <header className={`h-16 ${darkMode ? 'bg-[#1F2937]' : 'bg-[var(--color-primary)]'} text-white fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4`} style={{ boxShadow: 'var(--shadow-2)' }}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-white/10 rounded transition-colors"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded flex items-center justify-center p-1" style={{ backgroundColor: darkMode ? 'var(--color-surface)' : 'var(--color-primary)' }}>
              <img src={image_59e9396d40de986427c610e93570952e90e5ca14} alt="tekWeaver logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 600, lineHeight: 1 }}>SimRule</div>
              <div style={{ fontSize: '11px', opacity: 0.9, lineHeight: 1 }}>RuleWeaver simulation platform</div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 max-w-md mx-8 hidden md:block" ref={searchContainerRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70" size={20} />
            <input
              type="text"
              placeholder="Search scenarios, simulations..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              onKeyDown={handleSearchKeyDown}
              className="w-full bg-white/10 border border-white/20 rounded pl-10 pr-4 py-2 text-white placeholder-white/60 focus:bg-white/20 focus:outline-none transition-colors"
              style={{ fontSize: '14px' }}
            />
            {/* Global Search Dropdown */}
            {showSearchDropdown && searchQuery.length >= 2 && (
              <GlobalSearchDropdown
                results={searchResults}
                query={searchQuery}
                onSelectScenario={handleSelectScenario}
                onSelectSimulation={handleSelectSimulation}
                onClose={() => setShowSearchDropdown(false)}
              />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-white/10 rounded transition-colors"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className="p-2 hover:bg-white/10 rounded transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--color-accent)] rounded-full"></span>
          </button>
          <button className="p-2 hover:bg-white/10 rounded transition-colors">
            <Settings size={20} />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2 hover:bg-white/10 rounded transition-colors"
            >
              <div className="w-8 h-8 bg-[var(--color-accent)] rounded-full flex items-center justify-center">
                <User size={18} />
              </div>
              <ChevronDown size={16} />
            </button>
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--color-background)] rounded-lg py-2" style={{ boxShadow: 'var(--shadow-3)' }}>
                <button className="w-full text-left px-4 py-2 hover:bg-[var(--color-surface)] text-[var(--color-text-primary)] transition-colors" style={{ fontSize: '14px' }}>Profile</button>
                <button className="w-full text-left px-4 py-2 hover:bg-[var(--color-surface)] text-[var(--color-text-primary)] transition-colors" style={{ fontSize: '14px' }}>Settings</button>
                <hr className="my-2" style={{ borderColor: 'var(--color-border)' }} />
                <button className="w-full text-left px-4 py-2 hover:bg-[var(--color-surface)] text-[var(--color-text-primary)] transition-colors" style={{ fontSize: '14px' }}>Logout</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Side Navigation */}
      <aside
        className={`fixed left-0 top-16 bottom-0 bg-[var(--color-background)] border-r transition-all duration-300 z-40 ${
          sidebarCollapsed ? 'w-16' : 'w-60'
        }`}
        style={{ borderColor: 'var(--color-border)' }}
      >
        <nav className="py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-all ${
                  isActive
                    ? 'bg-[#E3F2FD] text-[var(--color-primary)] border-l-4'
                    : 'text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] border-l-4 border-transparent'
                }`}
                style={{
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 400,
                  borderLeftColor: isActive ? 'var(--color-primary)' : 'transparent',
                }}
              >
                <Icon size={20} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main
        className={`min-h-screen transition-all duration-300`}
        style={{
          marginLeft: sidebarCollapsed ? '64px' : '240px',
          paddingTop: '64px',
          paddingLeft: '5px',
          paddingRight: '5px'
        }}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}