// Color Presets Configuration
// Defines color schemes for different visual themes

import type { ColorPreset } from '@/types/api.types';

export interface ColorPresetConfig {
  name: string;
  description: string;
  colors: {
    primary: string;
    accent: string;
    success: string;
    error: string;
    warning: string;
    info: string;
  };
}

export const COLOR_PRESETS: Record<ColorPreset, ColorPresetConfig> = {
  default: {
    name: 'Default',
    description: 'Classic tekWeaver blue theme',
    colors: {
      primary: '#285A84',
      accent: '#FD9071',
      success: '#22C55E',
      error: '#EF4444',
      warning: '#F59E0B',
      info: '#3B82F6',
    },
  },
  ocean: {
    name: 'Ocean',
    description: 'Deep blue ocean vibes',
    colors: {
      primary: '#0077B6',
      accent: '#00B4D8',
      success: '#06D6A0',
      error: '#EF476F',
      warning: '#FFD166',
      info: '#118AB2',
    },
  },
  forest: {
    name: 'Forest',
    description: 'Natural green tones',
    colors: {
      primary: '#2D6A4F',
      accent: '#95D5B2',
      success: '#52B788',
      error: '#E63946',
      warning: '#F4A261',
      info: '#457B9D',
    },
  },
  sunset: {
    name: 'Sunset',
    description: 'Warm sunset gradients',
    colors: {
      primary: '#9B2335',
      accent: '#F4A259',
      success: '#8CB369',
      error: '#BC4749',
      warning: '#F2CC8F',
      info: '#5C7AEA',
    },
  },
};

// Apply color preset to document CSS variables
export function applyColorPreset(preset: ColorPreset): void {
  const config = COLOR_PRESETS[preset];
  if (!config) return;

  const root = document.documentElement;
  Object.entries(config.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });
}

// Get the current color preset from localStorage
export function getStoredColorPreset(): ColorPreset {
  try {
    const settings = JSON.parse(localStorage.getItem('simrule_settings') || '{}');
    return settings.colorPreset || 'default';
  } catch {
    return 'default';
  }
}
