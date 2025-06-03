import React from 'react';
import { Box, Heading, Text, Button, Flex, useColorModeValue, Icon } from '@chakra-ui/react';
import { IconType } from 'react-icons';

interface HeaderSectionProps {
  title: string;
  description?: string;
  buttonText?: string;
  buttonIcon?: IconType;
  onButtonClick?: () => void;
  gradient?: 'primary' | 'accent' | 'info';
  align?: 'left' | 'center' | 'right';
}

const HeaderSection: React.FC<HeaderSectionProps> = ({
  title,
  description,
  buttonText,
  buttonIcon,
  onButtonClick,
  gradient = 'primary',
  align = 'left'
}) => {
  // Определяем градиенты в зависимости от темы
  const gradients = {
    primary: 'linear(to-r, indigo.500, violet.500)',
    accent: 'linear(to-r, orange.400, amber.500)',
    info: 'linear(to-r, cyan.400, sky.500)'
  };
  
  // Цвета для текста
  const textColor = useColorModeValue('gray.700', 'gray.200');
  
  // Определяем выравнивание
  const textAlign = align;
  const justifyContent = 
    align === 'left' ? 'flex-start' : 
    align === 'right' ? 'flex-end' : 
    'center';
  
  return (
    <Box mb="sectionPadding">
      <Flex 
        direction="column" 
        align={align} 
        textAlign={textAlign}
      >
        <Heading 
          fontSize="fontSizes.heading"
          fontWeight="bold"
          mb={3}
          bgGradient={gradients[gradient]}
          bgClip="text"
          display="inline-block"
          position="relative"
          _after={{
            content: '""',
            position: 'absolute',
            bottom: '-6px',
            left: align === 'center' ? '30%' : align === 'right' ? '60%' : '0',
            width: '40%',
            height: '3px',
            bgGradient: gradients[gradient],
            borderRadius: 'full'
          }}
        >
          {title}
        </Heading>
        
        {description && (
          <Text 
            color={textColor} 
            fontSize="fontSizes.body"
            maxW="600px"
            alignSelf={align === 'center' ? 'center' : undefined}
            mt={2}
          >
            {description}
          </Text>
        )}
        
        {buttonText && (
          <Button
            variant={gradient === 'primary' ? 'gradient' : gradient === 'accent' ? 'accentGradient' : 'info'}
            size="md"
            rightIcon={buttonIcon && <Icon as={buttonIcon} />}
            onClick={onButtonClick}
            mt={4}
            _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
            transition="all 0.2s"
            alignSelf={align === 'center' ? 'center' : undefined}
            aria-label={buttonText}
          >
            {buttonText}
          </Button>
        )}
      </Flex>
    </Box>
  );
};

export default HeaderSection; 