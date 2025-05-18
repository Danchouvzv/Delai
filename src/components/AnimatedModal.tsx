import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { FiX } from 'react-icons/fi';

interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEsc?: boolean;
  footer?: React.ReactNode;
  className?: string;
}

const AnimatedModal = ({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEsc = true,
  footer,
  className = '',
}: AnimatedModalProps): React.ReactElement => {
  const { isDarkTheme } = useTheme();
  const modalRef = useRef<HTMLDivElement>(null);

  // Size styles
  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  };

  // Theme styles
  const backdropColor = isDarkTheme ? 'bg-slate-900/80' : 'bg-slate-800/70';
  const modalBg = isDarkTheme ? 'bg-slate-800' : 'bg-white';
  const headerBorderColor = isDarkTheme ? 'border-slate-700' : 'border-gray-200';
  const footerBorderColor = isDarkTheme ? 'border-slate-700' : 'border-gray-200';
  const textColor = isDarkTheme ? 'text-slate-100' : 'text-slate-800';

  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } }
  };

  const modalVariants = {
    hidden: { opacity: 0, y: -20, scale: 0.98 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1, 
      transition: { 
        type: 'spring', 
        stiffness: 400, 
        damping: 30
      } 
    },
    exit: { 
      opacity: 0, 
      y: -10, 
      scale: 0.95, 
      transition: { 
        duration: 0.15 
      } 
    }
  };

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && closeOnEsc) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, closeOnEsc]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node) && closeOnBackdropClick) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden ${backdropColor}`}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={overlayVariants}
          onClick={handleBackdropClick}
        >
          <motion.div
            ref={modalRef}
            className={`${sizeStyles[size]} w-full m-4 overflow-hidden rounded-xl shadow-xl ${modalBg} ${textColor} ${className}`}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <div className={`px-6 py-4 flex items-center justify-between border-b ${headerBorderColor}`}>
                <h3 className="text-lg font-semibold">{title}</h3>
                {showCloseButton && (
                  <motion.button
                    onClick={onClose}
                    className={`p-1 rounded-full ${isDarkTheme ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiX size={20} />
                  </motion.button>
                )}
              </div>
            )}
            
            <div className="px-6 py-4">
              {children}
            </div>
            
            {footer && (
              <div className={`px-6 py-3 border-t ${footerBorderColor}`}>
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnimatedModal; 