import React, { useEffect, useState } from 'react';
import { Text, TextProps } from '@chakra-ui/react';
import { motion, useSpring, useTransform } from 'framer-motion';

const MotionText = motion(Text);

interface AnimatedCounterProps extends TextProps {
  from?: number;
  to: number;
  duration?: number;
  delay?: number;
  formatter?: (value: number) => string;
  precision?: number;
}

/**
 * AnimatedCounter component that animates counting from one number to another
 * 
 * @param from - Starting value (default: 0)
 * @param to - Target value to count to
 * @param duration - Animation duration in seconds (default: 1.5)
 * @param delay - Delay before starting animation in seconds (default: 0)
 * @param formatter - Function to format the displayed number (default: value => value.toString())
 * @param precision - Number of decimal places to show (default: 0)
 */
const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  from = 0,
  to,
  duration = 1.5,
  delay = 0,
  formatter = (value: number) => value.toString(),
  precision = 0,
  ...textProps
}) => {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Use spring animation for smooth counting
  const springValue = useSpring(from, {
    stiffness: 50,
    damping: 20,
    duration,
    delay: delay * 1000,
  });
  
  // Transform the spring value to the target value
  const displayValue = useTransform(springValue, value => {
    return formatter(Number(value.toFixed(precision)));
  });
  
  // Start the animation when component mounts
  useEffect(() => {
    springValue.set(to);
  }, [springValue, to]);
  
  // For SSR compatibility, render static value first
  if (!isClient) {
    return <Text {...textProps}>{formatter(from)}</Text>;
  }
  
  return (
    <MotionText {...textProps}>
      {displayValue}
    </MotionText>
  );
};

export default AnimatedCounter; 