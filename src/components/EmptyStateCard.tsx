import React from 'react';
import { Box, Heading, Text, Button, VStack, Icon, useColorModeValue } from '@chakra-ui/react';
import { IconType } from 'react-icons';

interface EmptyStateCardProps {
  icon: IconType;
  title: string;
  description: string;
  buttonText?: string;
  onButtonClick?: () => void;
  colorScheme?: string;
}

const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  icon,
  title,
  description,
  buttonText,
  onButtonClick,
  colorScheme = 'indigo'
}) => {
  // Цвета для темы
  const bgColor = useColorModeValue(`${colorScheme}.50`, `${colorScheme}.900`);
  const borderColor = useColorModeValue(`${colorScheme}.100`, `${colorScheme}.800`);
  const iconColor = useColorModeValue(`${colorScheme}.500`, `${colorScheme}.300`);
  const textColor = useColorModeValue('gray.700', 'gray.200');
  
  return (
    <Box
      p={8}
      borderRadius="xl"
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      boxShadow="sm"
      w="full"
      textAlign="center"
      position="relative"
      overflow="hidden"
    >
      {/* Декоративный элемент */}
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        height="6px"
        bgGradient={`linear(to-r, ${colorScheme}.400, ${colorScheme === 'indigo' ? 'violet.500' : colorScheme === 'orange' ? 'amber.500' : 'sky.500'})`}
      />
      
      <VStack spacing={4}>
        <Icon as={icon} boxSize={12} color={iconColor} />
        <Heading size="md" color={textColor}>{title}</Heading>
        <Text color={textColor} maxW="500px" mx="auto">
          {description}
        </Text>
        
        {buttonText && (
          <Button
            mt={2}
            variant={colorScheme === 'indigo' ? 'gradient' : colorScheme === 'orange' ? 'accentGradient' : 'info'}
            onClick={onButtonClick}
            size="md"
            _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
            transition="all 0.2s"
            aria-label={buttonText}
          >
            {buttonText}
          </Button>
        )}
      </VStack>
    </Box>
  );
};

export default EmptyStateCard;
