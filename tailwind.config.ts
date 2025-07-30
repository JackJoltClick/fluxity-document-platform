import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./.storybook/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Stripe Primary Colors
        primary: {
          DEFAULT: '#635BFF',
          hover: '#5A52E5',
          light: '#E8E7FF',
          50: '#F5F4FF',
          100: '#E8E7FF',
          200: '#D5D2FF',
          300: '#B8B3FF',
          400: '#9A94FF',
          500: '#7C75FF',
          600: '#635BFF',
          700: '#5A52E5',
          800: '#4A43BF',
          900: '#3A3599',
        },
        
        // Stripe Text Colors
        text: {
          primary: '#0A2540',
          secondary: '#3C4055',
          muted: '#6B7385',
          disabled: '#727F96',
        },
        
        // Stripe Background Colors
        background: {
          DEFAULT: '#F6F9FC',
          surface: '#FFFFFF',
          raised: '#FFFFFF',
        },
        
        // Stripe Border Colors
        border: {
          DEFAULT: '#E4E8EE',
          hover: '#CBD2DC',
          focus: '#635BFF',
        },
        
        // Semantic Colors
        success: {
          DEFAULT: '#3EB574',
          light: '#E5F6ED',
          50: '#F0FAF4',
          100: '#E5F6ED',
          200: '#CCEEDA',
          300: '#A8DFC0',
          400: '#7FCD9F',
          500: '#3EB574',
          600: '#2E9D5A',
          700: '#267A48',
          800: '#1F5C38',
          900: '#184429',
        },
        
        warning: {
          DEFAULT: '#CB7519',
          light: '#FFF1DC',
          50: '#FFF8F0',
          100: '#FFF1DC',
          200: '#FFDDB3',
          300: '#FFC47A',
          400: '#FFA741',
          500: '#E88C30',
          600: '#CB7519',
          700: '#A15C0F',
          800: '#7A450B',
          900: '#5A3208',
        },
        
        error: {
          DEFAULT: '#DF1B41',
          light: '#FFEBEF',
          50: '#FFF5F7',
          100: '#FFEBEF',
          200: '#FFD6DF',
          300: '#FFB8C8',
          400: '#FF91A9',
          500: '#F96484',
          600: '#DF1B41',
          700: '#B91538',
          800: '#93102E',
          900: '#6D0C23',
        },
        
        info: {
          DEFAULT: '#0073E6',
          light: '#E6F2FF',
          50: '#F0F8FF',
          100: '#E6F2FF',
          200: '#CCE4FF',
          300: '#99CDFF',
          400: '#66B5FF',
          500: '#339DFF',
          600: '#0073E6',
          700: '#005BB8',
          800: '#00438A',
          900: '#002B5C',
        },
        
        // Grays
        gray: {
          50: '#FAFBFC',
          100: '#F6F9FC',
          200: '#E4E8EE',
          300: '#CBD2DC',
          400: '#A3ACB9',
          500: '#727F96',
          600: '#6B7385',
          700: '#3C4055',
          800: '#2A2F45',
          900: '#0A2540',
        },
      },
      
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['13px', { lineHeight: '20px' }],
        base: ['14px', { lineHeight: '21px' }],
        lg: ['16px', { lineHeight: '24px' }],
        xl: ['18px', { lineHeight: '27px' }],
        '2xl': ['20px', { lineHeight: '28px' }],
        '3xl': ['24px', { lineHeight: '32px' }],
        '4xl': ['32px', { lineHeight: '40px' }],
      },
      
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      
      letterSpacing: {
        tighter: '-0.02em',
        tight: '-0.01em',
        normal: '0',
      },
      
      lineHeight: {
        tight: '1.25',
        normal: '1.5',
        relaxed: '1.75',
      },
      
      spacing: {
        '0': '0',
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '2.5': '10px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '9': '36px',
        '10': '40px',
        '12': '48px',
        '14': '56px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
        '28': '112px',
        '32': '128px',
      },
      
      borderRadius: {
        none: '0',
        sm: '4px',
        DEFAULT: '8px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        '3xl': '24px',
        full: '9999px',
      },
      
      boxShadow: {
        xs: '0px 1px 1px rgba(0, 0, 0, 0.03), 0px 3px 6px rgba(18, 42, 66, 0.02)',
        sm: '0px 2px 5px -1px rgba(50, 50, 93, 0.25), 0px 1px 3px -1px rgba(0, 0, 0, 0.3)',
        DEFAULT: '0px 6px 24px 0px rgba(0, 0, 0, 0.05), 0px 0px 0px 1px rgba(0, 0, 0, 0.08)',
        lg: '0px 50px 100px -20px rgba(50, 50, 93, 0.25), 0px 30px 60px -30px rgba(0, 0, 0, 0.3)',
        elevated: '0px 13px 27px -5px rgba(50, 50, 93, 0.25), 0px 8px 16px -8px rgba(0, 0, 0, 0.3)',
        none: 'none',
      },
      
      transitionDuration: {
        fast: '150ms',
        DEFAULT: '200ms',
        slow: '300ms',
      },
      
      transitionTimingFunction: {
        DEFAULT: 'ease',
        'in-out': 'ease-in-out',
      },
      
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'skeleton': 'skeleton 1.5s infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        skeleton: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      
      zIndex: {
        '0': '0',
        '10': '10',
        '20': '20',
        '30': '30',
        '40': '40',
        '50': '50',
        'dropdown': '100',
        'sticky': '200',
        'modal': '300',
        'tooltip': '400',
      },
    },
  },
  plugins: [],
};

export default config;