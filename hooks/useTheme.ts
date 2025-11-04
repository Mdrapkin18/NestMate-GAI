import { useState, useEffect, useMemo } from 'react';

export const useTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check for saved preference in localStorage, default to system preference
    const savedTheme = window.localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      window.localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      window.localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  return { isDarkMode, setIsDarkMode };
};
