import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useColorScheme, ColorSchemeName } from 'react-native';

export type ThemeColors = {
  // Base colors
  primary: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  notification: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Grayscale
  gray50: string;
  gray100: string;
  gray200: string;
  gray300: string;
  gray400: string;
  gray500: string;
  gray600: string;
  gray700: string;
  gray800: string;
  gray900: string;
};

export type ThemeType = {
  colors: ThemeColors;
  dark: boolean;
};

type ThemeContextType = {
  theme: ThemeType;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
};

const lightColors: ThemeColors = {
  primary: '#000000',
  background: '#FFFFFF',
  card: '#FFFFFF',
  text: '#000000',
  textSecondary: '#666666',
  border: '#E5E5EA',
  notification: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#007AFF',
  gray50: '#F8F8F8',
  gray100: '#F2F2F7',
  gray200: '#E5E5EA',
  gray300: '#D1D1D6',
  gray400: '#C7C7CC',
  gray500: '#AEAEB2',
  gray600: '#8E8E93',
  gray700: '#636366',
  gray800: '#3A3A3C',
  gray900: '#1C1C1E',
};

const darkColors: ThemeColors = {
  ...lightColors,
  background: '#000000',
  card: '#1C1C1E',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  border: '#2C2C2E',
  gray50: '#1C1C1E',
  gray100: '#2C2C2E',
  gray200: '#3A3A3C',
  gray300: '#48484A',
  gray400: '#636366',
  gray500: '#8E8E93',
  gray600: '#AEAEB2',
  gray700: '#C7C7CC',
  gray800: '#D1D1D6',
  gray900: '#E5E5EA',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

type ThemeProviderProps = {
  children: ReactNode;
  initialTheme?: 'light' | 'dark' | ThemeType;
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialTheme,
}) => {
  const systemColorScheme = useColorScheme();
  const [themeState, setThemeState] = useState<ThemeType>(() => {
    if (initialTheme && typeof initialTheme === 'object' && 'dark' in initialTheme) {
      return initialTheme;
    }
    const isDark = initialTheme === 'dark' || (!initialTheme && systemColorScheme === 'dark');
    return {
      colors: isDark ? darkColors : lightColors,
      dark: isDark,
    };
  });

  const setTheme = React.useCallback((theme: 'light' | 'dark' | ThemeType) => {
    if (typeof theme === 'string') {
      setThemeState({
        colors: theme === 'dark' ? darkColors : lightColors,
        dark: theme === 'dark',
      });
    } else {
      setThemeState(theme);
    }
  }, []);

  const toggleTheme = React.useCallback(() => {
    setTheme(themeState.dark ? 'light' : 'dark');
  }, [themeState.dark]);

  useEffect(() => {
    if (!initialTheme && systemColorScheme) {
      setTheme(systemColorScheme);
    }
  }, [initialTheme, systemColorScheme]);

  const contextValue = useMemo(() => ({
    theme: themeState,
    isDark: themeState.dark,
    setTheme,
    toggleTheme,
  }), [themeState]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const withTheme = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  const WithTheme: React.FC<P> = (props) => (
    <ThemeContext.Consumer>
      {(context) => {
        if (context === undefined) {
          throw new Error('withTheme must be used within a ThemeProvider');
        }
        return <WrappedComponent {...props} theme={context} />;
      }}
    </ThemeContext.Consumer>
  );
  return WithTheme;
};
