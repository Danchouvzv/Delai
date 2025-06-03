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
    // Основные цвета бренда (согласно Brand refresh)
    indigo: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
    },
    violet: {
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
    amber: {
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
    cyan: {
      50: '#ecfeff',
      100: '#cffafe',
      200: '#a5f3fc',
      300: '#67e8f9',
      400: '#22d3ee',
      500: '#06b6d4',
      600: '#0891b2',
      700: '#0e7490',
      800: '#155e75',
      900: '#164e63',
    },
    sky: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
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
  // Определение семантических цветов для бренда
  semanticTokens: {
    colors: {
      // Основные цвета бренда
      'brand.primary': {
        default: 'indigo.600',
        _dark: 'indigo.400',
      },
      'brand.secondary': {
        default: 'violet.600',
        _dark: 'violet.400',
      },
      'brand.accent': {
        default: 'orange.500',
        _dark: 'orange.300',
      },
      'brand.highlight': {
        default: 'amber.400',
        _dark: 'amber.300',
      },
      'brand.info': {
        default: 'cyan.500',
        _dark: 'cyan.300',
      },
      // Градиенты
      'gradient.primary': 'linear(to-r, indigo.500, violet.500)',
      'gradient.accent': 'linear(to-r, orange.400, amber.500)',
      'gradient.info': 'linear(to-r, cyan.400, sky.500)',
    },
    // Добавляем семантические токены для отступов
    space: {
      sectionPadding: '8',   // эквивалент Chakra's 32px (8 × 4)
      cardGap: '4',          // 16px между карточками
    },
    // Добавляем семантические токены для размеров шрифтов
    fontSizes: {
      heading: '2xl',
      subheading: 'lg',
      body: 'md',
    },
    // Добавляем компонентные токены
    components: {
      ProjectCard: {
        headerFontSize: 'heading',
        bodyFontSize: 'body',
        tagFontSize: 'sm',
      }
    }
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
          bg: props.colorMode === 'dark' ? 'indigo.500' : 'indigo.600',
          color: 'white',
          _hover: {
            bg: props.colorMode === 'dark' ? 'indigo.600' : 'indigo.700',
          },
        }),
        outline: (props: any) => ({
          borderColor: props.colorMode === 'dark' ? 'indigo.400' : 'indigo.600',
          color: props.colorMode === 'dark' ? 'indigo.400' : 'indigo.600',
          _hover: {
            bg: props.colorMode === 'dark' ? 'indigo.900' : 'indigo.50',
          },
        }),
        accent: (props: any) => ({
          bg: props.colorMode === 'dark' ? 'orange.400' : 'orange.500',
          color: 'white',
          _hover: {
            bg: props.colorMode === 'dark' ? 'orange.500' : 'orange.600',
          },
        }),
        info: (props: any) => ({
          bg: props.colorMode === 'dark' ? 'cyan.400' : 'cyan.500',
          color: 'white',
          _hover: {
            bg: props.colorMode === 'dark' ? 'cyan.500' : 'cyan.600',
          },
        }),
        gradient: {
          bgGradient: 'linear(to-r, indigo.500, violet.500)',
          color: 'white',
          _hover: {
            bgGradient: 'linear(to-r, indigo.600, violet.600)',
          },
        },
        accentGradient: {
          bgGradient: 'linear(to-r, orange.400, amber.500)',
          color: 'white',
          _hover: {
            bgGradient: 'linear(to-r, orange.500, amber.600)',
          },
        },
      },
    },
    Badge: {
      baseStyle: {
        borderRadius: 'full',
      },
      variants: {
        solid: (props: any) => ({
          bg: props.colorMode === 'dark' ? 'indigo.500' : 'indigo.600',
          color: 'white',
        }),
        outline: (props: any) => ({
          borderColor: props.colorMode === 'dark' ? 'indigo.400' : 'indigo.600',
          color: props.colorMode === 'dark' ? 'indigo.400' : 'indigo.600',
        }),
        accent: (props: any) => ({
          bg: props.colorMode === 'dark' ? 'orange.400' : 'orange.500',
          color: 'white',
        }),
        info: (props: any) => ({
          bg: props.colorMode === 'dark' ? 'cyan.400' : 'cyan.500',
          color: 'white',
        }),
        subtle: (props: any) => ({
          bg: props.colorMode === 'dark' ? 'indigo.900' : 'indigo.100',
          color: props.colorMode === 'dark' ? 'indigo.200' : 'indigo.800',
        }),
        accentSubtle: (props: any) => ({
          bg: props.colorMode === 'dark' ? 'orange.900' : 'orange.100',
          color: props.colorMode === 'dark' ? 'orange.200' : 'orange.800',
        }),
        infoSubtle: (props: any) => ({
          bg: props.colorMode === 'dark' ? 'cyan.900' : 'cyan.100',
          color: props.colorMode === 'dark' ? 'cyan.200' : 'cyan.800',
        }),
      },
    },
    Card: {
      baseStyle: (props: any) => ({
        container: {
          bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
          borderRadius: 'xl',
          overflow: 'hidden',
          boxShadow: 'md',
        },
      }),
      variants: {
        elevated: (props: any) => ({
          container: {
            boxShadow: 'lg',
            _hover: {
              boxShadow: 'xl',
            },
          },
        }),
        outline: (props: any) => ({
          container: {
            borderWidth: '1px',
            borderColor: props.colorMode === 'dark' ? 'gray.700' : 'gray.200',
          },
        }),
        filled: (props: any) => ({
          container: {
            bg: props.colorMode === 'dark' ? 'gray.700' : 'gray.100',
          },
        }),
        unstyled: {
          container: {
            bg: 'none',
            boxShadow: 'none',
          },
        },
      },
    },
    // Добавляем стили для других компонентов
    Tabs: {
      variants: {
        'soft-rounded': (props: any) => ({
          tab: {
            borderRadius: 'full',
            fontWeight: 'semibold',
            color: props.colorMode === 'dark' ? 'gray.400' : 'gray.600',
            _selected: {
              color: 'white',
              bg: props.colorMode === 'dark' ? 'indigo.400' : 'indigo.600',
            },
          },
        }),
      },
    },
  },
});

export default theme; 