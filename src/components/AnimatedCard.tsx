import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

interface AnimatedCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  variant?: 'default' | 'outlined' | 'elevated';
  hoverEffect?: boolean;
  className?: string;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  animate?: boolean;
}

const AnimatedCard = ({
  children,
  title,
  subtitle,
  footer,
  variant = 'default',
  hoverEffect = true,
  className = '',
  onClick,
  padding = 'md',
  animate = true,
  ...props
}: AnimatedCardProps): React.ReactElement => {
  const { isDarkTheme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  // Padding styles
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6'
  };

  // Variant styles based on theme
  const getVariantStyles = () => {
    const styles = {
      default: {
        light: 'bg-white border border-gray-200',
        dark: 'bg-slate-800 border border-slate-700'
      },
      outlined: {
        light: 'bg-white border-2 border-blue-200',
        dark: 'bg-slate-800 border-2 border-blue-800'
      },
      elevated: {
        light: 'bg-white shadow-lg',
        dark: 'bg-slate-800 shadow-lg shadow-slate-900/60'
      }
    };

    return styles[variant][isDarkTheme ? 'dark' : 'light'];
  };

  // Text color based on theme
  const textColor = isDarkTheme ? 'text-slate-100' : 'text-slate-800';
  const subtitleColor = isDarkTheme ? 'text-slate-400' : 'text-slate-500';

  // Hover styles
  const getHoverStyles = () => {
    if (!hoverEffect) return '';
    
    return isDarkTheme 
      ? 'hover:shadow-lg hover:shadow-slate-900/30 hover:border-blue-700'
      : 'hover:shadow-md hover:border-blue-300';
  };

  // Animation variants
  const cardVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    hover: { y: -5, transition: { duration: 0.2 } },
    tap: { y: 0, transition: { duration: 0.1 } }
  };

  return (
    <motion.div
      className={`
        ${getVariantStyles()}
        ${getHoverStyles()}
        ${paddingStyles[padding]}
        rounded-xl transition-all duration-200
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      variants={cardVariants}
      initial={animate ? 'initial' : undefined}
      animate={animate ? 'animate' : undefined}
      whileHover={hoverEffect && onClick ? 'hover' : undefined}
      whileTap={onClick ? 'tap' : undefined}
      {...props}
    >
      {(title || subtitle) && (
        <div className={`${padding !== 'none' ? 'mb-3' : ''}`}>
          {title && <h3 className={`font-semibold text-lg ${textColor}`}>{title}</h3>}
          {subtitle && <p className={`text-sm ${subtitleColor}`}>{subtitle}</p>}
        </div>
      )}
      
      <div className={textColor}>{children}</div>
      
      {footer && (
        <div className={`${padding !== 'none' ? 'mt-4 pt-3' : 'mt-3 pt-2'} border-t ${isDarkTheme ? 'border-slate-700' : 'border-gray-200'}`}>
          {footer}
        </div>
      )}
    </motion.div>
  );
};

export default AnimatedCard; 