// AppContext - Global application state management

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { apiService } from '@/services';
import { applyColorPreset } from '@/config/colorPresets';
import type { AppSettings, ScenarioResponse, SimulationResponse, UserProfile } from '@/types/api.types';

// Default profile
const defaultProfile: UserProfile = {
  fullName: 'John Doe',
  email: 'john.doe@tekweaver.com',
  role: 'Senior Test Engineer',
  department: 'Quality Assurance',
};

// Default settings
const defaultSettings: AppSettings = {
  apiBaseUrl: 'http://localhost:8081/api/v1',
  wsBaseUrl: 'ws://localhost:8081/ws',
  defaultRuleSet: undefined,
  defaultPageSize: 10,
  autoRefreshInterval: 30000,
  autoSaveInterval: 30000,
  theme: 'light',
  defaultExecutionMode: 'SEQUENTIAL',
  scenarioTimeoutSeconds: 60,
  maxConcurrentScenarios: 5,
  editorTheme: 'vs-light',
  tableDensity: 'standard',
  colorPreset: 'default',
  notifications: {
    browserNotifications: true,
    simulationComplete: true,
    failedScenarios: true,
    soundEffects: false,
  },
};

// Context state interface
interface AppContextState {
  // User info
  userId: string;
  userName: string;

  // Profile
  profile: UserProfile;
  updateProfile: (profile: UserProfile) => void;

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
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;

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
  read: boolean;
  category?: 'simulation' | 'scenario' | 'dataset' | 'coverage' | 'system';
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
  const [profile, setProfile] = useLocalStorage<UserProfile>('simrule_profile', defaultProfile);
  const [recentScenarios, setRecentScenarios] = useLocalStorage<ScenarioResponse[]>(
    'simrule_recent_scenarios',
    []
  );
  const [recentSimulations, setRecentSimulations] = useLocalStorage<SimulationResponse[]>(
    'simrule_recent_simulations',
    []
  );

  // Persisted notifications - use useLocalStorage with custom serializer for Date objects
  const [storedNotifications, setStoredNotifications] = useLocalStorage<Notification[]>(
    'simrule_notifications',
    [],
    {
      serialize: (value) => JSON.stringify(value),
      deserialize: (value) => {
        const parsed = JSON.parse(value);
        // Restore Date objects from ISO strings
        return parsed.map((n: Notification & { timestamp: string }) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
      },
    }
  );

  // Local state
  const [apiStatus, setApiStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [availableRuleSets, setAvailableRuleSets] = useState<string[]>([]);
  const [selectedRuleSet, setSelectedRuleSet] = useState<string | null>(settings.defaultRuleSet || null);

  // Compute unread count from stored notifications
  const unreadCount = storedNotifications.filter((n) => !n.read).length;

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

  // Profile management
  const updateProfile = useCallback(
    (newProfile: UserProfile) => {
      setProfile(newProfile);
    },
    [setProfile]
  );

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
    (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
      const prefs = settings.notifications;

      // Check if this notification type should be shown based on preferences
      if (notification.category === 'simulation' && !prefs.simulationComplete) {
        return; // Don't show simulation completion notifications if disabled
      }
      if (notification.type === 'error' && notification.category === 'scenario' && !prefs.failedScenarios) {
        return; // Don't show failed scenario notifications if disabled
      }

      const newNotification: Notification = {
        ...notification,
        id: crypto.randomUUID(),
        timestamp: new Date(),
        read: false,
      };
      setStoredNotifications((prev) => [newNotification, ...prev.slice(0, 49)]); // Keep last 50

      // Browser notification if enabled
      if (prefs.browserNotifications && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new window.Notification(notification.title, { body: notification.message });
        } else if (Notification.permission !== 'denied') {
          window.Notification.requestPermission();
        }
      }

      // Sound effect placeholder - can be implemented later
      // if (prefs.soundEffects) {
      //   playNotificationSound(notification.type);
      // }
    },
    [settings.notifications, setStoredNotifications]
  );

  const dismissNotification = useCallback((id: string) => {
    setStoredNotifications((prev) => prev.filter((n) => n.id !== id));
  }, [setStoredNotifications]);

  const clearNotifications = useCallback(() => {
    setStoredNotifications([]);
  }, [setStoredNotifications]);

  const markAsRead = useCallback((id: string) => {
    setStoredNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, [setStoredNotifications]);

  const markAllAsRead = useCallback(() => {
    setStoredNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );
  }, [setStoredNotifications]);

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

  // Apply color preset on initial load
  useEffect(() => {
    if (settings.colorPreset) {
      applyColorPreset(settings.colorPreset);
    }
  }, []);

  const value: AppContextState = {
    userId,
    userName,
    profile,
    updateProfile,
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
    notifications: storedNotifications,
    unreadCount,
    addNotification,
    dismissNotification,
    clearNotifications,
    markAsRead,
    markAllAsRead,
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
    throw new Error(
      'useAppContext must be used within an AppProvider. ' +
      'Wrap your component tree with <AppProvider> in your app root.'
    );
  }
  return context;
}

// Export for type inference
export type { AppContextState, Notification, AppSettings, UserProfile };
