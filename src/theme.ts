import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

// Конфигурация темы
const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

// Расширение темы с добавлением цветов
const theme = extendTheme({
  config,
  colors: {
    blue: {
      50: '#e6f1ff',
      100: '#c8dcff',
      200: '#a3c3ff',
      300: '#7eaaff',
      400: '#5992ff',
      500: '#3579ff',
      600: '#2a61cc',
      700: '#1f4999',
      800: '#153066',
      900: '#0a1833',
    },
    teal: {
      50: '#e6fffa',
      100: '#b2f5ea',
      200: '#81e6d9',
      300: '#4fd1c5',
      400: '#38b2ac',
      500: '#319795',
      600: '#2c7a7b',
      700: '#285e61',
      800: '#234e52',
      900: '#1d4044',
    },
    gray: {
      50: '#f7fafc',
      100: '#edf2f7',
      200: '#e2e8f0',
      300: '#cbd5e0',
      400: '#a0aec0',
      500: '#718096',
      600: '#4a5568',
      700: '#2d3748',
      800: '#1a202c',
      900: '#171923',
    },
    purple: {
      50: '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
    },
    green: {
      50: '#f0fff4',
      100: '#c6f6d5',
      200: '#9ae6b4',
      300: '#68d391',
      400: '#48bb78',
      500: '#38a169',
      600: '#2f855a',
      700: '#276749',
      800: '#22543d',
      900: '#1c4532',
    },
    yellow: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    orange: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
    },
    red: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
  },
  styles: {
    global: (props: any) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
        color: props.colorMode === 'dark' ? 'white' : 'gray.800',
      },
    }),
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'semibold',
        borderRadius: 'md',
      },
      variants: {
        solid: (props: any) => ({
          bg: props.colorMode === 'dark' ? 'teal.500' : 'teal.500',
          color: 'white',
          _hover: {
            bg: props.colorMode === 'dark' ? 'teal.600' : 'teal.600',
          },
        }),
        outline: (props: any) => ({
          borderColor: props.colorMode === 'dark' ? 'teal.500' : 'teal.500',
          color: props.colorMode === 'dark' ? 'teal.500' : 'teal.500',
          _hover: {
            bg: props.colorMode === 'dark' ? 'teal.800' : 'teal.50',
          },
        }),
      },
    },
  },
});

export default theme; 