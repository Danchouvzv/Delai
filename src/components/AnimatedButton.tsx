import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { FiLoader } from 'react-icons/fi';

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const AnimatedButton = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}: AnimatedButtonProps): React.ReactElement => {
  const { isDarkTheme } = useTheme();

  // Size styles
  const sizeStyles = {
    sm: 'py-1.5 px-3 text-sm',
    md: 'py-2 px-4 text-base',
    lg: 'py-2.5 px-5 text-lg'
  };

  // Variant styles based on theme
  const getVariantStyles = () => {
    const styles = {
      primary: {
        light: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md',
        dark: 'bg-blue-500 hover:bg-blue-600 text-white shadow-md'
      },
      secondary: {
        light: 'bg-purple-600 hover:bg-purple-700 text-white shadow-md',
        dark: 'bg-purple-500 hover:bg-purple-600 text-white shadow-md'
      },
      outline: {
        light: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
        dark: 'border-2 border-blue-400 text-blue-400 hover:bg-slate-800'
      },
      ghost: {
        light: 'text-blue-600 hover:bg-blue-50',
        dark: 'text-blue-400 hover:bg-slate-800'
      },
      danger: {
        light: 'bg-red-600 hover:bg-red-700 text-white shadow-md',
        dark: 'bg-red-500 hover:bg-red-600 text-white shadow-md'
      }
    };

    return styles[variant][isDarkTheme ? 'dark' : 'light'];
  };

  // Disabled styles
  const disabledStyles = 'opacity-60 cursor-not-allowed';

  return (
    <motion.button
      className={`
        ${sizeStyles[size]}
        ${getVariantStyles()}
        ${isLoading || disabled ? disabledStyles : ''}
        ${fullWidth ? 'w-full' : ''}
        rounded-lg font-medium transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        flex items-center justify-center gap-2
        ${className}
      `}
      whileHover={!isLoading && !disabled ? { scale: 1.02 } : {}}
      whileTap={!isLoading && !disabled ? { scale: 0.98 } : {}}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="mr-2"
        >
          <FiLoader />
        </motion.span>
      ) : leftIcon ? (
        <span className="flex items-center">{leftIcon}</span>
      ) : null}
      
      <span>{children}</span>
      
      {rightIcon && !isLoading && (
        <span className="flex items-center">{rightIcon}</span>
      )}
    </motion.button>
  );
};

export default AnimatedButton; 