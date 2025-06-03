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
  
  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      borderWidth="1px"
      borderRadius="xl"
      borderColor={borderColor}
      p={8}
      bg={bgColor}
      boxShadow="sm"
      textAlign="center"
      maxW="600px"
      mx="auto"
      role="alert"
    >
      <VStack spacing={6}>
        <Box
          bg={iconBgColor}
          p={4}
          borderRadius="full"
          boxSize="80px"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Icon as={icon} boxSize="40px" color={iconColor} />
        </Box>
        
        <Heading size="md" fontWeight="bold">
          {title}
        </Heading>
        
        <Text color="gray.500">
          {description}
        </Text>
        
        {buttonText && onButtonClick && (
          <Button
            colorScheme={colorScheme}
            onClick={onButtonClick}
            size="md"
            mt={2}
            _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
            transition="all 0.2s"
          >
            {buttonText}
          </Button>
        )}
      </VStack>
    </MotionBox>
  );
};

export default EmptyStateCard; 