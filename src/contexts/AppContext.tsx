// AppContext - Global application state management

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { apiService } from '@/services';
import type { AppSettings, ScenarioResponse, SimulationResponse } from '@/types/api.types';

// Default settings
const defaultSettings: AppSettings = {
  apiBaseUrl: 'http://localhost:8081/api/v1',
  wsBaseUrl: 'ws://localhost:8081/ws',
  defaultRuleSet: undefined,
  defaultPageSize: 10,
  autoRefreshInterval: 30000,
  theme: 'light',
  defaultExecutionMode: 'SEQUENTIAL',
  scenarioTimeoutSeconds: 60,
  maxConcurrentScenarios: 5,
  editorTheme: 'vs-light',
  tableDensity: 'standard',
};

// Context state interface
interface AppContextState {
  // User info
  userId: string;
  userName: string;

  // Settings
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;

  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // API Status
  apiStatus: 'connected' | 'disconnected' | 'checking';
  checkApiConnection: () => Promise<boolean>;

  // Rule Sets
  availableRuleSets: string[];
  selectedRuleSet: string | null;
  setSelectedRuleSet: (ruleSet: string | null) => void;

  // Notifications
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;

  // Recent items
  recentScenarios: ScenarioResponse[];
  recentSimulations: SimulationResponse[];
  addRecentScenario: (scenario: ScenarioResponse) => void;
  addRecentSimulation: (simulation: SimulationResponse) => void;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  timestamp: Date;
  autoDismiss?: boolean;
}

// Create context
const AppContext = createContext<AppContextState | undefined>(undefined);

// Provider props
interface AppProviderProps {
  children: ReactNode;
}

// Provider component
export function AppProvider({ children }: AppProviderProps) {
  // Persisted state
  const [settings, setSettings] = useLocalStorage<AppSettings>('simrule_settings', defaultSettings);
  const [recentScenarios, setRecentScenarios] = useLocalStorage<ScenarioResponse[]>(
    'simrule_recent_scenarios',
    []
  );
  const [recentSimulations, setRecentSimulations] = useLocalStorage<SimulationResponse[]>(
    'simrule_recent_simulations',
    []
  );

  // Local state
  const [apiStatus, setApiStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [availableRuleSets, setAvailableRuleSets] = useState<string[]>([]);
  const [selectedRuleSet, setSelectedRuleSet] = useState<string | null>(settings.defaultRuleSet || null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // TODO: Replace hardcoded user with actual authentication system
  // In production, user info should come from:
  // - OAuth2/OIDC provider (e.g., Keycloak, Auth0, Okta)
  // - JWT token from authentication service
  // - Session-based auth with backend
  // Current hardcoded values are for development/testing only
  const userId = 'system';
  const userName = 'Test User';

  // Theme
  const isDarkMode = settings.theme === 'dark';

  const toggleDarkMode = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  }, [setSettings]);

  // Settings management
  const updateSettings = useCallback(
    (newSettings: Partial<AppSettings>) => {
      setSettings((prev) => ({ ...prev, ...newSettings }));

      // Update API service if base URL changed
      if (newSettings.apiBaseUrl) {
        apiService.setBaseUrl(newSettings.apiBaseUrl);
      }
    },
    [setSettings]
  );

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    apiService.setBaseUrl(defaultSettings.apiBaseUrl);
  }, [setSettings]);

  // API connection check
  const checkApiConnection = useCallback(async (): Promise<boolean> => {
    setApiStatus('checking');
    try {
      const health = await apiService.checkHealth();
      const isConnected = health.status === 'UP';
      setApiStatus(isConnected ? 'connected' : 'disconnected');
      return isConnected;
    } catch {
      setApiStatus('disconnected');
      return false;
    }
  }, []);

  // Notifications
  const addNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'timestamp'>) => {
      const newNotification: Notification = {
        ...notification,
        id: crypto.randomUUID(),
        timestamp: new Date(),
      };
      setNotifications((prev) => [newNotification, ...prev.slice(0, 9)]); // Keep last 10

      // Auto-dismiss after 5 seconds if enabled
      if (notification.autoDismiss !== false) {
        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== newNotification.id));
        }, 5000);
      }
    },
    []
  );

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Recent items
  const addRecentScenario = useCallback(
    (scenario: ScenarioResponse) => {
      setRecentScenarios((prev) => {
        const filtered = prev.filter((s) => s.id !== scenario.id);
        return [scenario, ...filtered].slice(0, 5);
      });
    },
    [setRecentScenarios]
  );

  const addRecentSimulation = useCallback(
    (simulation: SimulationResponse) => {
      setRecentSimulations((prev) => {
        const filtered = prev.filter((s) => s.id !== simulation.id);
        return [simulation, ...filtered].slice(0, 5);
      });
    },
    [setRecentSimulations]
  );

  // Initial API connection check
  useEffect(() => {
    checkApiConnection();

    // Periodic health checks
    const interval = setInterval(checkApiConnection, 60000);
    return () => clearInterval(interval);
  }, [checkApiConnection]);

  // Apply theme to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const value: AppContextState = {
    userId,
    userName,
    settings,
    updateSettings,
    resetSettings,
    isDarkMode,
    toggleDarkMode,
    apiStatus,
    checkApiConnection,
    availableRuleSets,
    selectedRuleSet,
    setSelectedRuleSet,
    notifications,
    addNotification,
    dismissNotification,
    clearNotifications,
    recentScenarios,
    recentSimulations,
    addRecentScenario,
    addRecentSimulation,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Custom hook to use the context
export function useAppContext(): AppContextState {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// Export for type inference
export type { AppContextState, Notification, AppSettings };
