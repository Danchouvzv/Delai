import React from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  Icon,
  useColorModeValue
} from '@chakra-ui/react';
import { IconType } from 'react-icons';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

interface EmptyStateCardProps {
  icon: IconType;
  title: string;
  description: string;
  buttonText?: string;
  onButtonClick?: () => void;
  colorScheme?: string;
}

/**
 * Component for displaying empty state with icon and action button
 */
const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  icon,
  title,
  description,
  buttonText,
  onButtonClick,
  colorScheme = 'teal',
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const iconBgColor = useColorModeValue(`${colorScheme}.50`, `${colorScheme}.900`);
  const iconColor = useColorModeValue(`${colorScheme}.500`, `${colorScheme}.200`);
  const headingColor = useColorModeValue('gray.800', 'gray.100');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  
  // Animation variants
  const iconAnimation = {
    initial: { scale: 1 },
    animate: { 
      scale: [1, 1.05, 1],
      transition: { 
        repeat: Infinity, 
        repeatType: "reverse" as const,
        duration: 2
      }
    }
  };
  
  return (
    <Box
      p={6}
      borderWidth="1px"
      borderRadius="lg"
      textAlign="center"
      sx={{
        backgroundColor: bgColor,
        borderColor: borderColor,
        transition: "all 0.3s ease"
      }}
    >
      <VStack spacing={6}>
        <MotionBox
          bg={iconBgColor}
          p={4}
          borderRadius="full"
          boxSize="80px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          initial="initial"
          animate="animate"
          variants={iconAnimation}
        >
          <Icon as={icon} boxSize="40px" color={iconColor} />
        </MotionBox>
        
        <VStack spacing={2}>
          <Heading as="h3" size="md" color={headingColor}>
            {title}
          </Heading>
          <Text color={textColor} maxW="400px">
            {description}
          </Text>
        </VStack>
        
        {buttonText && onButtonClick && (
          <Button
            colorScheme={colorScheme}
            onClick={onButtonClick}
            size="md"
            mt={2}
            _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
            _active={{ transform: 'translateY(0)', boxShadow: 'sm' }}
          >
            {buttonText}
          </Button>
        )}
      </VStack>
    </Box>
  );
};

export default EmptyStateCard; 