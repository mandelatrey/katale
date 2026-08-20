import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // One-time migration: earlier builds auto-applied 'dark' from the OS
    // `prefers-color-scheme` on first load, without any UI to opt out. Clear
    // that stored value once so returning users aren't stuck in the broken
    // dark theme.
    if (!window.localStorage.getItem('theme-migrated-v2')) {
      window.localStorage.removeItem('theme');
      window.localStorage.setItem('theme-migrated-v2', '1');
    }
    const stored = window.localStorage.getItem('theme');
    setTheme(stored === 'dark' ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

