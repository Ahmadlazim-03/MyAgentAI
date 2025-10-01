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
  'hitam': 'dark',
  'black': 'dark',
  'dark': 'dark',
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
        root.style.setProperty('--bg-color', '#f8fafc');
        root.style.setProperty('--text-color', '#1f2937');
        break;
      case 'dark':
        root.style.setProperty('--primary-color', '#374151');
        root.style.setProperty('--primary-light', '#4b5563');
        root.style.setProperty('--primary-dark', '#111827');
        root.style.setProperty('--bg-color', '#1f2937');
        root.style.setProperty('--text-color', '#f9fafb');
        break;
      case 'light':
        root.style.setProperty('--primary-color', '#6b7280');
        root.style.setProperty('--primary-light', '#f3f4f6');
        root.style.setProperty('--primary-dark', '#374151');
        root.style.setProperty('--bg-color', '#ffffff');
        root.style.setProperty('--text-color', '#111827');
        break;
      case 'red':
        root.style.setProperty('--primary-color', '#ef4444');
        root.style.setProperty('--primary-light', '#fecaca');
        root.style.setProperty('--primary-dark', '#dc2626');
        root.style.setProperty('--bg-color', '#fef2f2');
        root.style.setProperty('--text-color', '#1f2937');
        break;
      case 'green':
        root.style.setProperty('--primary-color', '#10b981');
        root.style.setProperty('--primary-light', '#a7f3d0');
        root.style.setProperty('--primary-dark', '#059669');
        root.style.setProperty('--bg-color', '#ecfdf5');
        root.style.setProperty('--text-color', '#1f2937');
        break;
      case 'purple':
        root.style.setProperty('--primary-color', '#8b5cf6');
        root.style.setProperty('--primary-light', '#ddd6fe');
        root.style.setProperty('--primary-dark', '#7c3aed');
        root.style.setProperty('--bg-color', '#faf5ff');
        root.style.setProperty('--text-color', '#1f2937');
        break;
      case 'yellow':
        root.style.setProperty('--primary-color', '#f59e0b');
        root.style.setProperty('--primary-light', '#fde68a');
        root.style.setProperty('--primary-dark', '#d97706');
        root.style.setProperty('--bg-color', '#fffbeb');
        root.style.setProperty('--text-color', '#1f2937');
        break;
      case 'rainbow':
        root.style.setProperty('--primary-color', 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)');
        root.style.setProperty('--primary-light', '#f0f9ff');
        root.style.setProperty('--primary-dark', '#1e40af');
        root.style.setProperty('--bg-color', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
        root.style.setProperty('--text-color', '#ffffff');
        break;
      default:
        // Try to use the color name directly
        root.style.setProperty('--primary-color', mappedTheme);
        root.style.setProperty('--primary-light', '#f3f4f6');
        root.style.setProperty('--primary-dark', '#374151');
        root.style.setProperty('--bg-color', '#f8fafc');
        root.style.setProperty('--text-color', '#1f2937');
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