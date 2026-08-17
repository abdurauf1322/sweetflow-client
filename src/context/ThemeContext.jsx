import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children, userKey }) => {
  // Read initial theme mode based on the user key. Default to 'dark'.
  const [themeMode, setThemeMode] = useState(() => {
    if (!userKey) return 'dark';
    return localStorage.getItem(`app_theme_mode_${userKey}`) || 'dark';
  });

  useEffect(() => {
    if (!userKey) return;
    
    // Save to localStorage whenever it changes
    localStorage.setItem(`app_theme_mode_${userKey}`, themeMode);

    // Apply or remove 'dark' class on the HTML root element
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [themeMode, userKey]);

  // When the user changes (e.g., login/logout), update the theme to that user's preference
  useEffect(() => {
    if (!userKey) return;
    const savedTheme = localStorage.getItem(`app_theme_mode_${userKey}`) || 'dark';
    setThemeMode(savedTheme);
  }, [userKey]);

  const toggleTheme = () => {
    setThemeMode(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ themeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
