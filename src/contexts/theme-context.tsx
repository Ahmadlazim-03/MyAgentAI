'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
  applyTheme: (colorName: string) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const themeMap: Record<string, string> = {
  'biru': 'blue',
  'blue': 'blue',
  'gelap': 'dark',
  'hitam': 'dark',
  'black': 'dark',
  'dark': 'dark',
  'terang': 'light',
  'putih': 'light',
  'white': 'light',
  'light': 'light',
  'merah': 'red',
  'red': 'red',
  'hijau': 'green',
  'green': 'green',
  'kuning': 'yellow',
  'yellow': 'yellow',
  'ungu': 'purple',
  'purple': 'purple',
  'pink': 'pink',
  'orange': 'orange',
  'indigo': 'indigo',
  'teal': 'teal',
  'gray': 'gray',
  'abu': 'gray',
  'pelangi': 'rainbow',
  'colorful': 'rainbow',
  'warna-warni': 'rainbow',
  'warni': 'rainbow',
  'rainbow': 'rainbow'
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState('blue');

  const applyTheme = (colorName: string) => {
    const normalizedColor = colorName.toLowerCase().replace(/\s+/g, '-');
    const mappedTheme = themeMap[normalizedColor] || normalizedColor;
    setTheme(mappedTheme);
    
    // Apply CSS variables for dynamic theming
    const root = document.documentElement;
    
    switch (mappedTheme) {
      case 'blue':
        root.style.setProperty('--primary-color', '#3b82f6');
        root.style.setProperty('--primary-light', '#dbeafe');
        root.style.setProperty('--primary-dark', '#1e40af');
        root.style.setProperty('--primary-gradient', 'linear-gradient(90deg, #3b82f6, #1e40af)');
        root.style.setProperty('--bg-color', '#f8fafc');
        root.style.setProperty('--text-color', '#1f2937');
        root.style.setProperty('--navbar-bg', '#ffffff');
        root.style.setProperty('--navbar-fg', '#0f172a');
        root.style.setProperty('--panel-bg', '#ffffff');
        root.style.setProperty('--panel-border', '#e5e7eb');
        break;
      case 'dark':
        root.style.setProperty('--primary-color', '#374151');
        root.style.setProperty('--primary-light', '#4b5563');
        root.style.setProperty('--primary-dark', '#111827');
        root.style.setProperty('--primary-gradient', 'linear-gradient(90deg, #4b5563, #111827)');
        root.style.setProperty('--bg-color', '#1f2937');
        root.style.setProperty('--text-color', '#f9fafb');
        root.style.setProperty('--navbar-bg', '#111827');
        root.style.setProperty('--navbar-fg', '#e5e7eb');
        root.style.setProperty('--panel-bg', '#111827');
        root.style.setProperty('--panel-border', '#374151');
        break;
      case 'light':
        root.style.setProperty('--primary-color', '#6b7280');
        root.style.setProperty('--primary-light', '#f3f4f6');
        root.style.setProperty('--primary-dark', '#374151');
        root.style.setProperty('--primary-gradient', 'linear-gradient(90deg, #9ca3af, #374151)');
        root.style.setProperty('--bg-color', '#ffffff');
        root.style.setProperty('--text-color', '#111827');
        root.style.setProperty('--navbar-bg', '#ffffff');
        root.style.setProperty('--navbar-fg', '#111827');
        root.style.setProperty('--panel-bg', '#ffffff');
        root.style.setProperty('--panel-border', '#e5e7eb');
        break;
      case 'red':
        root.style.setProperty('--primary-color', '#ef4444');
        root.style.setProperty('--primary-light', '#fecaca');
        root.style.setProperty('--primary-dark', '#dc2626');
        root.style.setProperty('--primary-gradient', 'linear-gradient(90deg, #ef4444, #b91c1c)');
        root.style.setProperty('--bg-color', '#fef2f2');
        root.style.setProperty('--text-color', '#1f2937');
        root.style.setProperty('--navbar-bg', '#fef2f2');
        root.style.setProperty('--navbar-fg', '#7f1d1d');
        root.style.setProperty('--panel-bg', '#ffffff');
        root.style.setProperty('--panel-border', '#fecaca');
        break;
      case 'green':
        root.style.setProperty('--primary-color', '#10b981');
        root.style.setProperty('--primary-light', '#a7f3d0');
        root.style.setProperty('--primary-dark', '#059669');
        root.style.setProperty('--primary-gradient', 'linear-gradient(90deg, #10b981, #047857)');
        root.style.setProperty('--bg-color', '#ecfdf5');
        root.style.setProperty('--text-color', '#1f2937');
        root.style.setProperty('--navbar-bg', '#ecfdf5');
        root.style.setProperty('--navbar-fg', '#064e3b');
        root.style.setProperty('--panel-bg', '#ffffff');
        root.style.setProperty('--panel-border', '#a7f3d0');
        break;
      case 'purple':
        root.style.setProperty('--primary-color', '#8b5cf6');
        root.style.setProperty('--primary-light', '#ddd6fe');
        root.style.setProperty('--primary-dark', '#7c3aed');
        root.style.setProperty('--primary-gradient', 'linear-gradient(90deg, #8b5cf6, #7c3aed)');
        root.style.setProperty('--bg-color', '#faf5ff');
        root.style.setProperty('--text-color', '#1f2937');
        root.style.setProperty('--navbar-bg', '#faf5ff');
        root.style.setProperty('--navbar-fg', '#4c1d95');
        root.style.setProperty('--panel-bg', '#ffffff');
        root.style.setProperty('--panel-border', '#ddd6fe');
        break;
      case 'yellow':
        root.style.setProperty('--primary-color', '#f59e0b');
        root.style.setProperty('--primary-light', '#fde68a');
        root.style.setProperty('--primary-dark', '#d97706');
        root.style.setProperty('--primary-gradient', 'linear-gradient(90deg, #f59e0b, #b45309)');
        root.style.setProperty('--bg-color', '#fffbeb');
        root.style.setProperty('--text-color', '#1f2937');
        root.style.setProperty('--navbar-bg', '#fffbeb');
        root.style.setProperty('--navbar-fg', '#92400e');
        root.style.setProperty('--panel-bg', '#ffffff');
        root.style.setProperty('--panel-border', '#fde68a');
        break;
      case 'rainbow':
        root.style.setProperty('--primary-color', '#8b5cf6');
        root.style.setProperty('--primary-light', '#f0f9ff');
        root.style.setProperty('--primary-dark', '#1e40af');
        root.style.setProperty('--primary-gradient', 'linear-gradient(90deg, #ef4444, #f59e0b, #10b981, #3b82f6, #8b5cf6)');
        root.style.setProperty('--bg-color', '#0f172a');
        root.style.setProperty('--text-color', '#ffffff');
        root.style.setProperty('--navbar-bg', '#0b1020');
        root.style.setProperty('--navbar-fg', '#e5e7eb');
        root.style.setProperty('--panel-bg', '#0b1020');
        root.style.setProperty('--panel-border', '#1f2a44');
        break;
      default:
        // Try to use the color name directly
        root.style.setProperty('--primary-color', mappedTheme);
        root.style.setProperty('--primary-light', '#f3f4f6');
        root.style.setProperty('--primary-dark', '#374151');
        root.style.setProperty('--primary-gradient', `linear-gradient(90deg, ${mappedTheme}, #374151)`);
  root.style.setProperty('--bg-color', '#f8fafc');
  root.style.setProperty('--text-color', '#1f2937');
  root.style.setProperty('--navbar-bg', '#ffffff');
  root.style.setProperty('--navbar-fg', '#0f172a');
  root.style.setProperty('--panel-bg', '#ffffff');
  root.style.setProperty('--panel-border', '#e5e7eb');
    }
  };

  useEffect(() => {
    applyTheme('blue'); // Default theme
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};